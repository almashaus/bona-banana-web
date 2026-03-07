"use client";

import type React from "react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarIcon,
  Download,
  EditIcon,
  UploadIcon,
  User,
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
  DialogDescription,
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
  const t = useTranslations("Profile");
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

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <ProfileImageInput
            profileImage={profileImage}
            setProfileImage={setProfileImage}
            id={user?.id ?? ""}
          />
          <div>
            <h1 className="text-3xl font-bold">{user?.name}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Tabs
          defaultValue="profile"
          className="w-full"
          dir={locale === "en" ? "ltr" : "rtl"}
          value={activeTab}
          onValueChange={handleTabChange}
        >
          <TabsList className="grid w-full grid-cols-4 mb-8">
            <TabsTrigger value="profile">{t("profile")}</TabsTrigger>
            <TabsTrigger value="tickets">{t("myTickets")}</TabsTrigger>
            <TabsTrigger value="purchases">{t("myPurchases")}</TabsTrigger>
            <TabsTrigger value="settings">{t("settings")}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="rounded-lg border p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-4">
                {t("personalInformation")}
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
                      <Label htmlFor="name">{t("name")}</Label>
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
                      <Label htmlFor="email">{t("email")}</Label>
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
                      <Label htmlFor="phone">{t("phone")}</Label>
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
                        <Label htmlFor="gender">{t("gender")}</Label>
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
                                {t("male")}
                              </div>
                            </SelectItem>
                            <SelectItem value="Female">
                              <div className="flex items-center">
                                {t("female")}
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-3">
                      <Label htmlFor="birthDate">{t("birthDate")}</Label>

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
                                <span>{t("pickDate")}</span>
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
                      {isUpdating ? t("updating") : t("updateProfile")}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tickets">
            <div className="rounded-lg border p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-4">{t("myTickets")}</h2>
              <div className="text-center py-3">
                {isLoading && (
                  <div className="flex justify-center items-center py-12">
                    <Loading />
                  </div>
                )}
                {!isLoading && data?.tickets.length === 0 && (
                  <div>
                    <p className="text-muted-foreground mb-4">
                      {t("dontHaveTickets")}
                    </p>
                    <Button asChild>
                      <Link href="/">{t("browseEvents")}</Link>
                    </Button>
                  </div>
                )}
                {!isLoading && data?.tickets.length! > 0 && (
                  <div className="bg-white mt-2 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("eventTitle")}</TableHead>
                          <TableHead>{t("eventDate")}</TableHead>
                          <TableHead>{t("ticketID")}</TableHead>
                          <TableHead>{t("QRCode")}</TableHead>
                          <TableHead>{t("status")}</TableHead>
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
                                  <Image
                                    src={
                                      generateQRCode(
                                        ticketData.ticket.token ||
                                          ticketData.ticket.id,
                                      ) || "/no-image.svg"
                                    }
                                    alt={"QR code"}
                                    width={80}
                                    height={80}
                                    priority
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
              <h2 className="text-xl font-semibold mb-4">{t("myPurchases")}</h2>
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
                        {t("dontHavePurchases")}
                      </p>
                      <Button asChild>
                        <Link href="/">{t("browseProducts")}</Link>
                      </Button>
                    </div>
                  )}
                {!isLoading && data?.purchases && data.purchases.length > 0 && (
                  <div className="bg-white mt-2 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t("productTitle")}</TableHead>
                          <TableHead>{t("orderID")}</TableHead>
                          <TableHead>{t("orderDate")}</TableHead>
                          <TableHead>{t("price")}</TableHead>
                          <TableHead>{t("status")}</TableHead>
                          <TableHead>{t("file")}</TableHead>
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
                                  : t("productDeleted")}
                              </TableCell>
                              <TableCell>{order.id}</TableCell>
                              <TableCell>
                                {formatDate(new Date(order.orderDate), locale)}
                              </TableCell>
                              <TableCell>
                                {price(Number(order.price.toFixed(2)), locale)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`${getOrderStatusBadgeColor(order.status)}`}
                                >
                                  {order.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <Button
                                  variant="outline"
                                  className="text-primary hover:text-primary"
                                  onClick={() => {
                                    if (product?.downloadableFile?.fileUrl) {
                                      window.open(
                                        product.downloadableFile.fileUrl,
                                        "_blank",
                                      );
                                    } else {
                                      toast({
                                        title: "No file available",
                                        description:
                                          "The product has no file available",
                                        variant: "destructive",
                                      });
                                    }
                                  }}
                                >
                                  <Download className="h-4 w-4 text-orangeColor" />
                                </Button>
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
                {t("accountSettings")}
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
                    {t("logout")}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent dir="ltr" className="bg-stone-100">
            <div className="flex justify-center bg-white m-2 p-4 rounded-lg ">
              <Image
                src={generateQRCode(selectedQR!) || "/no-image.svg"}
                alt={"QR code"}
                width={150}
                height={150}
                priority
              />
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
