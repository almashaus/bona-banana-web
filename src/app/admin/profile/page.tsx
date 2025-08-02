"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Activity, Check, X } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/src/components/ui/avatar";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Textarea } from "@/src/components/ui/textarea";
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
import useSWR from "swr";
import { MemberStatus, MemberRole, AppUser } from "@/src/models/user";
import Link from "next/link";
import { getRoleBadgeColor, getStatusBadgeColor } from "@/src/lib/utils/styles";
import { formatDate } from "@/src/lib/utils/formatDate";

// Mock permissions data
const mockPermissions = [
  {
    feature: "Event Management",
    view: true,
    create: true,
    edit: true,
    delete: false,
  },
  {
    feature: "Report Access",
    view: true,
    create: false,
    edit: false,
    delete: false,
  },
  {
    feature: "Send Notifications",
    view: true,
    create: true,
    edit: true,
    delete: false,
  },
  {
    feature: "User Management",
    view: false,
    create: false,
    edit: false,
    delete: false,
  },
  {
    feature: "Financial Reports",
    view: true,
    create: false,
    edit: false,
    delete: false,
  },
];

// Mock activity log
const mockActivityLog = [
  {
    id: "1",
    action: "Created event 'New Event'",
    timestamp: "2024-01-15 14:30",
    type: "event_created",
  },
  {
    id: "2",
    action: "Edited user permissions",
    timestamp: "2024-01-15 10:15",
    type: "user_edited",
  },
  {
    id: "3",
    action: "Sent notification to all users",
    timestamp: "2024-01-14 16:45",
    type: "notification_sent",
  },
  {
    id: "4",
    action: "Generated financial report",
    timestamp: "2024-01-14 09:30",
    type: "report_generated",
  },
];

export default function UserProfilePage() {
  const { user, resetPassword } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState(mockPermissions);
  const [internalNotes, setInternalNotes] = useState("");

  const {
    data: member,
    error,
    isLoading,
  } = useSWR<AppUser>(`/api/admin/members/${user?.id}`);

  const handleResetPassword = async () => {
    try {
      if (member?.email) {
        await resetPassword(member.email);

        toast({
          title: "Password reset email sent",
          description: `A password reset link has been sent to ${member?.email}`,
        });
      } else {
        toast({
          title: "Error",
          description: "Email not found for this user.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to send password reset email. Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="container py-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Member Profile</h1>
          <p className="text-muted-foreground">View and manage details</p>
        </div>
      </div>

      {/* User Header Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20 border">
              <AvatarImage src={member?.profileImage} alt={member?.name} />
              <AvatarFallback className="text-lg">
                {(member?.name || "")
                  .split(" ")
                  .map((n) => n[0])
                  .join("")}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h2 className="text-2xl font-bold">{member?.name}</h2>
              <p className="text-muted-foreground">{member?.email}</p>
              <div className="flex items-center gap-4 mt-2">
                <Badge
                  className={getRoleBadgeColor(
                    member?.dashboard?.role as MemberRole
                  )}
                >
                  {member?.dashboard?.role}
                </Badge>
                <Badge
                  className={getStatusBadgeColor(
                    member?.dashboard?.status as MemberStatus
                  )}
                >
                  {member?.dashboard?.status}
                </Badge>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
          <TabsTrigger value="notes">Internal Notes</TabsTrigger>
        </TabsList>

        {/* Personal Info Tab */}
        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
              <CardDescription>
                Member account details and settings
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={member?.name}
                    className="focus-visible:ring-0"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={member?.email}
                    className="focus-visible:ring-0"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Input
                    id="role"
                    value={member?.dashboard?.role}
                    className="focus-visible:ring-0"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={member?.phone}
                    className="focus-visible:ring-0"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status</Label>
                  <Input
                    id="status"
                    value={member?.dashboard?.status}
                    className="focus-visible:ring-0"
                    readOnly
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="joined">Joined Date</Label>
                  <Input
                    id="joined"
                    value={
                      member?.dashboard?.joinedDate
                        ? formatDate(member?.dashboard?.joinedDate!)
                        : ""
                    }
                    className="focus-visible:ring-0"
                    readOnly
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TODO: Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>
                Permissions Management{" "}
                <span className="text-red-500 text-sm font-light">
                  *In progress*
                </span>
              </CardTitle>
              <CardDescription>
                Manage user permissions for different features
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Feature</TableHead>
                      <TableHead className="text-center">View</TableHead>
                      <TableHead className="text-center">Create</TableHead>
                      <TableHead className="text-center">Edit</TableHead>
                      <TableHead className="text-center">Delete</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {permissions.map((permission, index) => (
                      <TableRow key={permission.feature}>
                        <TableCell className="font-medium">
                          {permission.feature}
                        </TableCell>
                        <TableCell className="text-center">
                          {permission.view ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-gray-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {permission.create ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-gray-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {permission.edit ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-gray-500" />
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          {permission.delete ? (
                            <Check className="h-5 w-5 text-green-500" />
                          ) : (
                            <X className="h-5 w-5 text-gray-500" />
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TODO: Activity Log Tab */}
        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>
                Activity Log
                <span className="text-red-500 text-sm font-light">
                  *In progress*
                </span>
              </CardTitle>
              <CardDescription>
                Recent user actions and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {mockActivityLog.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="p-2 bg-muted rounded-full">
                      <Activity className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {activity.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* TODO: Internal Notes Tab */}
        <TabsContent value="notes">
          <Card>
            <CardHeader>
              <CardTitle>
                Internal Notes
                <span className="text-red-500 text-sm font-light">
                  *In progress*
                </span>
              </CardTitle>
              <CardDescription>
                Private notes visible only to administrators
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Add internal notes about this user..."
                value={internalNotes}
                onChange={(e) => setInternalNotes(e.target.value)}
                rows={10}
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
