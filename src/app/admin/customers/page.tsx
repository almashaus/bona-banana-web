"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, PanelLeft, CircleAlertIcon } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Badge } from "@/src/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useToast } from "@/src/components/ui/use-toast";
import { getTicketStatusBadgeColor } from "@/src/lib/utils/styles";
import useSWR from "swr";
import { CustomerResponse } from "@/src/models/user";
import Loading from "@/src/components/ui/loading";
import { useMobileSidebar } from "@/src/lib/stores/useMobileSidebar";
import { useIsMobile } from "@/src/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/src/components/ui/dialog";
import { getAuth } from "firebase/auth";

export default function customersPage() {
  const { user } = useAuth();
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const router = useRouter();
  const { toast } = useToast();
  const [customers, setCustomers] = useState<CustomerResponse[]>([]);
  const [searchTerm, setSearchTerm] = useState("");

  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerResponse | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const isMobile = useIsMobile();
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);

  interface Response {
    customers: CustomerResponse[];
  }

  const { data, error, isLoading } = useSWR<Response>("/api/admin/customers");

  useEffect(() => {
    if (data) {
      const filteredData = data.customers.filter((customer) => {
        const matchesSearch =
          customer.user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.user.email.toLowerCase().includes(searchTerm.toLowerCase());

        return matchesSearch;
      });
      setCustomers(filteredData);
    }
  }, [data, searchTerm]);

  const handleViewDetails = (customer: CustomerResponse) => {
    setSelectedCustomer(customer);
    setIsDialogOpen(true);
  };

  return (
    <div className="container py-6">
      {/* Page Header */}
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
          <h1 className="text-3xl font-bold">Customers Management</h1>
          <p className="text-muted-foreground">Manage customers</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search by name or email..."
            className="w-full pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {/* members Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[10px]"></TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone Number</TableHead>
              <TableHead>Birth Date</TableHead>
              <TableHead>Gender</TableHead>
              <TableHead>Tickets</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {customers?.map((customer) => (
              <TableRow key={customer.user.id} role="row">
                {/* avatar */}
                <TableCell>
                  <div className="flex justify-center">
                    <Avatar className="h-8 w-8 bg-stone-200">
                      <AvatarImage
                        src={customer.user.profileImage}
                        alt={customer.user.name}
                      />
                      <AvatarFallback>
                        {customer.user.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TableCell>
                {/* name */}
                <TableCell className="font-medium">
                  {customer.user.name}
                </TableCell>
                <TableCell>{customer.user.email}</TableCell>
                {/* role */}
                <TableCell>{customer.user.phone}</TableCell>
                {/* status */}
                <TableCell>{customer.user.birthDate}</TableCell>
                {/* events managed */}
                <TableCell>{customer.user.gender}</TableCell>
                {/* actions */}
                <TableCell
                  onClick={(e) => e.stopPropagation()}
                  style={{ minWidth: 120 }}
                >
                  <Button
                    variant="ghost"
                    size="sm"
                    className={`${customer.tickets.length === 0 ? "bg-stone-200" : "bg-orangeColor"}`}
                    onClick={() => handleViewDetails(customer)}
                  >
                    {customer.tickets.length}
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {isLoading && (
        <div className="flex justify-center items-center py-12 border rounded-b-lg bg-white">
          <Loading />
        </div>
      )}

      {/* No results message */}
      {customers.length === 0 && !isLoading && (
        <div className="text-center py-8 bg-white rounded-b-md border-x border-b">
          <CircleAlertIcon
            strokeWidth={1.25}
            className="mx-auto h-12 w-12 text-muted-foreground mb-4"
          />
          <h3 className="text-lg font-semibold mb-2">No customers found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or clear filters.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}

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
            {selectedCustomer?.tickets.length === 0 ? (
              <p className="text-center p-6">No tickets</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>QR Code</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>

                <TableBody>
                  {selectedCustomer?.tickets.map((ticket) => {
                    return (
                      <TableRow key={ticket.id}>
                        <TableCell className="font-medium">
                          {ticket.id}
                        </TableCell>
                        <TableCell>
                          <div className="bg-white p-2 rounded-lg inline-block mb-2">
                            <img
                              src="/images/qr-code.png"
                              alt="QR Code"
                              className="w-20 h-20"
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
