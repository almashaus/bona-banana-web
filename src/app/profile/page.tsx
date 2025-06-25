"use client";

import type React from "react";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { User } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { Separator } from "@/src/components/ui/separator";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { useToast } from "@/src/components/ui/use-toast";
import { useAuth } from "@/src/features/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [isUpdating, setIsUpdating] = useState(false);

  if (!user) {
    router.push(`/login?redirect=${encodeURIComponent("/profile")}`);
    return null;
  }

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    setIsUpdating(false);
    toast({
      title: "Profile updated",
      description: "Your profile has been updated successfully",
    });
  };

  return (
    <div className="container py-10">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Avatar className="h-16 w-16">
            <AvatarFallback className="text-lg">
              <User className="h-8 w-8" />
            </AvatarFallback>
          </Avatar>
          <div>
            <h1 className="text-3xl font-bold">{user?.name}</h1>
            <p className="text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-8">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="tickets">My Tickets</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <div className="rounded-lg border p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-4">
                Personal Information
              </h2>
              <form onSubmit={handleUpdateProfile}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                      Name
                    </Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="email" className="text-right">
                      Email
                    </Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="col-span-3"
                    />
                  </div>
                </div>
                <div className="flex justify-end">
                  <Button type="submit" disabled={isUpdating}>
                    {isUpdating ? "Updating..." : "Update Profile"}
                  </Button>
                </div>
              </form>
            </div>
          </TabsContent>

          <TabsContent value="tickets">
            <div className="rounded-lg border p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-4">My Tickets</h2>
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  You don't have any tickets yet.
                </p>
                <Button asChild>
                  <Link href="/events">Browse Events</Link>
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="rounded-lg border p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-4">Account Settings</h2>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium mb-2">Change Password</h3>
                  <div className="grid gap-4 py-4">
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="current-password" className="text-right">
                        Current Password
                      </Label>
                      <Input
                        id="current-password"
                        type="password"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="new-password" className="text-right">
                        New Password
                      </Label>
                      <Input
                        id="new-password"
                        type="password"
                        className="col-span-3"
                      />
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="confirm-password" className="text-right">
                        Confirm Password
                      </Label>
                      <Input
                        id="confirm-password"
                        type="password"
                        className="col-span-3"
                      />
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <Button>Change Password</Button>
                  </div>
                </div>

                <Separator />

                <div>
                  <h3 className="text-lg font-medium mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p>
                  <Button variant="destructive" onClick={() => logout()}>
                    Log Out
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
