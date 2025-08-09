"use client";

import Link from "next/link";
import {
  CameraIcon,
  Check,
  CheckCircle,
  DollarSignIcon,
  InfoIcon,
  SearchIcon,
  Ticket,
  TicketIcon,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import Image from "next/image";
import { useToast } from "@/src/components/ui/use-toast";
import UsersPage from "./members/page";
import useSWR, { mutate } from "swr";
import { PanelLeft } from "lucide-react";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { useMobileSidebar } from "@/src/lib/stores/useMobileSidebar";
import { DashboardEvent } from "@/src/models/event";
import { getStatusIcon } from "@/src/lib/utils/statusIcons";
import Loading from "@/src/components/ui/loading";
import { formatDate } from "@/src/lib/utils/formatDate";
import { generateQRCode } from "@/src/lib/utils/utils";
import { useEffect, useState } from "react";
import { Badge } from "@/src/components/ui/badge";
import { getTicketStatusBadgeColor } from "@/src/lib/utils/styles";
import { TicketStatus } from "@/src/models/ticket";
import { getAuth } from "firebase/auth";

export default function AdminPage() {
  const isMobile = useIsMobile();
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);

  const fetcher = (url: string) =>
    fetch(url, { cache: "no-store" }).then((res) => res.json());

  interface Response {
    events: DashboardEvent[];
    number: number;
  }

  const { data, error, isLoading } = useSWR<Response>(
    "/api/admin/dashboard",
    fetcher,
    {
      revalidateOnFocus: true,
      revalidateIfStale: true,
      refreshInterval: 30000,
    }
  );

  return (
    <div className="container py-6">
      <div className="mb-6">
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
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading || error ? "..." : (data?.number ?? 0)}
            </div>
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
            <DollarSignIcon className="h-4 w-4 text-muted-foreground" />
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

      {/* ------------- Tabs ------------ */}
      <Tabs defaultValue="events">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <DashboardEventsList />
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
            <CardContent>
              <UsersPage />
              <div className="flex justify-center ">
                <Button asChild>
                  <Link href="/admin/users">View All Users</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DashboardEventsList() {
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const { toast } = useToast();
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isValidtion, setIsValidtion] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  interface Response {
    events: DashboardEvent[];
    number: number;
  }

  const { data, error, isLoading } = useSWR<Response>("/api/admin/dashboard");

  useEffect(() => {
    if (data) {
      setEvents(data.events);
    }
  }, [data]);

  const handleValidToUsedTicket = async (ticketId: string) => {
    try {
      setIsValidtion(true);
      const idToken = await authUser.getIdToken();

      const response = await fetch("/api/admin/dashboard", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          id: ticketId,
          data: { status: TicketStatus.USED },
        }),
      });

      if (response.ok) {
        await mutate("/api/admin/dashboard");
        await mutate("/api/admin/events");
        await mutate("/api/admin/customers");
        await mutate("/api/profile");
      }
    } catch (error) {
      toast({
        title: "⚠️ Error",
        description: "Failed to validate the ticket. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsValidtion(false);
    }
  };

  const handleViewDetails = (eventId: string) => {
    setSelectedEvent(eventId);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <Card>
        <CardHeader>
          <CardTitle>Upcoming Events</CardTitle>
          <CardDescription>
            Manage your events, edit details, or remove events.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {isLoading && (
            <div className="flex justify-center items-center py-12">
              <Loading />
            </div>
          )}

          {!isLoading && events && events.length === 0 && (
            <div className="flex flex-col justify-center items-center py-12 text-muted-foreground">
              <SearchIcon />
              <p>No Events in this month</p>
            </div>
          )}

          {error && (
            <div className="flex flex-col justify-center items-center py-12 text-muted-foreground">
              <InfoIcon />
              <p>Unable to fetch data. Please try again later.</p>
            </div>
          )}

          {/* <Events /> */}
          {events && events.length > 0 && (
            <div className="rounded-lg border bg-white">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[10px]"></TableHead>
                    <TableHead>Title</TableHead>
                    <TableHead>City</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[80px]">
                      Purchased Tickets
                    </TableHead>
                    <TableHead className="w-[80px]">View Tickets</TableHead>
                    <TableHead className="w-[80px]">QR Code</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {events.map((event, index, array) => (
                    <TableRow key={event.eventDate.id} role="row">
                      <TableCell>
                        <div className="h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-md">
                          <img
                            src={event.eventImage || "/no-image.svg"}
                            alt={event.title}
                            className="h-full w-full object-cover"
                          />
                        </div>
                      </TableCell>

                      <TableCell className="font-medium">
                        <div className="flex flex-col">
                          <p>{event.title}</p>
                          <p className="text-orangeColor">
                            {formatDate(event.eventDate.date)}
                          </p>
                        </div>
                      </TableCell>

                      <TableCell>{event.location}</TableCell>
                      <TableCell>
                        <div className="flex flex-col items-center justify-center text-muted-foreground">
                          {getStatusIcon(event.status)}
                          {event.status}
                        </div>
                      </TableCell>
                      <TableCell
                        className={`${event.tickets.length === event.eventDate.capacity && "text-redColor"}`}
                      >
                        {event.tickets.length}/{event.eventDate.capacity}
                      </TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          onClick={() => handleViewDetails(event.id)}
                        >
                          <TicketIcon className="h-3 w-3" /> Tickets
                        </Button>
                      </TableCell>
                      <TableCell>
                        <Button variant="outline" size="sm" onClick={() => {}}>
                          <CameraIcon className="h-3 w-3" /> Scan Code
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ----------- Tickets Dialog ----------- */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="bg-stone-100 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Tickets List</DialogTitle>
            <DialogDescription>
              The complete information for tickets
            </DialogDescription>
          </DialogHeader>
          <div className="bg-white mt-2 rounded-md border">
            {selectedEvent && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Attend</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {events
                    .find((e) => e.id === selectedEvent)
                    ?.tickets.map((ticket) => {
                      return (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">
                            {ticket.id}
                          </TableCell>
                          <TableCell>
                            <div className="flex justify-center bg-white p-2 rounded-lg  mb-2 w-20 h-20 md:w-full md:h-full">
                              <Image
                                src={
                                  generateQRCode(ticket.token || ticket.id) ||
                                  "/no-image.svg"
                                }
                                alt={"QR code"}
                                width={80}
                                height={80}
                              />
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              className={`${getTicketStatusBadgeColor(ticket.status)}`}
                            >
                              {isValidtion ? "....." : ticket.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {ticket.status === TicketStatus.VALID ? (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  handleValidToUsedTicket(ticket.id)
                                }
                              >
                                <CheckCircle className="h-4 w-4 text-green-600" />
                              </Button>
                            ) : (
                              <Button variant="ghost" size="icon" disabled>
                                <Check className="h-4 w-4 text-gray-600" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
