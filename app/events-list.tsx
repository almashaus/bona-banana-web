"use client";

import React from "react";
import Link from "next/link";
import { CalendarDays, MapPin, Search } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/lib/utils";
import { Event } from "@/data/models";

export default function EventsList({ allEvents }: { allEvents: Event[] }) {
  return (
    <div className="mx-auto grid max-w-5xl items-center gap-6 py-12 md:grid-cols-2 lg:grid-cols-3">
      {allEvents.map((event) => (
        <Link href={`/events/${event.event_id}`} key={event.event_id}>
          <Card className="overflow-hidden transition-all hover:shadow-lg">
            <div className="flex justify-center items-center">
              <img
                src={event.event_image || "/placeholder.svg"}
                alt={event.title}
                className="h-full w-full object-cover transition-transform hover:scale-105"
                onError={(e) => {
                  e.currentTarget.src = "/no-image.svg";
                }}
              />
            </div>
            <CardContent className="p-4">
              <h3 className="line-clamp-1 text-lg font-bold">{event.title}</h3>
              <div className="mt-2 flex items-center text-sm text-muted-foreground">
                <CalendarDays className="mr-1 h-4 w-4" />
                {`${event.dates?.[0].date}, ${event.dates?.[0].start_time} - ${event.dates?.[0].end_time}`}
              </div>
              <div className="mt-1 flex items-center text-sm text-muted-foreground">
                <MapPin className="mr-1 h-4 w-4" />
                {event.location}
              </div>
            </CardContent>
            <CardFooter className="p-4 pt-0 flex justify-between items-center">
              <Badge variant="outline">{event.status}</Badge>
              <span className="font-medium">{formatCurrency(event.price)}</span>
            </CardFooter>
          </Card>
        </Link>
      ))}
    </div>
  );
}
