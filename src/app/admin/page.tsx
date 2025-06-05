"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Plus, Ticket, Users } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { useAuth } from "@/src/features/auth/auth-provider";
import { getEvents } from "@/src/lib/firebase/firestore";
import { useToast } from "@/src/components/ui/use-toast";
import UsersPage from "./users/page";
import Events from "./events/page";
import useSWR from "swr";
import { PanelLeft } from "lucide-react";
import { useIsMobile } from "@/src/hooks/use-mobile";
import { useMobileSidebar } from "@/src/lib/stores/useMobileSidebar";

export default function AdminPage() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const setMobileOpen = useMobileSidebar((state) => state.setMobileOpen);

  const { data, error, isLoading } = useSWR("events", () => getEvents());

  useEffect(() => {
    if (!user?.isAdmin) {
      router.push("/");
    }
  }, [user, router]);

  if (!user?.isAdmin) {
    return null;
  }

  return (
    <div className="container py-10">
      <div className="flex justify-start items-center mb-6">
        {isMobile && (
          <Button
            variant="ghost"
            size="icon"
            className="flex items-center p-2 rounded-lg text-neutral-400 dark:text-white"
            onClick={() => setMobileOpen(true)}
            aria-label="Open sidebar"
          >
            <PanelLeft />
          </Button>
        )}
        <h1 className="text-3xl font-bold">Dashboard</h1>
      </div>

      <div className="grid gap-6 md:grid-cols-3 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Events</CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "..." : data?.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">+2 from last month</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ticket Sales</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">+573</div>
            <p className="text-xs text-muted-foreground">
              +201 from last month
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              className="h-4 w-4 text-muted-foreground"
            >
              <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
            </svg>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              <span className="icon-saudi_riyal" />
              {45231.89}
            </div>
            <p className="text-xs text-muted-foreground">
              +20.1% from last month
            </p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="events">
        <TabsList className="grid w-full grid-cols-3 mb-8">
          <TabsTrigger value="events">Events</TabsTrigger>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="users">Users</TabsTrigger>
        </TabsList>

        <TabsContent value="events">
          <Card>
            <CardHeader>
              <CardTitle>Events Management</CardTitle>
              <CardDescription>
                Manage your events, edit details, or remove events.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <Events />
              <div className="flex justify-center ">
                <Button asChild>
                  <Link href="/admin/events">View All Events</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="tickets">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Sales</CardTitle>
              <CardDescription>
                View and manage ticket sales for all events.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8">
                <p className="text-muted-foreground">
                  No recent ticket sales to display.
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="users">
          <Card>
            <CardContent>
              <UsersPage />
              <div className="flex justify-center ">
                <Button asChild>
                  <Link href="/admin/users">View All Users</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
