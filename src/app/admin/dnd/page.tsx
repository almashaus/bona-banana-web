"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Swords,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  Users,
  CalendarDays,
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/src/components/ui/table";
import { Button } from "@/src/components/ui/button";
import { Badge } from "@/src/components/ui/badge";
import Loading from "@/src/components/ui/loading";
import useSWR from "swr";
import { usePermissions } from "@/src/hooks/useMemberPermissions";
import { useAuthStore } from "@/src/lib/stores/useAuthStore";
import AccessDenied from "@/src/components/ui/access-denied";
import { formatDate } from "@/src/lib/utils/formatDate";
import { Campaign, CampaignStatus } from "@/src/models/campaign/campaign";

function getStatusBadge(status: string) {
  switch (status) {
    case CampaignStatus.PENDING:
      return (
        <Badge
          variant="outline"
          className="text-orangeColor border-orangeColor"
        >
          <Clock className="h-3 w-3 me-1" /> Pending
        </Badge>
      );
    case CampaignStatus.PUBLISHED:
      return (
        <Badge variant="outline" className="text-green-600 border-green-600">
          <CheckCircle className="h-3 w-3 me-1" /> Published
        </Badge>
      );
    case CampaignStatus.REJECTED:
      return (
        <Badge variant="outline" className="text-redColor border-redColor">
          <XCircle className="h-3 w-3 me-1" /> Rejected
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

export default function AdminDnDPage() {
  const user = useAuthStore((s) => s.user);
  const { hasPermission } = usePermissions(user);
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const canView = hasPermission("DnD Management", "view");

  const { data, isLoading } = useSWR<{ campaigns: Campaign[] }>(
    canView ? "/api/campaigns?status=all" : null,
  );

  if (!canView) return <AccessDenied />;
  if (isLoading)
    return (
      <div className="flex justify-center items-center py-20">
        <Loading />
      </div>
    );

  const campaigns = data?.campaigns || [];
  const filtered =
    statusFilter === "all"
      ? campaigns
      : campaigns.filter((c) => c.status === statusFilter);

  return (
    <div className="p-4 md:p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Swords className="h-6 w-6 text-orangeColor" />
          <h1 className="text-2xl font-bold">DnD Campaigns</h1>
        </div>
      </div>

      {/* Status Filter */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {[
          { label: "All", value: "all" },
          { label: "Pending", value: CampaignStatus.PENDING },
          { label: "Published", value: CampaignStatus.PUBLISHED },
          { label: "Rejected", value: CampaignStatus.REJECTED },
        ].map((tab) => (
          <Button
            key={tab.value}
            variant={statusFilter === tab.value ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(tab.value)}
          >
            {tab.label}
            {tab.value !== "all" && (
              <span className="ms-1.5 text-xs opacity-60">
                {
                  campaigns.filter((c) =>
                    tab.value === "all" ? true : c.status === tab.value,
                  ).length
                }
              </span>
            )}
          </Button>
        ))}
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <Swords className="h-8 w-8 mx-auto mb-3 opacity-30" />
          <p>No campaigns found.</p>
        </div>
      ) : (
        <div className="rounded-md border bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="hidden md:table-cell">Sessions</TableHead>
                <TableHead className="hidden md:table-cell">Players</TableHead>
                <TableHead className="hidden lg:table-cell">City</TableHead>
                <TableHead className="hidden lg:table-cell">Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((campaign) => (
                <TableRow key={campaign.id}>
                  <TableCell className="font-medium">
                    {campaign.title}
                  </TableCell>
                  <TableCell>{getStatusBadge(campaign.status)}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {campaign.sessionsCount}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {campaign.playersCount}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {campaign.city?.en ?? "-"}
                  </TableCell>
                  <TableCell className="hidden lg:table-cell">
                    {campaign.startDate
                      ? formatDate(new Date(campaign.startDate))
                      : "-"}
                  </TableCell>
                  <TableCell>
                    <Link href={`/admin/dnd/${campaign.id}`}>
                      <Button variant="default" size="sm">
                        <Eye className="h-4 w-4 me-1" /> View
                      </Button>
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
