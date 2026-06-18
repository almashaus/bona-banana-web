"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useTranslations, useLocale } from "next-intl";
import { useCampaignCheckoutStore } from "@/src/lib/stores/useCampaignCheckoutStore";
import useSWR from "swr";
import {
  Swords,
  ArrowLeft,
  CalendarDays,
  Users,
  MapPin,
  Coins,
  User,
  Clock,
  CheckCircle,
  Shield,
  Sparkles,
  ArrowRight,
  Pencil,
  Mail,
  UserMinus,
  RotateCcw,
  Loader2,
} from "lucide-react";
import { getAuth } from "firebase/auth";
import { Button } from "@/src/components/ui/button";
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
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/src/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Label } from "@/src/components/ui/label";
import Loading from "@/src/components/ui/loading";
import { useToast } from "@/src/components/ui/use-toast";
import { formatDate, formatDateTime } from "@/src/lib/utils/formatDate";
import { cn } from "@/src/lib/utils/utils";
import {
  Campaign,
  CampaignPlayer,
  CampaignSession,
  CampaignBooking,
  CampaignStatus,
  BookingStatus,
} from "@/src/models/campaign/campaign";
import { Separator } from "@/src/components/ui/separator";
import { price } from "@/src/lib/utils/locales";

interface CampaignBooker {
  id: string;
  name: string | null;
  email: string | null;
}

interface CampaignDetail extends Campaign {
  players: CampaignPlayer[];
  sessions: CampaignSession[];
  bookings: CampaignBooking[];
  /** Real users behind the bookings, keyed by userId. */
  bookers?: Record<string, CampaignBooker>;
}

export default function CampaignPageClient({
  campaignId,
}: {
  campaignId: string;
}) {
  const router = useRouter();
  const { user } = useAuth();
  const t = useTranslations("DnD");
  const locale = useLocale();
  const { toast } = useToast();

  const { data, isLoading, mutate } = useSWR<CampaignDetail>(
    `/api/campaigns/${campaignId}`,
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30">
        <div className="bg-greenColor">
          <div className="container mx-auto px-4 py-8">
            <div className="h-5 w-32 bg-white/10 animate-pulse rounded mb-4" />
            <div className="h-8 w-64 bg-white/15 animate-pulse rounded mb-2" />
            <div className="h-4 w-48 bg-white/10 animate-pulse rounded" />
          </div>
        </div>
        <div className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-none shadow-sm">
                <CardContent className="p-6 space-y-4">
                  <div className="h-5 w-32 bg-muted animate-pulse rounded" />
                  <div className="space-y-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <div
                        key={i}
                        className="h-14 bg-muted animate-pulse rounded-lg"
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
            <div className="space-y-4">
              <div className="h-40 bg-muted animate-pulse rounded-lg" />
              <div className="h-24 bg-muted animate-pulse rounded-lg" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center text-center px-4">
        <div className="p-4 rounded-full bg-muted mb-4">
          <Swords className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-xl font-bold mb-2">{t("campaignNotFound")}</h2>
        <p className="text-muted-foreground mb-4">
          {t("campaignNotFoundDescription")}
        </p>
        <Button onClick={() => router.push("/dnd")}>
          {t("backToCampaigns")}
        </Button>
      </div>
    );
  }

  const campaign = data;
  const isMaster = user?.id === campaign.masterId;
  const isPublished = campaign.status === CampaignStatus.PUBLISHED;

  if (isMaster) {
    return (
      <MasterView
        campaign={campaign}
        t={t}
        locale={locale}
        router={router}
        toast={toast}
        mutate={mutate}
      />
    );
  }

  return (
    <PlayerView
      campaign={campaign}
      t={t}
      locale={locale}
      router={router}
      user={user}
      toast={toast}
    />
  );
}

// ── Master View ──────────────────────────────────────────────

function MasterView({
  campaign,
  t,
  locale,
  router,
  toast,
  mutate,
}: {
  campaign: CampaignDetail;
  t: (key: string, values?: Record<string, string | number>) => string;
  locale: string;
  router: ReturnType<typeof useRouter>;
  toast: ReturnType<
    typeof import("@/src/components/ui/use-toast").useToast
  >["toast"];
  mutate: () => void;
}) {
  const sessionsCount = campaign.sessions.length;

  // Player slot being withdrawn/restored right now (its id), for spinner state.
  const [pendingPlayerId, setPendingPlayerId] = useState<string | null>(null);

  // Withdraw or restore a player slot. This intentionally does NOT re-submit the
  // campaign for approval and sends no email — see the PATCH handler.
  const handleWithdrawToggle = async (playerId: string, restore: boolean) => {
    const authUser = getAuth().currentUser;
    if (!authUser) {
      toast({ title: t("withdrawFailed"), variant: "destructive" });
      return;
    }
    setPendingPlayerId(playerId);
    try {
      const idToken = await authUser.getIdToken();
      const res = await fetch(`/api/campaigns/${campaign.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          action: restore ? "restorePlayer" : "withdrawPlayer",
          playerId,
        }),
      });
      if (res.ok) {
        toast({
          title: t(restore ? "playerRestored" : "playerWithdrawn"),
          variant: "success",
        });
        mutate();
      } else {
        const err = await res.json().catch(() => null);
        toast({
          title: t("withdrawFailed"),
          description: err?.error,
          variant: "destructive",
        });
      }
    } catch {
      toast({ title: t("withdrawFailed"), variant: "destructive" });
    } finally {
      setPendingPlayerId(null);
    }
  };

  const paidBookingsForSession = (sessionId: string) =>
    campaign.bookings.filter(
      (b) => b.sessionId === sessionId && b.status === BookingStatus.PAID,
    );

  // All PAID bookings for a given player slot, across every session.
  const playerPaidBookings = (playerId: string) =>
    campaign.bookings.filter(
      (b) => b.playerId === playerId && b.status === BookingStatus.PAID,
    );

  // The PAID booking (if any) for a specific player slot in a specific session.
  const bookingFor = (sessionId: string, playerId: string) =>
    campaign.bookings.find(
      (b) =>
        b.sessionId === sessionId &&
        b.playerId === playerId &&
        b.status === BookingStatus.PAID,
    );

  const bookerFor = (userId?: string | null) =>
    userId ? (campaign.bookers?.[userId] ?? null) : null;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-greenColor text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dnd")}
            className="flex items-end text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 mb-3 -ms-2"
          >
            {locale == "en" ? (
              <ArrowLeft className="h-4 w-4 me-2" />
            ) : (
              <ArrowRight className="h-4 w-4 me-2" />
            )}
            {t("backToCampaigns")}
          </Button>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <User className="h-6 w-6 text-orangeColor" />
              <div>
                <h1 className="text-2xl md:text-3xl font-bold">
                  {campaign.title}
                </h1>
                <p className="text-primary-foreground/60 text-sm">
                  Master &mdash; <StatusText status={campaign.status} t={t} />
                </p>
              </div>
            </div>
            <Button
              onClick={() => router.push(`/dnd/${campaign.id}/edit`)}
              className="bg-orangeColor hover:bg-orangeColor/90 text-white shrink-0"
            >
              <Pencil className="h-4 w-4 me-2" />
              {t("editCampaign")}
            </Button>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* Info Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
          <StatCard
            icon={<Coins className="h-4 w-4 text-orangeColor" />}
            label={t("price")}
            value={`${campaign.price} SAR`}
          />
          <StatCard
            icon={<MapPin className="h-4 w-4 text-orangeColor" />}
            label={t("city")}
            value={locale === "ar" ? campaign.city?.ar : campaign.city?.en}
          />
          <StatCard
            icon={<CalendarDays className="h-4 w-4 text-orangeColor" />}
            label={t("sessions")}
            value={String(campaign.sessionsCount)}
          />
          <StatCard
            icon={<Users className="h-4 w-4 text-orangeColor" />}
            label={t("players")}
            value={String(campaign.playersCount)}
          />
        </div>

        {/* Sessions Overview — detailed per-player status */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CalendarDays className="h-4 w-4 text-orangeColor" />
              {t("sessions")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {campaign.sessions.map((session) => {
              const booked = paidBookingsForSession(session.id);
              return (
                <div
                  key={session.id}
                  className="rounded-lg border border-beigeColor/60 overflow-hidden"
                >
                  {/* Session header */}
                  <div className="flex items-center justify-between p-3 bg-beigeColor/30">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orangeColor/15 text-orangeColor text-xs font-bold">
                        {session.sessionNumber}
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {t("sessionNo", { number: session.sessionNumber })}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {session.dateTime
                            ? formatDateTime(new Date(session.dateTime))
                            : "-"}
                        </p>
                      </div>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {booked.length}/{campaign.playersCount}
                    </Badge>
                  </div>

                  {/* Per-player status for this session */}
                  <div className="divide-y divide-border/50 bg-card">
                    {campaign.players.map((player) => {
                      const booking = bookingFor(session.id, player.id);
                      const booker = bookerFor(booking?.userId);
                      return (
                        <div
                          key={player.id}
                          className="flex items-center justify-between gap-2 px-3 py-2"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <User
                              className={cn(
                                "h-3.5 w-3.5 shrink-0",
                                player.withdrawn
                                  ? "text-muted-foreground/40"
                                  : booking
                                    ? "text-green-600"
                                    : "text-muted-foreground/40",
                              )}
                            />
                            <span
                              className={cn(
                                "text-sm font-medium truncate",
                                player.withdrawn &&
                                  "text-muted-foreground line-through",
                              )}
                            >
                              {player.name}
                            </span>
                            {player.withdrawn && (
                              <span className="text-xs text-redColor font-medium shrink-0">
                                ({t("withdrawn")})
                              </span>
                            )}
                          </div>
                          {booking ? (
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                                {booker?.name ||
                                  booker?.email ||
                                  t("unknownPlayer")}
                              </span>
                              <Badge
                                variant="outline"
                                className="text-green-600 border-green-600 text-xs shrink-0"
                              >
                                <CheckCircle className="h-3 w-3 me-1" />
                                {t("booked")}
                              </Badge>
                            </div>
                          ) : (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground shrink-0"
                            >
                              {t("available")}
                            </Badge>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Player Assignments — who is assigned to each player slot */}
        <Card className="border-none shadow-sm">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Users className="h-4 w-4 text-orangeColor" />
              {t("playerAssignments")}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {campaign.players.map((player) => {
              const paid = playerPaidBookings(player.id);
              const bookedCount = new Set(paid.map((b) => b.sessionId)).size;
              const fully = sessionsCount > 0 && bookedCount === sessionsCount;
              const partial = bookedCount > 0 && !fully;
              const withdrawn = !!player.withdrawn;
              const primaryUserId =
                player.assignedUserId ?? paid[0]?.userId ?? null;
              const booker = bookerFor(primaryUserId);
              const pending = pendingPlayerId === player.id;

              return (
                <div
                  key={player.id}
                  className={cn(
                    "p-3 rounded-lg border",
                    withdrawn
                      ? "bg-muted/40 border-border"
                      : fully
                        ? "bg-green-50 border-green-200"
                        : partial
                          ? "bg-orangeColor/5 border-orangeColor/30"
                          : "bg-beigeColor/30 border-beigeColor/60",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={cn(
                          "flex items-center justify-center w-8 h-8 rounded-full shrink-0",
                          withdrawn
                            ? "bg-muted"
                            : fully
                              ? "bg-green-600/15"
                              : partial
                                ? "bg-orangeColor/15"
                                : "bg-greenColor/10",
                        )}
                      >
                        <User
                          className={cn(
                            "h-4 w-4",
                            withdrawn
                              ? "text-muted-foreground/50"
                              : fully
                                ? "text-green-700"
                                : partial
                                  ? "text-orangeColor"
                                  : "text-greenColor",
                          )}
                        />
                      </div>
                      <div className="min-w-0">
                        <span
                          className={cn(
                            "text-sm font-medium block truncate",
                            withdrawn && "text-muted-foreground line-through",
                          )}
                        >
                          {player.name}
                        </span>
                        {withdrawn ? (
                          <span className="text-xs text-muted-foreground block">
                            {t("withdrawnNote")}
                          </span>
                        ) : booker ? (
                          <span className="text-xs text-muted-foreground block truncate">
                            {t("bookedBy")}:{" "}
                            {booker.name || booker.email || t("unknownPlayer")}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground block">
                            {t("noBookingsYet")}
                          </span>
                        )}
                      </div>
                    </div>
                    {withdrawn ? (
                      <Badge
                        variant="outline"
                        className="text-redColor border-redColor text-xs shrink-0"
                      >
                        {t("withdrawn")}
                      </Badge>
                    ) : fully ? (
                      <Badge
                        variant="outline"
                        className="text-green-600 border-green-600 text-xs shrink-0"
                      >
                        <CheckCircle className="h-3 w-3 me-1" /> {t("assigned")}
                      </Badge>
                    ) : partial ? (
                      <Badge
                        variant="outline"
                        className="text-orangeColor border-orangeColor text-xs shrink-0"
                      >
                        {t("partiallyBooked")}
                      </Badge>
                    ) : (
                      <Badge
                        variant="outline"
                        className="text-xs bg-yellowColor/20 text-yellowColor border border-yellowColor shrink-0"
                      >
                        {t("available")}
                      </Badge>
                    )}
                  </div>

                  {bookedCount > 0 && (
                    <div className="mt-2 ms-11 space-y-1">
                      {booker?.name && booker?.email && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                          <Mail className="h-3 w-3 shrink-0" /> {booker.email}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        {t("sessionsBookedOf", {
                          booked: bookedCount,
                          total: sessionsCount,
                        })}
                      </p>
                    </div>
                  )}

                  {/* Withdraw / restore action — no approval, no email */}
                  <div className="mt-3 ms-11">
                    {withdrawn ? (
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={pending}
                        onClick={() => handleWithdrawToggle(player.id, true)}
                        className="h-7 text-xs border-greenColor/40 text-greenColor hover:bg-greenColor/10"
                      >
                        {pending ? (
                          <Loader2 className="h-3 w-3 me-1 animate-spin" />
                        ) : (
                          <RotateCcw className="h-3 w-3 me-1" />
                        )}
                        {t("restorePlayer")}
                      </Button>
                    ) : (
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={pending}
                            className="h-7 text-xs border-redColor/40 text-redColor hover:bg-redColor/10"
                          >
                            {pending ? (
                              <Loader2 className="h-3 w-3 me-1 animate-spin" />
                            ) : (
                              <UserMinus className="h-3 w-3 me-1" />
                            )}
                            {t("withdrawPlayer")}
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>
                              {t("withdrawPlayerTitle")}
                            </AlertDialogTitle>
                            <AlertDialogDescription>
                              {t("withdrawPlayerDescription", {
                                name: player.name,
                              })}
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() =>
                                handleWithdrawToggle(player.id, false)
                              }
                              className="bg-redColor hover:bg-redColor/90 text-white"
                            >
                              {t("withdrawPlayer")}
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// ── Player/Visitor View ──────────────────────────────────────

function PlayerView({
  campaign,
  t,
  locale,
  router,
  user,
  toast,
}: {
  campaign: CampaignDetail;
  t: (key: string, values?: Record<string, string | number>) => string;
  locale: string;
  router: ReturnType<typeof useRouter>;
  user: { id: string; name: string } | null;
  toast: ReturnType<
    typeof import("@/src/components/ui/use-toast").useToast
  >["toast"];
}) {
  const [selectedPlayer, setSelectedPlayer] = useState<string>("");
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const store = useCampaignCheckoutStore();

  // Withdrawn slots are hidden from players/visitors (still visible to the master).
  const enabledPlayers = campaign.players.filter(
    (p) => p.isActive && !p.withdrawn,
  );

  const isPlayerBookedInSession = (sessionId: string, playerId: string) =>
    campaign.bookings.some(
      (b) =>
        b.sessionId === sessionId &&
        b.playerId === playerId &&
        b.status === BookingStatus.PAID,
    );

  // A player is "fully booked" only when every session has a PAID booking for them.
  const isPlayerFullyBooked = (playerId: string) =>
    campaign.sessions.every((s) => isPlayerBookedInSession(s.id, playerId));

  const toggleSession = (sessionId: string) => {
    setSelectedSessions((prev) =>
      prev.includes(sessionId)
        ? prev.filter((id) => id !== sessionId)
        : [...prev, sessionId],
    );
  };

  const handleBookAll = () => {
    if (!selectedPlayer) {
      toast({
        title: t("selectPlayer"),
        variant: "destructive",
      });
      return;
    }

    const allSessionIds = campaign.sessions.map((s) => s.id);

    // Check if player is already booked in any session
    const alreadyBooked = allSessionIds.filter((sid) =>
      isPlayerBookedInSession(sid, selectedPlayer),
    );
    if (alreadyBooked.length > 0) {
      toast({
        title: t("alreadyBooked"),
        description: `${alreadyBooked.length} sessions already booked.`,
        variant: "destructive",
      });
      return;
    }

    store.setCampaign(campaign);
    store.setSelectedPlayer(selectedPlayer);
    store.setBookAll(true, allSessionIds);
    router.push("/dnd/checkout");
  };

  const handleBookSelected = () => {
    if (!selectedPlayer) {
      toast({ title: t("selectPlayer"), variant: "destructive" });
      return;
    }
    if (selectedSessions.length === 0) {
      toast({
        title: "Select at least one session",
        variant: "destructive",
      });
      return;
    }

    store.setCampaign(campaign);
    store.setSelectedPlayer(selectedPlayer);
    // Set sessions individually
    store.setBookAll(false, []);
    selectedSessions.forEach((sid) => store.toggleSession(sid));
    router.push("/dnd/checkout");
  };

  const isPending = campaign.status === CampaignStatus.PENDING;

  // All PAID bookings that belong to the current user
  const myPaidBookings = campaign.bookings.filter(
    (b) => b.userId === user?.id && b.status === BookingStatus.PAID,
  );

  // Group by player — only include players that have at least one paid booking
  const myBookingsByPlayer = enabledPlayers
    .map((player) => {
      const sessions = campaign.sessions
        .filter((s) =>
          myPaidBookings.some(
            (b) => b.playerId === player.id && b.sessionId === s.id,
          ),
        )
        .sort((a, b) => a.sessionNumber - b.sessionNumber);
      return sessions.length > 0 ? { player, sessions } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  const hasConfirmedBookings = myBookingsByPlayer.length > 0;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-greenColor text-primary-foreground">
        <div className="container mx-auto px-4 py-8">
          <Button
            variant="ghost"
            onClick={() => router.push("/dnd")}
            className="flex items-end text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 mb-3 -ms-2"
          >
            {locale == "en" ? (
              <ArrowLeft className="h-4 w-4 me-2" />
            ) : (
              <ArrowRight className="h-4 w-4 me-2" />
            )}
            {t("backToCampaigns")}
          </Button>
          <div className="flex flex-col justify-center items-center md:items-start">
            <h1 className="text-2xl md:text-3xl font-bold">{campaign.title}</h1>
            <div className="flex flex-wrap justify-center items-center gap-3 mt-2 text-primary-foreground/70 text-sm">
              <span className="flex items-center gap-1">
                <Coins className="h-3.5 w-3.5 text-yellowColor" />{" "}
                {price(campaign.price, locale)} / {t("session").toLowerCase()}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-yellowColor" />{" "}
                {locale === "ar" ? campaign.city?.ar : campaign.city?.en}
              </span>
              <span className="flex items-center gap-1">
                <CalendarDays className="h-3.5 w-3.5 text-yellowColor" />{" "}
                {campaign.sessionsCount} {t("sessions")}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3.5 w-3.5 text-yellowColor" />{" "}
                {campaign.playersCount} {t("players")}
              </span>
            </div>
          </div>
        </div>
      </div>

      {isPending && (
        <div className="bg-orangeColor/10 border-b border-orangeColor/20">
          <div className="container mx-auto px-4 py-3 text-center text-sm text-orangeColor font-medium">
            <Clock className="h-4 w-4 inline me-1" />
            {t("pendingApproval")}
          </div>
        </div>
      )}

      <div className="container mx-auto px-4 py-8 max-w-4xl space-y-6">
        {/* ── Confirmed Bookings ─────────────────────────────── */}
        {hasConfirmedBookings && (
          <div className="rounded-xl bg-green-50 border border-green-200 p-5 space-y-4">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-600 shrink-0" />
              <h2 className="font-semibold text-green-800 text-base">
                {t("confirmedBookings")}
              </h2>
            </div>

            <div className="space-y-4">
              {myBookingsByPlayer.map(({ player, sessions }) => (
                <div key={player.id} className="space-y-2">
                  {/* Player name */}
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-green-700 shrink-0" />
                    <span className="font-medium text-green-900 text-sm">
                      {player.name}
                    </span>
                    <Badge className="bg-green-600/15 text-green-700 border-green-300 text-xs font-normal">
                      {sessions.length} {t("sessions")}
                    </Badge>
                  </div>

                  {/* Session rows */}
                  <div className="ms-6 space-y-1.5">
                    {sessions.map((session) => (
                      <div
                        key={session.id}
                        className="flex items-center gap-2 text-sm text-green-800"
                      >
                        <CalendarDays className="h-3.5 w-3.5 text-green-600 shrink-0" />
                        <span className="font-medium">
                          {t("sessionNo", { number: session.sessionNumber })}
                        </span>
                        <span className="text-green-700/70">—</span>
                        <span>
                          {session.dateTime
                            ? formatDateTime(new Date(session.dateTime))
                            : "TBD"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Booking Grid ───────────────────────────────────── */}
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Sessions Tabs + Player Selection */}
          <div className="lg:col-span-3 space-y-6">
            {/* Player Selection */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4 text-orangeColor" />
                  {t("selectPlayer")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  dir={locale == "en" ? "ltr" : "rtl"}
                  value={selectedPlayer}
                  onValueChange={setSelectedPlayer}
                  className="space-y-2"
                >
                  {enabledPlayers.map((player) => {
                    const fullyBooked = isPlayerFullyBooked(player.id);
                    return (
                      <div key={player.id}>
                        <Label
                          htmlFor={player.id}
                          className={cn(
                            "flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-all",
                            selectedPlayer === player.id
                              ? "border-orangeColor bg-orangeColor/5 ring-1 ring-orangeColor/20"
                              : "border-border hover:border-orangeColor/30",
                            fullyBooked && "opacity-50 cursor-not-allowed",
                          )}
                        >
                          <RadioGroupItem
                            value={player.id}
                            id={player.id}
                            disabled={fullyBooked}
                          />

                          <span className="font-medium text-sm flex-1">
                            {player.name}
                          </span>
                          {fullyBooked && (
                            <Badge
                              variant="outline"
                              className="text-xs text-muted-foreground"
                            >
                              {t("alreadyBooked")}
                            </Badge>
                          )}
                        </Label>
                      </div>
                    );
                  })}
                </RadioGroup>
              </CardContent>
            </Card>

            {/* Session Tabs */}
            <Card className="border-none shadow-sm">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <CalendarDays className="h-4 w-4 text-orangeColor" />
                  {t("selectSessions")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  dir={locale == "en" ? "ltr" : "rtl"}
                  defaultValue={campaign.sessions[0]?.id}
                  className="w-full"
                >
                  <TabsList className="w-full flex overflow-x-auto">
                    {campaign.sessions.map((session) => (
                      <TabsTrigger
                        key={session.id}
                        value={session.id}
                        className={cn(
                          "flex-1 min-w-0 text-xs sm:text-sm transition-colors",
                          selectedSessions.includes(session.id) &&
                            "text-green-600 font-semibold data-[state=active]:text-green-600",
                        )}
                      >
                        {t("sessionNo", { number: session.sessionNumber })}
                      </TabsTrigger>
                    ))}
                  </TabsList>

                  {campaign.sessions.map((session) => (
                    <TabsContent
                      dir={locale == "en" ? "ltr" : "rtl"}
                      key={session.id}
                      value={session.id}
                      className="mt-4"
                    >
                      <div className="space-y-3">
                        <div className="flex flex-col items-center justify-between text-sm text-muted-foreground">
                          <span className="text-orangeColor">
                            {t("dateAndTime")}:
                          </span>
                          <span>
                            {session.dateTime
                              ? formatDateTime(new Date(session.dateTime))
                              : "Date TBD"}
                          </span>
                        </div>

                        {/* Player slots in this session */}
                        <div className="space-y-2">
                          {enabledPlayers.map((player) => {
                            const booked = isPlayerBookedInSession(
                              session.id,
                              player.id,
                            );
                            return (
                              <div
                                key={player.id}
                                className={cn(
                                  "flex items-center justify-between p-3 rounded-lg border",
                                  booked
                                    ? "bg-muted/50 border-muted"
                                    : "bg-beigeColor/20 border-beigeColor/40",
                                )}
                              >
                                <div className="flex items-center gap-2">
                                  <User
                                    className={cn(
                                      "h-4 w-4",
                                      booked
                                        ? "text-muted-foreground"
                                        : "text-orangeColor",
                                    )}
                                  />
                                  <span
                                    className={cn(
                                      "text-sm font-medium",
                                      booked && "text-muted-foreground",
                                    )}
                                  >
                                    {player.name}
                                  </span>
                                </div>
                                {booked ? (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-green-600 border-green-600"
                                  >
                                    <CheckCircle className="h-3 w-3 me-1" />
                                    {t("booked")}
                                  </Badge>
                                ) : (
                                  <Badge
                                    variant="outline"
                                    className="text-xs text-orangeColor border-orangeColor"
                                  >
                                    {t("available")}
                                  </Badge>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Book this session button */}
                        {campaign.status === CampaignStatus.PUBLISHED && (
                          <Button
                            variant={
                              selectedSessions.includes(session.id)
                                ? "default"
                                : "outline"
                            }
                            className={cn(
                              "w-full mt-2 transition-all",
                              selectedSessions.includes(session.id)
                                ? "bg-greenColor hover:bg-greenColor/90 text-white"
                                : "border-greenColor/40 hover:border-greenColor/60 hover:text-greenColor",
                            )}
                            onClick={() => toggleSession(session.id)}
                            disabled={
                              !selectedPlayer ||
                              isPlayerBookedInSession(
                                session.id,
                                selectedPlayer,
                              )
                            }
                          >
                            {selectedSessions.includes(session.id) ? (
                              <>
                                <CheckCircle className="h-4 w-4 me-2" />{" "}
                                {t("selected")}
                              </>
                            ) : (
                              t("bookSession")
                            )}
                          </Button>
                        )}
                      </div>
                    </TabsContent>
                  ))}
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Booking Sidebar */}
          <div className="lg:col-span-2 space-y-6">
            {campaign.status === CampaignStatus.PUBLISHED && (
              <>
                {/* Book All Sessions Card */}
                <Card className="flex flex-col justify-center items-center border-orangeColor/30 bg-orangeColor/5 shadow-sm">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex justify-center items-center gap-2">
                      <Sparkles className="h-5 w-5 text-orangeColor" />
                      <span className="font-bold text-sm">
                        {t("bookAllSessions")}
                      </span>
                    </div>
                    <div className="text-center">
                      <Badge className="bg-yellowColor text-white text-sm px-3 py-1">
                        {t("bookAllDiscount")}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {t("discountNote")}
                    </p>
                    <div className="pt-4">
                      <Button
                        className="w-full bg-orangeColor hover:bg-orangeColor/90 text-white"
                        onClick={handleBookAll}
                        disabled={!selectedPlayer}
                      >
                        {t("bookAllSessions")}
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                {/* Price And Payment */}
                <Card className="border-none shadow-sm">
                  <CardContent className="p-5">
                    <div className="space-y-1 mb-2">
                      <p className="text-ms text-muted-foreground">
                        {t("pricePerSession")}
                      </p>
                      <p className="text-xl font-bold text-greenColor">
                        {price(campaign.price, locale)}
                      </p>
                    </div>
                    {/* Book Selected */}
                    {selectedSessions.length > 0 && (
                      <div className="flex flex-col mt-3 space-y-4">
                        <Separator />
                        <div className="font-medium">
                          {t("selectedSessions")}:{" "}
                          <span className="text-orangeColor">
                            {selectedSessions.length}
                          </span>
                        </div>
                        <span className="space-y-1">
                          <p className="text-ms text-muted-foreground">
                            {t("totalPrice")}
                          </p>
                          <p className="text-xl font-bold text-greenColor">
                            {price(
                              campaign.price * selectedSessions.length,
                              locale,
                            )}
                          </p>
                        </span>
                        <Button
                          className="w-full bg-greenColor hover:bg-greenColor/90 text-white"
                          onClick={handleBookSelected}
                        >
                          {t("proceedToPayment")}
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Shared Components ────────────────────────────────────────

function StatusText({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) {
  switch (status) {
    case CampaignStatus.PENDING:
      return <span className="text-orangeColor">{t("pending")}</span>;
    case CampaignStatus.PUBLISHED:
      return <span className="text-green-400">{t("published")}</span>;
    case CampaignStatus.REJECTED:
      return <span className="text-redColor">{t("rejected")}</span>;
    default:
      return <span>{status}</span>;
  }
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Card className="border-none shadow-sm">
      <CardContent className="p-4 flex items-center gap-3">
        {icon}
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <p className="text-sm font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
