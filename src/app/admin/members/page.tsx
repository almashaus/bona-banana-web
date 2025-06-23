"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Edit,
  Shield,
  UserX,
  Trash2,
  User,
  Upload,
  Settings2,
  PanelLeft,
  UserCheck,
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
import {
  getUsersWithDashboardAccess,
  updateDocument,
} from "@/src/lib/firebase/firestore";
import useSWR, { mutate } from "swr";
import { AppUser, MemberStatus } from "@/src/models/user";
import Loading from "@/src/components/ui/loading";
import { MemberRole } from "@/src/models/user";
import { useMobileSidebar } from "@/src/lib/stores/useMobileSidebar";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { da } from "date-fns/locale";

export default function membersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [members, setMembers] = useState<AppUser[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const isMobile = useIsMobile();
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);

  const { data, error, isLoading } = useSWR<AppUser[]>("members", () =>
    getUsersWithDashboardAccess()
  );

  // Redirect if not admin
  useEffect(() => {
    if (!user?.hasDashboardAccess) {
      router.push("/");
    }
  }, [user, router]);

  if (!user?.hasDashboardAccess) {
    return null;
  }

  // Filter members based on search and filters
  useEffect(() => {
    if (data) {
      const filteredData = data.filter((user) => {
        const matchesSearch =
          user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.email.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesRole =
          roleFilter === "all" || user.dashboard?.role === roleFilter;
        const matchesStatus =
          statusFilter === "all" || user.dashboard?.status === statusFilter;

        return matchesSearch && matchesRole && matchesStatus;
      });
      setMembers(filteredData);
    }
  }, [data, searchTerm, roleFilter, statusFilter]);

  // Handle user suspension/activation
  const handleSuspendUser = async (userId: string) => {
    const dashboard = data?.find((u) => u.id === userId)?.dashboard;

    await updateDocument("users", userId, {
      dashboard: {
        ...dashboard,
        status:
          dashboard?.status === MemberStatus.ACTIVE
            ? MemberStatus.SUSPENDED
            : MemberStatus.ACTIVE,
      },
    });

    // Revalidate SWR data
    await mutate("members");

    const user = data?.find((u) => u.id === userId);
    const action =
      user?.dashboard?.status === MemberStatus.ACTIVE
        ? "suspended"
        : "activated";

    toast({
      title: `User ${action}`,
      description: `${user?.name} has been ${action} successfully.`,
      variant: "success",
    });
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const user = data?.find((u) => u.id === userId);
      setMembers(data!.filter((u) => u.id !== userId));

      await updateDocument("users", userId, {
        hasDashboardAccess: false,
        dashboard: null,
      });

      // Revalidate SWR data
      await mutate("members");

      toast({
        title: "User deleted",
        description: `${user?.name} has been deleted successfully.`,
        variant: "success",
      });
    } catch (error) {
      toast({
        title: "Error deleting user",
        description: "Failed to delete user. Please try again.",
        variant: "destructive",
      });
    }
  };

  const exportMembers = (format: string) => {
    toast({
      title: "Export started",
      description: `Exporting members to ${format.toUpperCase()} format...`,
    });
  };

  return (
    <div className="container py-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
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
          <h1 className="text-3xl font-bold">Team Members Management</h1>
          <p className="text-muted-foreground">
            Manage members, roles, and permissions
          </p>
        </div>
        {user?.dashboard?.role === MemberRole.ADMIN && (
          <Button asChild>
            <Link href="/admin/members/new">
              <Plus className="mr-2 h-4 w-4" />
              Add New Member
            </Link>
          </Button>
        )}
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
            <TableRow className=" bg-muted ">
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
                        <DropdownMenuItem asChild>
                          <Link
                            href={`/admin/members/${member.id}/permissions`}
                          >
                            <Shield className="mr-2 h-4 w-4" />
                            Permissions
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          onClick={() => handleSuspendUser(member.id)}
                          className={
                            member.dashboard?.status === "Active"
                              ? "text-orange-600"
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
                          onClick={() => handleDeleteUser(member.id)}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
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
        <div className="text-center py-8 bg-white">
          <User className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
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
