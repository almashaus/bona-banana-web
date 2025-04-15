import React from "react";
import Link from "next/link";
import { CalendarDays, ClockIcon, MapPin, Search } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Event } from "@/data/models";

export default function EventsList({ allEvents }: { allEvents: Event[] }) {
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
                <CalendarDays className="mr-1 h-4 w-4" />
                {`${event.dates?.[0].date}`}
              </div>
              <div className="mt-1 flex items-center text-sm text-muted-foreground">
                <ClockIcon className="mr-1 h-4 w-4" />
                {`${event.dates?.[0].start_time} - ${event.dates?.[0].end_time}`}
              </div>
            </CardContent>
            <CardFooter className="p-3 flex justify-between items-center bg-dark-color ">
              <div className=" bg-redColor px-8 py-3 rounded-md text-white">
                <span className="">{event.location}</span>
              </div>
              <div className="bg-yellowColor px-8 py-3 rounded-md text-white">
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
