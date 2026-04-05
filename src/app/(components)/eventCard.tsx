import Link from "next/link";
import Image from "next/image";
import { CalendarDays, ClockIcon } from "lucide-react";
import { Event } from "@/src/models/event";
import { formatDate, formatTime } from "@/src/lib/utils/formatDate";
import {
  findFirstTodayOrAfter,
  isSafeImageUrl,
  isSoldOut,
} from "@/src/lib/utils/utils";
import { price } from "@/src/lib/utils/locales";
import { Card, CardContent, CardFooter } from "@/src/components/ui/card";
import { cn } from "@/src/lib/utils/utils";

export function EventCard({
  event,
  locale,
  t,
}: {
  event: Event;
  locale: string;
  t: any;
}) {
  const soldOut = isSoldOut(event);
  const isFree = event.price === 0;

  const nearestDate =
    findFirstTodayOrAfter(event.dates.map((d) => d.date)) ??
    event.dates[0]?.date;
  const nearestStartTime =
    findFirstTodayOrAfter(event.dates.map((d) => d.startTime)) ??
    event.dates[0]?.startTime;
  const nearestEndTime =
    findFirstTodayOrAfter(event.dates.map((d) => d.endTime)) ??
    event.dates[0]?.endTime;
  return (
    <Link href={`/events/${event.slug}`} key={event.id}>
      <Card
        className={cn(
          "overflow-hidden shadow-none bg-darkColor border-0 transform-gpu will-change-transform transition-transform duration-300 hover:scale-105 hover:rotate-3",
          soldOut && "opacity-70",
        )}
      >
        <div className="flex justify-center items-center m-3">
          <div className="relative inline-block">
            {/* Placeholder shimmer shown until image loads */}
            <div className="w-[300px] h-[260px] rounded-lg bg-muted-foreground animate-pulse" />
            <Image
              src={
                event.eventLogo?.trim()
                  ? event.eventLogo
                  : isSafeImageUrl(event.eventImage)
                    ? event.eventImage
                    : "/no-image.svg"
              }
              alt={event.title}
              width={300}
              height={260}
              className="absolute inset-0 w-full h-full object-cover rounded-lg"
              unoptimized={event.eventLogo?.includes("firebasestorage")}
            />
            {/* Sold-out overlay */}
            {soldOut && (
              <div className="absolute inset-0 rounded-lg bg-black/55 flex items-center justify-center">
                <span className="bg-redColor text-white text-sm font-bold px-4 py-1.5 rounded-full uppercase tracking-wide">
                  {t("soldOut")}
                </span>
              </div>
            )}
          </div>
        </div>

        <CardContent className="p-4 mx-3 rounded-md bg-beigeColor">
          <h3 className="line-clamp-1 text-lg font-bold">
            {locale === "en" ? event.title : event.titleAr}
          </h3>
          <div className="mt-2 flex items-center text-sm text-muted-foreground">
            <CalendarDays className="me-1 h-4 w-4 text-redColor shrink-0" />
            {nearestDate ? formatDate(nearestDate, locale) : "—"}
          </div>
          <div className="mt-1 flex items-center text-sm text-muted-foreground">
            <ClockIcon className="me-1 h-4 w-4 text-redColor shrink-0" />
            {nearestStartTime && nearestEndTime
              ? `${formatTime(nearestStartTime, locale)} – ${formatTime(nearestEndTime, locale)}`
              : "—"}
          </div>
        </CardContent>

        <CardFooter className="p-3 grid grid-cols-2 gap-3 justify-between items-center">
          <div className="bg-redColor py-3 rounded-md text-white text-center text-sm">
            {locale === "en" ? event.city.en : event.city.ar}
          </div>
          <div
            className={cn(
              "py-3 rounded-md font-medium text-center text-sm",
              isFree ? "bg-greenColor text-white" : "bg-yellowColor",
            )}
          >
            {isFree ? t("free") : price(event.price, locale)}
          </div>
        </CardFooter>
      </Card>
    </Link>
  );
}
