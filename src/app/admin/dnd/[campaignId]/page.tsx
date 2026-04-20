"use client";

import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Swords,
  Users,
  CalendarDays,
  MapPin,
  Coins,
  CheckCircle,
  XCircle,
  Clock,
  User,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/src/components/ui/alert-dialog";
import Loading from "@/src/components/ui/loading";
import { useToast } from "@/src/components/ui/use-toast";
import useSWR, { mutate } from "swr";
import { usePermissions } from "@/src/hooks/useMemberPermissions";
import { useAuthStore } from "@/src/lib/stores/useAuthStore";
import AccessDenied from "@/src/components/ui/access-denied";
import { formatDate, formatDateTime } from "@/src/lib/utils/formatDate";
import { getAuth } from "firebase/auth";
import {
  Campaign,
  CampaignPlayer,
  CampaignSession,
  CampaignBooking,
  CampaignStatus,
  BookingStatus,
} from "@/src/models/campaign/campaign";

interface CampaignDetail extends Campaign {
  players: CampaignPlayer[];
  sessions: CampaignSession[];
  bookings: CampaignBooking[];
}

export default function AdminCampaignDetailPage({
  params,
}: {
  params: { campaignId: string };
}) {
  const router = useRouter();
  const { toast } = useToast();
  const authUser = getAuth().currentUser;
  const user = useAuthStore((s) => s.user);
  const { hasPermission } = usePermissions(user);

  const canView = hasPermission("DnD Management", "view");
  const canEdit = hasPermission("DnD Management", "edit");

  const { data, isLoading } = useSWR<CampaignDetail>(
    canView ? `/api/campaigns/${params.campaignId}` : null,
  );

  if (!canView) return <AccessDenied />;
  if (isLoading)
    return (
      <div className="flex justify-center items-center py-20">
        <Loading />
      </div>
    );
  if (!data) {
    return (
      <div className="p-6 text-center text-muted-foreground">
        Campaign not found.
      </div>
    );
  }

  const campaign = data;
  const isPending = campaign.status === CampaignStatus.PENDING;

  const handleAction = async (action: "approve" | "reject") => {
    if (!authUser) return;
    try {
      const idToken = await authUser.getIdToken();
      const res = await fetch(`/api/campaigns/${params.campaignId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ action }),
      });

      if (res.ok) {
        toast({
          title:
            action === "approve" ? "Campaign Approved" : "Campaign Rejected",
          description:
            action === "approve"
              ? "The campaign is now published and visible to players."
              : "The campaign has been rejected.",
          variant: action === "approve" ? "success" : "destructive",
        });
        await mutate(`/api/campaigns/${params.campaignId}`);
        await mutate("/api/campaigns?status=all");
      } else {
        toast({
          title: "Error",
          description: "Failed to update campaign status.",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: "Error",
        description: "Something went wrong.",
        variant: "destructive",
      });
    }
  };

  const paidBookingsForSession = (sessionId: string) =>
    campaign.bookings.filter(
      (b) => b.sessionId === sessionId && b.status === BookingStatus.PAID,
    );

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <Button variant="outline" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Swords className="h-5 w-5 text-orangeColor" />
        <h1 className="text-2xl font-bold mb-1">{campaign.title}</h1>
        <StatusBadge status={campaign.status} />
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Campaign Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Campaign Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid sm:grid-cols-2 gap-4">
                <InfoItem
                  icon={<Coins className="h-4 w-4 text-orangeColor" />}
                  label="Price per Session"
                  value={`${campaign.price} SAR`}
                />
                <InfoItem
                  icon={<MapPin className="h-4 w-4 text-orangeColor" />}
                  label="City"
                  value={campaign.city?.en ?? "-"}
                />
                <InfoItem
                  icon={<CalendarDays className="h-4 w-4 text-orangeColor" />}
                  label="Start Date"
                  value={
                    campaign.startDate
                      ? formatDate(new Date(campaign.startDate))
                      : "-"
                  }
                />
                <InfoItem
                  icon={<Users className="h-4 w-4 text-orangeColor" />}
                  label="Players"
                  value={`${campaign.playersCount} players / ${campaign.sessionsCount} sessions`}
                />
              </dl>
            </CardContent>
          </Card>

          {/* Sessions */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <CalendarDays className="h-4 w-4 text-orangeColor" />
                Sessions ({campaign.sessions.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaign.sessions.map((session) => {
                const booked = paidBookingsForSession(session.id);
                return (
                  <div
                    key={session.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orangeColor/15 text-orangeColor text-xs font-bold">
                        {session.sessionNumber}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          Session {session.sessionNumber}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.dateTime
                            ? formatDateTime(new Date(session.dateTime))
                            : "No date set"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {booked.length}/{campaign.playersCount} booked
                    </Badge>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Players */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <Users className="h-4 w-4 text-orangeColor" />
                Players ({campaign.players.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {campaign.players.map((player) => (
                <div
                  key={player.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                >
                  <div className="flex items-center gap-3">
                    <User className="h-4 w-4 text-greenColor" />
                    <div>
                      <p className="text-sm font-medium">{player.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {player.assignedUserId
                          ? "Assigned user"
                          : "Not yet assigned user"}
                      </p>
                    </div>
                  </div>
                  <Badge
                    variant="outline"
                    className={
                      player.isActive
                        ? "text-green-600 border-green-600"
                        : "text-muted-foreground"
                    }
                  >
                    {player.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        {/* Sidebar: Actions */}
        <div className="space-y-6">
          {isPending && canEdit && (
            <Card className="border-orangeColor/30 bg-orangeColor/5">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Clock className="h-4 w-4 text-orangeColor" />
                  Admin Review
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  This campaign is pending your review. Approve to publish it
                  publicly, or reject it.
                </p>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button className="w-full bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle className="h-4 w-4 me-2" />
                      Approve & Publish
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Approve Campaign?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will publish &quot;{campaign.title}&quot; and make
                        it available for players to book sessions.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleAction("approve")}
                        className="bg-green-600 hover:bg-green-700"
                      >
                        Approve
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>

                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full text-redColor border-redColor hover:bg-redColor/5"
                    >
                      <XCircle className="h-4 w-4 me-2" />
                      Reject
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Reject Campaign?</AlertDialogTitle>
                      <AlertDialogDescription>
                        This will reject &quot;{campaign.title}&quot;. The
                        campaign master will be notified.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => handleAction("reject")}
                        className="bg-redColor hover:bg-redColor/90"
                      >
                        Reject
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </CardContent>
            </Card>
          )}

          {/* Campaign Status Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Status</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <StatusBadge status={campaign.status} />
              {campaign.approvedBy && (
                <p className="text-xs text-muted-foreground">
                  Approved:{" "}
                  {campaign.approvedAt
                    ? formatDateTime(new Date(campaign.approvedAt))
                    : "-"}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Created:{" "}
                {campaign.createdAt
                  ? formatDateTime(new Date(campaign.createdAt))
                  : "-"}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
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

function InfoItem({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2">
      <div className="mt-0.5">{icon}</div>
      <div>
        <dt className="text-xs text-muted-foreground">{label}</dt>
        <dd className="text-sm font-medium">{value}</dd>
      </div>
    </div>
  );
}
