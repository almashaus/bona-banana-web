"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Edit,
  UserX,
  Trash2,
  Upload,
  Settings2,
  PanelLeft,
  UserCheck,
  UserPlus,
  UserPen,
  CircleAlertIcon,
} from "lucide-react";
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
import { useAuth } from "@/src/features/auth/auth-provider";
import { useToast } from "@/src/components/ui/use-toast";
import { getRoleBadgeColor, getStatusBadgeColor } from "@/src/lib/utils/styles";
import useSWR, { mutate } from "swr";
import { AppUser, MemberStatus } from "@/src/models/user";
import Loading from "@/src/components/ui/loading";
import { MemberRole } from "@/src/models/user";
import { useMobileSidebar } from "@/src/lib/stores/useMobileSidebar";
import { useIsMobile } from "@/src/hooks/use-mobile";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from "@/src/components/ui/dialog";
import { getAuth } from "firebase/auth";

export default function membersPage() {
  const { user } = useAuth();
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const router = useRouter();
  const { toast } = useToast();
  const [members, setMembers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [users, setUsers] = useState<AppUser[]>([]);
  const [email, setEmail] = useState("");
  const [convertDialogOpen, setConvertDialogOpen] = useState(false);
  const [isConverting, setIsConverting] = useState(false);
  const isMobile = useIsMobile();
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);

  interface Response {
    members: AppUser[];
    users: AppUser[];
  }

  const { data, error, isLoading } = useSWR<Response>("/api/admin/members");

  // Filter members based on search and filters
  useEffect(() => {
    if (data) {
      const filteredData = data.members.filter((member) => {
        const matchesSearch =
          member.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          member.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole =
          roleFilter === "all" || member.dashboard?.role === roleFilter;
        const matchesStatus =
          statusFilter === "all" || member.dashboard?.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
      });
      setMembers(filteredData);

      const filteredUsers = data.users.filter(
        (user) => !user.hasDashboardAccess
      );
      setUsers(filteredUsers as AppUser[]);
    }
  }, [data, searchTerm, roleFilter, statusFilter]);

  // Handle user suspension/activation
  const handleSuspendUser = async (userId: string) => {
    const dashboard = data?.members?.find((u) => u.id === userId)?.dashboard;

    const idToken = await authUser.getIdToken();

    const response = await fetch("/api/admin/members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${idToken}`,
      },
      body: JSON.stringify({
        id: userId,
        data: {
          dashboard: {
            ...dashboard,
            status:
              dashboard?.status === MemberStatus.ACTIVE
                ? MemberStatus.SUSPENDED
                : MemberStatus.ACTIVE,
          },
        },
      }),
    });

    if (response.ok) {
      await mutate("/api/admin/members");

      const user = data?.members.find((u) => u.id === userId);
      const action =
        user?.dashboard?.status === MemberStatus.ACTIVE
          ? "suspended"
          : "activated";

      toast({
        title: `User ${action}`,
        description: `${user?.name} has been ${action} successfully.`,
        variant: "success",
      });
    }
  };

  // Handle user removing
  const handleRemoveUser = async (userId: string) => {
    try {
      const user = data?.members.find((u) => u.id === userId);
      setMembers(data!.members.filter((u) => u.id !== userId));

      const idToken = await authUser.getIdToken();

      const response = await fetch("/api/admin/members", {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          id: userId,
          data: {
            hasDashboardAccess: false,
            dashboard: null,
          },
        }),
      });

      if (response.ok) {
        await mutate("/api/admin/members");

        toast({
          title: "User removed",
          description: `${user?.name} has been removed successfully.`,
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error removing user",
        description: "Failed to remove user. Please try again.",
        variant: "destructive",
      });
    }
  };

  // handle user coverting
  const handleConvertUserToMember = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsConverting(true);
      const user = users?.find((u) => u.email === email);

      const idToken = await authUser.getIdToken();

      const response = await fetch("/api/admin/members/new", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          id: user?.id!,
          data: { hasDashboardAccess: true },
        }),
      });

      //wait for the user to be updated in Firestore
      await new Promise((resolve) => setTimeout(resolve, 3000));
      if (response.ok) {
        setConvertDialogOpen(false);
        // Revalidate SWR data
        await mutate("/api/admin/members");
        setEmail("");

        toast({
          title: "User Converted",
          description: `${user?.name} has been converted successfully.`,
          variant: "success",
        });
      }
    } catch (error) {
      toast({
        title: "Error converting user",
        description: "Failed to convert user. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsConverting(false);
    }
  };

  const exportMembers = (format: string) => {
    // toast({
    //   title: "Export started",
    //   description: `Exporting members to ${format.toUpperCase()} format...`,
    // });
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
          <h1 className="text-3xl font-bold">Team Members Management</h1>
          <p className="text-muted-foreground">
            Manage members, roles, and permissions
          </p>
        </div>
        {user?.dashboard?.role === MemberRole.ADMIN && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add New Member
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link href="/admin/members/new">
                  <UserPlus className="mr-2 h-4 w-4" />
                  Create new account
                </Link>
              </DropdownMenuItem>
              {/* Convert user to member dialog trigger */}
              <DropdownMenuItem onClick={() => setConvertDialogOpen(true)}>
                <UserPen className="mr-2 h-4 w-4" />
                Convert user to member
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* Convert User to Member Dialog */}
      <Dialog open={convertDialogOpen} onOpenChange={setConvertDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Convert User to Member</DialogTitle>
            <DialogDescription>
              Select a user to grant dashboard access.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col gap-4 my-4">
            {users && users.length > 0 && !isLoading && (
              <Select value={email} onValueChange={setEmail}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Emails" />
                </SelectTrigger>
                <SelectContent>
                  {users.map((user) => (
                    <SelectItem key={user.id} value={user.email}>
                      {user.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
          <DialogFooter>
            <Button onClick={handleConvertUserToMember} disabled={isConverting}>
              {isConverting ? "Converting..." : "Convert"}
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

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

        <div className="flex flex-col sm:flex-row gap-2">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-full sm:w-[140px]">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {Object.values(MemberRole).map((role) => (
                <SelectItem key={role} value={role}>
                  {role}
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
              {Object.values(MemberStatus).map((status) => (
                <SelectItem key={status} value={status}>
                  {status}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="flex items-center gap-2">
                <Upload className="h-4 w-4" />
                Export
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem onClick={() => exportMembers("excel")}>
                Export to Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportMembers("pdf")}>
                Export to PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* members Table */}
      <div className="rounded-lg border bg-white">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[10px]"></TableHead>
              <TableHead>User</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Events Managed</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {members?.map((member) => (
              <TableRow
                key={member.id}
                role="row"
                tabIndex={0}
                className={`${
                  user?.dashboard?.role === MemberRole.ADMIN && "cursor-pointer"
                }`}
                onClick={(e) => {
                  if (user?.dashboard?.role === MemberRole.ADMIN) {
                    e.stopPropagation();
                    router.push(`/admin/members/${member.id}`);
                  }
                }}
              >
                {/* avatar */}
                <TableCell>
                  <div className="flex justify-center">
                    <Avatar className="h-8 w-8 bg-stone-200">
                      <AvatarImage
                        src={member.profileImage}
                        alt={member.name}
                      />
                      <AvatarFallback>
                        {member.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                </TableCell>
                {/* name */}
                <TableCell className="font-medium">{member.name}</TableCell>
                <TableCell>{member.email}</TableCell>
                {/* role */}
                <TableCell>
                  <Badge className={getRoleBadgeColor(member.dashboard!.role)}>
                    {member.dashboard?.role}
                  </Badge>
                </TableCell>
                {/* status */}
                <TableCell>
                  <Badge
                    className={getStatusBadgeColor(member.dashboard!.status)}
                  >
                    {member.dashboard?.status}
                  </Badge>
                </TableCell>
                {/* events managed */}
                <TableCell>{member.dashboard?.eventsManaged}</TableCell>
                {/* actions */}
                <TableCell
                  onClick={(e) => e.stopPropagation()}
                  style={{ minWidth: 120 }}
                >
                  {user?.dashboard?.role === MemberRole.ADMIN && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <Settings2 className="h-4 w-4 text-orangeColor" />
                        </Button>
                      </DropdownMenuTrigger>

                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/admin/members/${member.id}`}>
                            <Eye className="mr-2 h-4 w-4" />
                            View Profile
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuItem asChild>
                          <Link href={`/admin/members/${member.id}/edit`}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Member
                          </Link>
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleSuspendUser(member.id)}
                          className={
                            member.dashboard?.status === "Active"
                              ? "text-orange-500"
                              : "text-green-600"
                          }
                        >
                          {member.dashboard?.status === "Active" ? (
                            <>
                              <UserX className="mr-2 h-4 w-4" /> Suspend
                            </>
                          ) : (
                            <>
                              <UserCheck className="mr-2 h-4 w-4" /> Activate
                            </>
                          )}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleRemoveUser(member.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Remove
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
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
      {members?.length === 0 && !isLoading && (
        <div className="text-center py-8 bg-white rounded-b-md border-x border-b">
          <CircleAlertIcon
            strokeWidth={1.25}
            className="mx-auto h-12 w-12 text-muted-foreground mb-4"
          />
          <h3 className="text-lg font-semibold mb-2">No members found</h3>
          <p className="text-muted-foreground mb-4">
            Try adjusting your search or filter criteria.
          </p>
          <Button
            variant="outline"
            onClick={() => {
              setSearchTerm("");
              setRoleFilter("all");
              setStatusFilter("all");
            }}
          >
            Clear Filters
          </Button>
        </div>
      )}
    </div>
  );
}
