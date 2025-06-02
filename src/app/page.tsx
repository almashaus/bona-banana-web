"use client";

import React from "react";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Event, EventStatus } from "@/src/models/event";
import Loading from "@/src/components/ui/loading";
import { CalendarDays, ClockIcon } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/src/components/ui/card";
import { formatDate, formatTime } from "@/src/lib/utils/formatDate";
import { getEventsByStatus } from "../lib/firebase/firestore";
import useSWR from "swr";

export default function Home() {
  const { data, error, isLoading } = useSWR("publishedEvents", () =>
    getEventsByStatus(EventStatus.PUBLISHED)
  );

  return (
    <div className="flex flex-col min-h-screen ">
      {/* Hero Section */}
      {/* <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col justify-center items-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tighter text-center sm:text-5xl xl:text-6xl/none">
              Discover Events That Match Your Passion
            </h1>
            <p className="max-w-[800px] text-center text-muted-foreground md:text-xl">
              Find and book tickets for concerts, sports, theater, festivals,
              and more.
            </p>
          </div>
        </div>
      </section> */}

      {/* Featured Events Section */}
      <section className="w-full py-12 md:py-24 lg:py-32">
        <div className="container px-8 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold tracking-tighter md:text-4xl/tight">
                Featured Events
              </h2>
              <p className="max-w-[900px] text-muted-foreground md:text-xl/relaxed lg:text-base/relaxed xl:text-xl/relaxed">
                Discover the most popular events happening near you
              </p>
            </div>
          </div>
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loading />
            </div>
          )}
          {data && (
            <div>
              <EventsList allEvents={data} />
              <div className="flex justify-center ">
                <Button asChild>
                  <Link href="/">View All Events</Link>
                </Button>
              </div>
            </div>
          )}
          {error ||
            (data?.length == 0 && (
              <div className="flex flex-col justify-center items-center py-12">
                <img
                  src="/no-data.png"
                  alt="no data"
                  className="h-1/2 w-1/2 lg:h-1/4 lg:w-1/4"
                />
                <p className="text-muted-foreground text-center">
                  There is no event currently, Come back later!
                </p>
              </div>
            ))}
        </div>
      </section>
    </div>
  );
}

function EventsList({ allEvents }: { allEvents: Event[] }) {
  return (
    <div className="grid max-w-5xl items-center gap-6 mx-6 lg:mx-auto py-12 sm:grid-cols-2 lg:grid-cols-3">
      {allEvents.map((event) => (
        <Link href={`/events/${event.id}`} key={event.id}>
          <Card className="overflow-hidden transition-all shadow-none hover:scale-105  bg-darkColor border-0">
            <div className="flex justify-center items-center m-3">
              <img
                src={event.eventImage || "/no-image.svg"}
                alt={event.title}
                className="h-full w-full object-cover rounded-md"
                onError={(e) => {
                  e.currentTarget.src = "/no-image.svg";
                }}
              />
            </div>
            <CardContent className="p-4 bg-lightColor mx-3 rounded-md">
              <h3 className="line-clamp-1 text-lg font-bold">{event.title}</h3>
              <div className="mt-2 flex items-center text-sm text-muted-foreground">
                <CalendarDays className="mr-1 h-4 w-4 text-redColor" />
                {`${formatDate(event.dates[0].date)}`}
              </div>
              <div className="mt-1 flex items-center text-sm text-muted-foreground">
                <ClockIcon className="mr-1 h-4 w-4 text-redColor" />
                {`${formatTime(event.dates[0].startTime)} - ${formatTime(
                  event.dates[0].endTime
                )}`}
              </div>
            </CardContent>
            <CardFooter className="p-3 grid grid-cols-2 gap-3 justify-between items-center bg-dark-color ">
              <div className=" bg-redColor py-3 rounded-md text-white text-center">
                <span className="">{event.location}</span>
              </div>
              <div className="bg-yellowColor py-3 rounded-md text-white  text-center">
                <span className="icon-saudi_riyal" />
                {event.price}
              </div>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
