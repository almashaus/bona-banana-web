"use client";

import type React from "react";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  CalendarIcon,
  ImageIcon,
  Plus,
  Trash2,
  XIcon,
  CheckIcon,
  UploadIcon,
  Clock4Icon,
  EyeIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
import { Switch } from "@/src/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useToast } from "@/src/components/ui/use-toast";
import { useAuth } from "@/src/features/auth/auth-provider";
import { add, format } from "date-fns";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { cn, generateEventId } from "@/src/lib/utils/utils";
import { Event, EventDate, EventStatus } from "@/src/models/event";
import { setDoc, doc, Timestamp } from "firebase/firestore";
import { db } from "@/src/lib/firebase/firebaseConfig";
import { formatDate } from "@/src/lib/utils/formatDate";

export default function CreateEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();

  // Initialize state variables with default values
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocaton] = useState("Riyadh");
  const [eventImage, setEventImage] = useState("");
  const [adImage, setAdImage] = useState("");
  const [price, setPrice] = useState<number>(0);
  const [status, setStatus] = useState<EventStatus>(EventStatus.DRAFT);
  const [isDnd, setIsDnd] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventDates, setEventDates] = useState<EventDate[]>([
    {
      event_date_id: `date-${Date.now()}`,
      date: new Date(),
      start_time: new Date(),
      end_time: new Date(new Date().setHours(new Date().getHours() + 3)),
      capacity: 50,
      event_id: "",
    },
  ]);

  // Redirect if not admin
  if (!user?.isAdmin) {
    router.push("/");
    return null;
  }

  // Generate slug from title
  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^\w ]+/g, "")
      .replace(/ +/g, "-");
  };

  // Handle title change and auto-generate slug
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTitle = e.target.value;
    setTitle(newTitle);
    setSlug(generateSlug(newTitle));
  };

  // Add new event date
  const addEventDate = () => {
    const newDate: EventDate = {
      event_date_id: `date-${Date.now()}-${Math.random()
        .toString(36)
        .substring(2, 9)}`,
      date: new Date(),
      start_time: new Date(),
      end_time: new Date(new Date().setHours(new Date().getHours() + 3)),
      capacity: 50,
      event_id: "",
    };
    setEventDates([...eventDates, newDate]);
  };

  // Remove event date
  const removeEventDate = (id: string) => {
    setEventDates(eventDates.filter((date) => date.event_date_id !== id));
  };

  // Update event date
  const updateEventDate = (id: string, field: keyof EventDate, value: any) => {
    setEventDates(
      eventDates.map((date) => {
        if (date.event_date_id === id) {
          return { ...date, [field]: value };
        }
        return date;
      })
    );
  };

  // Add new event to Firestore
  const addNewEvent = async (event: Event) => {
    try {
      // Generate event ID and set event dates
      const eventId = generateEventId();
      event.event_id = eventId;
      event.dates = eventDates.map((date) => ({
        ...date,
        event_id: eventId,
      }));

      await setDoc(doc(db, "events", event.event_id), event);
      console.log("Document written with ID: ", event.event_id);
    } catch (e) {
      console.error("Error adding document: ", e);
    }
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await addNewEvent({
        creator_id: user?.id || "1",
        title: title,
        slug: slug,
        description: description,
        event_image: "https://i.ibb.co/jPx2PPxn/IMG-9784.png", // TODO:  eventImage,
        ad_image: adImage,
        price: price,
        status: status,
        location: location,
        is_dnd: isDnd,
        created_at: Timestamp.fromDate(new Date()),
        updated_at: Timestamp.fromDate(new Date()),
        dates: eventDates,
        event_id: "",
      });

      // Show success toast
      toast({
        title: "✅ Event created",
        description: "Your event has been created successfully 🎉",
      });

      // Redirect to admin events page
      router.push("/admin");
    } catch (error) {
      toast({
        title: "⚠️ Error",
        description: "There was an error creating the event ❗️",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-10 lg:px-0 max-w-full">
      <div className="flex items-center justify-between md:mx-16 lg:mx-40 mb-6">
        <h1 className="text-3xl font-bold">Create New Event</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <XIcon className="h-4 w-4 md:me-2" />
          <span className="hidden md:inline">Cancel</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 md:mx-16 lg:mx-40 mb-6">
          <Card>
            <CardHeader>
              <CardTitle>Event Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="title">Event Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={handleTitleChange}
                  placeholder="Enter event title"
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your event"
                  rows={5}
                  required
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="price">Price</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    id="price"
                    value={price}
                    onChange={(e) =>
                      setPrice(
                        Number.isNaN(Number.parseFloat(e.target.value))
                          ? 0
                          : Number.parseFloat(e.target.value)
                      )
                    }
                    placeholder="0.00"
                    className="w-24"
                    required
                  />
                  <span className="text-muted-foreground">SR</span>
                </div>
              </div>

              <div className="grid gap-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={location}
                  onChange={(e) => setLocaton(e.target.value)}
                  placeholder="Riyadh"
                  required
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="status">Status</Label>
                  <Select
                    value={status}
                    onValueChange={(value) => setStatus(value as EventStatus)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={EventStatus.DRAFT}>
                        <div className="flex items-center">
                          Draft
                          <Clock4Icon className=" w-4 h-4 text-gray-400 mx-1 " />
                        </div>
                      </SelectItem>
                      <SelectItem value={EventStatus.PUBLISHED}>
                        <div className="flex items-center">
                          Published
                          <EyeIcon className=" w-4 h-4 text-blue-400 mx-1 " />
                        </div>
                      </SelectItem>
                      <SelectItem value={EventStatus.CANCELLED}>
                        <div className="flex items-center">
                          Cancelled
                          <XIcon className=" w-4 h-4 text-red-400 mx-1 " />
                        </div>
                      </SelectItem>
                      <SelectItem value={EventStatus.COMPLETED}>
                        <div className="flex items-center">
                          Completed
                          <CheckIcon className=" w-4 h-4 text-green-400 mx-1 " />
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Images</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-4">
                <Label htmlFor="event-image">Event Image</Label>
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <div className="border rounded-md p-1 w-48 h-40 flex flex-col items-center justify-center bg-muted relative">
                    {eventImage ? (
                      <img
                        src={eventImage || "/placeholder.svg"}
                        alt="Event"
                        className="w-full h-full object-cover rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = "/no-image.svg";
                        }}
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                    <input
                      type="file"
                      id="event-image-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const imageUrl = URL.createObjectURL(file);
                          setEventImage(imageUrl);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-1 right-1 h-7 px-2 text-xs"
                      onClick={() =>
                        document.getElementById("event-image-upload")?.click()
                      }
                    >
                      <UploadIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-muted-foreground">Or</span>
                  <Input
                    id="event-image"
                    value={eventImage}
                    onChange={(e) => setEventImage(e.target.value)}
                    placeholder="Enter image URL"
                  />
                </div>
              </div>
              <br />
              <div className="grid gap-4">
                <Label htmlFor="ad-image">Advertisement Image</Label>
                <div className="flex flex-col md:flex-row items-center gap-2">
                  <div className="border rounded-md p-1 w-48 h-40 flex flex-col items-center justify-center bg-muted relative">
                    {adImage ? (
                      <img
                        src={adImage || "/placeholder.svg"}
                        alt="Ad"
                        className="max-w-full max-h-full object-contain rounded-md"
                        onError={(e) => {
                          e.currentTarget.src = "/no-image.svg";
                        }}
                      />
                    ) : (
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    )}
                    <input
                      type="file"
                      id="ad-image-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const imageUrl = URL.createObjectURL(file);
                          setAdImage(imageUrl);
                        }
                      }}
                    />
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      className="absolute bottom-1 right-1 h-7 px-2 text-xs"
                      onClick={() =>
                        document.getElementById("ad-image-upload")?.click()
                      }
                    >
                      <UploadIcon className="w-4 h-4" />
                    </Button>
                  </div>
                  <span className="text-muted-foreground">Or</span>
                  <Input
                    id="ad-image"
                    type="text"
                    value={adImage}
                    onChange={(e) => setAdImage(e.target.value)}
                    placeholder="Enter image URL"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Event Dates</CardTitle>
              <CardDescription>
                Add one or more dates for your event
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {eventDates.map((eventDate, index) => (
                <div
                  key={eventDate.event_date_id}
                  className="space-y-4 pb-4 border-b last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium">Date {index + 1}</h3>
                    {eventDates.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-500"
                        onClick={() => removeEventDate(eventDate.event_date_id)}
                      >
                        <Trash2 className="h-4 w-4 mr-1 text-red-500" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mx-5">
                    <div className="">
                      <Label>Date</Label>
                      <div className="flex flex-col space-y-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal bg-white",
                                !eventDate.date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {eventDate.date ? (
                                formatDate(eventDate.date)
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={eventDate.date}
                              onSelect={(day) => {
                                if (day) {
                                  const newDate = new Date(day);
                                  newDate.setHours(eventDate.date.getHours());
                                  newDate.setMinutes(
                                    eventDate.date.getMinutes()
                                  );
                                  updateEventDate(
                                    eventDate.event_date_id,
                                    "date",
                                    newDate
                                  );
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label>Start Time</Label>
                      <div className="flex space-x-2">
                        <Input
                          type="time"
                          value={format(eventDate.start_time, "HH:mm")}
                          onChange={(e) => {
                            const [hours, minutes] = e.target.value.split(":");
                            const newDate = new Date(eventDate.date);
                            newDate.setHours(Number.parseInt(hours));
                            newDate.setMinutes(Number.parseInt(minutes));
                            updateEventDate(
                              eventDate.event_date_id,
                              "start_time",
                              newDate
                            );
                          }}
                        />
                      </div>
                      <Label>End Time</Label>
                      <div className="flex flex-col space-y-2">
                        <div className="flex space-x-2">
                          <Input
                            type="time"
                            value={format(eventDate.end_time, "HH:mm")}
                            onChange={(e) => {
                              const [hours, minutes] =
                                e.target.value.split(":");
                              const newDate = new Date(eventDate.date);
                              newDate.setHours(Number.parseInt(hours));
                              newDate.setMinutes(Number.parseInt(minutes));
                              updateEventDate(
                                eventDate.event_date_id,
                                "end_time",
                                newDate
                              );
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-2 mx-5">
                    <Label htmlFor={`capacity-${eventDate.event_date_id}`}>
                      Capacity
                    </Label>
                    <Input
                      id={`capacity-${eventDate.event_date_id}`}
                      type="number"
                      min="1"
                      value={eventDate.capacity}
                      onChange={(e) =>
                        updateEventDate(
                          eventDate.event_date_id,
                          "capacity",
                          Number.parseInt(e.target.value)
                        )
                      }
                      placeholder="50"
                      className="w-24"
                      required
                    />
                  </div>
                </div>
              ))}

              <Button
                type="button"
                // variant="outline"
                className="w-full text-black/80 bg-muted-foreground/30 hover:bg-muted-foreground/20"
                onClick={addEventDate}
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Date
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end gap-4 md:mx-16 lg:mx-40">
          <Button variant="outline" type="button" onClick={() => router.back()}>
            <XIcon className="h-4 w-4 me-2" /> Cancel
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            <CheckIcon className="h-4 w-4 me-2" />{" "}
            {isSubmitting ? "Creating..." : "Create Event"}
          </Button>
        </div>
      </form>
    </div>
  );
}
