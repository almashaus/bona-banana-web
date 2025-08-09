"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/src/components/ui/use-toast";
import Link from "next/link";
import {
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
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
import { Ticket } from "@/src/models/ticket";
import { getTicketStatusBadgeColor } from "@/src/lib/utils/styles";
import { getAuth } from "firebase/auth";
import { AppUser } from "@/src/models/user";

export default function EventsPage() {
  const { toast } = useToast();
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const pathname = usePathname();
  const eventUrl = pathname?.includes("/events");
  const isMobile = useIsMobile();
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);
  const [responseData, setResponseData] = useState<Response[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openCollapsibleIds, setOpenCollapsibleIds] = useState<Set<string>>(
    () => new Set()
  );
  const [selectedEventDate, setSelectedEventDate] = useState<EventDate | null>(
    null
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  interface Response {
    event: Event;
    tickets: {
      ticket: Ticket;
      user: AppUser;
    }[];
  }

  const { data, error, isLoading } = useSWR<Response[]>("/api/admin/events");

  useEffect(() => {
    if (data) {
      setResponseData(data);
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
        await mutate("/api/published-events");
        await mutate("/api/admin/orders");

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

        {responseData?.length === 0 && !isLoading && (
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

        {responseData && responseData.length > 0 && (
          <div>
            {responseData.map((response: Response, index, array) => {
              return (
                <div
                  key={response.event.id}
                  className={`${index !== array.length - 1 && "border-b pb-6"} p-5 mb-3 `}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-2 md:gap-4">
                      <div className="h-20 w-20 md:h-24 md:w-24 overflow-hidden rounded-md">
                        <img
                          src={response.event.eventImage || "/no-image.svg"}
                          alt={response.event.title}
                          className="h-full w-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-lg">
                            {response.event.title}
                          </h3>
                        </div>

                        <div className="flex items-end mb-1 text-xs md:text-sm text-muted-foreground">
                          <MapPin className="mr-1 h-3 w-3 md:h-4 md:w-4 text-orangeColor" />
                          {response.event.location}
                        </div>
                        <div className="flex items-end mb-1 text-xs md:text-sm text-muted-foreground">
                          <span className="icon-saudi_riyal text-orangeColor" />
                          {response.event.price}
                        </div>
                        <div className="flex items-end mb-1 text-xs md:text-sm text-muted-foreground">
                          {getStatusIcon(response.event.status)}
                          {response.event.status}
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/admin/events/edit/${response.event.id}`}>
                          <Edit2 className="h-3 w-3" /> Edit
                        </Link>
                      </Button>

                      <AlertDialog>
                        <AlertDialogTrigger>
                          <Button
                            variant="destructive"
                            size="sm"
                            disabled={isDeleting}
                          >
                            <Trash className="h-3 w-3" /> Delete
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              Are you absolutely sure?
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              This action cannot be undone. This will
                              permanently delete the event data.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                              onClick={() => deleteEvent(response.event.id)}
                              disabled={isDeleting}
                            >
                              {isDeleting ? (
                                <LoadingDots />
                              ) : (
                                <>
                                  <Trash className="h-3 w-3 me-1" /> Delete
                                </>
                              )}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  <Collapsible
                    open={openCollapsibleIds.has(response.event.id)}
                    onOpenChange={(open) => {
                      setOpenCollapsibleIds((prev) => {
                        const newSet = new Set(prev);
                        if (open) {
                          newSet.add(response.event.id);
                        } else {
                          newSet.delete(response.event.id);
                        }
                        return newSet;
                      });
                    }}
                  >
                    <CollapsibleTrigger className="flex items-end mt-2 font-medium gap-1">
                      {openCollapsibleIds.has(response.event.id) ? (
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
                            {response.event.dates?.map((date) => (
                              <TableRow key={date.id}>
                                <TableCell className="font-medium">
                                  {formatDate(date.date)}
                                </TableCell>
                                <TableCell>
                                  {formatTime(date.startTime)}
                                </TableCell>
                                <TableCell>
                                  {formatTime(date.endTime)}
                                </TableCell>
                                <TableCell>
                                  <Badge
                                    className={`${
                                      date.availableTickets < 5
                                        ? "bg-orange-100 text-orange-600"
                                        : "bg-green-100 text-green-700"
                                    } pb-1`}
                                  >
                                    {date.availableTickets}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  {date.capacity - date.availableTickets}
                                </TableCell>
                                <TableCell>
                                  <Button
                                    size="sm"
                                    onClick={() => handleViewDetails(date)}
                                  >
                                    <TicketIcon className="h-3 w-3" /> Tickets
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
              );
            })}
          </div>
        )}
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
            {data && data.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {(() => {
                    const ticketsForSelectedDate = data.flatMap((item) =>
                      item.tickets.filter(
                        (ticketObj) =>
                          ticketObj.ticket.eventDateId === selectedEventDate?.id
                      )
                    );
                    if (ticketsForSelectedDate.length === 0) {
                      return (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <p className="text-center p-6">No tickets</p>
                          </TableCell>
                        </TableRow>
                      );
                    }
                    return ticketsForSelectedDate.map((ticketObj) => (
                      <TableRow key={ticketObj.ticket.id}>
                        <TableCell>{ticketObj.user.name}</TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex flex-col">
                            <p>{ticketObj.user.phone}</p>
                            <p>{ticketObj.user.email}</p>
                          </div>
                        </TableCell>
                        <TableCell>{ticketObj.ticket.id}</TableCell>

                        <TableCell>
                          <Badge
                            className={`${getTicketStatusBadgeColor(
                              ticketObj.ticket.status
                            )}`}
                          >
                            {ticketObj.ticket.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ));
                  })()}
                </TableBody>
              </Table>
            )}
            {/* )} */}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
