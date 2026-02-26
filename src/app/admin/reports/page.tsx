"use client";

import { useEffect } from "react";
import { Users, DollarSign, MapPin, Upload, Ticket } from "lucide-react";
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
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/src/components/ui/chart";
import {
  Line,
  LineChart,
  Bar,
  BarChart,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import useSWR from "swr";
import { ReportsData } from "../../api/admin/reports/route";
import RevenueTable from "./components/revenueTable";
import AttendanceTable from "./components/attendanceTable";
import { usePermissions } from "@/src/hooks/useMemberPermissions";
import { useAuth } from "@/src/features/auth/auth-provider";
import AccessDenied from "@/src/components/ui/access-denied";

export default function ReportsPage() {
  const { user } = useAuth();
  const { data, error, isLoading } = useSWR<ReportsData>("/api/admin/reports");

  const handleExport = (format: "excel" | "pdf") => {
    // In a real app, this would trigger an export
    alert(`Exporting report as ${format.toUpperCase()}...`);
  };

  const { hasPermission } = usePermissions(user);
  const canViewReports: boolean = hasPermission("Reports", "view");

  if (!canViewReports) {
    return <AccessDenied />;
  }

  return (
    <div className="p-4 md:p-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold">Reports Dashboard</h1>
          <p className="text-muted-foreground mt-1">
            Complete data-driven overview of system performance
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => handleExport("pdf")}>
            <Upload className="mr-2 h-4 w-4" />
            Export PDF
          </Button>
        </div>
      </div>

      {/* ---------------------------------------- */}
      {/* Summary KPIs */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <DollarSign className="h-5 w-5 text-orangeColor" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.totalRevenue}
              <span className="icon-saudi_riyal text-md font-light" />
            </div>
            {/* <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+12.5%</span> from last period
            </p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tickets</CardTitle>
            <Ticket className="h-5 w-5 text-orangeColor" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.totalTickets.toLocaleString()}
            </div>
            {/* <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+8.2%</span> from last period
            </p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total Attendees
            </CardTitle>
            <Users className="h-5 w-5 text-orangeColor" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.totalAttendees.toLocaleString()}
            </div>
            {/* <p className="text-xs text-muted-foreground mt-1">
              <span className="text-green-600">+15.3%</span> from last period
            </p> */}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Top City</CardTitle>
            <MapPin className="h-5 w-5 text-orangeColor" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {data?.summary.topCity.name}
            </div>
            {/* <p className="text-xs text-muted-foreground mt-1">
              {revenueByCityData[0].revenue}
              <span className="icon-saudi_riyal text-md font-light" /> revenue
            </p> */}
          </CardContent>
        </Card>
      </div>

      {/* Tabs for Visual Analytics and Detailed Reports */}
      <Tabs defaultValue="visual" className="space-y-6">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="visual">Visual Analytics</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Report</TabsTrigger>
          <TabsTrigger value="attendance">Attendance Report</TabsTrigger>
        </TabsList>

        {/* ---------------------------------------- */}

        {/* Visual Analytics Tab */}
        <TabsContent value="visual" className="space-y-6">
          {/* Revenue Over Time */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue Over Time</CardTitle>
              <CardDescription>{/* TODO: description */}</CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "hsl(var(--chart-2))",
                  },
                }}
                className="md:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data?.charts.revenueOverTime}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis width={50} />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--chart-2))"
                      strokeWidth={2}
                      dot={{
                        fill: "hsl(var(--chart-1))",
                        stroke: "hsl(var(--chart-1))",
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>

          <div className="space-y-6 xl:space-y-0 xl:grid xl:gap-6 xl:grid-cols-2">
            {/* Orders by Event */}
            <Card>
              <CardHeader>
                <CardTitle>Orders by Event</CardTitle>
                <CardDescription>
                  Total orders across all events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    orders: {
                      label: "Orders",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="md:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.charts.ordersByEvent}
                      layout="vertical"
                    >
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis type="number" allowDecimals={false} />
                      <YAxis dataKey="eventName" type="category" width={100} />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <Bar
                        dataKey="orders"
                        fill="hsl(var(--chart-2))"
                        barSize={50}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>

            {/* Attendance Ratio */}
            <Card>
              <CardHeader>
                <CardTitle>Attendance Ratio</CardTitle>
                <CardDescription>
                  Tickets sold number:{" "}
                  {
                    data?.charts.attendanceRatio.find(
                      (item) => item.name === "ticketsSold",
                    )?.value
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartContainer
                  config={{
                    used: {
                      label: "Used Tickets",
                      color: "hsl(var(--chart-1))",
                    },
                    unused: {
                      label: "Unused Tickets",
                      color: "hsl(var(--chart-2))",
                    },
                  }}
                  className="md:h-[300px]"
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.charts.attendanceRatio.slice(0, 2)}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name }) => `${name}`}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {data?.charts.attendanceRatio.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <ChartTooltip content={<ChartTooltipContent />} />
                    </PieChart>
                  </ResponsiveContainer>
                </ChartContainer>
              </CardContent>
            </Card>
          </div>

          {/* Revenue by City */}
          <Card>
            <CardHeader>
              <CardTitle>Revenue by City</CardTitle>
              <CardDescription>
                Cities generating the most revenue
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ChartContainer
                config={{
                  revenue: {
                    label: "Revenue",
                    color: "hsl(var(--chart-3))",
                  },
                }}
                className="md:h-[300px]"
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={data?.charts.revenueByCity}
                    layout="horizontal"
                  >
                    <CartesianGrid strokeDasharray="3 3" />

                    <XAxis dataKey="city" type="category" />
                    <YAxis type="number" />
                    <ChartTooltip content={<ChartTooltipContent />} />
                    <Bar
                      dataKey="revenue"
                      fill="hsl(var(--chart-1))"
                      barSize={50}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </ChartContainer>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ---------------------------------------- */}

        {/* Detailed Reports Tab */}
        <TabsContent value="revenue" className="space-y-6">
          <RevenueTable />
        </TabsContent>

        {/* ---------------------------------------- */}
        <TabsContent value="attendance" className="space-y-6">
          <AttendanceTable />
        </TabsContent>
      </Tabs>
    </div>
  );
}
