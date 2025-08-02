"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarDays, CheckCircle, Download, MapPin } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Separator } from "@/src/components/ui/separator";
import { generateQRCode } from "@/src/lib/utils/utils";
import { formatDate } from "@/src/lib/utils/formatDate";
import { Event } from "@/src/models/event";
import useSWR from "swr";
import { useLanguage } from "@/src/components/i18n/language-provider";
import { Order } from "@/src/models/order";
import Loading from "@/src/components/ui/loading";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { Ticket } from "@/src/models/ticket";
import Image from "next/image";

function Confirmation() {
  const [event, setEvent] = useState<Event | null>(null);
  const [date, setDate] = useState<Date | null>(null);
  const [order, setOrder] = useState<Order | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  const router = useRouter();
  const { t } = useLanguage();
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
  }

  const { data, error, isLoading } = useSWR<Response>(
    `/api/order?orderNumber=${orderNumber}`
  );

  useEffect(() => {
    if (data) {
      setOrder(data.order as Order);
      setQuantity(data.order.tickets.length);

      const eventData: Event = data.event as Event;
      if (eventData && eventData.dates && eventData.dates.length > 0) {
        setEvent(eventData as Event);

        const sDate = eventData.dates.find(
          (item) => item.id === data.tickets[0].eventDateId
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
        <p className="mb-6">We couldn't find the details for your order.</p>
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

  // Calculate totals
  const total = event?.price! * quantity;
  const subtotal = total - total * 0.15;
  const fees = (total - subtotal).toFixed(2);

  return (
    <div className="container py-10">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-100 text-green-600 mb-4">
            <CheckCircle className="h-10 w-10" />
          </div>
          <h1 className="text-3xl font-bold">{t("confirm.confirm")}</h1>
          <p className="text-muted-foreground mt-2">{t("confirm.purchase")}</p>
        </div>

        <Card className="mb-6" ref={cardRef}>
          <CardContent className="p-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="text-xl font-semibold">{event.title}</div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <CalendarDays className="mr-1 h-4 w-4" />
                  {formatDate(date)}
                </div>
                <div className="flex items-center text-sm text-muted-foreground mt-1">
                  <MapPin className="mr-1 h-4 w-4" />
                  {event.location}
                </div>
              </div>
              <div className="text-right items-end">
                <div className="text-sm text-muted-foreground">
                  {t("confirm.orderNumber")}
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
                      <Image
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
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {t("event.tickets").charAt(0).toUpperCase() +
                    t("event.tickets").slice(1)}
                </span>
                <span>
                  {quantity} × <span className="icon-saudi_riyal" />
                  {event.price}
                </span>
              </div>
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
          </CardContent>
        </Card>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            className="flex items-center gap-2"
            onClick={handleDownloadPDF}
          >
            <Download className="h-4 w-4" />
            {t("confirm.download")}{" "}
            {quantity > 1 ? t("confirm.tickets") : t("confirm.ticket")}
          </Button>
          <Button variant="outline" asChild>
            <Link href="/profile?tab=tickets">{t("confirm.myTickets")}</Link>
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
