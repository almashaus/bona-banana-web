"use client";

import type React from "react";
import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { CalendarIcon, User } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { useToast } from "@/src/components/ui/use-toast";
import { useAuth } from "@/src/features/auth/auth-provider";
import { Avatar, AvatarFallback } from "@/src/components/ui/avatar";
import { cn, generateQRCode } from "@/src/lib/utils/utils";
import { Calendar } from "@/src/components/ui/calendar";
import { formatDate } from "@/src/lib/utils/formatDate";
import { getAuth } from "firebase/auth";
import useSWR, { mutate } from "swr";
import { AppUser } from "@/src/models/user";
import { Ticket } from "@/src/models/ticket";
import { getTicketStatusBadgeColor } from "@/src/lib/utils/styles";
import { Badge } from "@/src/components/ui/badge";
import { Event } from "@/src/models/event";
import Loading from "@/src/components/ui/loading";
import Image from "next/image";
import { useAuthStore } from "@/src/lib/stores/useAuthStore";

function Profile() {
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const user = useAuthStore((state) => state.user);
  const setUser = useAuthStore((state) => state.setUser);
  const searchParams = useSearchParams();
  const router = useRouter();
  const { toast } = useToast();
  const [userData, setUserData] = useState<AppUser | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(tabParam || "profile");

  if (!user) {
    router.push(`/login?redirect=${encodeURIComponent("/profile")}`);
    return null;
  }

  interface Response {
    appUser: AppUser;
    tickets: {
      event?: Event;
      date?: Date;
      ticket: Ticket;
    }[];
  }

  const { data, error, isLoading } = useSWR<Response>(
    `/api/profile/${user?.id}`
  );

  useEffect(() => {
    if (data) {
      setUserData(data.appUser);
      setUser(data.appUser);
    }
  }, [data]);

  useEffect(() => {
    if (tabParam && tabParam !== activeTab) {
      setActiveTab(tabParam);
    }
  }, [tabParam]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    const params = new URLSearchParams(window.location.search);
    params.set("tab", value);
    router.replace(`?${params.toString()}`, { scroll: false });
  };

  const handleInputChange = (field: string, value: any) => {
    setUserData((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        [field]: value,
      };
    });
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);
    try {
      const idToken = await authUser.getIdToken();

      const response = await fetch(`/api/profile/${user?.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ id: user?.id, data: userData }),
      });

      setIsUpdating(false);
      if (response.ok) {
        await mutate(`/api/profile/${user?.id}`);
        await mutate("/api/admin/customers");

        toast({
          title: "Profile updated",
          description: "Your profile has been updated successfully",
        });
      }
    } catch (error) {
      toast({
        title: "Failed updating profile",
        description: "",
        variant: "destructive",
      });
    }
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

        <Tabs
          defaultValue="profile"
          className="w-full"
          value={activeTab}
          onValueChange={handleTabChange}
        >
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

              {isLoading && (
                <div className="flex justify-center items-center py-12">
                  <Loading />
                </div>
              )}
              {!isLoading && userData && (
                <form onSubmit={handleUpdateProfile}>
                  <div className="grid gap-4 px-10 py-5">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        value={userData?.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        required
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        type="email"
                        value={userData?.email}
                        onChange={(e) =>
                          handleInputChange("email", e.target.value)
                        }
                        className=" text-muted-foreground"
                        disabled
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="phone">phone</Label>
                      <Input
                        id="phone"
                        type="phone"
                        value={userData?.phone}
                        onChange={(e) =>
                          handleInputChange("phone", e.target.value)
                        }
                      />
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="status">Status</Label>
                        <Select
                          value={userData?.gender}
                          onValueChange={(value) => {
                            handleInputChange("gender", value);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue
                              placeholder={userData?.gender || "Select Gender"}
                            />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Male">
                              <div className="flex items-center">Male</div>
                            </SelectItem>
                            <SelectItem value="Female">
                              <div className="flex items-center">Female</div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="birthDate">Birth Date</Label>

                      <div className="flex flex-col space-y-2">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal bg-white"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {userData?.birthDate ? (
                                formatDate(new Date(userData?.birthDate))
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              captionLayout="dropdown"
                              selected={new Date(userData?.birthDate || "")}
                              onSelect={(day) => {
                                if (day) {
                                  handleInputChange("birthDate", day);
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>
                  </div>
                  <div className="flex justify-center">
                    <Button type="submit" disabled={isUpdating}>
                      {isUpdating ? "Updating..." : "Update Profile"}
                    </Button>
                  </div>
                </form>
              )}
            </div>
          </TabsContent>

          <TabsContent value="tickets">
            <div className="rounded-lg border p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-4">My Tickets</h2>
              <div className="text-center py-3">
                {isLoading && (
                  <div className="flex justify-center items-center py-12">
                    <Loading />
                  </div>
                )}
                {!isLoading && data?.tickets.length === 0 && (
                  <div>
                    <p className="text-muted-foreground mb-4">
                      You don't have any tickets yet.
                    </p>
                    <Button asChild>
                      <Link href="/">Browse Events</Link>
                    </Button>
                  </div>
                )}
                {!isLoading && data?.tickets.length! > 0 && (
                  <div className="bg-white mt-2 rounded-md border">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>ID</TableHead>
                          <TableHead>Event Title</TableHead>
                          <TableHead>Event Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>QR Code</TableHead>
                        </TableRow>
                      </TableHeader>

                      <TableBody>
                        {data?.tickets.map((ticketData) => {
                          return (
                            <TableRow key={ticketData.ticket.id}>
                              <TableCell className="font-medium">
                                {ticketData.ticket.id}
                              </TableCell>
                              <TableCell className="font-medium">
                                {ticketData.event?.title || ""}
                              </TableCell>
                              <TableCell className="font-medium">
                                {formatDate(ticketData.date!)}
                              </TableCell>
                              <TableCell>
                                <Badge
                                  className={`${getTicketStatusBadgeColor(ticketData.ticket.status)}`}
                                >
                                  {ticketData.ticket.status}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex justify-center bg-white p-2 rounded-lg  mb-2 w-20 h-20 md:w-full md:h-full">
                                  <Image
                                    src={
                                      generateQRCode(
                                        ticketData.ticket.token ||
                                          ticketData.ticket.id
                                      ) || "/no-image.svg"
                                    }
                                    alt={"QR code"}
                                    width={80}
                                    height={80}
                                  />
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="settings">
            <div className="rounded-lg border p-6 shadow-sm bg-white">
              <h2 className="text-xl font-semibold mb-4">Account Settings</h2>

              <div className="space-y-6">
                {/* <Separator /> */}

                <div>
                  {/* <h3 className="text-lg font-medium mb-2">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground mb-4">
                    Once you delete your account, there is no going back. Please
                    be certain.
                  </p> */}

                  {/* <Button variant="destructive" onClick={() => logout()}>
                    Log Out
                  </Button> */}
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}
