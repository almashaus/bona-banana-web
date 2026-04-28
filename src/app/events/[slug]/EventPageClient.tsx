"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  CalendarDays,
  CalendarIcon,
  Check,
  ClockIcon,
  Copy,
  Gift,
  InfoIcon,
  Loader2,
  MapPin,
  Megaphone,
  Tag,
  Ticket,
  TicketIcon,
  Users,
  X,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { Input } from "@/src/components/ui/input";
import { Separator } from "@/src/components/ui/separator";
import {
  formatDate,
  formatDateShort,
  formatTime,
} from "@/src/lib/utils/formatDate";
import { Event, EventDate, EventStatus } from "@/src/models/event";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useToast } from "@/src/components/ui/use-toast";
import Loading from "@/src/components/ui/loading";
import { useCheckoutStore } from "@/src/lib/stores/useCheckoutStore";
import useSWR from "swr";
import {
  findFirstTodayOrAfter,
  isBeforeToday,
  isSafeImageUrl,
  roundMoney,
} from "@/src/lib/utils/utils";
import { Skeleton } from "@/src/components/ui/skeleton";
import { price } from "@/src/lib/utils/locales";
import { useLocale, useTranslations } from "next-intl";
import { Coupon } from "@/src/models/coupon";
import { computeStatus } from "@/src/lib/utils/couponValidation";
import { getAuth } from "firebase/auth";

interface AppliedCoupon {
  id: string;
  code: string;
  discountAmount: number;
  discountType: string;
  details: {
    type: string;
    discountKind: string;
    discountValue: number;
    maxCap: number | null;
    minTicketValue: number | null;
    offerSubtype: string | null;
    buyQuantity: number | null;
    getQuantity: number | null;
  };
}

interface ActiveOffer {
  id: string;
  type: string;
  discountKind: string;
  discountValue: number;
  maxCap: number | null;
  minTicketValue: number | null;
  offerSubtype: string | null;
  buyQuantity: number | null;
  getQuantity: number | null;
  description: string;
}

function recalculateDiscount(
  details: AppliedCoupon["details"],
  subtotal: number,
  ticketQuantity: number,
  ticketPrice: number,
): number {
  if (
    details.offerSubtype === "buyXgetY" &&
    details.buyQuantity != null &&
    details.getQuantity != null
  ) {
    const sets = Math.floor(
      ticketQuantity / (details.buyQuantity + details.getQuantity),
    );
    return sets * details.getQuantity * ticketPrice;
  }

  if (details.discountKind === "percentage") {
    let discount = (subtotal * details.discountValue) / 100;
    if (details.maxCap != null) discount = Math.min(discount, details.maxCap);
    return roundMoney(discount);
  }

  return roundMoney(Math.min(details.discountValue, subtotal));
}

function computeOfferDiscount(
  offer: ActiveOffer | null,
  qty: number,
  ticketPrice: number,
  total: number,
): number {
  if (!offer || ticketPrice <= 0) return 0;

  if (
    offer.offerSubtype === "buyXgetY" &&
    offer.buyQuantity != null &&
    offer.getQuantity != null
  ) {
    const bundleSize = offer.buyQuantity + offer.getQuantity;
    if (qty % bundleSize !== 0) return 0;
    return roundMoney((qty / bundleSize) * offer.getQuantity * ticketPrice);
  }

  if (offer.discountKind === "percentage") {
    let disc = (total * offer.discountValue) / 100;
    if (offer.maxCap != null) disc = Math.min(disc, offer.maxCap);
    return roundMoney(disc);
  }

  return roundMoney(Math.min(offer.discountValue, total));
}

export default function EventPageClient() {
  const { user } = useAuth();
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const router = useRouter();
  const { toast } = useToast();
  const tEvent = useTranslations("Event");
  const tCoupon = useTranslations("Coupon");
  const tPage = useTranslations("Page");
  const tHome = useTranslations("Home");
  const tPDF = useTranslations("PDF");
  const locale = useLocale();
  const [selectedDate, setSelectedDate] = useState<EventDate>();
  const [quantity, setQuantity] = useState<number>(1);
  const [event, setEvent] = useState<Event | null>(null);

  // Coupon state
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<AppliedCoupon | null>(
    null,
  );
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Voucher state
  const [copiedVoucherCode, setCopiedVoucherCode] = useState("");
  const [isVouchersDialogOpen, setIsVouchersDialogOpen] = useState(false);
  const [voucherSearchCode, setVoucherSearchCode] = useState("");
  const [isSavingVoucher, setIsSavingVoucher] = useState(false);
  const [voucherSaveError, setVoucherSaveError] = useState<string | null>(null);

  // Offer state (auto-applied, no code required)
  const [activeOffer, setActiveOffer] = useState<ActiveOffer | null>(null);

  const params = useParams<{ slug: string }>();
  const slug: string = params?.slug!;

  const { data, error, isLoading } = useSWR<Event>(`/api/events/${slug}`);

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

  const dir = locale === "en" ? "ltr" : "rtl";

  useEffect(() => {
    const eventData: Event = data as Event;
    if (eventData) {
      if (
        eventData.status !== EventStatus.PUBLISHED &&
        eventData.status !== EventStatus.COMPLETED
      ) {
        router.replace("/");
        return;
      }
    }
    if (eventData && eventData.dates && eventData.dates.length > 0) {
      setEvent(eventData);

      const currentDate = findFirstTodayOrAfter(
        eventData.dates.map((d) => d.date),
      );

      setSelectedDate(eventData.dates.find((d) => d.date === currentDate));
    }
  }, [data, router]);

  // Fetch and auto-apply active offer for this event
  useEffect(() => {
    if (!event || event.price <= 0) return;

    fetch(`/api/coupons/offers?eventId=${event.id}`)
      .then((res) => res.json())
      .then((data) => {
        if (data.offer) {
          setActiveOffer(data.offer);
        }
      })
      .catch(() => { });
  }, [event?.id]);

  // Recalculate coupon discount when quantity changes (coupon applies on offered price)
  useEffect(() => {
    setCouponInput("");
    setCouponError(null);

    if (!event || !appliedCoupon) return;

    const base = event.price * quantity;
    const currentOfferDisc = computeOfferDiscount(
      activeOffer,
      quantity,
      event.price,
      base,
    );
    const priceAfterOffer = base - currentOfferDisc;
    const details = appliedCoupon.details;

    if (
      details.minTicketValue != null &&
      priceAfterOffer < details.minTicketValue
    ) {
      setAppliedCoupon(null);
      setCouponError(
        tCoupon("couponMinNotMet") ||
        `Minimum order value of ${details.minTicketValue} required`,
      );
      return;
    }

    const newDiscount = recalculateDiscount(
      details,
      priceAfterOffer,
      quantity,
      event.price,
    );

    setAppliedCoupon((prev) =>
      prev ? { ...prev, discountAmount: newDiscount } : null,
    );
    setCouponError(null);
  }, [quantity]);

  const handleApplyCoupon = useCallback(async () => {
    if (!couponInput.trim() || !event) return;

    setCouponLoading(true);
    setCouponError(null);

    try {
      const base = event.price * quantity;
      const currentOfferDisc = computeOfferDiscount(
        activeOffer,
        quantity,
        event.price,
        base,
      );
      const priceAfterOffer = base - currentOfferDisc;

      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          couponCode: couponInput,
          eventId: event.id,
          ticketQuantity: quantity,
          cartSubtotal: priceAfterOffer,
          userId: user?.id,
        }),
      });

      const data = await res.json();

      if (data.valid) {
        setAppliedCoupon({
          id: data.couponId,
          code: data.couponCode,
          discountAmount: data.discountAmount,
          discountType: data.discountType,
          details: data.couponDetails,
        });
        setCouponError(null);
      } else {
        setCouponError(tCoupon(data.errorMessage));
        setAppliedCoupon(null);
      }
    } catch {
      setCouponError(tCoupon("serverErrorDuringValidation"));
    } finally {
      setCouponLoading(false);
    }
  }, [couponInput, event, quantity, user?.id]);

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError(null);
  };

  const subtotal = event ? roundMoney(event.price * quantity) : 0;
  const offerDiscount = computeOfferDiscount(
    activeOffer,
    quantity,
    event?.price ?? 0,
    subtotal,
  );
  const offerTotal = roundMoney(subtotal - offerDiscount);
  const couponDiscount = roundMoney(appliedCoupon?.discountAmount ?? 0);
  const finalTotal = roundMoney(offerTotal - couponDiscount);

  const handleBuyTicket = () => {
    useCheckoutStore.setState({
      event: event,
      eventDateId: selectedDate?.id,
      quantity: quantity,
      offerId: offerDiscount > 0 ? activeOffer!.id : null,
      offerDiscount: offerDiscount,
      couponId: appliedCoupon?.id ?? null,
      couponCode: appliedCoupon?.code ?? null,
      discountAmount: couponDiscount,
      discountType: appliedCoupon?.discountType ?? null,
    });

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/checkout")}`);
      return;
    }

    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please select a date for the event",
        variant: "destructive",
      });
      return;
    }

    router.push("/checkout");
  };

  if (error || !slug || typeof slug !== "string") {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {tPage("eventNotFound") || "Event not found"}
        </h1>
        <p className="mb-6">
          {tPage("eventNotFoundDescription") ||
            "The event you're looking for doesn't exist or has been removed."}
        </p>
        <Button asChild>
          <Link href="/">{tHome("allEvents")}</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !event) {
    return (
      <div className="px-5 py-10 md:container">
        <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Event Details */}
          <div className="md:col-span-1 lg:col-span-2 lg:me-6">
            <div className="flex justify-start gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center items-center py-24">
              <Loading />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-neutral-200 bg-card text-card-foreground shadow-sm">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>

          {/* Ticket Info */}
          <div className="flex flex-col ">
            <Card>
              <CardContent className="space-y-8 my-4">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <article className="px-5 py-10 md:container">
      <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Event Title and Image */}
        <div className="md:col-span-1 lg:col-span-2 lg:me-6">
          <div className="flex justify-start gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              {locale === "en" ? (
                <ArrowLeft className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
            <h1 className="text-3xl font-bold">
              {locale === "en" ? event.title : event.titleAr}
            </h1>
          </div>
          <div className="aspect-video w-full relative my-4 rounded-xl overflow-hidden">
            <Image
              src={
                isSafeImageUrl(event.eventImage)
                  ? event.eventImage!
                  : "/no-image.svg"
              }
              alt={event.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 75vw, 100vw"
              priority
              onError={(e) => {
                e.currentTarget.src = "/no-image.svg";
              }}
            />
          </div>
          {/* Event Details */}
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{tEvent("details")}</h2>
            <p className="text-muted-foreground whitespace-pre-line pb-4">
              {locale === "en" ? event.description : event.descriptionAr}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-neutral-200 bg-card text-card-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-redColor" />
                <div>
                  <p className="text-sm font-medium">{tEvent("date")}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate
                      ? `${formatDate(selectedDate.date, locale)}`
                      : event.dates && event.dates.length > 0
                        ? event.dates.length > 1
                          ? `${formatDate(event.dates[0].date, locale)} - ${formatDate(
                            event.dates[event.dates.length - 1].date,
                            locale,
                          )}`
                          : `${formatDate(event.dates[0].date, locale)}`
                        : tEvent("noDatesAvailable") || "No dates available"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-redColor" />
                <div>
                  <p className="text-sm font-medium">{tEvent("time")}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate
                      ? `${formatTime(selectedDate.startTime, locale)} - ${formatTime(selectedDate.endTime, locale)}`
                      : event.dates && event.dates.length > 0
                        ? `${formatTime(event.dates[0].startTime, locale)} - ${formatTime(
                          event.dates[0].endTime,
                          locale,
                        )}`
                        : tEvent("noTimesAvailable") || "No times available"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-redColor" />
                <div>
                  <p className="text-sm font-medium">{tEvent("capacity")}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate
                      ? selectedDate.capacity
                      : event.dates[0].capacity}{" "}
                    {tEvent("attendees") || "attendees"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-redColor" />
                <div>
                  <p className="text-sm font-medium">{tEvent("city")}</p>
                  <p className="text-sm text-muted-foreground">
                    {locale === "en" ? event.city.en : event.city.ar}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-redColor" />
                <div>
                  <p className="text-sm font-medium">{tEvent("venue")}</p>
                  <p className="text-sm text-muted-foreground">{event.venue}</p>
                </div>
              </div>
              {event.locationUrl && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" asChild>
                    <Link href={`${event.locationUrl}`} target="_blank">
                      <img
                        src="/icons/google-map-icon.svg"
                        alt="Instagram"
                        className="w-5 h-5 me-2"
                      />
                      {tEvent("location")}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            {event.id === "8reN7zxtwEHj0zj7c24p" && (
              <div className="flex flex-row justify-center align-bottom items-end gap-2 mt-6">
                <Button
                  className="w-full p-6 lg:text-lg gap-2 bg-redColor text-white hover:bg-redColor/80"
                  onClick={() => router.push("/pdf?file=jacaro-rules.pdf")}
                >
                  {tPDF("jacaroRules")}
                  {locale === "en" ? (
                    <ArrowRight
                      className="w-4 h-4 ms-1 mt-1"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <ArrowLeft
                      className="w-4 h-4 ms-1 mt-1"
                      strokeWidth={2.5}
                    />
                  )}
                </Button>

                <Button
                  className="w-full p-6 lg:text-lg gap-2 bg-redColor text-white hover:bg-redColor/80"
                  onClick={() => router.push("/pdf?file=baloot-rules.pdf")}
                >
                  {tPDF("balootRules")}
                  {locale === "en" ? (
                    <ArrowRight
                      className="w-4 h-4 ms-1 mt-1"
                      strokeWidth={2.5}
                    />
                  ) : (
                    <ArrowLeft
                      className="w-4 h-4 ms-1 mt-1"
                      strokeWidth={2.5}
                    />
                  )}
                </Button>
              </div>
            )}
            {event.adImage && (
              <div className="pt-4">
                <img
                  src={
                    isSafeImageUrl(event.adImage)
                      ? event.adImage!
                      : "/no-image.svg"
                  }
                  alt={event.title}
                  className="object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = "/no-image.svg";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Ticket Info */}
        <div className="flex flex-col md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{tEvent("ticketInformation")}</CardTitle>
              <CardDescription>{tEvent("selectDateQuantity")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {tEvent("date")}
                </label>
                <Select
                  value={selectedDate?.id}
                  onValueChange={(value) => {
                    setSelectedDate(event.dates.find((d) => d.id === value));
                  }}
                >
                  <SelectTrigger dir={dir}>
                    <SelectValue
                      placeholder={tEvent("selectDate") || "Select date"}
                    />
                  </SelectTrigger>
                  <SelectContent dir={dir}>
                    {event.dates?.map((date) => (
                      <SelectItem
                        key={date.id}
                        value={date.id}
                        className={`${isBeforeToday(date.date) && "text-neutral-400"}`}
                      >
                        {formatDate(date.date, locale)} |{" "}
                        {formatTime(date.startTime, locale)} -{" "}
                        {formatTime(date.endTime, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedDate?.availableTickets! === 0 ||
                isBeforeToday(selectedDate?.date!) ? (
                <div className="flex justify-center items-center py-3 rounded-md bg-neutral-300 text-neutral-600">
                  <InfoIcon className="w-5 h-5 me-2" />
                  {tEvent("noTicketsAvailable")}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {tEvent("quantity")}
                    </label>
                    <Select
                      value={quantity.toString()}
                      onValueChange={(value) => {
                        setQuantity(Number.parseInt(value));
                      }}
                    >
                      <SelectTrigger dir={dir}>
                        <SelectValue
                          placeholder={
                            tEvent("selectQuantity") || "Select quantity"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent dir={dir}>
                        {Array.from(
                          {
                            length: Math.min(
                              selectedDate?.availableTickets ?? 0,
                              5,
                            ),
                          },
                          (_, i) => i + 1,
                        ).map((num) => {
                          const isBundleQty =
                            activeOffer?.offerSubtype === "buyXgetY" &&
                            activeOffer.buyQuantity != null &&
                            activeOffer.getQuantity != null &&
                            num %
                            (activeOffer.buyQuantity +
                              activeOffer.getQuantity) ===
                            0;

                          return (
                            <SelectItem key={num} value={num.toString()}>
                              {num}{" "}
                              {num === 1 ? tEvent("ticket") : tEvent("tickets")}
                              {isBundleQty && (
                                <span className="text-sm text-green-500 mx-4">
                                  {tCoupon("buyXGetYFree", {
                                    x: activeOffer!.buyQuantity!,
                                    y: activeOffer!.getQuantity!,
                                  })}
                                </span>
                              )}
                            </SelectItem>
                          );
                        })}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Offer Banner (auto-applied) */}
                  {activeOffer &&
                    event.price > 0 &&
                    (!appliedCoupon || appliedCoupon.code === "") && (
                      <div className="flex items-center gap-2 rounded-md border border-green-200 bg-green-50 px-3 py-2.5">
                        <Megaphone className="h-4 w-4 text-green-600 shrink-0" />
                        <span className="text-sm font-medium text-green-700">
                          {activeOffer.offerSubtype === "buyXgetY" &&
                            activeOffer.buyQuantity != null &&
                            activeOffer.getQuantity != null
                            ? tCoupon("buyXGetYFree", {
                              x: activeOffer.buyQuantity,
                              y: activeOffer.getQuantity,
                            })
                            : activeOffer.discountKind === "percentage"
                              ? tCoupon("percentageOff", {
                                value: activeOffer.discountValue,
                              })
                              : tCoupon("fixedOff", {
                                value: activeOffer.discountValue,
                              })}
                        </span>
                      </div>
                    )}

                  {/* Coupon Code Section */}
                  {event.price > 0 && (
                    <div className="space-y-2 pt-1">
                      <label className="text-sm font-medium leading-none">
                        {tCoupon("couponCode") || "Coupon Code"}
                      </label>
                      {appliedCoupon && appliedCoupon.code !== "" ? (
                        <div className="flex items-center justify-between rounded-md border border-green-200 bg-green-50 px-3 py-2">
                          <div className="flex items-center gap-2 text-sm text-green-700">
                            <Tag className="h-4 w-4" />
                            <span className="font-medium">
                              {appliedCoupon.code}
                            </span>
                            <span className="text-green-600">
                              {tCoupon("applied") || "Applied"}
                            </span>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={handleRemoveCoupon}
                            className=" p-0 text-green-700 hover:text-red-600 hover:bg-red-50"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ) : (
                        <div className="flex gap-2">
                          <Input
                            placeholder={
                              tCoupon("enterCouponCode") || "Enter coupon code"
                            }
                            value={couponInput}
                            onChange={(e) => {
                              setCouponInput(e.target.value.toUpperCase());
                              if (couponError) setCouponError(null);
                            }}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                handleApplyCoupon();
                              }
                            }}
                            disabled={couponLoading}
                            className="flex-1"
                          />
                          <Button
                            variant="outline"
                            onClick={handleApplyCoupon}
                            disabled={couponLoading || !couponInput.trim()}
                            className="shrink-0 px-4 py-5"
                          >
                            {couponLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              tCoupon("apply") || "Apply"
                            )}
                          </Button>
                        </div>
                      )}
                      {couponError && (
                        <p className="text-sm text-red-500">{couponError}</p>
                      )}
                      <div>
                        <Button
                          variant="link"
                          className="shrink-0 gap-2 border-orangeColor text-orangeColor"
                          onClick={() => setIsVouchersDialogOpen(true)}
                        >
                          <Gift className="h-4 w-4" />
                          <span className="text-sm">
                            {tCoupon("myVouchers")}
                          </span>
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Pricing Summary */}
                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-redColor" />
                      <span className="text-muted-foreground">
                        {tEvent("PricePerTicket:")}
                      </span>
                    </div>
                    <span className="font-bold">
                      {price(event.price, locale)}
                    </span>
                  </div>
                  <Separator />

                  {(offerDiscount > 0 || appliedCoupon) && (
                    <>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          {` ${tEvent("subtotal")} (${quantity} ${quantity > 1 ? tEvent("tickets") : tEvent("ticket")})`}
                        </span>
                        <span>{price(subtotal, locale)}</span>
                      </div>

                      {offerDiscount > 0 && (
                        <div className="flex items-center justify-between text-sm text-green-600">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            {tCoupon("offerDiscount") || "Offer Discount"}
                          </span>
                          <span>-{price(offerDiscount, locale)}</span>
                        </div>
                      )}

                      {appliedCoupon && (
                        <div className="flex items-center justify-between text-sm text-green-600">
                          <span className="flex items-center gap-1">
                            <Tag className="h-3.5 w-3.5" />
                            {tCoupon("couponDiscount") || "Coupon Discount"}
                          </span>
                          <span>-{price(couponDiscount, locale)}</span>
                        </div>
                      )}

                      <Separator />
                    </>
                  )}

                  <div className="flex items-center justify-between font-bold">
                    <span>{tEvent("total")}</span>
                    <span>
                      {offerDiscount > 0 || appliedCoupon
                        ? price(finalTotal, locale)
                        : price(subtotal, locale)}
                    </span>
                  </div>
                  <div className="pt-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleBuyTicket}
                      disabled={event.status === EventStatus.COMPLETED}
                    >
                      {event.status === EventStatus.COMPLETED
                        ? tEvent("completed")
                        : tEvent("buyTicket")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          {/* Voucher Dialog */}
          <Dialog
            open={isVouchersDialogOpen}
            onOpenChange={(open) => {
              setIsVouchersDialogOpen(open);
              if (!open) setVoucherSearchCode("");
            }}
          >
            <DialogContent
              dir={locale === "ar" ? "rtl" : "ltr"}
              className="max-w-2xl max-h-[85vh] overflow-y-auto  "
            >
              {/* Header */}

              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg mt-4">
                  <Gift className="h-5 w-5 text-amber-500" />
                  {tCoupon("myVouchers")}
                </DialogTitle>
              </DialogHeader>

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
                    .map(
                      ({ coupon, remainingBalance, userUsageCount, applicableEventNames }) => {
                        const baseStatus = computeStatus(coupon);
                        const isPerUserLimitReached =
                          coupon.perUserLimit != null &&
                          userUsageCount != null &&
                          userUsageCount >= coupon.perUserLimit;
                        const status =
                          isPerUserLimitReached ||
                            (coupon.allowPartialConsumption &&
                              remainingBalance === 0)
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
                                  className={`text-xs font-medium px-3 py-1 rounded-full uppercase tracking-wide ${isActive
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
                                  className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded transition-colors ${isCopied
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
                                  )}{" "}
                                  – {formatDateShort(new Date(coupon.endDate))}
                                </p>
                                {applicableEventNames.length === 0 ? (
                                  <span className="text-xs text-stone-400 flex items-end gap-1">
                                    <TicketIcon className="h-3 w-3" /> All
                                    events
                                  </span>
                                ) : (
                                  <span className="text-xs text-stone-400 flex items-end gap-1">
                                    <TicketIcon className="h-3 w-3" />{" "}
                                    {applicableEventNames.map(
                                      (e) => `${e.en}- `,
                                    )}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      },
                    )}
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>
    </article>
  );
}
