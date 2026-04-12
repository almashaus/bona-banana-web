"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  CheckCircle,
  ClockIcon,
  CreditCard,
  Gift,
  LockIcon,
  MapPin,
  FileText,
  Tag,
  TicketIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import { useToast } from "@/src/components/ui/use-toast";
import { generateIDNumber } from "@/src/lib/utils/utils";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useAuthStore } from "@/src/lib/stores/useAuthStore";
import { auth } from "@/src/lib/firebase/firebaseConfig";
import { Event } from "@/src/models/event";
import { Order, OrderStatus } from "@/src/models/order";
import { Ticket, TicketStatus } from "@/src/models/ticket";
import { eventDateTimeString } from "@/src/lib/utils/formatDate";
import Loading from "@/src/components/ui/loading";
import { useCheckoutStore } from "@/src/lib/stores/useCheckoutStore";
import { mutate } from "swr";
import { price } from "@/src/lib/utils/locales";
import { roundMoney } from "@/src/lib/utils/utils";
import { paymentMethodsIds } from "@/src/data/appData";
import { useLocale, useTranslations } from "next-intl";

type PaymentMethod = {
  PaymentMethodId: number;
  PaymentMethodAr: string;
  PaymentMethodEn: string;
  PaymentMethodCode: string;
  ImageUrl: string;
};

const validatePhone = (phone: string) => /^\d{9,10}$/.test(phone);

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const setUser = useAuthStore((state) => state.setUser);
  const t = useTranslations("Checkout");
  const tEvent = useTranslations("Event");
  const tCoupon = useTranslations("Coupon");
  const locale = useLocale();

  const storedEvent = useCheckoutStore((state) => state.event);
  const dateId = useCheckoutStore((state) => state.eventDateId);
  const quantity = useCheckoutStore((state) => state.quantity);
  const offerId = useCheckoutStore((state) => state.offerId);
  const storedOfferDiscount = useCheckoutStore((state) => state.offerDiscount);
  const couponId = useCheckoutStore((state) => state.couponId);
  const couponCode = useCheckoutStore((state) => state.couponCode);
  const storedCouponDiscount = useCheckoutStore(
    (state) => state.discountAmount,
  );
  const discountType = useCheckoutStore((state) => state.discountType);

  const [isProcessing, setIsProcessing] = useState(false);
  const [phoneDialogOpen, setPhoneDialogOpen] = useState(false);
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneError, setPhoneError] = useState<string | null>(null);
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMethod, setSelectedMethod] = useState<number>(2);
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const eventData: Event = storedEvent as Event;
    if (eventData && eventData.dates && eventData.dates.length > 0) {
      setEvent(eventData as Event);

      const sdate = eventData.dates.find((item) => item.id === dateId);
      setSelectedDate(eventDateTimeString(sdate ?? eventData.dates[0], locale));
    }
  }, [storedEvent]);

  const rawSubtotal = roundMoney(event?.price! * quantity);
  const hasOffer = offerId !== null && storedOfferDiscount > 0;
  const offerDiscountAmount = hasOffer ? roundMoney(storedOfferDiscount) : 0;
  const hasCoupon = couponId !== null && storedCouponDiscount > 0;
  const couponDiscountAmount = hasCoupon ? roundMoney(storedCouponDiscount) : 0;
  const totalDiscount = roundMoney(offerDiscountAmount + couponDiscountAmount);

  const total = roundMoney(rawSubtotal - totalDiscount);
  const isFreeOrder = total === 0;

  useEffect(() => {
    if (total && total > 0) {
      const initiate = async () => {
        setIsLoading(true);
        const response = await fetch("/api/payment/initiate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            invoiceAmount: total,
            currencyIso: "SAR",
          }),
        });

        if (response.ok) {
          const jsonData = await response.json();
          setPaymentMethods(jsonData?.data?.Data?.PaymentMethods || []);
        }
        setIsLoading(false);
      };

      initiate();
    }
  }, [total]);

  const processCheckout = async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    const orderId = generateIDNumber("ORDER");

    const ticketsIds: string[] = [];
    const tickets: Ticket[] = [];

    for (let i = 0; i < quantity; i++) {
      const ticketId = generateIDNumber("TICKET");

      const ticket: Ticket = {
        id: ticketId,
        orderId: orderId,
        userId: currentUser.id,
        eventId: event?.id!,
        eventDateId: event?.dates.find((item) => item.id === dateId)?.id!,
        qrCode: "",
        status: TicketStatus.PENDING,
        purchasePrice: event?.price || 0,
      };
      ticketsIds.push(ticketId);
      tickets.push(ticket);
    }

    const order: Order = {
      id: orderId,
      userId: currentUser.id,
      eventId: event?.id!,
      invoiceId: null,
      orderDate: new Date(),
      status: OrderStatus.PENDING,
      totalAmount: total,
      couponId: couponId ?? offerId ?? null,
      discountAmount: totalDiscount,
      discountType: discountType ?? (hasOffer ? "offer" : null),
      paymentMethod:
        paymentMethods.find((m) => m.PaymentMethodId === selectedMethod)
          ?.PaymentMethodEn || "MADA",
      tickets: ticketsIds,
    };

    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: order,
        tickets: tickets,
      }),
    });

    if (!response.ok) {
      toast({
        title: t("orderFailed") || "Order Failed",
        description:
          t("orderFailedDescription") ||
          "Failed to create order. Please try again.",
        variant: "destructive",
      });
      return;
    }

    await mutate("/api/admin/events");
    await mutate("/api/admin/orders");
    await mutate("/api/admin/customers", undefined, { revalidate: true });
    await mutate("/api/published-events");

    try {
      const payload = {
        paymentMethodId: selectedMethod,
        invoiceValue: total,
        customerName: currentUser.name,
        customerEmail: currentUser.email,
        customerReference: `event-${event?.slug}`,
        orderId,
      };

      const res = await fetch("/api/payment/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error("Execute error");

      const redirectUrl = json?.data?.Data?.PaymentURL;

      if (!redirectUrl) throw new Error("Missing redirect url from gateway");

      window.location.href = redirectUrl;
    } catch (err: any) {
      toast({
        title: "Payment Failed",
        description:
          "Something went wrong on the payment. Please try again later.",
        variant: "destructive",
      });
    }
  };

  const processZeroTotalCheckout = async () => {
    const currentUser = useAuthStore.getState().user;
    if (!currentUser) {
      router.replace("/login");
      return;
    }

    const orderId = generateIDNumber("ORDER");
    const ticketsIds: string[] = [];
    const tickets: Ticket[] = [];

    for (let i = 0; i < quantity; i++) {
      const ticketId = generateIDNumber("TICKET");
      const ticket: Ticket = {
        id: ticketId,
        orderId,
        userId: currentUser.id,
        eventId: event?.id!,
        eventDateId: event?.dates.find((item) => item.id === dateId)?.id!,
        qrCode: "",
        status: TicketStatus.PENDING,
        purchasePrice: event?.price || 0,
      };
      ticketsIds.push(ticketId);
      tickets.push(ticket);
    }

    const order: Order = {
      id: orderId,
      userId: currentUser.id,
      eventId: event?.id!,
      invoiceId: null,
      orderDate: new Date(),
      status: OrderStatus.PENDING,
      totalAmount: 0,
      couponId: couponId ?? offerId ?? null,
      discountAmount: totalDiscount,
      discountType: discountType ?? (hasOffer ? "offer" : null),
      paymentMethod: "Free",
      tickets: ticketsIds,
    };

    const postRes = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ order, tickets }),
    });

    if (!postRes.ok) {
      toast({
        title: t("orderFailed") || "Order Failed",
        description:
          t("orderFailedDescription") ||
          "Failed to create order. Please try again.",
        variant: "destructive",
      });
      return;
    }

    const putRes = await fetch("/api/checkout", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, email: currentUser.email }),
    });

    if (!putRes.ok) {
      toast({
        title: t("orderFailed") || "Order Failed",
        description:
          t("orderFailedDescription") ||
          "Failed to confirm order. Please contact support.",
        variant: "destructive",
      });
      return;
    }

    await mutate("/api/admin/events");
    await mutate("/api/admin/orders");
    await mutate("/api/admin/customers", undefined, { revalidate: true });
    await mutate("/api/published-events");

    router.push(`/confirmation?orderNumber=${orderId}`);
  };

  const handleSavePhoneAndContinue = async () => {
    if (!user) return;
    if (!validatePhone(phoneInput)) {
      setPhoneError(t("phoneInvalid"));
      return;
    }
    setPhoneError(null);
    const fbUser = auth.currentUser;
    if (!fbUser) {
      router.replace("/login");
      return;
    }

    setIsSavingPhone(true);
    try {
      const idToken = await fbUser.getIdToken();
      const response = await fetch(`/api/profile/${user.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id: user.id, data: { phone: phoneInput } }),
      });

      if (!response.ok) {
        throw new Error("save failed");
      }

      setUser({ ...user, phone: phoneInput });
      await mutate(`/api/profile/${user.id}`);
      setPhoneDialogOpen(false);
      setPhoneInput("");
      setIsProcessing(true);
      try {
        if (isFreeOrder) {
          await processZeroTotalCheckout();
        } else {
          await processCheckout();
        }
      } finally {
        setIsProcessing(false);
      }
    } catch {
      toast({
        title: t("phoneSaveFailed"),
        variant: "destructive",
      });
    } finally {
      setIsSavingPhone(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      router.replace("/login");
      return;
    }

    if (!user.phone?.trim()) {
      setPhoneInput("");
      setPhoneError(null);
      setPhoneDialogOpen(true);
      return;
    }

    setIsProcessing(true);
    try {
      if (isFreeOrder) {
        await processZeroTotalCheckout();
      } else {
        await processCheckout();
      }
    } finally {
      setIsProcessing(false);
    }
  };

  if (!event?.id! || !dateId) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {t("invalidInfo") || "Invalid checkout information"}
        </h1>
        <p className="mb-6">
          {t("selectEventDate") ||
            "Please select an event and date before proceeding to checkout."}
        </p>
        <Button asChild>
          <a href="/">{t("allEvents")}</a>
        </Button>
      </div>
    );
  }
  if (!event) {
    return (
      <div className="flex justify-center items-center py-24">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="flex justify-start gap-4 mb-5">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          {locale === "en" ? (
            <ArrowLeft className="h-4 w-4" />
          ) : (
            <ArrowRight className="h-4 w-4" />
          )}
        </Button>
        <h1 className="text-3xl font-bold">{t("checkout")}</h1>
      </div>
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <div className="flex items-end gap-1 text-xl font-semibold mb-4">
              <FileText />
              {t("summary")}
            </div>

            <div className="flex items-start gap-4 mb-6">
              <div className="h-20 w-20 overflow-hidden rounded-md">
                <img
                  src={
                    event.eventLogo?.trim()
                      ? event.eventLogo
                      : event.eventImage?.trim()
                        ? event.eventImage
                        : "/no-image.svg"
                  }
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium">{event.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <CalendarDays className="me-1 h-4 w-4 text-redColor" />
                  {selectedDate.split("-")[1]}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <ClockIcon className="me-1 h-4 w-4 text-redColor" />
                  {selectedDate.split("-")[2]} - {selectedDate.split("-")[3]}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="me-1 h-4 w-4 text-redColor" />
                  {event.city.en}
                </div>
                <div className="flex items-center text-sm mt-1">
                  <TicketIcon className="me-1 h-4 w-4 text-redColor" />
                  {quantity}{" "}
                  {quantity === 1 ? tEvent("ticket") : tEvent("tickets")}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              {(hasOffer || hasCoupon) && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("subtotal") || "Subtotal"}
                    </span>
                    <span>{price(rawSubtotal, locale)}</span>
                  </div>

                  {hasOffer && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        {tCoupon("offerDiscount") || "Offer Discount"}
                      </span>
                      <span>-{price(offerDiscountAmount, locale)}</span>
                    </div>
                  )}

                  {hasCoupon && (
                    <div className="flex justify-between text-sm text-green-600">
                      <span className="flex items-center gap-1">
                        <Tag className="h-3.5 w-3.5" />
                        {tCoupon("couponDiscount") || "Coupon Discount"}
                        {couponCode && (
                          <span className="font-mono text-xs bg-green-100 px-1.5 py-0.5 rounded">
                            {couponCode}
                          </span>
                        )}
                      </span>
                      <span>-{price(couponDiscountAmount, locale)}</span>
                    </div>
                  )}

                  <Separator className="my-2" />
                </>
              )}
              <div className="flex justify-between font-bold">
                <span>{tEvent("total")}</span>
                <span>{price(total, locale)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="lg:col-span-1">
          <form
            onSubmit={handlePaymentSubmit}
            className="bg-white rounded-lg border p-6 shadow-sm"
          >
            {isFreeOrder ? (
              <>
                <div className="flex items-end gap-1 text-xl font-semibold mb-4">
                  <Gift />
                  {tCoupon("freeOrder") || "Free Order"}
                </div>
                <div className="rounded-md border border-green-200 bg-green-50 p-4 mb-6 text-sm text-green-800 flex items-start gap-2">
                  <CheckCircle className="h-4 w-4 mt-0.5 shrink-0 text-green-600" />
                  <span>{t("voucherCoversFullAmount")}</span>
                </div>
                <Button
                  type="submit"
                  className="w-full"
                  size="lg"
                  disabled={isProcessing}
                >
                  {isProcessing ? (
                    <span className="flex items-center gap-3">
                      <CheckCircle className="h-4 w-4 animate-pulse" />
                      {t("processing") || "Processing..."}
                    </span>
                  ) : (
                    <span>
                      {tCoupon("confirmFreeOrder") || "Confirm Free Order"}
                    </span>
                  )}
                </Button>
              </>
            ) : (
              <>
                <div className="flex items-end gap-1 text-xl font-semibold mb-4">
                  <CreditCard />
                  {t("paymentMethods")}
                </div>

                {isLoading && (
                  <div className="flex justify-center items-center py-12">
                    <Loading />
                  </div>
                )}

                {paymentMethods && !isLoading && (
                  <>
                    <div className="grid gap-2">
                      {paymentMethods.length === 0 && (
                        <div>{t("noPaymentMethods")}</div>
                      )}

                      {paymentMethods
                        .filter((m) =>
                          paymentMethodsIds.includes(m.PaymentMethodId),
                        )
                        .map((method: PaymentMethod) => (
                          <div
                            key={method.PaymentMethodId}
                            onClick={() =>
                              setSelectedMethod(method.PaymentMethodId)
                            }
                            className={`${selectedMethod === method.PaymentMethodId ? "border-2 border-orangeColor" : " border-muted-foreground/20"} border rounded-lg flex justify-between items-center p-2 cursor-pointer`}
                          >
                            <div className="flex items-center">
                              <input
                                type="radio"
                                name="paymentMethod"
                                className="accent-greenColor cursor-pointer"
                                value={String(method.PaymentMethodId)}
                                checked={
                                  selectedMethod === method.PaymentMethodId
                                }
                                onChange={() =>
                                  setSelectedMethod(method.PaymentMethodId)
                                }
                              />
                              <img
                                src={method.ImageUrl}
                                alt={method.PaymentMethodEn}
                                className="ms-3 me-2"
                                width={50}
                                height={10}
                              />
                              <Label
                                htmlFor={String(method.PaymentMethodId)}
                                className="cursor-pointer"
                              >
                                {method.PaymentMethodEn}
                              </Label>
                            </div>
                          </div>
                        ))}
                    </div>
                    <div className="mt-6 w-full space-y-2">
                      <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={isProcessing}
                      >
                        {isProcessing ? (
                          <span className="flex items-center gap-3">
                            <CreditCard className="h-4 w-4 animate-pulse" />
                            {t("processing") || "Processing..."}
                          </span>
                        ) : (
                          <span>
                            {t("pay")} {price(total, locale)}
                          </span>
                        )}
                      </Button>
                      <div className="flex items-center gap-1 text-xs font-medium text-gray-600">
                        <LockIcon className="w-3 h-3" /> {t("securePay")}{" "}
                        <img
                          src="/images/MF-logo.svg"
                          alt="My Fatoorah Logo"
                          className="h-3"
                        />
                      </div>
                    </div>
                  </>
                )}
              </>
            )}
          </form>
        </div>
      </div>

      <Dialog
        open={phoneDialogOpen}
        onOpenChange={(open) => {
          setPhoneDialogOpen(open);
          if (!open) {
            setPhoneError(null);
            setPhoneInput("");
          }
        }}
      >
        <DialogContent className="sm:max-w-md max-w-xs" dir="ltr">
          <DialogHeader>
            <DialogTitle>{t("phoneRequiredTitle")}</DialogTitle>
            <DialogDescription>
              {t("phoneRequiredDescription")}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="checkout-phone">{t("phoneLabel")}</Label>
            <Input
              id="checkout-phone"
              type="tel"
              inputMode="numeric"
              autoComplete="tel"
              placeholder="05XXXXXXXX"
              value={phoneInput}
              onChange={(e) => {
                setPhoneInput(e.target.value.replace(/\D/g, ""));
                setPhoneError(null);
              }}
            />
            {phoneError && (
              <p className="text-sm text-destructive">{phoneError}</p>
            )}
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPhoneDialogOpen(false)}
              disabled={isSavingPhone}
            >
              {t("cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSavePhoneAndContinue}
              disabled={isSavingPhone}
            >
              {isSavingPhone ? t("processing") : t("continueToPay")}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
