"use client";

import type React from "react";
import { useEffect, useState } from "react";
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
  PenLine,
  X,
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useToast } from "@/src/components/ui/use-toast";
import { useAuth } from "@/src/features/auth/auth-provider";
import { cityMap, cn, compressImage, isAfterDate } from "@/src/lib/utils/utils";
import { City, Event, EventDate, EventStatus } from "@/src/models/event";
import { getAuth } from "firebase/auth";
import useSWR, { mutate } from "swr";
import { Progress } from "@/src/components/ui/progress";
import { getDownloadURL, ref, uploadBytesResumable } from "firebase/storage";
import { storage } from "@/src/lib/firebase/firebaseConfig";
import Image from "next/image";
import { EventDatesSelect } from "../(components)/eventDatesSelect";

export default function CreateEventPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const auth = getAuth();
  const authUser = auth.currentUser!;

  interface Response {
    city: {
      ar: string;
      en: string;
    }[];
  }

  const { data, error, isLoading } = useSWR<Response>(
    `/api/admin/settings/city`
  );

  // Initialize state variables with default values
  const [title, setTitle] = useState("");
  const [titleAr, setTitleAr] = useState("");
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [descriptionAr, setDescriptionAr] = useState("");
  const [city, setCity] = useState("Riyadh");
  const [venue, setVenue] = useState("");
  const [locationUrl, setLocationUrl] = useState("");
  const [eventLogo, setEventLogo] = useState("");
  const [eventImage, setEventImage] = useState("");
  const [adImage, setAdImage] = useState("");
  const [price, setPrice] = useState("");
  const [status, setStatus] = useState<EventStatus>(EventStatus.DRAFT);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [eventDates, setEventDates] = useState<EventDate[]>([
    {
      id: `date${Date.now()}`,
      date: new Date(),
      startTime: new Date(new Date().setHours(18, 0, 0, 0)),
      endTime: new Date(new Date().setHours(23, 0, 0, 0)),
      capacity: 20,
      availableTickets: 20,
      eventId: "",
    },
  ]);

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
      id: `date${Date.now()}`,
      date: new Date(),
      startTime: new Date(new Date().setHours(18, 0, 0, 0)),
      endTime: new Date(new Date().setHours(23, 0, 0, 0)),
      capacity: 20,
      availableTickets: 20,
      eventId: "",
    };
    setEventDates([...eventDates, newDate]);
  };

  // Remove event date
  const removeEventDate = (id: string) => {
    setEventDates(eventDates.filter((date) => date.id !== id));
  };

  // Update event date
  const updateEventDate = (id: string, field: keyof EventDate, value: any) => {
    setEventDates(
      eventDates.map((date) => {
        if (date.id === id) {
          if (field === "capacity") {
            return { ...date, [field]: value, availableTickets: value };
          }
          return { ...date, [field]: value };
        }
        return date;
      })
    );
  };

  const setRepeatedDates = (eventDates: EventDate[]) => {
    setEventDates([...eventDates]);
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    if (Number.isNaN(price)) {
      toast({
        title: "Error",
        description: "The price must be number",
        variant: "destructive",
      });
      setIsSubmitting(false);
      return;
    }

    for (const eventDate of eventDates) {
      if (isAfterDate(eventDate.startTime, eventDate.endTime)) {
        toast({
          title: "Error",
          description: "Start time must be before end time.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
    }

    const idToken = await authUser.getIdToken();

    const theCity = await cityMap(city);

    try {
      let event: Event = {
        creatorId: user?.id || "1",
        title: title,
        titleAr: titleAr,
        slug: slug,
        description: description,
        descriptionAr: descriptionAr,
        eventLogo: eventLogo,
        eventImage: eventImage,
        adImage: adImage,
        price: parseFloat(price),
        status: status,
        city: theCity,
        venue: venue,
        locationUrl: locationUrl,
        createdAt: new Date(),
        updatedAt: new Date(),
        dates: eventDates,
        id: "",
      };

      const response = await fetch("/api/admin/events/new", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ event: event }),
      });

      if (response.ok) {
        await mutate("/api/admin/events");
        await mutate("/api/published-events");
        await mutate("/api/admin/orders");

        toast({
          title: "Event created",
          description: "Your event has been created successfully",
          variant: "success",
        });

        router.push("/admin/events");
      } else {
        toast({
          title: "Error",
          description: "There was an error creating the event ❗️",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "There was an error creating the event ❗️",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Create New Event</h1>
        <Button variant="outline" onClick={() => router.back()}>
          <XIcon className="h-4 w-4 md:me-2" />
          <span className="hidden md:inline">Cancel</span>
        </Button>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid gap-6 mb-6">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Event Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid lg:grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="title">
                      Event Title{" "}
                      <span className="text-orangeColor text-sm">
                        ( English )
                      </span>
                    </Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={handleTitleChange}
                      placeholder="Enter event title"
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="title">
                      Event Title{" "}
                      <span className="text-orangeColor text-sm">( عربي )</span>
                    </Label>
                    <Input
                      id="titleAr"
                      value={titleAr}
                      onChange={(e) => setTitleAr(e.target.value)}
                      placeholder="أدخل عنوان الفعالية"
                      dir="rtl"
                      required
                    />
                  </div>
                </div>
                <div className="grid lg:grid-cols-2 gap-2">
                  <div className="grid gap-2">
                    <Label htmlFor="description">
                      Description{" "}
                      <span className="text-orangeColor text-sm">
                        ( English )
                      </span>
                    </Label>
                    <Textarea
                      id="description"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="Describe your event"
                      rows={8}
                      required
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="description">
                      Description{" "}
                      <span className="text-orangeColor text-sm">( عربي )</span>
                    </Label>
                    <Textarea
                      id="descriptionAr"
                      value={descriptionAr}
                      onChange={(e) => setDescriptionAr(e.target.value)}
                      placeholder="أوصف الفعالية"
                      dir="rtl"
                      rows={8}
                      required
                    />
                  </div>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="price">Price</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      id="price"
                      value={price}
                      onChange={(e) => {
                        const value = e.target.value;

                        if (value === "") {
                          setPrice("");
                          return;
                        }

                        const numberValue = Number(value);
                        if (!isNaN(numberValue)) {
                          setPrice(value);
                        }
                      }}
                      placeholder="25"
                      className="w-24"
                      required
                    />
                    <span className="text-muted-foreground">SR</span>
                  </div>
                </div>

                <div className="grid gap-2 lg:w-1/2">
                  <Label htmlFor="city">City</Label>

                  <Select
                    value={city}
                    onValueChange={(value) => {
                      setCity(value);
                    }}
                    required
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={city} />
                    </SelectTrigger>
                    <SelectContent>
                      {data?.city?.map((c) => (
                        <SelectItem key={c.en} value={c.en}>
                          {c.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2 lg:w-1/2">
                  <Label htmlFor="venue">Venue Name</Label>
                  <Input
                    id="venue"
                    value={venue}
                    onChange={(e) => setVenue(e.target.value)}
                    required
                  />
                </div>

                <div className="grid gap-2 lg:w-1/2">
                  <Label htmlFor="locationUrl">Location URL</Label>
                  <Input
                    id="locationUrl"
                    value={locationUrl}
                    onChange={(e) => setLocationUrl(e.target.value)}
                    placeholder="https://maps.app.goo.gl"
                  />
                </div>

                <div className="grid gap-2 lg:w-1/2">
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
                      <SelectItem value={EventStatus.CANCELED}>
                        <div className="flex items-center">
                          Canceled
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
              </CardContent>
            </Card>
          </div>
          <div className="">
            <Card>
              <CardHeader>
                <CardTitle>Event Images</CardTitle>
              </CardHeader>
              <CardContent className="flex flex-col lg:flex-row justify-around space-y-6 md:space-y-0">
                <div className="grid gap-4">
                  <Label htmlFor="event-logo">Event Logo</Label>
                  <EventLogoInput
                    eventLogo={eventLogo}
                    setEventLogo={setEventLogo}
                    slug={slug}
                  />
                </div>

                <div className="grid gap-4">
                  <Label htmlFor="event-image">Event Image</Label>
                  <EventImageInput
                    eventImage={eventImage}
                    setEventImage={setEventImage}
                    slug={slug}
                  />
                </div>

                <div className="grid gap-4">
                  <Label htmlFor="ad-image">Advertisement Image</Label>
                  <AdImageInput
                    adImage={adImage}
                    setAdImage={setAdImage}
                    slug={slug}
                  />
                </div>
              </CardContent>
            </Card>
          </div>

          <EventDatesSelect
            eventDates={eventDates}
            addEventDate={addEventDate}
            updateEventDate={updateEventDate}
            removeEventDate={removeEventDate}
            setRepeatedDates={setRepeatedDates}
          />
        </div>

        <div className="flex justify-end gap-4 mt-6">
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

function EventLogoInput({
  eventLogo,
  setEventLogo,
  slug,
}: {
  eventLogo: string;
  setEventLogo: (url: string) => void;
  slug: string;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isURL, setIsURL] = useState(false);
  const [tempValue, setTempValue] = useState(eventLogo);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    if (file.size > 5 * 1024 * 1024) {
      // compress before uploading
      file = await compressImage(file);
    }

    const objectUrl = URL.createObjectURL(file);
    setEventLogo(objectUrl);

    const ext = file.name.split(".").pop();
    const path = `events/${slug}/event_${Date.now()}.${ext}`;

    const storageRef = ref(storage, path);
    const metadata = {
      contentType: file.type,
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(pct));
      },
      (error) => {
        setUploading(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setEventLogo(downloadUrl);
        } finally {
          setUploading(false);
          // free memory for the preview
          URL.revokeObjectURL(objectUrl);
          setProgress(null);
        }
      }
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div>
        <div className="border rounded-md p-1 w-64 h-64 2xl:w-72 2xl:h-72 flex flex-col items-center justify-center bg-muted relative">
          {eventLogo ? (
            <Image
              src={eventLogo || "/no-image.svg"}
              alt="Event"
              className="w-full h-full object-cover rounded-md"
              fill
              priority
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
            onChange={handleChange}
          />

          <div className="">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute bottom-1 right-1 h-7 px-2 text-xs"
              onClick={() =>
                document.getElementById("event-image-upload")?.click()
              }
            >
              <UploadIcon className="w-4 h-4 text-redColor" />
            </Button>
          </div>
        </div>
        {uploading && (
          <Progress value={progress ?? 0} max={100} className="my-1">
            {progress}%
          </Progress>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setIsURL(!isURL);
          if (isURL) {
            setEventLogo("");
            setTempValue("");
          }
        }}
        className="text-orangeColor"
      >
        {isURL ? (
          <X className="w-4 h-4 me-1" />
        ) : (
          <>
            <PenLine className="w-4 h-4 me-1" /> Write Image URL
          </>
        )}
      </Button>
      {isURL && (
        <div className="flex items-center w-80 gap-2">
          <Input
            id="event-Logo"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="Enter Logo URL"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setEventLogo(tempValue)}
          >
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}

function EventImageInput({
  eventImage,
  setEventImage,
  slug,
}: {
  eventImage: string;
  setEventImage: (url: string) => void;
  slug: string;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isURL, setIsURL] = useState(false);
  const [tempValue, setTempValue] = useState(eventImage);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);

    if (file.size > 5 * 1024 * 1024) {
      // compress before uploading
      file = await compressImage(file);
    }

    const objectUrl = URL.createObjectURL(file);
    setEventImage(objectUrl);

    const ext = file.name.split(".").pop();
    const path = `events/${slug}/event_${Date.now()}.${ext}`;

    const storageRef = ref(storage, path);
    const metadata = {
      contentType: file.type,
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(pct));
      },
      (error) => {
        setUploading(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setEventImage(downloadUrl);
        } finally {
          setUploading(false);
          // free memory for the preview
          URL.revokeObjectURL(objectUrl);
          setProgress(null);
        }
      }
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div>
        <div className="border rounded-md p-1 w-64 h-64 2xl:w-72 2xl:h-72 flex flex-col items-center justify-center bg-muted relative">
          {eventImage ? (
            <Image
              src={eventImage || "/no-image.svg"}
              alt="Event"
              className="w-full h-full object-cover rounded-md"
              fill
              priority
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
            onChange={handleChange}
          />

          <div className="">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute bottom-1 right-1 h-7 px-2 text-xs"
              onClick={() =>
                document.getElementById("event-image-upload")?.click()
              }
            >
              <UploadIcon className="w-4 h-4 text-redColor" />
            </Button>
          </div>
        </div>
        {uploading && (
          <Progress value={progress ?? 0} max={100} className="my-1">
            {progress}%
          </Progress>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setIsURL(!isURL);
          if (isURL) {
            setEventImage("");
            setTempValue("");
          }
        }}
        className="text-orangeColor"
      >
        {isURL ? (
          <X className="w-4 h-4 me-1" />
        ) : (
          <>
            <PenLine className="w-4 h-4 me-1" /> Write Image URL
          </>
        )}
      </Button>
      {isURL && (
        <div className="flex items-center w-80 gap-2">
          <Input
            id="event-image"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="Enter image URL"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setEventImage(tempValue)}
          >
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}

function AdImageInput({
  adImage,
  setAdImage,
  slug,
}: {
  adImage: string;
  setAdImage: (url: string) => void;
  slug: string;
}) {
  const [progress, setProgress] = useState<number | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isURL, setIsURL] = useState(false);
  const [tempValue, setTempValue] = useState(adImage);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    if (file.size > 5 * 1024 * 1024) {
      // compress before uploading
      file = await compressImage(file);
    }

    const objectUrl = URL.createObjectURL(file);
    setAdImage(objectUrl);

    const ext = file.name.split(".").pop();
    const path = `events/${slug}/ad_${Date.now()}.${ext}`;

    const storageRef = ref(storage, path);
    const metadata = {
      contentType: file.type,
    };

    const uploadTask = uploadBytesResumable(storageRef, file, metadata);
    setUploading(true);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const pct = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        setProgress(Math.round(pct));
      },
      (error) => {
        console.error("Upload failed", error);
        setUploading(false);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          setAdImage(downloadUrl);
        } finally {
          setUploading(false);
          // free memory for the preview
          URL.revokeObjectURL(objectUrl);
          setProgress(null);
        }
      }
    );
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <div>
        <div className="border rounded-md p-1 w-64 h-64 2xl:w-72 2xl:h-72 flex flex-col items-center justify-center bg-muted relative">
          {adImage ? (
            <Image
              src={adImage || "/no-image.svg"}
              alt="Advertisement"
              className="w-full h-full object-cover rounded-md"
              fill
              priority
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
            onChange={handleChange}
          />
          <div className="">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="absolute bottom-1 right-1 h-7 px-2 text-xs"
              onClick={() =>
                document.getElementById("ad-image-upload")?.click()
              }
            >
              <UploadIcon className="w-4 h-4 text-redColor" />
            </Button>
          </div>
        </div>
        {uploading && (
          <Progress value={progress ?? 0} max={100} className="my-1">
            {progress}%
          </Progress>
        )}
      </div>
      <Button
        type="button"
        variant="outline"
        onClick={() => {
          setIsURL(!isURL);
          if (isURL) {
            setAdImage("");
            setTempValue("");
          }
        }}
        className="text-orangeColor"
      >
        {isURL ? (
          <X className="w-4 h-4 me-1" />
        ) : (
          <>
            <PenLine className="w-4 h-4 me-1" /> Write Image URL
          </>
        )}
      </Button>
      {isURL && (
        <div className="flex items-center w-80 gap-2">
          <Input
            id="event-image"
            value={tempValue}
            onChange={(e) => setTempValue(e.target.value)}
            placeholder="Enter image URL"
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => setAdImage(tempValue)}
          >
            Upload
          </Button>
        </div>
      )}
    </div>
  );
}
