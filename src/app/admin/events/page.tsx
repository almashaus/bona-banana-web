"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/src/components/ui/use-toast";
import Link from "next/link";
import { CalendarDays, ClockIcon, MapPin, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Event } from "@/src/models/event";
import { formatDate, formatTime } from "@/src/lib/utils/formatDate";
import LoadingDots from "@/src/components/ui/loading-dots";
import { deleteDocById, getEvents } from "@/src/lib/firebase/firestore";
import Loading from "@/src/components/ui/loading";
import { getStatusIcon } from "@/src/lib/utils/statusIcons";

export default function Events() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const eventUrl = pathname?.includes("/events");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getEvents()
      .then((events) => {
        setEvents(events);
      })
      .catch(() => {
        setError("Failed to fetch data. Please try again later.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const deleteEvent = async (eventId: string) => {
    try {
      setIsDeleting(true);
      const result = await deleteDocById("events", eventId);

      if (result) {
        setEvents((prevEvents) =>
          prevEvents.filter((event) => event.event_id !== eventId)
        );

        toast({
          title: "✅ Event deleted",
          description: "Your event has been deleted successfully",
        });
      } else {
        throw new Error("Failed to delete event");
      }
    } catch (error) {
      setError("Error deleting event");

      toast({
        title: "⚠️ Error deleting event",
        description: "Failed to delete event. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className={` ${eventUrl && "container my-10"}`}>
      {eventUrl && (
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Events</h1>
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus className="mr-2 h-4 w-4" />
              Create Event
            </Link>
          </Button>
        </div>
      )}

      <div className={` bg-white rounded-lg ${eventUrl && " p-3"}`}>
        {loading && (
          <div className="flex justify-center items-center py-12">
            <Loading />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-12">
            <p>{error}</p>
          </div>
        )}

        {events.length === 0 && !loading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No events available. Create your first event.
            </p>
          </div>
        )}

        {events.map((event: Event) => (
          <div
            key={event.event_id}
            className="flex items-center justify-between border-b mb-4 pb-4"
          >
            <div className="flex items-center gap-2 md:gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-md">
                <img
                  src={event.event_image || "/placeholder.svg"}
                  alt={event.title}
                  className="h-full w-full object-cover"
                />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold text-lg">{event.title}</h3>
                  {getStatusIcon(event.status)}
                </div>
                <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                  <CalendarDays className="mr-1 h-3 w-3 md:h-4 md:w-4 text-orangeColor" />
                  {`${formatDate(event.dates[0].date)}`}
                </div>
                <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                  <ClockIcon className="mr-1 h-3 w-3 md:h-4 md:w-4 text-orangeColor" />
                  {`${formatTime(event.dates[0].start_time)} - ${formatTime(
                    event.dates[0].end_time
                  )}`}
                </div>
                <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                  <MapPin className="mr-1 h-3 w-3 md:h-4 md:w-4 text-orangeColor" />
                  {event.location}
                </div>
              </div>
            </div>
            <div className="flex flex-col md:flex-row gap-2">
              <Button variant="outline" size="sm" asChild>
                <Link href={`/admin/events/edit/${event.event_id}`}>Edit</Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={() => deleteEvent(event.event_id)}
              >
                {isDeleting ? <LoadingDots /> : "Delete"}
              </Button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
