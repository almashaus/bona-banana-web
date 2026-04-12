"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, CheckCircle, Download, MapPin, Tag } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { generateQRCode } from "@/src/lib/utils/utils";
import { formatDate } from "@/src/lib/utils/formatDate";
import { Coupon } from "@/src/models/coupon";
import { Event } from "@/src/models/event";
import useSWR from "swr";
import { Order } from "@/src/models/order";
import Loading from "@/src/components/ui/loading";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Ticket } from "@/src/models/ticket";
import Image from "next/image";
import { price } from "@/src/lib/utils/locales";
import { useLocale, useTranslations } from "next-intl";

function Confirmation() {
  const [event, setEvent] = useState<Event | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const router = useRouter();
  const t = useTranslations("Confirm");
  const tEvent = useTranslations("Event");
  const tCoupon = useTranslations("Coupon");
  const locale = useLocale();
  const searchParams = useSearchParams();
  const orderNumber = searchParams?.get("orderNumber");
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!orderNumber) {
      router.push("/");
    }
  }, [orderNumber, router]);

  interface Response {
    order: Order;
    event: Event;
    tickets: Ticket[];
    coupon: Coupon | null;
  }

  const { data, error, isLoading } = useSWR<Response>(
    `/api/order?orderNumber=${orderNumber}`,
  );

  useEffect(() => {
    if (data) {
      setOrder(data.order as Order);
      setQuantity(data.order.tickets.length);

      const eventData: Event = data.event as Event;
      if (eventData && eventData.dates && eventData.dates.length > 0) {
        setEvent(eventData as Event);

        const sDate = eventData.dates.find(
          (item) => item.id === data.tickets[0].eventDateId,
        )?.date!;
        setDate(sDate);
      }
    }
  }, [data]);

  // Download PDF handler
  const handleDownloadPDF = async () => {
    if (!cardRef.current) return;
    const canvas = await html2canvas(cardRef.current, {
      scale: 2,
      useCORS: true,
    });
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "pt",
      format: "a4",
    });
    // Calculate width/height to fit A4
    const pageWidth = pdf.internal.pageSize.getWidth();
    const pageHeight = pdf.internal.pageSize.getHeight();
    // Calculate scale to fit both width and height
    const margin = 20;
    const maxWidth = pageWidth - margin * 2;
    const maxHeight = pageHeight - margin * 2;
    const ratio = Math.min(maxWidth / canvas.width, maxHeight / canvas.height);
    const imgWidth = canvas.width * ratio;
    const imgHeight = canvas.height * ratio;
    const x = (pageWidth - imgWidth) / 2;
    const y = (pageHeight - imgHeight) / 2;
    pdf.addImage(imgData, "PNG", x, y, imgWidth, imgHeight);
    pdf.save(`${orderNumber}.pdf`);
  };

  if (error) {
    return (
      <div className="container py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">
          Invalid confirmation information
        </h1>
        <p className="mb-6">We couldn't find the details for your order</p>
        <Button asChild>
          <Link href="/events">Browse Events</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !event || !date || !orderNumber) {
    return (
      <div className="flex justify-center items-center py-20">
        <Loading />
      </div>
    );
  }

  const rawSubtotal = (event?.price ?? 0) * quantity;
  const discountAmount = order?.discountAmount ?? 0;
  const hasDiscount = discountAmount > 0;
  const coupon = data?.coupon ?? null;

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold">{t("confirm")}</h1>
          <p className="text-muted-foreground mt-2">{t("purchase")}</p>
        </div>

        <Card className="mb-6" ref={cardRef}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xl font-semibold">{event.title}</div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <CalendarDays className="me-1 h-4 w-4 text-orangeColor" />
                  {formatDate(date, locale)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="me-1 h-4 w-4 text-orangeColor" />
                  {event.city.en}
                </div>
              </div>
              <div className="text-right items-end">
                <div className="text-sm text-muted-foreground">
                  {t("orderNumber")}
                </div>
                <div className="font-medium">{orderNumber}</div>
              </div>
            </div>

            <Separator className="my-4" />

            <div className="flex justify-center mb-4">
              <div className="text-center">
                {data?.tickets?.map((ticket) => (
                  <div
                    key={ticket.id}
                    className="flex flex-col items-center gap-1 mb-4"
                  >
                    <span className="text-sm text-muted-foreground">
                      {ticket.id}
                    </span>
                    <div className="flex justify-center bg-white p-2 rounded-lg  mb-2 w-40 h-40 md:w-full md:h-full">
                      <img
                        src={
                          generateQRCode(ticket.token || ticket.id) ||
                          "/no-image.svg"
                        }
                        alt={"QR code"}
                        width={150}
                        height={150}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {tEvent("tickets").charAt(0).toUpperCase() +
                    tEvent("tickets").slice(1)}
                </span>
                <span>
                  {quantity} × {price(event.price, locale)}
                </span>
              </div>

              {hasDiscount && (
                <>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {t("subtotal")}
                    </span>
                    <span>{price(rawSubtotal, locale)}</span>
                  </div>
                  <div className="flex justify-between text-sm text-green-600">
                    <span className="flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5" />
                      {tCoupon("couponDiscount")}
                      {coupon?.code && (
                        <span className="font-mono text-xs bg-green-100 px-1.5 py-0.5 rounded">
                          {coupon.code}
                        </span>
                      )}
                    </span>
                    <span>-{price(discountAmount, locale)}</span>
                  </div>
                  <Separator className="my-2" />
                </>
              )}

              <div className="flex justify-between font-bold">
                <span>{tEvent("total")}</span>
                <span>{price(order?.totalAmount ?? rawSubtotal, locale)}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            className="flex items-center gap-2"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4" />
            {t("download")} {quantity > 1 ? t("tickets") : t("ticket")}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile?tab=tickets">{t("myTickets")}</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <Suspense>
      <Confirmation />
    </Suspense>
  );
}
