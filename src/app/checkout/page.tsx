"use client";

import type React from "react";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CalendarDays,
  ClockIcon,
  CreditCard,
  MapPin,
  TicketIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { useToast } from "@/src/components/ui/use-toast";
import { generateIDNumber } from "@/src/lib/utils/utils";
import { useAuth } from "@/src/features/auth/auth-provider";
import { Event } from "@/src/models/event";
import { Order, OrderStatus } from "@/src/models/order";
import { Ticket, TicketStatus } from "@/src/models/ticket";
import { eventDateTimeString } from "@/src/lib/utils/formatDate";
import Loading from "@/src/components/ui/loading";
import { useCheckoutStore } from "@/src/lib/stores/useCheckoutStore";
import { useLanguage } from "@/src/components/i18n/language-provider";
import { mutate } from "swr";

export default function CheckoutPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const { t } = useLanguage();

  const storedEvent = useCheckoutStore((state) => state.event);
  const dateId = useCheckoutStore((state) => state.eventDateId);
  const quantity = useCheckoutStore((state) => state.quantity);

  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("card");
  const [event, setEvent] = useState<Event | null>(null);
  const [selectedDate, setSelectedDate] = useState("");

  useEffect(() => {
    const eventData: Event = storedEvent as Event;
    if (eventData && eventData.dates && eventData.dates.length > 0) {
      setEvent(eventData as Event);

      const sdate = eventData.dates.find((item) => item.id === dateId);
      setSelectedDate(eventDateTimeString(sdate ?? eventData.dates[0]));
    }
  }, [storedEvent]);

  // Calculate totals
  const total = event?.price! * quantity;
  const subtotal = total - total * 0.15;
  const fees = (total - subtotal).toFixed(2);

  // handle payment
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessing(true);

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please log in to proceed with the checkout.",
        variant: "destructive",
      });
      setIsProcessing(false);
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
        userId: user.id,
        eventId: event?.id!,
        eventDateId: event?.dates.find((item) => item.id === dateId)?.id!,
        qrCode: "",
        status: TicketStatus.VALID,
        purchasePrice: event?.price || 0,
      };
      ticketsIds.push(ticketId);
      tickets.push(ticket);
    }

    const order: Order = {
      id: orderId,
      userId: user.id,
      eventId: event?.id!,
      orderDate: new Date(),
      status: OrderStatus.PAID, // TODO: status of the payment
      totalAmount: total,
      promoCodeId: null, // V-2.0
      discountAmount: 0, // V-2.0
      paymentMethod: "Visa", // TODO: the payment method
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

    if (response.ok) {
      await mutate("/api/admin/events");
      await mutate("/api/admin/orders");
      await mutate("/api/admin/customers", undefined, { revalidate: true });
      await mutate("/api/published-events");

      // Send order confirmation email
      if (user.email) {
        await sendOrderConfirmationEmail(user.email, orderId);
      }

      // Navigate to confirmation page
      router.replace(`/confirmation?orderNumber=${orderId}`);
    }
  };

  // Send order confirmation email
  async function sendOrderConfirmationEmail(
    email: string,
    orderNumber: string
  ) {
    if (event) {
      await fetch("/api/send-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email,
          orderNumber: orderNumber,
          event: event,
          dateId: dateId,
        }),
      });
    }
  }

  if (!event?.id! || !dateId) {
    return (
      <div className="container pt-20 text-center">
        <h1 className="text-2xl font-bold mb-4">
          {t("checkout.invalidInfo") || "Invalid checkout information"}
        </h1>
        <p className="mb-6">
          {t("checkout.selectEventDate") ||
            "Please select an event and date before proceeding to checkout."}
        </p>
        <Button asChild>
          <a href="/">{t("home.allEvents")}</a>
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
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-3xl font-bold">{t("checkout.checkout")}</h1>
      </div>
      <div className="grid gap-10 lg:grid-cols-3">
        {/* Order Summary */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg border p-6 shadow-sm">
            <h2 className="text-xl font-semibold mb-4">
              {t("checkout.summary")}
            </h2>

            <div className="flex items-start gap-4 mb-6">
              <div className="h-20 w-20 overflow-hidden rounded-md">
                <img
                  src={event.eventImage || "/no-image.svg"}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <h3 className="text-lg font-medium">{event.title}</h3>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <CalendarDays className="mr-1 h-4 w-4 text-redColor" />
                  {selectedDate.split("-")[1]}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <ClockIcon className="mr-1 h-4 w-4 text-redColor" />
                  {selectedDate.split("-")[2]} - {selectedDate.split("-")[3]}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="mr-1 h-4 w-4 text-redColor" />
                  {event.location}
                </div>
                <div className="flex items-center text-sm mt-1">
                  <TicketIcon className="mr-1 h-4 w-4 text-redColor" />
                  {quantity}{" "}
                  {quantity === 1 ? t("event.ticket") : t("event.tickets")}
                </div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              {/* TODO: VAT*/}
              {/* <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("checkout.subtotal")}
                </span>
                <span>
                  <span className="icon-saudi_riyal" />
                  {subtotal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("checkout.tax")}
                </span>
                <span>
                  <span className="icon-saudi_riyal" />
                  {fees}
                </span>
              </div>
              <Separator className="my-2" /> */}
              <div className="flex justify-between font-bold">
                <span>
                  {t("event.total")}{" "}
                  {/* <span className="text-xs font-light text-muted-foreground">
                    *{t("checkout.VAT")}
                  </span> */}
                </span>
                <span>
                  <span className="icon-saudi_riyal" />
                  {total}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Payment Form */}
        <div className="lg:col-span-1">
          <form
            onSubmit={handleSubmit}
            className="bg-white rounded-lg border p-6 shadow-sm"
          >
            <h2 className="text-xl font-semibold mb-4">
              {t("checkout.paymentDetails")}
            </h2>

            <Tabs defaultValue="card" onValueChange={setPaymentMethod}>
              <TabsList className="grid w-full grid-cols-2 mb-4">
                <TabsTrigger value="card">Credit Card</TabsTrigger>
                <TabsTrigger value="paypal">PayPal</TabsTrigger>
              </TabsList>
              <TabsContent value="card" className="space-y-4">
                <div className="space-y-1">
                  <Label htmlFor="name">
                    {t("checkout.cardholderName") || "Cardholder Name"}
                  </Label>
                  <Input id="name" defaultValue={user?.name || ""} required />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="card-number">
                    {t("checkout.cardNumber") || "Card Number"}
                  </Label>
                  <Input
                    id="card-number"
                    placeholder="1234 5678 9012 3456"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <Label htmlFor="expiry">
                      {t("checkout.expiryDate") || "Expiry Date"}
                    </Label>
                    <Input id="expiry" placeholder="MM/YY" required />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="cvc">{t("checkout.cvc") || "CVC"}</Label>
                    <Input id="cvc" placeholder="123" required />
                  </div>
                </div>
                <div className="grid gap-4">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span className="flex items-center ">
                        <CreditCard className="h-4 w-4 animate-pulse" />
                        {t("checkout.processing") || "Processing..."}
                      </span>
                    ) : (
                      <span>
                        {t("checkout.pay")}{" "}
                        <span className="icon-saudi_riyal" />
                        {total}
                      </span>
                    )}
                  </Button>
                </div>
              </TabsContent>
              <TabsContent
                value="paypal"
                className="flex flex-col justify-center items-center h-40"
              >
                <p className="text-center text-muted-foreground">
                  {t("checkout.paypalRedirect") ||
                    "You will be redirected to PayPal to complete your payment."}
                </p>
                <div className="mt-6 w-full">
                  <Button
                    type="submit"
                    className="w-full"
                    size="lg"
                    disabled={isProcessing}
                  >
                    {isProcessing ? (
                      <span className="flex items-center gap-2">
                        <CreditCard className="h-4 w-4 animate-pulse" />
                        {t("checkout.processing") || "Processing..."}
                      </span>
                    ) : (
                      <span>
                        {t("checkout.pay")}{" "}
                        <span className="icon-saudi_riyal" />
                        {total}
                      </span>
                    )}
                  </Button>
                </div>
              </TabsContent>
            </Tabs>
          </form>
        </div>
      </div>
    </div>
  );
}
