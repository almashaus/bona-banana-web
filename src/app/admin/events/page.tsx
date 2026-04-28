"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { useToast } from "@/src/components/ui/use-toast";
import Link from "next/link";
import {
  CalendarCheck,
  CalendarCheck2,
  CalendarClock,
  Check,
  CheckCircle,
  CheckIcon,
  ChevronDown,
  ChevronFirst,
  ChevronLast,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  CircleAlertIcon,
  Clock,
  Clock4Icon,
  Copy,
  Edit2,
  EyeIcon,
  MapPin,
  Plus,
  TicketIcon,
  Trash,
  XIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/src/components/ui/dropdown-menu";
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
import { Event, EventDate, EventStatus } from "@/src/models/event";
import { formatDate, formatTime } from "@/src/lib/utils/formatDate";
import LoadingDots from "@/src/components/ui/loading-dots";
import Loading from "@/src/components/ui/loading";
import { getStatusIcon } from "@/src/lib/utils/statusIcons";
import useSWR, { mutate } from "swr";
import { Badge } from "@/src/components/ui/badge";
import { Ticket } from "@/src/models/ticket";
import { getTicketStatusBadgeColor } from "@/src/lib/utils/styles";
import { getAuth } from "firebase/auth";
import { AppUser } from "@/src/models/user";
import Image from "next/image";
import { useAuthStore } from "@/src/lib/stores/useAuthStore";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { usePermissions } from "@/src/hooks/useMemberPermissions";
import { isBefore, isToday } from "date-fns";
import {
  copyToClipboard,
  isBeforeDate,
  isBeforeToday,
} from "@/src/lib/utils/utils";
import AccessDenied from "@/src/components/ui/access-denied";

export default function EventsPage() {
  const { toast } = useToast();
  const user = useAuthStore((state) => state.user);
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const pathname = usePathname();
  const eventUrl = pathname?.includes("/events");
  const isMobile = useIsMobile();
  const [responseData, setResponseData] = useState<Response[]>([]);
  const [isDeleting, setIsDeleting] = useState(false);
  const [openCollapsibleIds, setOpenCollapsibleIds] = useState<Set<string>>(
    () => new Set(),
  );
  const [selectedEventDate, setSelectedEventDate] = useState<EventDate | null>(
    null,
  );
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [eventPaginationState, setEventPaginationState] = useState<
    Record<string, { currentPage: number; pageSize: number }>
  >({});

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
      setOpenCollapsibleIds(new Set([data[0].event.id]));
      // Initialize pagination state for each event
      const paginationState: Record<
        string,
        { currentPage: number; pageSize: number }
      > = {};
      data.forEach((response) => {
        paginationState[response.event.id] = { currentPage: 1, pageSize: 5 };
      });
      setEventPaginationState(paginationState);
    }
  }, [data]);

  const handleEventStatus = async (id: string, status: EventStatus) => {
    const update = { status: status };
    const idToken = await authUser.getIdToken();
    try {
      const response = await fetch(`/api/admin/events/edit/${id}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id, update }),
      });

      if (response.ok) {
        await mutate("/api/admin/events");
        await mutate("/api/published-events");
        await mutate("/api/admin/orders");

        toast({
          title: "Event updated",
          description: "Your event has been updated successfully",
          variant: "success",
        });
      } else {
        throw new Error("Failed to update event");
      }
    } catch (error) {
      toast({
        title: "Error updating event",
        description: "Failed to update event. Please try again later.",
        variant: "destructive",
      });
    }
  }

  const handlePageChange = (eventId: string, newPage: number) => {
    setEventPaginationState((prev) => ({
      ...prev,
      [eventId]: { ...prev[eventId], currentPage: newPage },
    }));
  };

  const handlePageSizeChange = (eventId: string, newSize: number) => {
    setEventPaginationState((prev) => ({
      ...prev,
      [eventId]: { currentPage: 1, pageSize: newSize },
    }));
  };

  const getPaginatedDates = (dates: EventDate[], eventId: string) => {
    const pagination = eventPaginationState[eventId] || {
      currentPage: 1,
      pageSize: 5,
    };
    const sortedDates = [...dates].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
    );
    const startIndex = (pagination.currentPage - 1) * pagination.pageSize;
    const endIndex = startIndex + pagination.pageSize;
    return sortedDates.slice(startIndex, endIndex);
  };

  const deleteEvent = async (eventId: string) => {
    try {
      setIsDeleting(true);

      const event: Event = responseData.find(
        (data) => data.event.id === eventId,
      )?.event!;

      const idToken = await authUser.getIdToken();
      const response = await fetch(`/api/admin/events`, {
        method: "DELETE",
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
          title: "Event deleted",
          description: "Your event has been deleted successfully",
          variant: "success",
        });
      } else {
        throw new Error("Failed to delete event");
      }
    } catch (error) {
      toast({
        title: "Error deleting event",
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

  const { hasPermission } = usePermissions(user);
  const canViewEvents: boolean = hasPermission("Event Management", "view");
  const canCreateEvent: boolean = hasPermission("Event Management", "create");
  const canEditEvent: boolean = hasPermission("Event Management", "edit");
  const canDeleteEvent: boolean = hasPermission("Event Management", "delete");

  if (!canViewEvents) {
    return <AccessDenied />;
  }

  return (
    <div className="p-4 md:p-6">
      {eventUrl && (
        <div className="flex flex-col md:flex-row justify-between  md:items-center gap-4 mb-3">
          <div>
            <h1 className="text-3xl font-bold">Events Management</h1>
            <p className="text-muted-foreground">
              Manage your events, edit details, or remove events
            </p>
          </div>
          {canCreateEvent && (
            <div className="flex justify-end">
              <Button asChild>
                <Link href="/admin/events/new">
                  <Plus className="me-2 h-4 w-4" />
                  Create Event
                </Link>
              </Button>
            </div>
          )}
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
              if (
                !user?.dashboard?.eventsAccess ||
                user?.dashboard?.eventsAccess?.length === 0 ||
                user?.dashboard?.eventsAccess?.includes(response.event.id)
              )
                return (
                  <div
                    key={response.event.id}
                    className={`${index !== array.length - 1 && "border-b pb-6"} p-3 mb-3 `}
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2">
                        <h3 className="font-semibold text-lg">
                          {response.event.title}
                        </h3>
                      </div>

                      <div className="flex flex-row items-start justify-between gap-2 md:gap-4">
                        <div className="flex flex-row gap-2 items-center">
                          <div className="h-20 w-20 md:h-24 md:w-24 overflow-hidden relative rounded-md">
                            <Image
                              src={
                                response.event.eventLogo?.trim()
                                  ? response.event.eventLogo
                                  : response.event.eventImage?.trim()
                                    ? response.event.eventImage
                                    : "/no-image.svg"
                              }
                              alt={response.event.title}
                              className="h-full w-full object-cover"
                              fill
                              priority
                            />
                          </div>

                          <div className="flex flex-col gap-2">
                            <div className="flex items-end text-xs md:text-sm text-muted-foreground">
                              <MapPin className="mr-1 h-4 w-4 md:h-4 md:w-4 text-orangeColor" />
                              {response.event.city.en}
                            </div>
                            <div className="flex items-end text-xs md:text-sm text-muted-foreground">
                              <span className="icon-saudi_riyal text-orangeColor" />
                              {response.event.price}
                            </div>
                            <div className="flex items-end text-xs md:text-sm text-muted-foreground">
                              {getStatusIcon(response.event.status)}
                              {response.event.status}
                            </div>
                          </div>
                        </div>

                        <div className="flex flex-col gap-2">
                          {canEditEvent && (
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                >
                                  <Clock className="h-3 w-3" /> Edit Status
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent>
                                <DropdownMenuItem className={`flex items-center ${response.event.status === EventStatus.DRAFT && "bg-green-500/20"}`}
                                  onClick={() => handleEventStatus(response.event.id, EventStatus.DRAFT)}>
                                  Draft
                                  <Clock4Icon className=" w-4 h-4 text-gray-400 mx-1 " />
                                </DropdownMenuItem>
                                <DropdownMenuItem className={`flex items-center ${response.event.status === EventStatus.PUBLISHED && "bg-green-500/20"}`}
                                  onClick={() => handleEventStatus(response.event.id, EventStatus.PUBLISHED)}>
                                  Published
                                  <EyeIcon className=" w-4 h-4 text-blue-400 mx-1 " />
                                </DropdownMenuItem>
                                <DropdownMenuItem className={`flex items-center ${response.event.status === EventStatus.CANCELED && "bg-green-500/20"}`}
                                  onClick={() => handleEventStatus(response.event.id, EventStatus.CANCELED)}>
                                  Canceled
                                  <XIcon className=" w-4 h-4 text-red-400 mx-1 " />
                                </DropdownMenuItem>
                                <DropdownMenuItem className={`flex items-center ${response.event.status === EventStatus.COMPLETED && "bg-green-500/20"}`}
                                  onClick={() => handleEventStatus(response.event.id, EventStatus.COMPLETED)}>
                                  Completed
                                  <CheckIcon className=" w-4 h-4 text-green-400 mx-1 " />
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          )}

                          {canEditEvent && (
                            <Button variant="outline" size="sm" asChild>
                              <Link
                                href={`/admin/events/edit/${response.event.id}`}
                              >
                                <Edit2 className="h-3 w-3" /> Edit Event
                              </Link>
                            </Button>
                          )}

                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              {canDeleteEvent && (
                                <Button
                                  variant="destructive"
                                  size="sm"
                                  disabled={isDeleting}
                                >
                                  <Trash className="h-3 w-3" /> Delete
                                </Button>
                              )}
                            </AlertDialogTrigger>
                            <AlertDialogContent dir="ltr">
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
                      <CollapsibleTrigger className="flex items-end mt-4 font-medium gap-1">
                        {openCollapsibleIds.has(response.event.id) ? (
                          <ChevronUp className="text-orangeColor" />
                        ) : (
                          <ChevronDown className="text-redColor" />
                        )}
                        <span> Dates & Tickets</span>
                      </CollapsibleTrigger>
                      <CollapsibleContent>
                        <div className="mt-2 rounded-t-md border">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className=""></TableHead>
                                <TableHead>Date and Time</TableHead>
                                <TableHead>Available Tickets</TableHead>
                                <TableHead>Purchased Tickets</TableHead>
                                <TableHead>View Tickets</TableHead>
                              </TableRow>
                            </TableHeader>

                            <TableBody>
                              {getPaginatedDates(
                                response.event.dates,
                                response.event.id,
                              )?.map((date) => (
                                <TableRow key={date.id}>
                                  <TableCell className="flex justify-center">
                                    {isBeforeToday(date.date) ? (
                                      <CalendarCheck2 className="w-5 h-5 mt-3 text-green-500" />
                                    ) : (
                                      <CalendarClock className="w-5 h-5 mt-3 text-muted-foreground" />
                                    )}
                                  </TableCell>

                                  <TableCell className="font-medium">
                                    <div
                                      className={`${isBeforeToday(date.date) ? "text-muted-foreground/70" : ""}`}
                                    >
                                      {formatDate(date.date)}
                                    </div>
                                    <div
                                      className={`${isBeforeToday(date.date) ? "text-muted-foreground/50" : "text-muted-foreground"}`}
                                    >
                                      {formatTime(date.startTime)} -{" "}
                                      {formatTime(date.endTime)}
                                    </div>
                                  </TableCell>

                                  <TableCell>
                                    <Badge
                                      className={`${date.availableTickets < 5
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
                        {/* pagination */}
                        <div className="bg-muted px-5 py-2.5 flex flex-col space-y-3 md:space-y-0 md:flex-row items-center justify-between border-x border-b rounded-b-md">
                          {(() => {
                            const pagination = eventPaginationState[
                              response.event.id
                            ] || {
                              currentPage: 1,
                              pageSize: 5,
                            };
                            const totalDates = response.event.dates.length;
                            const totalPages = Math.ceil(
                              totalDates / pagination.pageSize,
                            );
                            const startItem =
                              (pagination.currentPage - 1) *
                              pagination.pageSize +
                              1;
                            const endItem = Math.min(
                              pagination.currentPage * pagination.pageSize,
                              totalDates,
                            );

                            return (
                              <>
                                <div className="flex items-center gap-4">
                                  <div className="w-full">
                                    <span className="text-xs text-gray-500">
                                      {startItem} - {endItem} of {totalDates}
                                    </span>
                                  </div>

                                  <Select
                                    value={pagination.pageSize.toString()}
                                    onValueChange={(value) =>
                                      handlePageSizeChange(
                                        response.event.id,
                                        Number(value),
                                      )
                                    }
                                  >
                                    <SelectTrigger className="text-xs">
                                      <SelectValue
                                        placeholder={pagination.pageSize}
                                      />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem
                                        key={"5"}
                                        value={"5"}
                                        className="text-xs"
                                      >
                                        5 per page
                                      </SelectItem>
                                      <SelectItem
                                        key={"10"}
                                        value={"10"}
                                        className="text-xs"
                                      >
                                        10 per page
                                      </SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>

                                <div className="flex items-center gap-2">
                                  <button
                                    onClick={() =>
                                      handlePageChange(response.event.id, 1)
                                    }
                                    disabled={pagination.currentPage === 1}
                                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                  >
                                    <ChevronFirst className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() =>
                                      handlePageChange(
                                        response.event.id,
                                        pagination.currentPage - 1,
                                      )
                                    }
                                    disabled={pagination.currentPage === 1}
                                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                  >
                                    <ChevronLeft className="w-4 h-4" />
                                  </button>

                                  <div className="flex items-center gap-1">
                                    {Array.from({ length: totalPages }).map(
                                      (_, index) => {
                                        const pageNumber = index + 1;
                                        return (
                                          <button
                                            key={pageNumber}
                                            onClick={() =>
                                              handlePageChange(
                                                response.event.id,
                                                pageNumber,
                                              )
                                            }
                                            className={`px-3 py-1 bg-white border rounded-md text-sm ${pagination.currentPage ===
                                              pageNumber
                                              ? "bg-orangeColor text-orangeColor border-orangeColor"
                                              : "border-gray-300 hover:bg-gray-100"
                                              }`}
                                          >
                                            {pageNumber}
                                          </button>
                                        );
                                      },
                                    )}
                                  </div>

                                  <button
                                    onClick={() =>
                                      handlePageChange(
                                        response.event.id,
                                        pagination.currentPage + 1,
                                      )
                                    }
                                    disabled={
                                      pagination.currentPage === totalPages
                                    }
                                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                  >
                                    <ChevronRight className="w-4 h-4" />
                                  </button>

                                  <button
                                    onClick={() =>
                                      handlePageChange(
                                        response.event.id,
                                        totalPages,
                                      )
                                    }
                                    disabled={
                                      pagination.currentPage === totalPages
                                    }
                                    className="px-3 py-1.5 bg-white border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
                                  >
                                    <ChevronLast className="w-4 h-4" />
                                  </button>
                                </div>
                              </>
                            );
                          })()}
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                );
            })}
          </div>
        )
        }
      </div>

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
            {data && data.length > 0 && (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Ticket ID</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {(() => {
                    const ticketsForSelectedDate = data.flatMap((item) =>
                      item.tickets.filter(
                        (ticketObj) =>
                          ticketObj.ticket.eventDateId ===
                          selectedEventDate?.id,
                      ),
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
                              ticketObj.ticket.status,
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
