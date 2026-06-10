"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { Check, MapPin } from "lucide-react";
import { useTranslations } from "next-intl";
import { Event, EventStatus } from "@/src/models/event";
import { formatDateShort2 } from "@/src/lib/utils/formatDate";
import { isSafeImageUrl, isSoldOut } from "@/src/lib/utils/utils";
import { price } from "@/src/lib/utils/locales";
import { Card } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils/utils";

export function EventCard({ event, locale }: { event: Event; locale: string }) {
  const t = useTranslations("Home");
  const soldOut = isSoldOut(event);
  const isFree = event.price === 0;
  const isDisabled = event.status !== EventStatus.PUBLISHED;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const upcomingDates = [...event.dates]
    .filter((d) => new Date(d.date) >= today)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const firstUpcomingDate = upcomingDates.find(
    (d) => new Date(d.date) >= today,
  );
  const [selectedDate, setSelectedDate] = useState<string | null>(
    firstUpcomingDate ? String(firstUpcomingDate.date) : null,
  );

  const imageSrc = event.eventLogo?.trim()
    ? event.eventLogo
    : isSafeImageUrl(event.eventImage)
      ? event.eventImage
      : "/no-image.svg";

  return (
    <Card
      className={cn(
        "relative overflow-visible shadow-none bg-darkColor border-0 rounded-3xl max-w-full",
        soldOut && "opacity-70",
        isDisabled && "grayscale opacity-80",
      )}
    >
      {/* City badge floating above the card */}
      <div className="absolute top-6 -end-3 z-10">
        <div
          className={cn(
            "inline-flex items-center gap-2 p-1 pe-4 rounded-full text-xs md:text-sm font-bold shadow-md",
            isDisabled ? "bg-gray-400 text-gray-700" : "bg-cyan-400 text-black",
          )}
        >
          <div className="bg-beigeColor rounded-full p-1.5 md:p-2">
            {" "}
            <MapPin className="w-3.5 md:w-4 h-3.5 md:h-4 shrink-0" />
          </div>
          {locale === "en" ? event.city.en : event.city.ar}
        </div>
      </div>

      {/* Event image */}
      <Link
        href={`/events/${event.slug}`}
        key={event.id}
        className="cursor-pointer block"
      >
        <div className="flex justify-center items-center m-3.5">
          <div className="relative w-[300px] h-[260px] rounded-xl overflow-hidden">
            {/* Placeholder shimmer shown until image loads */}
            <div className="absolute inset-0 bg-muted-foreground animate-pulse rounded-2xl" />
            <Image
              src={imageSrc}
              alt={event.title}
              fill
              priority
              className="object-cover rounded-2xl"
              unoptimized={event.eventLogo?.includes("firebasestorage")}
            />
            {soldOut && (
              <div className="absolute inset-0 rounded-xl bg-black/55 flex items-center justify-center">
                <span className="bg-redColor text-white text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                  {t("soldOut")}
                </span>
              </div>
            )}
          </div>
        </div>
      </Link>

      <div className={"mx-3.5 pt-1 pb-4"}>
        {/* Date chips */}
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex w-max me-0.5 gap-2">
            {upcomingDates.length > 0 ? (
              upcomingDates.map((eventDate) => {
                const dateKey = String(eventDate.date);
                const isSelected = selectedDate === dateKey;

                return (
                  <button
                    key={dateKey}
                    onClick={() => setSelectedDate(dateKey)}
                    className={cn(
                      "flex items-center gap-1.5 rounded-2xl px-2.5 py-1.5 transition-colors",
                      isSelected
                        ? "bg-yellowColor"
                        : "border border-neutral-400",
                    )}
                  >
                    <Image
                      src="/icons/calendar.svg"
                      width={18}
                      height={19}
                      alt="calendar"
                      className={cn(
                        "shrink-0",
                        !isSelected && "opacity-60 grayscale",
                      )}
                    />
                    <span
                      className={cn(
                        "font-medium whitespace-nowrap",
                        isSelected ? "text-darkColor" : "text-neutral-400",
                      )}
                    >
                      {formatDateShort2(eventDate.date, locale)}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="flex justify-center items-center gap-1.5 bg-muted-foreground/30 text-muted/50 rounded-2xl pt-1.5 pb-2 ps-2.5 pe-3.5">
                <Check className="w-5 h-5" />{" "}
                <span className="text-sm md:text-md font-medium whitespace-nowrap">
                  {t("completed")}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="p-3 pt-2 space-y-2">
        {/* Use My Tickets + available count */}
        {/* TODO: uncomment */}
        {/* <div>
          <a href={`/checkout`}>
            <button className="w-full bg-orangeColor py-3 rounded-2xl font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90">
              <div className="relative -rotate-6">
                <div className="absolute top-0 start-[20px] z-10 text-md">
                  4
                </div>
                <Image
                  src="/icons/ticket.svg"
                  width={45}
                  height={30}
                  alt="ticket"
                  className="shrink-0"
                />
              </div>
              <span className="text-sm md:text-md"> {t("useMyTickets")}</span>
            </button>
          </a>
        </div> */}

        {/* Price */}
        <div>
          {/*  href={`/checkout`} */}
          <a href={`/events/${event.slug}`}>
            <button
              className={`w-full ${
                isFree
                  ? "bg-greenColor text-white"
                  : "bg-lightGreenColor text-darkColor"
              } py-3 rounded-2xl text-sm md:text-md font-bold flex items-center justify-center gap-2 transition-opacity hover:opacity-90`}
            >
              <div>
                {isFree ? (
                  t("free")
                ) : (
                  <span>
                    {/* TODO: {`${t("pay")}`} */}
                    {price(event.price, locale)}
                  </span>
                )}
              </div>
            </button>
          </a>
        </div>
      </div>
    </Card>
  );
}
