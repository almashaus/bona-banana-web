"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useToast } from "@/src/components/ui/use-toast";
import Link from "next/link";
import {
  Check,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  CircleAlertIcon,
  Edit2,
  MapPin,
  PanelLeft,
  Plus,
  TicketIcon,
  Trash,
} from "lucide-react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/src/components/ui/collapsible";
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
import { Button } from "@/src/components/ui/button";
import { Event, EventDate } from "@/src/models/event";
import { formatDate, formatTime } from "@/src/lib/utils/formatDate";
import LoadingDots from "@/src/components/ui/loading-dots";
import Loading from "@/src/components/ui/loading";
import { getStatusIcon } from "@/src/lib/utils/statusIcons";
import useSWR, { mutate } from "swr";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { useMobileSidebar } from "@/src/lib/stores/useMobileSidebar";
import { Badge } from "@/src/components/ui/badge";
import { Ticket, TicketStatus } from "@/src/models/ticket";
import { getTicketStatusBadgeColor } from "@/src/lib/utils/styles";
import { getAuth } from "firebase/auth";
import { generateQRCode } from "@/src/lib/utils/utils";

export default function Events() {
  const { toast } = useToast();
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const router = useRouter();
  const pathname = usePathname();
  const eventUrl = pathname?.includes("/events");
  const isMobile = useIsMobile();
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);

  const [events, setEvents] = useState<Event[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isValidtion, setIsValidtion] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openCollapsibleIds, setOpenCollapsibleIds] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedEventDate, setSelectedEventDate] = useState<EventDate | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  interface Response {
    events: Event[];
    tickets: Ticket[];
  }

  const { data, error, isLoading } = useSWR<Response>("/api/admin/events");

  useEffect(() => {
    if (data) {
      setEvents(data.events);
      setTickets(data.tickets);
    }
  }, [data]);

  const deleteEvent = async (eventId: string) => {
    try {
      setIsDeleting(true);

      const idToken = await authUser.getIdToken();
      const response = await fetch(`/api/admin/events?eventId=${eventId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
      });

      if (response.ok) {
        await mutate("/api/admin/events");
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

  const handleViewDetails = (eventDate: EventDate) => {
    setSelectedEventDate(eventDate);
    setIsDialogOpen(true);
  };

  const handleValidToUsedTicket = async (ticketId: string) => {
    try {
      setIsValidtion(true);
      const idToken = await authUser.getIdToken();

      const response = await fetch("/api/admin/events", {
        method: "POST",
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
        await mutate("/api/admin/events");
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

  return (
    <div className="container py-6">
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
            <h1 className="text-3xl font-bold">Events Management</h1>
            <p className="text-muted-foreground">
              Manage your events, edit details, or remove events
            </p>
          </div>

          <div>
            <Button asChild>
              <Link href="/admin/events/new">
                <Plus className="me-2 h-4 w-4" />
                Create Event
              </Link>
            </Button>
          </div>
        </div>
      )}

      <div className={` bg-white rounded-lg ${eventUrl && "border"}`}>
        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loading />
          </div>
        )}

        {error && (
          <div className="text-red-500 text-center py-12">
            <p>
              {typeof error === "string"
                ? error
                : error instanceof Error
                  ? error.message
                  : "An error occurred."}
            </p>
          </div>
        )}

        {events?.length === 0 && !isLoading && (
          <div className="text-center py-12">
            <CircleAlertIcon
              strokeWidth={1.25}
              className="mx-auto h-12 w-12 text-muted-foreground mb-4"
            />

            <p className="text-muted-foreground">
              No events available. Create your first event.
            </p>
          </div>
        )}

        {events?.map((event: Event, index, array) => (
          <div
            key={event.id}
            className={`${index !== array.length - 1 && "border-b pb-6"} p-5 mb-3 `}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-2 md:gap-4">
                <div className="h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-md">
                  <img
                    src={event.eventImage || "/no-image.svg"}
                    alt={event.title}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-lg">{event.title}</h3>
                  </div>

                  <div className="flex items-end mb-1 text-xs md:text-sm text-muted-foreground">
                    <MapPin className="mr-1 h-3 w-3 md:h-4 md:w-4 text-orangeColor" />
                    {event.location}
                  </div>
                  <div className="flex items-end mb-1 text-xs md:text-sm text-muted-foreground">
                    <span className="icon-saudi_riyal text-orangeColor" />
                    {event.price}
                  </div>
                  <div className="flex items-end mb-1 text-xs md:text-sm text-muted-foreground">
                    {getStatusIcon(event.status)}
                    {event.status}
                  </div>
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <Button variant="outline" size="sm" asChild>
                  <Link href={`/admin/events/edit/${event.id}`}>
                    <Edit2 className="h-3 w-3" /> Edit
                  </Link>
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  disabled={isDeleting}
                  onClick={() => deleteEvent(event.id)}
                >
                  {isDeleting ? (
                    <LoadingDots />
                  ) : (
                    <>
                      <Trash className="h-3 w-3" /> Delete
                    </>
                  )}
                </Button>
              </div>
            </div>
            <Collapsible
              open={openCollapsibleIds.has(event.id)}
              onOpenChange={(open) => {
                setOpenCollapsibleIds((prev) => {
                  const newSet = new Set(prev);
                  if (open) {
                    newSet.add(event.id);
                  } else {
                    newSet.delete(event.id);
                  }
                  return newSet;
                });
              }}
            >
              <CollapsibleTrigger className="flex items-end mt-2 font-medium gap-1">
                {openCollapsibleIds.has(event.id) ? (
                  <ChevronUp />
                ) : (
                  <ChevronDown />
                )}
                <span> Dates & Tickets</span>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="mt-2 rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Start Time</TableHead>
                        <TableHead>End Time</TableHead>
                        <TableHead>Available Tickets</TableHead>
                        <TableHead>Purchased Tickets</TableHead>
                        <TableHead>View Tickets</TableHead>
                      </TableRow>
                    </TableHeader>

                    <TableBody>
                      {event.dates?.map((data) => (
                        <TableRow key={data.id}>
                          <TableCell className="font-medium">
                            {formatDate(data.date)}
                          </TableCell>
                          <TableCell>{formatTime(data.startTime)}</TableCell>
                          <TableCell>{formatTime(data.endTime)}</TableCell>
                          <TableCell>
                            <Badge
                              className={`${data.availableTickets < 5 ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-700"} pb-1`}
                            >
                              {data.availableTickets}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {data.capacity - data.availableTickets}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleViewDetails(data)}
                            >
                              <TicketIcon className="h-4 w-4 text-orangeColor" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        ))}
      </div>

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
            {!tickets.find(
              (ticket) => ticket.eventDateId === selectedEventDate?.id
            ) ? (
              <p className="text-center p-6">No tickets</p>
            ) : (
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
                  {tickets.map((ticket) => {
                    if (ticket.eventDateId === selectedEventDate?.id)
                      return (
                        <TableRow key={ticket.id}>
                          <TableCell className="font-medium">
                            {ticket.id}
                          </TableCell>
                          <TableCell>
                            <div className="bg-white p-2 rounded-lg inline-block mb-2">
                              <img
                                src={
                                  generateQRCode(ticket.token || ticket.id) ||
                                  "/no-image.svg"
                                }
                                alt="QR Code"
                                className="w-20 h-20"
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
                                <CheckSquare className="h-4 w-4 text-green-600" />
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
