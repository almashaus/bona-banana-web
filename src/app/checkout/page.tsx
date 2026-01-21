"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  CalendarDays,
  ClockIcon,
  CreditCard,
  LockIcon,
  MapPin,
  FileText,
  TicketIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import { useToast } from "@/src/components/ui/use-toast";
import { generateIDNumber } from "@/src/lib/utils/utils";
import { useAuth } from "@/src/features/auth/auth-provider";
import { Event } from "@/src/models/event";
import { Order, OrderStatus } from "@/src/models/order";
import { Ticket, TicketStatus } from "@/src/models/ticket";
import { eventDateTimeString } from "@/src/lib/utils/formatDate";
import Loading from "@/src/components/ui/loading";
import { useCheckoutStore } from "@/src/lib/stores/useCheckoutStore";
import { mutate } from "swr";
import { price } from "@/src/lib/utils/locales";
import { paymentMethodsIds } from "@/src/data/appData";
import { useLocale, useTranslations } from "next-intl";

type PaymentMethod = {
  PaymentMethodId: number;
  PaymentMethodAr: string;
  PaymentMethodEn: string;
  PaymentMethodCode: string;
  ImageUrl: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const t = useTranslations("Checkout");
  const tEvent = useTranslations("Event");
  const locale = useLocale();

  const storedEvent = useCheckoutStore((state) => state.event);
  const dateId = useCheckoutStore((state) => state.eventDateId);
  const quantity = useCheckoutStore((state) => state.quantity);

  const [isProcessing, setIsProcessing] = useState(false);
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

  // Calculate totals

  const total = event?.price! * (quantity === 3 ? 2 : quantity);
  const subtotal = total - total * 0.15;
  const fees = (total - subtotal).toFixed(2);

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

  // handle payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!user) {
      setIsProcessing(false);
      router.replace("/login");

      return;
    }

    // -------------- Insert order and tickets to database ------------
    const orderId = generateIDNumber("ORDER");

    const ticketsIds: string[] = [];
    const tickets: Ticket[] = [];

    for (let i = 0; i < quantity; i++) {
      const ticketId = generateIDNumber("TICKET");

      const ticket: Ticket = {
        id: ticketId,
        orderId: orderId,
        userId: user.id,
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
      userId: user.id,
      eventId: event?.id!,
      invoiceId: null,
      orderDate: new Date(),
      status: OrderStatus.PENDING,
      totalAmount: total,
      promoCodeId: null, // V-2.0
      discountAmount: 0, // V-2.0
      paymentMethod:
        paymentMethods.find((m) => m.PaymentMethodId === selectedMethod)
          ?.PaymentMethodEn || "MADA",
      tickets: ticketsIds,
    };

    // ------ Insert order & tickets
    const response = await fetch("/api/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        order: order,
        tickets: tickets,
      }),
    });

    if (response.ok) {
      await mutate("/api/admin/events");
      await mutate("/api/admin/orders");
      await mutate("/api/admin/customers", undefined, { revalidate: true });
      await mutate("/api/published-events");

      try {
        const payload = {
          paymentMethodId: selectedMethod,
          invoiceValue: total,
          customerName: user.name,
          customerEmail: user.email,
          customerReference: event?.id,
          orderId,
        };

        // ------ execute payment
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
      } finally {
        setIsProcessing(false);
      }
    }
  };

  if (!event?.id! || !dateId) {
    return (
      <div className="container pt-20 text-center">
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
                    event.eventLogo?.length !== 0
                      ? event.eventLogo!
                      : (event.eventImage ?? "/no-image.svg")
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
              {/* TODO: VAT*/}
              {/* <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("subtotal")}
                </span>
                <span>
                  <span className="icon-saudi_riyal" />
                  {subtotal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("tax")}
                </span>
                <span>
                  <span className="icon-saudi_riyal" />
                  {fees}
                </span>
              </div>
              <Separator className="my-2" /> */}
              <div className="flex justify-between font-bold">
                <span>
                  {tEvent("total")}{" "}
                  {/* <span className="text-xs font-light text-muted-foreground">
                    *{t("VAT")}
                  </span> */}
                </span>
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
                            checked={selectedMethod === method.PaymentMethodId}
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
          </form>
        </div>
      </div>
    </div>
  );
}
