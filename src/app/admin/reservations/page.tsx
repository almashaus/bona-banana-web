"use client";

import { Label } from "@/src/components/ui/label";
import { useState, useEffect } from "react";
import {
  Search,
  Eye,
  X,
  Mail,
  Copy,
  Check,
  Calendar,
  CreditCard,
  Phone,
  User,
  Ticket,
  QrCode,
  CheckCircle,
  Settings2,
  PanelLeft,
  Printer,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/src/components/ui/dialog";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { useToast } from "@/src/components/ui/use-toast";
import useSWR, { mutate } from "swr";
import Loading from "@/src/components/ui/loading";
import { Order, OrderResponse, OrderStatus } from "@/src/models/order";
import { formatDate } from "@/src/lib/utils/formatDate";
import { getOrderStatusBadgeColor } from "@/src/lib/utils/styles";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { useMobileSidebar } from "@/src/lib/stores/useMobileSidebar";
import Image from "next/image";
import { handlePrintOrder } from "@/src/lib/utils/printOrder";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/src/components/ui/tooltip";
import { getDocumentById, updateDocument } from "@/src/lib/firebase/firestore";
import { Event } from "@/src/models/event";

const fetcher = (url: string) => fetch(url).then((res) => res.json());

export default function ReservationsPage() {
  const { toast } = useToast();
  const [reservations, setReservations] = useState<OrderResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [eventFilter, setEventFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentMethodFilter, setPaymentMethodFilter] = useState("all");
  const [selectedReservation, setSelectedReservation] =
    useState<OrderResponse | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [copiedOrderNumber, setCopiedOrderNumber] = useState("");
  const isMobile = useIsMobile();
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);

  const { data: orders, error, isLoading } = useSWR("/api/orders", fetcher);

  useEffect(() => {
    // Filter reservations
    const filteredReservations = (orders as OrderResponse[])?.filter(
      (order: OrderResponse) => {
        const matchesSearch =
          order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          order.contact.email
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          order.contact.phone.includes(searchTerm) ||
          order.orderNumber.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesEvent =
          eventFilter === "all" || order.eventName === eventFilter;
        const matchesStatus =
          statusFilter === "all" || order.status === statusFilter;
        const matchesPaymentMethod =
          paymentMethodFilter === "all" ||
          order.paymentMethod === paymentMethodFilter;

        return (
          matchesSearch && matchesEvent && matchesStatus && matchesPaymentMethod
        );
      }
    );

    setReservations(filteredReservations as OrderResponse[]);
  }, [orders, searchTerm, eventFilter, statusFilter, paymentMethodFilter]);

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case "Visa":
        return <CreditCard className="h-4 w-4" />;
      case "Apple Pay":
        return <Phone className="h-4 w-4" />;
      case "STC Pay":
        return <Phone className="h-4 w-4" />;
      case "Free":
        return <Ticket className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const copyOrderNumber = (orderNumber: string) => {
    navigator.clipboard.writeText(orderNumber);
    setCopiedOrderNumber(orderNumber);
    setTimeout(() => setCopiedOrderNumber(""), 2000);
    toast({
      title: "Copied!",
      description: "Order number copied to clipboard",
      variant: "success",
    });
  };

  const handleViewDetails = (reservation: OrderResponse) => {
    setSelectedReservation(reservation);
    setIsDetailsModalOpen(true);
  };

  const handleCancelReservation = async (reservationId: string) => {
    try {
      await updateDocument("orders", reservationId, {
        status: OrderStatus.CANCELLED,
      });

      // Revalidate SWR data
      await mutate("/api/orders");

      toast({
        title: "Reservation Cancelled",
        description: "The reservation has been cancelled successfully.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to cancel the reservation. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleConfirmPayment = (reservationId: string) => {
    setReservations(
      reservations.map((res) =>
        res.orderNumber === reservationId
          ? { ...res, status: "Confirmed" }
          : res
      )
    );
    toast({
      title: "Payment Confirmed",
      description: "The reservation has been confirmed successfully.",
    });
  };

  const handleResendTicket = async (reservationId: string) => {
    const order: Order = (await getDocumentById(
      "orders",
      reservationId
    )) as Order;

    const event: Event = (await getDocumentById(
      "events",
      order.eventId
    )) as Event;

    if (order && event) {
      await fetch("/api/send-ticket", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: "hadeel-4102@outlook.com", //TODO : replace
          order: order,
          event: event,
        }),
      });
    }

    toast({
      title: "Ticket Resent",
      description: "The ticket has been resent to the customer's email.",
    });
  };

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
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
          <h1 className="text-3xl font-bold">Reservations Management</h1>
          <p className="text-muted-foreground">
            View and manage all event orders and tickets
          </p>
        </div>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-24">
          <Loading />
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center py-24">
          <span>Error loading orders.</span>
        </div>
      )}

      {orders && (
        <div>
          {/* Search and Filters */}
          <div className="flex flex-col lg:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by order number, customer name, email, or phone ..."
                className="w-full pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-2">
              <Select value={eventFilter} onValueChange={setEventFilter}>
                <SelectTrigger className="w-full sm:w-[180px]">
                  <SelectValue placeholder="Event" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Events</SelectItem>
                  {[
                    ...new Set<string>(
                      orders.map((order: OrderResponse) => order.eventName)
                    ),
                  ].map((eventName) => (
                    <SelectItem key={eventName} value={eventName}>
                      {eventName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  {Object.values(OrderStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={paymentMethodFilter}
                onValueChange={setPaymentMethodFilter}
              >
                <SelectTrigger className="w-full sm:w-[140px]">
                  <SelectValue placeholder="Payment" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="Visa">Visa</SelectItem>
                  <SelectItem value="Apple Pay">Apple Pay</SelectItem>
                  <SelectItem value="STC Pay">STC Pay</SelectItem>
                  <SelectItem value="Free">Free</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Reservations Table */}
          <div className="bg-white rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order Number</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Event</TableHead>
                  <TableHead>Tickets</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead className="w-[60px]">Order Date</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations?.map((order: OrderResponse) => (
                  <TableRow
                    key={order.orderNumber}
                    role="row"
                    tabIndex={0}
                    className="cursor-pointer"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(order);
                    }}
                  >
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <div
                          className="relative group"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-3 w-3 text-orangeColor hover:text-orangeColor"
                                onClick={() =>
                                  copyOrderNumber(order.orderNumber)
                                }
                              >
                                {copiedOrderNumber === order.orderNumber ? (
                                  <Check className="h-3 w-3 text-green-500" />
                                ) : (
                                  <Copy className="h-3 w-3" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Copy</p>
                            </TooltipContent>
                          </Tooltip>
                        </div>
                        <span>{order.orderNumber}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {order.customerName}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <div>{order.contact.email}</div>
                        <div>{order.contact.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell className="text-orangeColor">
                      {order.eventName}
                    </TableCell>

                    <TableCell>{order.tickets.length}</TableCell>
                    <TableCell>
                      <Badge className={getOrderStatusBadgeColor(order.status)}>
                        {order.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm">{order.paymentMethod}</span>
                    </TableCell>
                    <TableCell>
                      {order.total} <span className="icon-saudi_riyal" />
                    </TableCell>
                    <TableCell>
                      {formatDate(new Date(order.orderDate))}
                    </TableCell>
                    <TableCell
                      className="text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <span className="sr-only">Open menu</span>
                            <Settings2 className="h-4 w-4 text-orangeColor" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => handleViewDetails(order)}
                          >
                            <Eye className="mr-2 h-4 w-4" />
                            View Details
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={() =>
                              handleResendTicket(order.orderNumber)
                            }
                          >
                            <Mail className="mr-2 h-4 w-4" />
                            Resend Ticket
                          </DropdownMenuItem>
                          {order.status === "Pending" && (
                            <DropdownMenuItem
                              onClick={() =>
                                handleConfirmPayment(order.orderNumber)
                              }
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Confirm Payment
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuSeparator />
                          {order.status !== "Used" &&
                            order.status !== "Canceled" && (
                              <DropdownMenuItem
                                onClick={() =>
                                  handleCancelReservation(order.orderNumber)
                                }
                                className="text-red-600"
                              >
                                <X className="mr-2 h-4 w-4" />
                                Cancel Order
                              </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* No results message */}
          {reservations?.length === 0 && (
            <div className="text-center py-8 bg-white rounded-b-md border-x border-b">
              <Ticket className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">
                No reservations found
              </h3>
              <p className="text-muted-foreground mb-4">
                Try adjusting your search or filter criteria.
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setEventFilter("all");
                  setStatusFilter("all");
                  setPaymentMethodFilter("all");
                }}
              >
                Clear Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ----------- Order Details Dialog ----------- */}
      <Dialog open={isDetailsModalOpen} onOpenChange={setIsDetailsModalOpen}>
        <DialogContent className="bg-stone-100 max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">Order Details</DialogTitle>
            <DialogDescription>
              The complete information for{" "}
              <span className="text-redColor">
                {selectedReservation?.orderNumber}
              </span>
            </DialogDescription>
          </DialogHeader>

          {selectedReservation && (
            <div className="grid gap-6 py-4">
              {/* Customer Information */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-end gap-2">
                    <User className="h-5 w-5" />
                    Customer Information
                  </CardTitle>
                </CardHeader>
                <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Name
                    </Label>
                    <p className="font-medium">
                      {selectedReservation.customerName}
                    </p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Email
                    </Label>
                    <p>{selectedReservation.contact.email}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Phone
                    </Label>
                    <p>{selectedReservation.contact.phone}</p>
                  </div>
                  <div>
                    <Label className="text-sm font-medium text-muted-foreground">
                      Order Number
                    </Label>
                    <div className="flex items-center gap-2">
                      <p className="font-mono">
                        {selectedReservation.orderNumber}
                      </p>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 p-0 text-orangeColor"
                        onClick={() =>
                          copyOrderNumber(selectedReservation.orderNumber)
                        }
                      >
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Event & Order Details */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-end gap-2">
                      <Calendar className="h-5 w-5" />
                      Event Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Event Name
                      </Label>
                      <p className="font-medium">
                        {selectedReservation.eventName}
                      </p>
                    </div>

                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Number of Tickets
                      </Label>
                      <p>{selectedReservation.tickets.length}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Status
                      </Label>
                      <div>
                        <Badge
                          className={getOrderStatusBadgeColor(
                            selectedReservation.status
                          )}
                        >
                          {selectedReservation.status}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-end gap-2">
                      <CreditCard className="h-5 w-5" />
                      Payment Information
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Payment Method
                      </Label>
                      <div className="flex items-center gap-2">
                        {getPaymentMethodIcon(
                          selectedReservation.paymentMethod
                        )}
                        <span>{selectedReservation.paymentMethod}</span>
                      </div>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Total Amount
                      </Label>
                      <p className="text-lg font-bold">
                        {selectedReservation.total}{" "}
                        <span className="icon-saudi_riyal" />
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium text-muted-foreground">
                        Order Date
                      </Label>
                      <p>{formatDate(selectedReservation.orderDate)}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* QR Code */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <QrCode className="h-5 w-5" />
                    Ticket QR Code
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="p-8 bg-muted rounded-lg">
                    <div className="flex items-center justify-center gap-6">
                      {selectedReservation.tickets.map((ticket) => (
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-sm text-muted-foreground">
                            {ticket.id}
                          </span>
                          <div className="w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center mb-4">
                            <Image
                              src={"/images/qr-code.png"}
                              alt="qr code"
                              width={100}
                              height={100}
                            />
                          </div>
                        </div>
                      ))}
                      <p className="font-mono text-sm">
                        {selectedReservation.tickets[0].qrCode}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 pt-4">
                <Button
                  onClick={() =>
                    handleResendTicket(selectedReservation.orderNumber)
                  }
                >
                  <Mail className="mr-2 h-4 w-4" />
                  Resend Ticket
                </Button>
                {selectedReservation.status === "Pending" && (
                  <Button
                    onClick={() =>
                      handleConfirmPayment(selectedReservation.orderNumber)
                    }
                  >
                    <CheckCircle className="mr-2 h-4 w-4" />
                    Confirm Payment
                  </Button>
                )}
                <Button variant="outline" onClick={() => handlePrintOrder()}>
                  <Printer className="mr-2 h-4 w-4" />
                  Print Order
                </Button>
                {selectedReservation.status !== "Used" &&
                  selectedReservation.status !== "Canceled" && (
                    <Button
                      variant="destructive"
                      onClick={() =>
                        handleCancelReservation(selectedReservation.orderNumber)
                      }
                    >
                      <X className="mr-2 h-4 w-4" />
                      Cancel Order
                    </Button>
                  )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
