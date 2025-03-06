"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, MapPin, Ticket, Users } from "lucide-react";
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
import { formatCurrency, formatDate } from "@/lib/utils";
import { events } from "@/data/events";
import { useAuth } from "@/components/auth/auth-provider";
import { useToast } from "@/components/ui/use-toast";

export default function EventPage({ params }: { params: { id: string } }) {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [quantity, setQuantity] = useState<number>(1);

  const event = events.find((e) => e.id === params.id);

  if (!event) {
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

  const handleBuyTicket = () => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to purchase tickets",
        variant: "destructive",
      });

      const redirectUrl = `/checkout?eventId=${encodeURIComponent(
        event.id
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
      `/checkout?eventId=${event.id}&date=${selectedDate}&quantity=${quantity}`
    );
  };

  return (
    <div className="container py-10">
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-12">
        {/* Event Image */}
        <div className="overflow-hidden rounded-lg">
          <img
            src={event.image || "/placeholder.svg"}
            alt={event.name}
            className="aspect-video w-full object-cover"
          />
        </div>

        {/* Event Details */}
        <div className="flex flex-col space-y-6">
          <div>
            <h1 className="text-3xl font-bold">{event.name}</h1>
            <div className="mt-2 flex items-center text-muted-foreground">
              <MapPin className="mr-1 h-5 w-5" />
              {event.venue}, {event.location}
            </div>
          </div>

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
                <Select onValueChange={setSelectedDate}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select date" />
                  </SelectTrigger>
                  <SelectContent>
                    {event.dates.map((date) => (
                      <SelectItem key={date} value={date}>
                        {formatDate(date)}
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
                  <Ticket className="h-5 w-5 text-muted-foreground" />
                  <span className="text-muted-foreground">
                    Price per ticket:
                  </span>
                </div>
                <span className="font-bold">{formatCurrency(event.price)}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between font-bold">
                <span>Total:</span>
                <span>{formatCurrency(event.price * quantity)}</span>
              </div>
            </CardContent>
            <CardFooter>
              <Button className="w-full" size="lg" onClick={handleBuyTicket}>
                Buy Ticket
              </Button>
            </CardFooter>
          </Card>

          <div className="space-y-4">
            <h2 className="text-xl font-bold">About This Event</h2>
            <p className="text-muted-foreground">{event.description}</p>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-muted-foreground">
                    {event.dates.length > 1
                      ? `${formatDate(event.dates[0])} - ${formatDate(
                          event.dates[event.dates.length - 1]
                        )}`
                      : formatDate(event.dates[0])}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Capacity</p>
                  <p className="text-sm text-muted-foreground">
                    {event.capacity} attendees
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
