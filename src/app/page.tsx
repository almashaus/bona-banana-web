"use client";

import React, { useState, useEffect, Suspense } from "react";
import { db } from "@/src/lib/firebase/firebaseConfig";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { Button } from "@/src/components/ui/button";
import { Event } from "@/src/models/event";
import Loading from "@/src/components/ui/loading";
import { formatEventsDates } from "@/src/lib/utils/formatDate";
import { query, orderBy } from "firebase/firestore";
import { CalendarDays, ClockIcon, MapPin, Search } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/src/components/ui/card";
import { formatDate, formatTime } from "@/src/lib/utils/formatDate";

export default function Home() {
  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getEvents() {
      try {
        const eventsQuery = query(
          collection(db, "events"),
          orderBy("updated_at", "desc")
        );
        const querySnapshot = await getDocs(eventsQuery);
        const events = querySnapshot.docs.map((doc) => {
          const data = formatEventsDates(doc.data(), false);
          return data as Event;
        });
        setAllEvents(events);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        setError("Failed to fetch data. Please try again later.");
        setLoading(false);
      }
    }

    getEvents();
  }, []);

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
          {loading ? (
            <div className="flex justify-center items-center py-12">
              <Loading />
            </div>
          ) : (
            <EventsList allEvents={allEvents} />
          )}

          <div className="flex justify-center">
            <Button asChild>
              <Link href="/">View All Events</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

function EventsList({ allEvents }: { allEvents: Event[] }) {
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
      {allEvents.map((event) => (
        <Link href={`/events/${event.event_id}`} key={event.event_id}>
          <Card className="overflow-hidden transition-all shadow-none hover:scale-105  bg-darkColor border-0">
            <div className="flex justify-center items-center m-3">
              <img
                src={event.event_image || "/placeholder.svg"}
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
                {`${formatTime(event.dates[0].start_time)} - ${formatTime(
                  event.dates[0].end_time
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
