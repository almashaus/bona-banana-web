"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Edit,
  Shield,
  Key,
  Activity,
  FileText,
  FileEdit,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
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
import { AppUser } from "@/src/models/user";
import {
  FeaturePermission,
  MemberRole,
  MemberStatus,
  RolePermissions,
} from "@/src/types/permissions";
import Link from "next/link";
import { getRoleBadgeColor, getStatusBadgeColor } from "@/src/lib/utils/styles";
import { formatDate, formatDateTime } from "@/src/lib/utils/formatDate";
import { GrayX, GreenCheck } from "@/src/lib/utils/statusIcons";

export default function UserProfilePage() {
  const { user, resetPassword } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [permissions, setPermissions] = useState<FeaturePermission[]>([]);
  const params = useParams<{ id: string }>();
  const id: string = params?.id!;

  const {
    data: member,
    isLoading,
    error,
  } = useSWR<AppUser>(`/api/admin/members/${id}`);

  const {
    data,
    isLoading: loading,
    error: err,
  } = useSWR<RolePermissions>("/api/admin/permissions");

  useEffect(() => {
    const role = member?.dashboard?.role;
    if (data && typeof data === "object") {
      if (role && data[role]) {
        setPermissions(data[role].map((p) => ({ ...p })));
      } else {
        setPermissions([]);
      }
    }
  }, [member]);

  const handleResetPassword = async () => {
    try {
      if (member?.email) {
        await resetPassword(member.email);

        toast({
          title: "Password reset email sent",
          description: `A password reset link has been sent to ${member?.email}`,
          variant: "success",
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

  const handlePermissionChange = (
    featureIndex: number,
    permission: string,
    value: boolean
  ) => {
    const updatedPermissions = [...permissions];
    updatedPermissions[featureIndex] = {
      ...updatedPermissions[featureIndex],
      [permission]: value,
    };
    setPermissions(updatedPermissions);
  };

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Member Profile</h1>
          <p className="text-muted-foreground">
            View and manage member details
          </p>
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
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal Info</TabsTrigger>
          <TabsTrigger value="permissions">Permissions</TabsTrigger>
          <TabsTrigger value="activity">Activity Log</TabsTrigger>
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

              <div className="pt-4 border-t">
                <h2 className="text-lg font-medium mb-6">Settings</h2>
                <div className="flex flex-col lg:flex-row gap-6">
                  <Button asChild>
                    <Link href={`/admin/members/${id}/edit`}>
                      <Edit className="mr-2 h-4 w-4" />
                      Edit Member
                    </Link>
                  </Button>

                  <Button
                    onClick={handleResetPassword}
                    className="flex items-center gap-2"
                  >
                    <Key className="h-4 w-4" />
                    Reset Password
                  </Button>
                </div>
                {/* <p className="text-sm text-muted-foreground mt-2">
                  This will send a password reset email to the user
                </p> */}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Permissions Tab */}
        <TabsContent value="permissions">
          <Card>
            <CardHeader>
              <CardTitle>Permissions</CardTitle>
              <CardDescription>
                View user permissions for different features
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
                          {permission.view ? <GreenCheck /> : <GrayX />}
                        </TableCell>
                        <TableCell className="text-center">
                          {permission.create ? <GreenCheck /> : <GrayX />}
                        </TableCell>
                        <TableCell className="text-center">
                          {permission.edit ? <GreenCheck /> : <GrayX />}
                        </TableCell>
                        <TableCell className="text-center">
                          {permission.delete ? <GreenCheck /> : <GrayX />}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="activity">
          <Card>
            <CardHeader>
              <CardTitle>Activity Log</CardTitle>
              <CardDescription>
                Recent user actions and activities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {member?.dashboard?.activityLog?.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-start gap-4 p-4 border rounded-lg"
                  >
                    <div className="p-2 bg-muted rounded-full">
                      {activity.type === "Event Management" ? (
                        <FileEdit className="h-4 w-4 text-redColor" />
                      ) : (
                        <Activity className="h-4 w-4 text-redColor" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatDateTime(new Date(activity.timestamp))}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
