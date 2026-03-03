import React, { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Event, EventStatus } from "@/src/models/event";
import { CalendarDays, ClockIcon, TriangleAlert } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/src/components/ui/card";
import { formatDate, formatTime } from "@/src/lib/utils/formatDate";
import { useLocale, useTranslations } from "next-intl";
import Image from "next/image";
import { price } from "../lib/utils/locales";
import { AnimatedImages } from "./(components)/animatedImages";
import { Hero } from "./(components)/animatedHero";
import LoadingEvents from "./(components)/loadingEvents";
import { findFirstTodayOrAfter } from "../lib/utils/utils";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

export default function Home() {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="w-full pt-10">
        <div>
          <Hero />
        </div>

        <div className="flex flex-col justify-center items-center">
          <Image
            src="/images/circles.svg"
            alt="background image"
            width={0}
            height={0}
            className="w-48 sm:w-60 md:w-72 lg:w-80 h-auto mt-16 md:mt-24 object-contain"
          />

          <div className="bg-lightBeigeColor w-full p-8">
            <div className="flex flex-col items-center justify-center text-center space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl">
                ✨ {t("title")} ✨
              </h2>
              <p className="max-w-[900px] text-muted-foreground text-md md:text-xl">
                {t("subtitle")}
              </p>
            </div>

            <div className="flex flex-col justify-center items-center">
              <Suspense fallback={<LoadingEvents />}>
                <EventsList locale={locale} />
              </Suspense>

              <Button asChild>
                <Link href="/"> {t("allEvents")}</Link>
              </Button>
            </div>
          </div>
        </div>

        <div>
          <AnimatedImages />
        </div>
      </div>
    </div>
  );
}

async function EventsList({ locale }: { locale: string }) {
  const res = await fetch(`${baseURL}/api/published-events`);

  if (!res.ok) {
    return (
      <div>
        <div className="flex flex-col justify-center items-center space-y-3 py-12">
          <TriangleAlert className="h-8 w-8 text-muted-foreground" />
          <p className="text-muted-foreground text-center">{"home.error"}</p>
        </div>
      </div>
    );
  }

  const allEvents = (await res.json()) as Event[];

  return (
    <div className="grid max-w-5xl justify-center items-center gap-6 mx-6 lg:mx-auto py-12 md:grid-cols-2 lg:grid-cols-3">
      {allEvents.map((event) => {
        return (
          <Link href={`/events/${event.slug}`} key={event.id}>
            <Card
              className={`overflow-hidden transition-all shadow-none hover:scale-105 hover:rotate-3 bg-darkColor border-0 ${""}`}
            >
              <div className="flex justify-center items-center m-3">
                <div className="relative inline-block">
                  <div className="w-[300px] h-[260px] rounded-lg bg-muted-foreground animate-pulse" />
                  <Image
                    src={
                      event.eventLogo?.trim()
                        ? event.eventLogo
                        : event.eventImage?.trim()
                          ? event.eventImage
                          : "/no-image.svg"
                    }
                    alt={event.title}
                    width={300}
                    height={260}
                    priority
                    className="absolute inset-0 w-full h-full object-cover rounded-lg"
                    unoptimized={event.eventLogo?.includes("firebasestorage")}
                  />
                </div>
              </div>
              <CardContent className={`p-4 mx-3 rounded-md ${"bg-beigeColor"}`}>
                <h3 className="line-clamp-1 text-lg font-bold">
                  {locale === "en" ? event.title : event.titleAr}
                </h3>
                <div className="mt-2 flex items-center text-sm text-muted-foreground">
                  <CalendarDays className="me-1 h-4 w-4 text-redColor" />
                  {`${formatDate(findFirstTodayOrAfter(event.dates.map((d) => d.date)) ?? event.dates[0].date, locale)}`}
                </div>
                <div className="mt-1 flex items-center text-sm text-muted-foreground">
                  <ClockIcon className="me-1 h-4 w-4 text-redColor" />
                  {`${formatTime(findFirstTodayOrAfter(event.dates.map((d) => d.startTime)) ?? event.dates[0].startTime, locale)} - ${formatTime(
                    findFirstTodayOrAfter(event.dates.map((d) => d.endTime)) ??
                      event.dates[0].endTime,
                    locale,
                  )}`}
                </div>
              </CardContent>
              <CardFooter className="p-3 grid grid-cols-2 gap-3 justify-between items-center bg-dark-color">
                <div className=" bg-redColor py-3 rounded-md text-white text-center">
                  <span className="">
                    {locale === "en" ? event.city.en : event.city.ar}
                  </span>
                </div>
                <div className="bg-yellowColor py-3 rounded-md text-white  text-center">
                  {price(event.price, locale)}
                </div>
              </CardFooter>
            </Card>
          </Link>
        );
      })}
    </div>
  );
}
