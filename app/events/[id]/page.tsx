"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, ClockIcon, MapPin, Ticket, Users } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { formatDate, formatEventsDates, formatTime } from "@/lib/utils";
import { Event } from "@/data/models";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/use-toast";
import { getDocumentById } from "@/utils/firestore";
import Loading from "@/components/ui/loading";

export default function EventPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const id = params.id as string;

  useEffect(() => {
    if (id) {
      getDocumentById("events", id)
        .then((data) => {
          const eventsData = formatEventsDates(data, true);
          setEvent(eventsData as Event);
        })
        .catch((err) => setError(err.message))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleBuyTicket = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to purchase tickets",
        variant: "destructive",
      });

      const redirectUrl = `/checkout?eventId=${encodeURIComponent(
        event?.event_id ?? ""
      )}&date=${encodeURIComponent(selectedDate)}&quantity=${encodeURIComponent(
        quantity
      )}`;
      router.push(`/auth/login?redirect=${encodeURIComponent(redirectUrl)}`);
      return;
    }

    if (!selectedDate) {
      toast({
        title: "Date required",
        description: "Please select a date for the event",
        variant: "destructive",
      });
      return;
    }

    // Navigate to checkout with event details
    router.push(
      `/checkout?eventId=${event?.event_id}&date=${selectedDate}&quantity=${quantity}`
    );
  };

  if (error) {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <p className="mb-6">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <a href="/events">Browse Events</a>
        </Button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center py-56">
        <Loading />
      </div>
    );
  } else if (event) {
    return (
      <div className="container py-10">
        <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
          {/* Event Details */}
          <div className="lg:col-span-2">
            <h1 className="text-3xl font-bold">{event.title}</h1>

            <img
              src={event.event_image || "/placeholder.svg"}
              alt={event.title}
              className="aspect-video w-full lg:w-3/4 object-cover rounded-xl my-4"
            />

            <div className="space-y-4">
              <h2 className="text-xl font-bold">Event Details</h2>
              <p className="text-muted-foreground">{event.description}</p>

              <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-neutral-200 bg-card text-card-foreground shadow-sm">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-redColor" />
                  <div>
                    <p className="text-sm font-medium">Date</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate
                        ? `${selectedDate.split("-")[0]}`
                        : event.dates && event.dates.length > 0
                        ? event.dates.length > 1 &&
                          event.dates[0].start_time &&
                          event.dates[0].end_time
                          ? `${formatDate(event.dates[0].date)} - ${formatDate(
                              event.dates[event.dates.length - 1].date
                            )}`
                          : `${formatDate(event.dates[0].date)}`
                        : "No dates available"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <ClockIcon className="h-5 w-5 text-redColor" />
                  <div>
                    <p className="text-sm font-medium">Time</p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate
                        ? `${selectedDate.split("-")[1]} - ${
                            selectedDate.split("-")[2]
                          }`
                        : event.dates && event.dates.length > 0
                        ? `${formatTime(
                            event.dates[0].start_time
                          )} - ${formatTime(event.dates[0].end_time)}`
                        : "No times available"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Users className="h-5 w-5 text-redColor" />
                  <div>
                    <p className="text-sm font-medium">Capacity</p>
                    <p className="text-sm text-muted-foreground">
                      {event.dates?.[0].capacity} attendees
                    </p>
                  </div>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <MapPin className="h-5 w-5 text-redColor" />
                  <div>
                    <p className="text-sm font-medium">Location</p>
                    <p className="text-sm text-muted-foreground">
                      {event.location}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Ticket Info */}
          <div className="flex flex-col space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Ticket Information</CardTitle>
                <CardDescription>
                  Select your preferred date and quantity
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Date
                  </label>
                  <Select
                    onValueChange={(value) => {
                      // value is like "date-1747506317478-7l6xwzl"
                      // const valueList = value.split("-");
                      setSelectedDate(value);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select date" />
                    </SelectTrigger>
                    <SelectContent>
                      {event.dates?.map((date) => (
                        <SelectItem
                          key={date.event_date_id}
                          value={`${formatDate(date.date)}-${formatTime(
                            date.start_time
                          )}-${formatTime(date.end_time)}`}
                        >
                          {formatDate(date.date)} |{" "}
                          {formatTime(date.start_time)} -{" "}
                          {formatTime(date.end_time)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                    Quantity
                  </label>
                  <Select
                    defaultValue="1"
                    onValueChange={(value) =>
                      setQuantity(Number.parseInt(value))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quantity" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                        <SelectItem key={num} value={num.toString()}>
                          {num} {num === 1 ? "ticket" : "tickets"}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between pt-4">
                  <div className="flex items-center gap-2">
                    <Ticket className="h-5 w-5 text-redColor" />
                    <span className="text-muted-foreground">
                      Price per ticket:
                    </span>
                  </div>
                  <span className="font-bold">
                    <span className="icon-saudi_riyal" />
                    {event.price}
                  </span>
                </div>
                <Separator />
                <div className="flex items-center justify-between font-bold">
                  <span>Total:</span>
                  <span>
                    <span className="icon-saudi_riyal" />
                    {event.price * quantity}
                  </span>
                </div>
              </CardContent>
              <CardFooter>
                <Button className="w-full" size="lg" onClick={handleBuyTicket}>
                  Buy Ticket
                </Button>
              </CardFooter>
            </Card>
          </div>
        </div>
      </div>
    );
  }
}
