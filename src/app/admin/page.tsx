"use client";

import {
  CalendarRange,
  CameraIcon,
  Check,
  CheckCircle,
  DollarSignIcon,
  EyeOffIcon,
  InfoIcon,
  SearchIcon,
  Ticket,
  TicketIcon,
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
import useSWR, { mutate } from "swr";
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
import QrScanner from "@/src/features/scanner/qr-scanner";
import { useAuth } from "@/src/features/auth/auth-provider";
import { MemberStatus } from "@/src/types/permissions";
import { usePermissions } from "@/src/hooks/useMemberPermissions";

export default function AdminPage() {
  const { user } = useAuth();
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const { toast } = useToast();
  const [events, setEvents] = useState<DashboardEvent[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isValidtion, setIsValidtion] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<string | null>(null);

  const [openCamera, setOpenCamera] = useState(false);

  const fetcher = (url: string) =>
    fetch(url, { cache: "no-store" }).then((res) => res.json());

  interface Response {
    events: DashboardEvent[];
    eventsNumber: number;
    ticketsCount: number;
    ticketsTotal: number;
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

  useEffect(() => {
    if (data) {
      setEvents(data.events);
    }
  }, [data]);

  const { hasPermission } = usePermissions(user);
  const canViewRevenue: boolean = hasPermission("Reports", "view");

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

  if (!user || user?.dashboard?.status === MemberStatus.SUSPENDED) {
    return <></>;
  }

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-row items-center justify-between ">
              <div>
                <CardTitle className="text-sm font-medium mb-1">
                  Total Events
                </CardTitle>
                <span className="text-2xl font-bold">
                  {isLoading || error ? "..." : (data?.eventsNumber ?? 0)}
                </span>
                <span className="text-sm font-normal"> Events</span>
              </div>
              <CalendarRange
                strokeWidth={1}
                className="h-12 w-12 text-orangeColor"
              />
            </div>
            <p className="text-sm text-muted-foreground"></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-row items-center justify-between ">
              <div>
                <CardTitle className="text-sm font-medium mb-1">
                  Ticket Sales
                </CardTitle>
                <span className="text-2xl font-bold">
                  {isLoading || error ? "..." : (data?.ticketsCount ?? 0)}
                </span>
                <span className="text-sm font-normal"> Tickets</span>
              </div>
              <Ticket strokeWidth={1} className="h-12 w-12 text-orangeColor" />
            </div>
            <p className="text-sm text-muted-foreground"></p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-sm font-medium mb-1">
                  Revenue
                </CardTitle>
                {canViewRevenue ? (
                  <div>
                    <span className="text-2xl font-bold">
                      {isLoading || error ? "..." : (data?.ticketsTotal ?? 0)}
                    </span>
                    <span className="icon-saudi_riyal text-md font-light" />
                  </div>
                ) : (
                  <span className="text-2xl font-bold">
                    <EyeOffIcon className="w-4 h-4 mt-2.5" />
                  </span>
                )}
              </div>
              <DollarSignIcon
                strokeWidth={1}
                className="h-12 w-12 text-orangeColor"
              />
            </div>
            <p className="text-sm text-muted-foreground"></p>
          </CardContent>
        </Card>
      </div>

      <div>
        <Card>
          <CardHeader>
            <CardTitle>Upcoming Events</CardTitle>
            <CardDescription>
              Manage this month events, scan tickets.
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
                          <div className="h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-md relative">
                            <Image
                              src={
                                event.eventLogo ??
                                event.eventImage ??
                                "/no-image.svg"
                              }
                              alt={event.title}
                              className="h-full w-full object-cover"
                              fill
                              priority
                              onError={(e) => {
                                e.currentTarget.src = "/no-image.svg";
                              }}
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

                        <TableCell>{event.city.en}</TableCell>
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
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setOpenCamera(true)}
                          >
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
          <DialogContent
            dir="ltr"
            className="bg-stone-100 max-w-4xl max-h-[90vh] overflow-y-auto"
          >
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
                      <TableHead>User Name</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Ticket ID</TableHead>
                      <TableHead>QR Code</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Attend</TableHead>
                    </TableRow>
                  </TableHeader>

                  <TableBody>
                    {events.find((e) => e.id === selectedEvent)?.tickets
                      .length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={6}>
                          <p className="text-center p-6">No tickets</p>
                        </TableCell>
                      </TableRow>
                    ) : (
                      events
                        .find((e) => e.id === selectedEvent)
                        ?.tickets.map((ticket) => {
                          return (
                            <TableRow key={ticket.id}>
                              <TableCell>{ticket.user.name}</TableCell>
                              <TableCell className="text-muted-foreground">
                                <div className="flex flex-col">
                                  <p>{ticket.user.phone}</p>
                                  <p>{ticket.user.email}</p>
                                </div>
                              </TableCell>
                              <TableCell className="font-medium">
                                {ticket.id}
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center bg-white p-2 rounded-lg  mb-2 w-20 h-20 md:w-full md:h-full">
                                  <Image
                                    src={
                                      generateQRCode(
                                        ticket.token || ticket.id
                                      ) || "/no-image.svg"
                                    }
                                    alt={"QR code"}
                                    width={80}
                                    height={80}
                                    priority
                                  />
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`${getTicketStatusBadgeColor(ticket.status)}`}
                                >
                                  {ticket.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {ticket.status === TicketStatus.VALID ? (
                                  <Button
                                    className="w-12 h-12 bg-green-600 hover:bg-green-600/70"
                                    onClick={() =>
                                      handleValidToUsedTicket(ticket.id)
                                    }
                                  >
                                    {isValidtion ? (
                                      <div className="flex justify-center">
                                        <Loading />
                                      </div>
                                    ) : (
                                      <CheckCircle size={50} />
                                    )}
                                  </Button>
                                ) : (
                                  <Button variant="ghost" size="icon" disabled>
                                    <Check
                                      className="text-gray-600"
                                      size={25}
                                    />
                                  </Button>
                                )}
                              </TableCell>
                            </TableRow>
                          );
                        })
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* ----------- Scanner Dialog ----------- */}
        <Dialog open={openCamera} onOpenChange={setOpenCamera}>
          <DialogContent className="bg-stone-100 max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-2xl">Ticket Scanner</DialogTitle>
              <DialogDescription>
                Scan the QR code of the ticket
              </DialogDescription>
            </DialogHeader>
            <QrScanner />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
