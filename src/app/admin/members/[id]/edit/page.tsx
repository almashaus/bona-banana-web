"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useToast } from "@/src/components/ui/use-toast";
import useSWR, { mutate } from "swr";
import { MemberStatus, MemberRole, AppUser } from "@/src/models/user";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { getAuth } from "firebase/auth";
import { useAuthStore } from "@/src/lib/stores/useAuthStore";

export default function UserProfilePage() {
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const setUser = useAuthStore((state) => state.setUser);
  const router = useRouter();
  const { toast } = useToast();
  const params = useParams<{ id: string }>();
  const id: string = params?.id!;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    role: "",
    status: "",
  });

  const { data, error, isLoading } = useSWR<AppUser>(
    `/api/admin/members/${id}`
  );

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || "",
        email: data.email || "",
        phone: data.phone || "",
        role: data.dashboard?.role || MemberRole.SUPPORT,
        status: data.dashboard?.status || MemberStatus.ACTIVE,
      });
      setUser(data);
    }
  }, [data]);

  const handleInputChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const appUser = {
        name: formData.name,
        phone: formData.phone,
        dashboard: {
          ...data?.dashboard,
          role: formData.role as MemberRole,
          status: formData.status as MemberStatus,
        },
      };

      const idToken = await authUser.getIdToken();

      const response = await fetch(`/api/admin/members/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id: id, data: appUser }),
      });

      if (response.ok) {
        await mutate("/api/admin/members");
        await mutate("/api/admin/customers");
        await mutate(`/api/profile/${id}`);

        toast({
          title: "✅ Member updated",
          description: "Member details have been successfully updated.",
          variant: "success",
        });

        router.push("/admin/members");
      } else {
        toast({
          title: "⚠️ Error updating member",
          description: "Failed to update member details. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "⚠️ Error updating member",
        description: "Failed to update member details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container py-10">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">Edit Member</h1>
          <p className="text-muted-foreground">Manage member details</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardDescription>Member account details and settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData?.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={formData?.email}
                className="focus-visible:ring-0 text-muted-foreground"
                readOnly
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select
                value={formData.role}
                onValueChange={(value) => handleInputChange("role", value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MemberRole).map((role) => (
                    <SelectItem key={role} value={role}>
                      {role}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData?.phone}
                onChange={(e) => handleInputChange("phone", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => handleInputChange("status", value)}
                required
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.values(MemberStatus).map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
      <div className="flex justify-end gap-4 mt-8">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} onClick={handleSubmit}>
          {isSubmitting ? "Updating Member..." : "Update Member"}
        </Button>
      </div>
    </div>
  );
}
