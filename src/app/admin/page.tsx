"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  CalendarDays,
  ClockIcon,
  MapPin,
  Plus,
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { useAuth } from "@/src/features/auth/auth-provider";
import { Event } from "@/src/models/event";
import {
  formatDate,
  formatEventsDates,
  formatTime,
} from "@/src/lib/utils/formatDate";
import { collection, getDocs, orderBy, query } from "@firebase/firestore";
import { db } from "@/src/lib/firebase/firebaseConfig";
import Loading from "@/src/components/ui/loading";
import { deleteDocById } from "@/src/lib/firebase/firestore";
import LoadingDots from "@/src/components/ui/loading-dots";
import { useToast } from "@/src/components/ui/use-toast";
import UsersList from "@/src/app/admin/users/page";

async function getEvents() {
  const eventsQuery = query(
    collection(db, "events"),
    orderBy("updated_at", "desc")
  );
  const querySnapshot = await getDocs(eventsQuery);
  const events = querySnapshot.docs.map((doc) => {
    const data = formatEventsDates(doc.data(), false);

    return data as Event;
  });
  return events;
}

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    getEvents()
      .then((events) => {
        setEvents(events);
      })
      .catch((error) => {
        console.error("Error fetching events:", error);
        setError("Failed to fetch data. Please try again later.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (!user?.isAdmin) {
      router.push("/");
    }
  }, [user, router]);

  if (!user?.isAdmin) {
    return null;
  }

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
      setError(`${error}`);

      toast({
        title: "⚠️ Error deleting event",
        description: "Failed to delete event. Please try again later.",
        variant: "destructive",
      });
      setError(null);
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="container py-10">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="mr-2 h-4 w-4" />
            Create Event
          </Link>
        </Button>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{events.length}</div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Sales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className="icon-saudi_riyal" />
              {45231.89}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Events Management</CardTitle>
              <CardDescription>
                Manage your events, edit details, or remove events.
              </CardDescription>
            </CardHeader>

            {loading && (
              <div className="flex justify-center items-center py-12">
                <Loading />
              </div>
            )}

            {events.length === 0 && !loading && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">
                  No events available. Create your first event.
                </p>
              </div>
            )}

            <CardContent className="space-y-4">
              {events.map((event: Event) => (
                <div
                  key={event.event_id}
                  className="flex items-center justify-between border-b pb-4"
                >
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 overflow-hidden rounded-md">
                      <img
                        src={event.event_image || "/placeholder.svg"}
                        alt={event.title}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div>
                      <h3 className="font-semibold text-lg">{event.title}</h3>
                      <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                        <CalendarDays className="mr-1 h-3 w-3 md:h-4 md:w-4 text-orangeColor" />
                        {`${formatDate(event.dates[0].date)}`}
                      </div>
                      <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                        <ClockIcon className="mr-1 h-3 w-3 md:h-4 md:w-4 text-orangeColor" />
                        {`${formatTime(
                          event.dates[0].start_time
                        )} - ${formatTime(event.dates[0].end_time)}`}
                      </div>
                      <div className="flex items-center text-xs md:text-sm text-muted-foreground">
                        <MapPin className="mr-1 h-3 w-3 md:h-4 md:w-4 text-orangeColor" />
                        {event.location}
                      </div>
                    </div>
                  </div>
                  <div className="flex flex-col md:flex-row gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/admin/events/edit/${event.event_id}`}>
                        Edit
                      </Link>
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Sales</CardTitle>
              <CardDescription>
                View and manage ticket sales for all events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No recent ticket sales to display.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardHeader>
              <CardTitle>User Management</CardTitle>
              <CardDescription>View and manage user accounts.</CardDescription>
            </CardHeader>
            <CardContent>
              <UsersList />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
