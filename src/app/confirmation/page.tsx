"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { CalendarDays, Download, MapPin, Ticket } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { formatDate, generateQRCode } from "@/src/lib/utils/utils";
import { events } from "@/src/models/events";

export default function ConfirmationPage() {
  const searchParams = useSearchParams();
  const [isLoading, setIsLoading] = useState(true);

  const orderNumber = searchParams.get("orderNumber");
  const eventId = searchParams.get("eventId");
  const date = searchParams.get("date");
  const quantity = Number.parseInt(searchParams.get("quantity") || "1");

  const event = events.find((e) => e.id === eventId);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  if (!event || !date || !orderNumber) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">
          Invalid confirmation information
        </h1>
        <p className="mb-6">We couldn't find the details for your order.</p>
        <Button asChild>
          <Link href="/events">Browse Events</Link>
        </Button>
      </div>
    );
  }

  const subtotal = event.price * quantity;
  const fees = subtotal * 0.05; // 5% service fee
  const total = subtotal + fees;
  const qrCodeUrl = generateQRCode(orderNumber);

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
            <Ticket className="h-6 w-6" />
          </div>
          <h1 className="text-3xl font-bold">Order Confirmed!</h1>
          <p className="text-muted-foreground mt-2">
            Your tickets have been successfully purchased.
          </p>
        </div>

        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-xl font-semibold">{event.name}</h2>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <CalendarDays className="mr-1 h-4 w-4" />
                  {formatDate(date)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="mr-1 h-4 w-4" />
                  {event.venue}, {event.location}
                </div>
              </div>
              <div className="text-right">
                <div className="text-sm text-muted-foreground">Order #</div>
                <div className="font-medium">{orderNumber}</div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-center mb-4">
              <div className="text-center">
                <div className="bg-white p-2 rounded-lg inline-block mb-2">
                  <img
                    src={qrCodeUrl || "/no-image.svg"}
                    alt="QR Code"
                    className="w-40 h-40"
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  Present this QR code at the venue
                </p>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tickets</span>
                <span>
                  {quantity} × <span className="icon-saudi_riyal" />
                  {event.price}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>
                  <span className="icon-saudi_riyal" />
                  {subtotal}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service Fee</span>
                <span>
                  <span className="icon-saudi_riyal" />
                  {fees}
                </span>
              </div>
              <Separator className="my-2" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span>
                  <span className="icon-saudi_riyal" />
                  {total}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button className="flex items-center gap-2">
            <Download className="h-4 w-4" />
            Download Ticket
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile/tickets">View My Tickets</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
