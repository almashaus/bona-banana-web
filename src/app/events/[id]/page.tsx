"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ArrowRight,
  Building,
  CalendarDays,
  ClockIcon,
  InfoIcon,
  MapPin,
  Ticket,
  Users,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
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
import { formatDate, formatTime } from "@/src/lib/utils/formatDate";
import { Event, EventDate, EventStatus } from "@/src/models/event";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useToast } from "@/src/components/ui/use-toast";
import Loading from "@/src/components/ui/loading";
import { useCheckoutStore } from "@/src/lib/stores/useCheckoutStore";
import useSWR from "swr";
import {
  findFirstTodayOrAfter,
  isBeforeToday,
  isSafeImageUrl,
} from "@/src/lib/utils/utils";
import { Skeleton } from "@/src/components/ui/skeleton";
import { price } from "@/src/lib/utils/locales";
import { useLocale, useTranslations } from "next-intl";

export default function EventPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const tEvent = useTranslations("Event");
  const tPage = useTranslations("Page");
  const tHome = useTranslations("Home");
  const locale = useLocale();
  const [selectedDate, setSelectedDate] = useState<EventDate>();
  const [quantity, setQuantity] = useState<number>(1);
  const [event, setEvent] = useState<Event | null>(null);

  // get event ID from params
  const params = useParams<{ id: string }>();
  const id: string = params?.id!;

  const { data, error, isLoading } = useSWR<Event>(`/api/events/${id}`);

  const dir = locale === "en" ? "ltr" : "rtl";

  useEffect(() => {
    const eventData: Event = data as Event;
    if (eventData && eventData.dates && eventData.dates.length > 0) {
      setEvent(eventData);

      const currentDate = findFirstTodayOrAfter(
        eventData.dates.map((d) => d.date),
      );

      setSelectedDate(eventData.dates.find((d) => d.date === currentDate));
    }
  }, [data]);

  const handleBuyTicket = () => {
    // Set event details in the checkout store
    useCheckoutStore.setState((state) => ({
      event: event,
      eventDateId: selectedDate?.id,
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
        <h1 className="text-2xl font-bold mb-4">
          {tPage("eventNotFound") || "Event not found"}
        </h1>
        <p className="mb-6">
          {tPage("eventNotFoundDescription") ||
            "The event you're looking for doesn't exist or has been removed."}
        </p>
        <Button asChild>
          <Link href="/">{tHome("allEvents")}</Link>
        </Button>
      </div>
    );
  }

  if (isLoading || !event) {
    return (
      <div className="px-5 py-10 md:container">
        <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 lg:grid lg:grid-cols-3 lg:gap-6">
          {/* Event Details */}
          <div className="md:col-span-1 lg:col-span-2 lg:me-6">
            <div className="flex justify-start gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => router.back()}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-center items-center py-24">
              <Loading />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-neutral-200 bg-card text-card-foreground shadow-sm">
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
              <Skeleton className="h-10" />
            </div>
          </div>

          {/* Ticket Info */}
          <div className="flex flex-col ">
            <Card>
              <CardContent className="space-y-8 my-4">
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
                <Skeleton className="h-10 rounded-lg" />
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="px-5 py-10 md:container">
      <div className="space-y-6 md:space-y-0 md:grid md:grid-cols-2 md:gap-6 lg:grid lg:grid-cols-3 lg:gap-6">
        {/* Event Details */}
        <div className="md:col-span-1 lg:col-span-2 lg:me-6">
          <div className="flex justify-start gap-4">
            <Button variant="outline" size="icon" onClick={() => router.back()}>
              {locale === "en" ? (
                <ArrowLeft className="h-4 w-4" />
              ) : (
                <ArrowRight className="h-4 w-4" />
              )}
            </Button>
            <h1 className="text-3xl font-bold">
              {locale === "en" ? event.title : event.titleAr}
            </h1>
          </div>
          <div className="aspect-video w-full relative my-4 rounded-xl overflow-hidden">
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
              onError={(e) => {
                e.currentTarget.src = "/no-image.svg";
              }}
            />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold">{tEvent("details")}</h2>
            <p className="text-muted-foreground whitespace-pre-line pb-4">
              {locale === "en" ? event.description : event.descriptionAr}
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border border-neutral-200 bg-card text-card-foreground shadow-sm">
              <div className="flex items-center gap-2">
                <CalendarDays className="h-5 w-5 text-redColor" />
                <div>
                  <p className="text-sm font-medium">{tEvent("date")}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate
                      ? `${formatDate(selectedDate.date, locale)}`
                      : event.dates && event.dates.length > 0
                        ? event.dates.length > 1
                          ? `${formatDate(event.dates[0].date, locale)} - ${formatDate(
                              event.dates[event.dates.length - 1].date,
                              locale,
                            )}`
                          : `${formatDate(event.dates[0].date, locale)}`
                        : tEvent("noDatesAvailable") || "No dates available"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ClockIcon className="h-5 w-5 text-redColor" />
                <div>
                  <p className="text-sm font-medium">{tEvent("time")}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate
                      ? `${formatTime(selectedDate.startTime, locale)} - ${formatTime(selectedDate.endTime, locale)}`
                      : event.dates && event.dates.length > 0
                        ? `${formatTime(event.dates[0].startTime, locale)} - ${formatTime(
                            event.dates[0].endTime,
                            locale,
                          )}`
                        : tEvent("noTimesAvailable") || "No times available"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-redColor" />
                <div>
                  <p className="text-sm font-medium">{tEvent("capacity")}</p>
                  <p className="text-sm text-muted-foreground">
                    {selectedDate
                      ? selectedDate.capacity
                      : event.dates[0].capacity}{" "}
                    {tEvent("attendees") || "attendees"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-redColor" />
                <div>
                  <p className="text-sm font-medium">{tEvent("city")}</p>
                  <p className="text-sm text-muted-foreground">
                    {locale === "en" ? event.city.en : event.city.ar}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Building className="h-5 w-5 text-redColor" />
                <div>
                  <p className="text-sm font-medium">{tEvent("venue")}</p>
                  <p className="text-sm text-muted-foreground">{event.venue}</p>
                </div>
              </div>
              {event.locationUrl && (
                <div className="flex items-center gap-2">
                  <Button variant="outline" asChild>
                    <Link href={`${event.locationUrl}`} target="_blank">
                      <img
                        src="/icons/google-map-icon.svg"
                        alt="Instagram"
                        className="w-5 h-5 me-2"
                      />
                      {tEvent("location")}
                    </Link>
                  </Button>
                </div>
              )}
            </div>
            {event.adImage && (
              <div className="pt-4">
                <img
                  src={
                    isSafeImageUrl(event.adImage)
                      ? event.adImage!
                      : "/no-image.svg"
                  }
                  alt={event.title}
                  className="object-cover rounded-xl"
                  onError={(e) => {
                    e.currentTarget.src = "/no-image.svg";
                  }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Ticket Info */}
        <div className="flex flex-col md:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle>{tEvent("ticketInformation")}</CardTitle>
              <CardDescription>{tEvent("selectDateQuantity")}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                  {tEvent("date")}
                </label>
                <Select
                  value={selectedDate?.id}
                  onValueChange={(value) => {
                    setSelectedDate(event.dates.find((d) => d.id === value));
                  }}
                >
                  <SelectTrigger dir={dir}>
                    <SelectValue
                      placeholder={tEvent("selectDate") || "Select date"}
                    />
                  </SelectTrigger>
                  <SelectContent dir={dir}>
                    {event.dates?.map((date) => (
                      <SelectItem
                        key={date.id}
                        value={date.id}
                        className={`${isBeforeToday(date.date) && "text-neutral-400"}`}
                      >
                        {formatDate(date.date, locale)} |{" "}
                        {formatTime(date.startTime, locale)} -{" "}
                        {formatTime(date.endTime, locale)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {selectedDate?.availableTickets! === 0 ||
              isBeforeToday(selectedDate?.date!) ? (
                <div className="flex justify-center items-center py-3 rounded-md bg-neutral-300 text-neutral-600">
                  <InfoIcon className="w-5 h-5 me-2" />
                  {tEvent("noTicketsAvailable")}
                </div>
              ) : (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                      {tEvent("quantity")}
                    </label>
                    <Select
                      defaultValue="1"
                      onValueChange={(value) =>
                        setQuantity(Number.parseInt(value))
                      }
                    >
                      <SelectTrigger dir={dir}>
                        <SelectValue
                          placeholder={
                            tEvent("selectQuantity") || "Select quantity"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent dir={dir}>
                        {Array.from(
                          {
                            length: Math.min(
                              selectedDate?.availableTickets ?? 0,
                              5,
                            ),
                          },
                          (_, i) => i + 1,
                        ).map((num) => (
                          <SelectItem key={num} value={num.toString()}>
                            {num}{" "}
                            {num === 1 ? tEvent("ticket") : tEvent("tickets")}
                            {num === 3 &&
                              event.id === "nsF44tZPR5lr3jRCMRJF" && (
                                <span className="text-sm text-green-500 mx-4">
                                  {tEvent("free")}
                                </span>
                              )}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex items-center justify-between pt-4">
                    <div className="flex items-center gap-2">
                      <Ticket className="h-5 w-5 text-redColor" />
                      <span className="text-muted-foreground">
                        {tEvent("PricePerTicket:")}
                      </span>
                    </div>
                    <span className="font-bold">
                      {price(event.price, locale)}
                    </span>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between font-bold">
                    <span>{tEvent("total")}</span>
                    {quantity === 3 && event.id === "nsF44tZPR5lr3jRCMRJF" ? (
                      <div>
                        <span className="line-through mx-2">
                          {price(event.price * quantity, locale)}
                        </span>
                        <span className=" text-green-500">
                          {price(event.price * (quantity - 1), locale)}{" "}
                        </span>
                      </div>
                    ) : (
                      <span>{price(event.price * quantity, locale)}</span>
                    )}
                  </div>
                  <div className="pt-3">
                    <Button
                      className="w-full"
                      size="lg"
                      onClick={handleBuyTicket}
                      disabled={event.status === EventStatus.COMPLETED}
                    >
                      {event.status === EventStatus.COMPLETED
                        ? tEvent("completed")
                        : tEvent("buyTicket")}
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
