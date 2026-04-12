"use client";

import type React from "react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarIcon,
  Check,
  Copy,
  Download,
  EditIcon,
  Gift,
  Ticket as TicketIcon,
  UploadIcon,
  User,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useToast } from "@/src/components/ui/use-toast";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import { cn, compressImage, generateQRCode } from "@/src/lib/utils/utils";
import { Calendar } from "@/src/components/ui/calendar";
import { formatDate } from "@/src/lib/utils/formatDate";
import { getAuth } from "firebase/auth";
import useSWR, { mutate } from "swr";
import { AppUser } from "@/src/models/user";
import { Ticket } from "@/src/models/ticket";
import {
  getTicketStatusBadgeColor,
  getOrderStatusBadgeColor,
} from "@/src/lib/utils/styles";
import { Badge } from "@/src/components/ui/badge";
import { Event } from "@/src/models/event";
import { DigitalProduct } from "@/src/models/digitalProduct";
import { ProductOrder } from "@/src/models/productOrder";
import Loading from "@/src/components/ui/loading";
import Image from "next/image";
import { useAuthStore } from "@/src/lib/stores/useAuthStore";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/src/lib/firebase/firebaseConfig";
import { useLocale, useTranslations } from "next-intl";
import { price } from "@/src/lib/utils/locales";
import { useAuth } from "@/src/features/auth/auth-provider";
import { Coupon } from "@/src/models/coupon";
import { computeStatus } from "@/src/lib/utils/couponValidation";
import { formatDateShort } from "@/src/lib/utils/formatDate";

function Profile() {
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const { logout } = useAuth();
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [profileImage, setProfileImage] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "profile");
  const [selectedQR, setSelectedQR] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [downloadingProductId, setDownloadingProductId] = useState<
    string | null
  >(null);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [copiedVoucherCode, setCopiedVoucherCode] = useState("");
  const [isVouchersDialogOpen, setIsVouchersDialogOpen] = useState(false);
  const [voucherSearchCode, setVoucherSearchCode] = useState("");
  const [isSavingVoucher, setIsSavingVoucher] = useState(false);
  const [voucherSaveError, setVoucherSaveError] = useState<string | null>(null);
  const tProfile = useTranslations("Profile");
  const tCoupon = useTranslations("Coupon");
  const locale = useLocale();

  interface Response {
    appUser: AppUser;
    tickets: {
      event?: Event;
      date?: Date;
      ticket: Ticket;
    }[];
    purchases: {
      order: ProductOrder;
      product: DigitalProduct | null;
    }[];
  }

  const { data, error, isLoading } = useSWR<Response>(
    user ? `/api/profile/${user.id}` : null,
  );

  interface VouchersResponse {
    vouchers: {
      coupon: Coupon;
      remainingBalance?: number;
      userUsageCount?: number;
      applicableEventNames: {
        en: string;
        ar: string;
        id: string;
      }[];
    }[];
  }
  const { data: vouchersData, isLoading: isVouchersLoading } =
    useSWR<VouchersResponse>(
      user && isVouchersDialogOpen ? `/api/profile/${user.id}/vouchers` : null,
      async (url: string) => {
        const idToken = await authUser.getIdToken();
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        return res.json();
      },
    );

  useEffect(() => {
    if (data) {
      setUserData(data.appUser);
      setProfileImage(data.appUser.profileImage ?? "");
      setUser(data.appUser);
    }
  }, [data]);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const validatePhone = (phone: string) => {
    // Only digits, length 9 or 10
    return /^\d{9,10}$/.test(phone);
  };

  const handleInputChange = (field: string, value: any) => {
    setUserData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
    if (field === "phone") {
      if (!validatePhone(value)) {
        setPhoneError("Phone number must be numbers and 10 digits");
      } else {
        setPhoneError(null);
      }
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    // Validate phone before submitting
    if (userData?.phone && !validatePhone(userData.phone)) {
      setPhoneError("Phone number must be numbers and 10 digits");
      return;
    }
    setIsUpdating(true);
    try {
      const idToken = await authUser.getIdToken();

      const response = await fetch(`/api/profile/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id: user?.id, data: userData }),
      });

      setIsUpdating(false);
      if (response.ok) {
        await mutate(`/api/profile/${user?.id}`);
        await mutate("/api/admin/customers");

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Failed updating profile",
        description: "",
        variant: "destructive",
      });
    }
  };

  const handleViewQR = (qr: string) => {
    setSelectedQR(qr);
    setIsDialogOpen(true);
  };

  const handleDownload = async (productId: string) => {
    setDownloadingProductId(productId);
    setDownloadProgress(0);

    const idToken = await authUser.getIdToken();
    try {
      const response = await fetch(
        `/api/product-order/download?productId=${productId}`,
        {
          headers: { Authorization: `Bearer ${idToken}` },
        },
      );

      if (!response.ok) {
        const errBody = await response.json().catch(() => ({}));
        const message =
          (errBody as { error?: string })?.error ?? "Download failed";
        throw new Error(message);
      }

      const contentLength = response.headers.get("Content-Length");
      const total = contentLength ? parseInt(contentLength, 10) : 0;
      const reader = response.body?.getReader();
      if (!reader) throw new Error("No response body");

      const chunks: Uint8Array[] = [];
      let loaded = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
        loaded += value.length;

        if (total > 0) {
          setDownloadProgress(Math.round((loaded / total) * 100));
        } else {
          setDownloadProgress((prev) => Math.min(prev + 15, 90));
        }
      }

      setDownloadProgress(100);
      const blob = new Blob(chunks as BlobPart[], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const disposition = response.headers.get("Content-Disposition");
      const filename =
        disposition
          ?.split("filename=")[1]
          ?.trim()
          .replace(/^["']|["']$/g, "") || "download.pdf";

      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Failed to download the file. Please try later.";
      toast({
        title: "Download failed",
        description: message,
        variant: "destructive",
      });
    } finally {
      setDownloadingProductId(null);
      setDownloadProgress(0);
    }
  };

  const handleSaveVoucher = async () => {
    if (!voucherSearchCode.trim() || !user) return;
    setIsSavingVoucher(true);
    setVoucherSaveError(null);
    try {
      const idToken = await authUser.getIdToken();
      const res = await fetch(`/api/profile/${user.id}/vouchers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ code: voucherSearchCode.trim() }),
      });

      const json = await res.json();

      if (!res.ok) {
        const errorKey = json?.error ?? "Error";
        const errorMessages: Record<string, string> = {
          voucherNotFound: tCoupon("voucherNotFound"),
          alreadyYours: tCoupon("voucherAlreadyYours"),
          voucherInactiveOrExpired: tCoupon("voucherInactiveOrExpired"),
          missingCode: tCoupon("enterVoucherCode"),
        };
        setVoucherSaveError(
          errorMessages[errorKey] ?? tCoupon("voucherSaveError"),
        );
        return;
      }

      // Success — clear input, revalidate vouchers list
      setVoucherSearchCode("");
      await mutate(`/api/profile/${user.id}/vouchers`);
      toast({
        title: tCoupon("voucherAdded"),
        variant: "success",
      });
    } catch {
      setVoucherSaveError(tCoupon("voucherSaveError"));
    } finally {
      setIsSavingVoucher(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <ProfileImageInput
            profileImage={profileImage}
            setProfileImage={setProfileImage}
            id={user?.id ?? ""}
          />
          <div className="flex-1 min-w-0">
            <h1 className="text-3xl font-bold truncate">{user?.name}</h1>
            <p className="text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button
            variant="outline"
            className="shrink-0 gap-2 border-orangeColor text-orangeColor hover:bg-yellowColor/20 hover:text-orangeColor"
            onClick={() => setIsVouchersDialogOpen(true)}
          >
            <Gift className="h-4 w-4" />
            <span className="hidden sm:inline">{tCoupon("myVouchers")}</span>
          </Button>
        </div>

        <Tabs
          defaultValue="profile"
          className="w-full"
          dir={locale === "en" ? "ltr" : "rtl"}
          value={activeTab}
          onValueChange={handleTabChange}
        >
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile">{tProfile("profile")}</TabsTrigger>
            <TabsTrigger value="tickets">{tProfile("myTickets")}</TabsTrigger>
            <TabsTrigger value="purchases">
              {tProfile("myPurchases")}
            </TabsTrigger>
            <TabsTrigger value="settings">{tProfile("settings")}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="rounded-lg border p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-4">
                {tProfile("personalInformation")}
              </h2>

              {isLoading && (
                <div className="flex justify-center items-center py-12">
                  <Loading />
                </div>
              )}
              {!isLoading && userData && (
                <form onSubmit={handleUpdateProfile}>
                  <div className="grid gap-4 px-2 md:px-10 py-5">
                    <div className="grid gap-3">
                      <Label htmlFor="name">{tProfile("name")}</Label>
                      <Input
                        id="name"
                        value={userData?.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="email">{tProfile("email")}</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userData?.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className=" text-muted-foreground"
                        disabled
                      />
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="phone">{tProfile("phone")}</Label>
                      <Input
                        id="phone"
                        type="phone"
                        value={userData?.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                        pattern="\d{9,10}"
                        maxLength={10}
                        minLength={9}
                        required={false}
                      />
                      {phoneError && (
                        <span className="text-red-500 text-xs mt-1">
                          {phoneError}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      <div className="grid gap-3">
                        <Label htmlFor="gender">{tProfile("gender")}</Label>
                        <Select
                          dir={locale === "en" ? "ltr" : "rtl"}
                          value={userData?.gender}
                          onValueChange={(value) => {
                            handleInputChange("gender", value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={userData?.gender || "Select"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">
                              <div className="flex items-center">
                                {tProfile("male")}
                              </div>
                            </SelectItem>
                            <SelectItem value="Female">
                              <div className="flex items-center">
                                {tProfile("female")}
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="birthDate">{tProfile("birthDate")}</Label>

                      <div className="flex flex-col space-y-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal bg-white",
                              )}
                            >
                              <CalendarIcon className="me-2 h-4 w-4" />
                              {userData?.birthDate ? (
                                formatDate(
                                  new Date(userData?.birthDate),
                                  locale,
                                )
                              ) : (
                                <span>{tProfile("pickDate")}</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent dir="ltr" className="w-auto p-0">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown"
                              selected={new Date(userData?.birthDate || "")}
                              onSelect={(day) => {
                                if (day) {
                                  handleInputChange("birthDate", day);
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating
                        ? tProfile("updating")
                        : tProfile("updateProfile")}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tickets">
            <div className="rounded-lg border p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-4">
                {tProfile("myTickets")}
              </h2>
              <div className="text-center py-3">
                {isLoading && (
                  <div className="flex justify-center items-center py-12">
                    <Loading />
                  </div>
                )}
                {!isLoading && data?.tickets.length === 0 && (
                  <div>
                    <p className="text-muted-foreground mb-4">
                      {tProfile("dontHaveTickets")}
                    </p>
                    <Button asChild>
                      <Link href="/">{tProfile("browseEvents")}</Link>
                    </Button>
                  </div>
                )}
                {!isLoading && data?.tickets.length! > 0 && (
                  <div className="bg-white mt-2 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{tProfile("eventTitle")}</TableHead>
                          <TableHead>{tProfile("eventDate")}</TableHead>
                          <TableHead>{tProfile("ticketID")}</TableHead>
                          <TableHead>{tProfile("QRCode")}</TableHead>
                          <TableHead>{tProfile("status")}</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {data?.tickets.map((ticketData) => {
                          return (
                            <TableRow
                              key={ticketData.ticket.id}
                              role="row"
                              tabIndex={0}
                              className="cursor-pointer"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleViewQR(
                                  ticketData.ticket.token ||
                                    ticketData.ticket.id,
                                );
                              }}
                            >
                              <TableCell>
                                {ticketData.event?.title || ""}
                              </TableCell>
                              <TableCell>
                                {formatDate(ticketData.date!, locale)}
                              </TableCell>
                              <TableCell>{ticketData.ticket.id}</TableCell>

                              <TableCell>
                                <div className="flex justify-center bg-white p-2 rounded-lg  mb-2 w-20 h-20 md:w-full md:h-full">
                                  <img
                                    src={
                                      generateQRCode(
                                        ticketData.ticket.token ||
                                          ticketData.ticket.id,
                                      ) || "/no-image.svg"
                                    }
                                    alt={"QR code"}
                                    width={80}
                                    height={80}
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`${getTicketStatusBadgeColor(ticketData.ticket.status)}`}
                                >
                                  {ticketData.ticket.status}
                                </Badge>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="purchases">
            <div className="rounded-lg border p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-4">
                {tProfile("myPurchases")}
              </h2>
              <div className="text-center py-3">
                {isLoading && (
                  <div className="flex justify-center items-center py-12">
                    <Loading />
                  </div>
                )}
                {!isLoading &&
                  (!data?.purchases || data.purchases.length === 0) && (
                    <div>
                      <p className="text-muted-foreground mb-4">
                        {tProfile("dontHavePurchases")}
                      </p>
                      <Button asChild>
                        <Link href="/">{tProfile("browseProducts")}</Link>
                      </Button>
                    </div>
                  )}
                {!isLoading && data?.purchases && data.purchases.length > 0 && (
                  <div className="bg-white mt-2 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{tProfile("productTitle")}</TableHead>
                          <TableHead>{tProfile("orderID")}</TableHead>
                          <TableHead>{tProfile("orderDate")}</TableHead>
                          <TableHead>{tProfile("price")}</TableHead>
                          <TableHead>{tProfile("status")}</TableHead>
                          <TableHead>{tProfile("file")}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.purchases
                          .sort(
                            (a, b) =>
                              new Date(b.order.orderDate).getTime() -
                              new Date(a.order.orderDate).getTime(),
                          )
                          .map(({ order, product }) => (
                            <TableRow key={order.id}>
                              <TableCell>
                                {product
                                  ? locale === "ar"
                                    ? product.titleAr
                                    : product.title
                                  : tProfile("productDeleted")}
                              </TableCell>
                              <TableCell>{order.id}</TableCell>
                              <TableCell>
                                {formatDate(new Date(order.orderDate), locale)}
                              </TableCell>
                              <TableCell>
                                {price(order.price, locale)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`${getOrderStatusBadgeColor(order.status)}`}
                                >
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {product?.downloadableFile ? (
                                  downloadingProductId === product.id ? (
                                    <div className="flex flex-col items-center gap-1">
                                      <span className="text-primary font-medium">
                                        %{downloadProgress}
                                      </span>
                                      <span
                                        className="h-1.5 w-1.5 rounded-full bg-gray-400 animate-pulse-gray"
                                        aria-hidden
                                      />
                                    </div>
                                  ) : (
                                    <Button
                                      variant="outline"
                                      className="text-primary hover:text-primary"
                                      onClick={() => handleDownload(product.id)}
                                    >
                                      <Download className="h-4 w-4 text-orangeColor" />
                                    </Button>
                                  )
                                ) : (
                                  <span className="text-muted-foreground">
                                    No File Available
                                  </span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="rounded-lg border p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-12">
                {tProfile("accountSettings")}
              </h2>

              <div className="space-y-6">
                {/* <Separator /> */}

                <div>
                  {/* <h3 className="text-lg font-medium mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p> */}

                  <Button
                    variant="outline"
                    className="text-destructive hover:text-destructive"
                    onClick={() => logout()}
                  >
                    {tProfile("logout")}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent dir="ltr" className="bg-stone-100">
            <div className="flex justify-center bg-white m-2 p-4 rounded-lg ">
              <img
                src={generateQRCode(selectedQR!) || "/no-image.svg"}
                alt={"QR code"}
                width={150}
                height={150}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* ── Vouchers Dialog ───────────────────────────────────────── */}
        <Dialog
          open={isVouchersDialogOpen}
          onOpenChange={(open) => {
            setIsVouchersDialogOpen(open);
            if (!open) setVoucherSearchCode("");
          }}
        >
          <DialogContent
            dir={locale === "ar" ? "rtl" : "ltr"}
            className="max-w-2xl max-h-[85vh] overflow-y-auto bg-stone-50 p-0"
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-white border-b px-6 py-4">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Gift className="h-5 w-5 text-amber-500" />
                  {tCoupon("myVouchers")}
                </DialogTitle>
              </DialogHeader>

              {/* Add voucher input */}
              <div className="mt-4">
                <p className="text-xs text-muted-foreground mb-2">
                  {tCoupon("redeemHint")}
                </p>
                <div className="flex items-center gap-2">
                  <Input
                    placeholder={tCoupon("enterVoucherCode")}
                    value={voucherSearchCode}
                    onChange={(e) => {
                      setVoucherSearchCode(e.target.value.toUpperCase());
                      setVoucherSaveError(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && voucherSearchCode.trim()) {
                        handleSaveVoucher();
                      }
                    }}
                    className="font-mono text-sm "
                    disabled={isSavingVoucher}
                  />
                  {voucherSearchCode && !isSavingVoucher && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="shrink-0"
                      onClick={() => {
                        setVoucherSearchCode("");
                        setVoucherSaveError(null);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    className="bg-amber-500 hover:bg-amber-600 text-white"
                    disabled={!voucherSearchCode.trim() || isSavingVoucher}
                    onClick={handleSaveVoucher}
                  >
                    {isSavingVoucher ? tCoupon("saving") : tCoupon("save")}
                  </Button>
                </div>
                {voucherSaveError && (
                  <p className="text-xs text-red-600 mt-1.5 bg-red-50 border border-red-200 rounded px-2 py-1">
                    {voucherSaveError}
                  </p>
                )}
              </div>
            </div>

            {/* Body */}
            <div className="px-6 py-5 space-y-5">
              {isVouchersLoading && (
                <div className="flex justify-center items-center py-16">
                  <Loading />
                </div>
              )}

              {!isVouchersLoading &&
                (!vouchersData?.vouchers ||
                  vouchersData.vouchers.length === 0) && (
                  <div className="text-center py-14 flex flex-col items-center gap-3">
                    <div className="w-16 h-16 rounded-full bg-amber-50 flex items-center justify-center">
                      <Gift className="h-8 w-8 text-amber-300" />
                    </div>
                    <p className="text-muted-foreground text-sm">
                      {tCoupon("noVouchers")}
                    </p>
                  </div>
                )}

              {!isVouchersLoading &&
                vouchersData?.vouchers &&
                vouchersData.vouchers
                  .filter(
                    ({ coupon }) =>
                      !voucherSearchCode ||
                      coupon.code
                        .toUpperCase()
                        .includes(voucherSearchCode.toUpperCase()),
                  )
                  .map(({ coupon, remainingBalance, userUsageCount, applicableEventNames }) => {
                    const baseStatus = computeStatus(coupon);
                    const isPerUserLimitReached =
                      coupon.perUserLimit != null &&
                      userUsageCount != null &&
                      userUsageCount >= coupon.perUserLimit;
                    const status =
                      isPerUserLimitReached ||
                      (coupon.allowPartialConsumption && remainingBalance === 0)
                        ? "Fully Redeemed"
                        : baseStatus;
                    const isCopied = copiedVoucherCode === coupon.code;
                    const isActive = status === "Active";
                    const isExpired =
                      status === "Expired" || status === "Fully Redeemed";

                    const valueLabel =
                      coupon.voucherKind === "freeTicket"
                        ? tCoupon("voucherKindFree")
                        : coupon.allowPartialConsumption &&
                            remainingBalance !== undefined
                          ? price(remainingBalance, locale)
                          : price(coupon.discountValue, locale);

                    const accentColor = isExpired
                      ? {
                          bg: "bg-stone-400",
                          text: "text-stone-400",
                          light: "bg-stone-50",
                        }
                      : {
                          bg: "bg-orangeColor",
                          text: "text-amber-500",
                          light: "bg-amber-50",
                        };

                    return (
                      <div
                        key={coupon.id}
                        className={`relative flex rounded-xl overflow-hidden ${accentColor.bg} transition-all ${isActive ? "hover:shadow-md" : "opacity-70"}`}
                      >
                        {/* ── Left stub ─────────────────────────────── */}
                        <div
                          className={`${accentColor.bg} p-3 relative w-14 flex-shrink-0 flex items-center justify-center`}
                        >
                          {/* Rotated label */}
                          <span className="text-white text-sm font-black tracking-[0.25em] uppercase rotate-[-90deg] whitespace-nowrap select-none">
                            {coupon.voucherKind === "freeTicket"
                              ? "FREE TICKET"
                              : "VOUCHER"}
                          </span>

                          {/* Top notch */}
                          <div
                            className={`absolute ${locale == "en" ? "-left-3" : "-right-3"} top-4 w-5 h-5 rounded-full bg-stone-50 z-5`}
                          />
                          <div
                            className={`absolute ${locale == "en" ? "-left-3" : "-right-3"} top-12 w-5 h-5 rounded-full bg-stone-50 z-5`}
                          />
                          {/* middle notch */}
                          <div
                            className={`absolute ${locale == "en" ? "-left-3" : "-right-3"}  w-5 h-5 rounded-full bg-stone-50 z-5`}
                          />
                          {/* Bottom notch */}
                          <div
                            className={`absolute ${locale == "en" ? "-left-3" : "-right-3"} bottom-12 w-5 h-5 rounded-full bg-stone-50 z-5`}
                          />
                          <div
                            className={`absolute ${locale == "en" ? "-left-3" : "-right-3"} bottom-4 w-5 h-5 rounded-full bg-stone-50 z-5`}
                          />
                        </div>

                        {/* Dashed tear line */}
                        <div
                          className={`absolute ${locale == "en" ? "left-14 " : "right-14"} top-0 bottom-0 border-l-2 border-dashed border-stone-50 z-5 pointer-events-none`}
                        />

                        {/* ── Main body ─────────────────────────────── */}
                        <div
                          className={`flex-1 ${accentColor.light} m-2 p-4 flex flex-col gap-1 rounded-md`}
                        >
                          {/* Top row: label + status */}
                          <div className="flex items-center justify-between ">
                            <p className="text-xs font-semibold uppercase tracking-widest text-stone-500">
                              {tCoupon("voucher")}
                            </p>
                            <span
                              className={`text-xs font-medium px-3 py-1 rounded-full uppercase tracking-wide ${
                                isActive
                                  ? "bg-green-100 text-green-700"
                                  : status === "Expired"
                                    ? "bg-red-100 text-red-700"
                                    : status === "Fully Redeemed"
                                      ? "bg-stone-200 text-stone-600"
                                      : "bg-blue-100 text-blue-700"
                              }`}
                            >
                              {status}
                            </span>
                          </div>

                          {/* Big value */}
                          <div
                            className={`text-3xl font-black leading-none ${accentColor.text}`}
                          >
                            {valueLabel}
                            {coupon.allowPartialConsumption &&
                              remainingBalance !== undefined &&
                              coupon.voucherKind !== "freeTicket" && (
                                <span className="text-xs font-medium text-stone-400 ms-1.5 normal-case">
                                  / {price(coupon.discountValue, locale)}
                                </span>
                              )}
                          </div>

                          {/* Code row */}
                          <div className="flex items-center gap-2 mt-1">
                            <div className="border border-dashed border-stone-300 rounded px-6 py-1 bg-white">
                              <span className="font-mono text-lg font-semibold tracking-widest text-stone-700">
                                {coupon.code}
                              </span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                navigator.clipboard.writeText(coupon.code);
                                setCopiedVoucherCode(coupon.code);
                                setTimeout(
                                  () => setCopiedVoucherCode(""),
                                  2000,
                                );
                              }}
                              className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${
                                isCopied
                                  ? "text-green-600 bg-green-50"
                                  : "text-orangeColor hover:bg-orange-100 "
                              }`}
                            >
                              {isCopied ? (
                                <>
                                  <Check className="h-3 w-3" /> Copied
                                </>
                              ) : (
                                <>
                                  <Copy className="h-3 w-3 text-orangeColor" />{" "}
                                  Copy
                                </>
                              )}
                            </button>
                          </div>

                          {/* Footer: validity + event scope */}
                          <div className="flex items-center justify-between mt-1 pt-2 border-t border-stone-200">
                            <p className="text-xs text-stone-400 flex items-center gap-1">
                              <CalendarIcon className="h-3 w-3" />
                              {formatDateShort(
                                new Date(coupon.startDate),
                              )} – {formatDateShort(new Date(coupon.endDate))}
                            </p>
                            {applicableEventNames.length === 0 ? (
                              <span className="text-xs text-stone-400 flex items-end gap-1">
                                <TicketIcon className="h-3 w-3" /> All events
                              </span>
                            ) : (
                              <span className="text-xs text-stone-400 flex items-end gap-1">
                                <TicketIcon className="h-3 w-3" />{" "}
                                {applicableEventNames.map((e) => `${e.en}- `)}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}

function ProfileImageInput({
  profileImage,
  setProfileImage,
  id,
}: {
  profileImage: string;
  setProfileImage: (url: string) => void;
  id: string;
}) {
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const [uploading, setUploading] = useState(false);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    if (file.size > 5 * 1024 * 1024) {
      // compress before uploading
      file = await compressImage(file);
    }
    const objectUrl = URL.createObjectURL(file);
    setProfileImage(objectUrl);

    const ext = file.name.split(".").pop();
    const path = `users/${id}/user_${Date.now()}.${ext}`;

    const storageRef = ref(storage, path);
    const metadata = {
      contentType: file.type,
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      },
      (error) => {
        setUploading(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setProfileImage(downloadUrl);
          const idToken = await authUser.getIdToken();

          const response = await fetch(`/api/profile/${id}`, {
            method: "PUT",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify({
              id: id,
              data: { profileImage: downloadUrl },
            }),
          });

          await mutate(`/api/profile/${id}`);
        } finally {
          setUploading(false);
          // free memory for the preview
          URL.revokeObjectURL(objectUrl);
        }
      },
    );
  };

  return (
    <div className="relative" style={{ width: "70px", height: "70px" }}>
      <Avatar className="h-16 w-16 bg-neutral-200">
        <AvatarImage src={profileImage} alt="Profile Image" />
        <AvatarFallback className="text-lg">
          {uploading ? <Loading /> : <User className="h-8 w-8" />}
        </AvatarFallback>
      </Avatar>
      <div className="">
        <input
          type="file"
          id="ad-image-upload"
          accept="image/*"
          className="hidden"
          onChange={handleChange}
        />

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="absolute -bottom-1 -right-1 h-8 w-8 px-2 text-xs bg-stone-100 border border-stone-200 rounded-full"
          onClick={() => document.getElementById("ad-image-upload")?.click()}
        >
          <EditIcon className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}
