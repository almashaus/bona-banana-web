"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/src/components/ui/use-toast";
import Link from "next/link";
import { CalendarDays, ClockIcon, MapPin, PanelLeft, Plus } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Event } from "@/src/models/event";
import { formatDate, formatTime } from "@/src/lib/utils/formatDate";
import LoadingDots from "@/src/components/ui/loading-dots";
import { deleteDocById, getEvents } from "@/src/lib/firebase/firestore";
import Loading from "@/src/components/ui/loading";
import { getStatusIcon } from "@/src/lib/utils/statusIcons";
import useSWR from "swr";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { useMobileSidebar } from "@/src/lib/stores/useMobileSidebar";

export default function Events() {
  const { toast } = useToast();
  const router = useRouter();
  const pathname = usePathname();
  const eventUrl = pathname?.includes("/events");
  const isMobile = useIsMobile();
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);

  const [events, setEvents] = useState<Event[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  const { data, error, isLoading } = useSWR("events", () => getEvents(), {
    onSuccess: (fetchedData) => {
      setEvents(fetchedData);
    },
  });

  const deleteEvent = async (eventId: string) => {
    try {
      setIsDeleting(true);
      const result = await deleteDocById("events", eventId);

      if (result) {
        setEvents((prevEvents) =>
          prevEvents.filter((event) => event.id !== eventId)
        );

        toast({
          title: "✅ Event deleted",
          description: "Your event has been deleted successfully",
        });
      } else {
        throw new Error("Failed to delete event");
      }
    } catch (error) {
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
    <div className={` ${eventUrl && "container py-6"}`}>
      {eventUrl && (
        <div className="flex flex-row justify-between items-end md:items-center gap-4 mb-6">
          <div className="">
            {isMobile && (
              <Button
                variant="ghost"
                size="icon"
                className="flex justify-start items-center rounded-lg text-neutral-400 dark:text-white hover:bg-transparent"
                onClick={() => setMobileOpen(true)}
                aria-label="Open sidebar"
              >
                <PanelLeft />
              </Button>
            )}
            <h1 className="text-3xl font-bold">Events</h1>
          </div>

          <div className="">
            <Button asChild>
              <Link href="/admin/events/new">
                <Plus className="me-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className={` bg-white rounded-lg ${eventUrl && "border p-6"}`}>
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loading />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-12">
            <p>{error}</p>
          </div>
        )}

        {events.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">
              No events available. Create your first event.
            </p>
          </div>
        )}

        {events.map((event: Event, index, array) => (
          <div
            key={event.id}
            className={`flex items-center justify-between ${
              index !== array.length - 1 && "border-b pb-4"
            }  mb-4 `}
          >
            <div className="flex items-center gap-2 md:gap-4">
              <div className="h-16 w-16 overflow-hidden rounded-md">
                <img
                  src={event.eventImage || "/no-image.svg"}
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
                  {`${formatTime(event.dates[0].startTime)} - ${formatTime(
                    event.dates[0].endTime
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
                <Link href={`/admin/events/edit/${event.id}`}>Edit</Link>
              </Button>
              <Button
                variant="destructive"
                size="sm"
                disabled={isDeleting}
                onClick={() => deleteEvent(event.id)}
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
