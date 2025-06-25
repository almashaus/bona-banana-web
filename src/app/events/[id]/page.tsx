"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  CalendarDays,
  ClockIcon,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Separator } from "@/src/components/ui/separator";
import {
  eventDateTimeString,
  formatDate,
  formatTime,
} from "@/src/lib/utils/formatDate";
import { Event } from "@/src/models/event";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useToast } from "@/src/components/ui/use-toast";
import { getEventById } from "@/src/lib/firebase/firestore";
import Loading from "@/src/components/ui/loading";
import { useCheckoutStore } from "@/src/lib/stores/useCheckoutStore";
import useSWR from "swr";
import { isSafeImageUrl } from "@/src/lib/utils/utils";

export default function EventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);
  const [event, setEvent] = useState<Event | null>(null);

  // get event ID from params
  const params = useParams<{ id: string }>();
  const id: string = params?.id!;

  const { data, error, isLoading } = useSWR(id ? ["event", id] : null, () =>
    getEventById(id as string)
  );

  useEffect(() => {
    const eventData: Event = data as Event;
    if (eventData && eventData.dates && eventData.dates.length > 0) {
      setEvent(eventData);
      setSelectedDate(eventDateTimeString(eventData.dates[0]));
    }
  }, [data]);

  const handleBuyTicket = () => {
    // Set event details in the checkout store
    useCheckoutStore.setState((state) => ({
      eventId: event?.id,
      eventDateId: selectedDate.split("-")[0],
      quantity: quantity,
    }));

    if (!user) {
      router.push(`/login?redirect=${encodeURIComponent("/checkout")}`);
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
    router.push("/checkout");
  };

  if (error || !id || typeof id !== "string") {
    return (
      <div className="container py-10 text-center">
        <h1 className="text-2xl font-bold mb-4">Event not found</h1>
        <p className="mb-6">
          The event you're looking for doesn't exist or has been removed.
        </p>
        <Button asChild>
          <Link href="/events">Browse Events</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !event) {
    return (
      <div className="flex justify-center items-center py-56">
        <Loading />
      </div>
    );
  }

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
        {/* Event Details */}
        <div className="lg:col-span-2">
          <div className="flex justify-start gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-3xl font-bold">{event.title}</h1>
          </div>
          <div className="aspect-video w-full lg:w-3/4 relative my-4 rounded-xl overflow-hidden">
            <Image
              src={
                isSafeImageUrl(event.eventImage)
                  ? event.eventImage!
                  : "/no-image.svg"
              }
              alt={event.title}
              fill
              className="object-cover"
              sizes="(min-width: 1024px) 75vw, 100vw"
              priority
            />
          </div>
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
                      ? `${selectedDate.split("-")[1]}`
                      : event.dates && event.dates.length > 0
                      ? event.dates.length > 1
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
                      ? `${selectedDate.split("-")[2]} - ${
                          selectedDate.split("-")[3]
                        }`
                      : event.dates && event.dates.length > 0
                      ? `${formatTime(event.dates[0].startTime)} - ${formatTime(
                          event.dates[0].endTime
                        )}`
                      : "No times available"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-redColor" />
                <div>
                  <p className="text-sm font-medium">Capacity</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate
                      ? selectedDate.split("-")[4]
                      : event.dates[0].capacity}{" "}
                    attendees
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
                  value={selectedDate}
                  onValueChange={(value) => {
                    setSelectedDate(value);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    {event.dates?.map((date) => (
                      <SelectItem
                        key={date.id}
                        value={eventDateTimeString(date)}
                      >
                        {formatDate(date.date)} | {formatTime(date.startTime)} -{" "}
                        {formatTime(date.endTime)}
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
                  onValueChange={(value) => setQuantity(Number.parseInt(value))}
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
