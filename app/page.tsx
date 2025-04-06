"use client";

import React, { useState, useEffect, Suspense } from "react";
import { db } from "@/firebaseConfig";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Event } from "@/data/models";
import Loading from "../components/ui/loading";
import EventsList from "./events-list";

export default function Home() {
  const [allEvents, setallEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function getEvents() {
      try {
        const querySnapshot = await getDocs(collection(db, "events"));
        const events = querySnapshot.docs.map((doc) => {
          const data = doc.data();
          const timestamp: Timestamp = data.dates[0].start_datetime;

          const date: Date = timestamp.toDate();
          data.dates[0].start_datetime = date.toLocaleString("en-US", {
            year: "numeric",
            month: "numeric",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          });
          return data as Event;
        });
        setallEvents(events);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching events:", error);
        setError("Failed to fetch data. Please try again later.");
        setLoading(false);
      }
    }

    getEvents();
  }, []);

  if (error) {
    return (
      <div className="container mx-auto p-4">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      {/* Hero Section */}
      {/* <section className="w-full py-12 md:py-24 lg:py-32 bg-gradient-to-b from-muted/50 to-muted">
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
