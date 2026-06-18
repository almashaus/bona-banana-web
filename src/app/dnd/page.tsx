"use client";

import Link from "next/link";
import Image from "next/image";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useTranslations, useLocale } from "next-intl";
import useSWR from "swr";
import {
  Swords,
  Plus,
  CalendarDays,
  Users,
  MapPin,
  Crown,
  Shield,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
  type LucideIcon,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { formatDate } from "@/src/lib/utils/formatDate";
import { Campaign, CampaignStatus } from "@/src/models/campaign/campaign";
import { Skeleton } from "@/src/components/ui/skeleton";

interface CampaignWithSubs extends Campaign {
  players: {
    id: string;
    name: string;
    isActive: boolean;
    assignedUserId?: string;
  }[];
  sessions: { id: string; sessionNumber: number; dateTime: string }[];
}

function StatusBadge({
  status,
  t,
}: {
  status: string;
  t: (key: string) => string;
}) {
  switch (status) {
    case CampaignStatus.PENDING:
      return (
        <Badge
          variant="outline"
          className="text-orangeColor border-orangeColor text-xs"
        >
          <Clock className="h-3 w-3 me-1" /> {t("pending")}
        </Badge>
      );
    case CampaignStatus.PUBLISHED:
      return (
        <Badge
          variant="outline"
          className="text-green-600 border-green-600 text-xs"
        >
          <CheckCircle className="h-3 w-3 me-1" /> {t("published")}
        </Badge>
      );
    case CampaignStatus.REJECTED:
      return (
        <Badge
          variant="outline"
          className="text-redColor border-redColor text-xs"
        >
          <XCircle className="h-3 w-3 me-1" /> {t("rejected")}
        </Badge>
      );
    default:
      return null;
  }
}

function CampaignCardSkeleton() {
  return (
    <Card className="border-none shadow-sm h-full">
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-md bg-muted animate-pulse" />
            <div className="h-5 w-32 bg-muted animate-pulse rounded" />
          </div>
          <div className="h-5 w-20 bg-muted animate-pulse rounded-full" />
        </div>
        <div className="space-y-2">
          <div className="h-4 w-40 bg-muted animate-pulse rounded" />
          <div className="h-4 w-28 bg-muted animate-pulse rounded" />
          <div className="h-4 w-36 bg-muted animate-pulse rounded" />
        </div>
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <div className="h-5 w-16 bg-muted animate-pulse rounded" />
          <div className="h-4 w-12 bg-muted animate-pulse rounded" />
        </div>
      </CardContent>
    </Card>
  );
}

type CardVariant = "owned" | "joined";

/**
 * Role-based theming so the two relationships never look interchangeable:
 * - "owned"  → you are the Dungeon Master (green brand accent, status matters)
 * - "joined" → you are a Player (orange accent, always published)
 */
const variantTheme: Record<
  CardVariant,
  {
    Icon: LucideIcon;
    roleKey: string;
    accentBar: string;
    iconWrap: string;
    iconColor: string;
    metaIcon: string;
    hoverTitle: string;
    price: string;
    arrow: string;
  }
> = {
  owned: {
    Icon: Crown,
    roleKey: "master",
    accentBar: "before:bg-green-900",
    iconWrap: "bg-green-900/10 group-hover:bg-green-900/20",
    iconColor: "text-green-900",
    metaIcon: "text-green-900/70",
    hoverTitle: "group-hover:text-green-900",
    price: "text-green-900",
    arrow: "group-hover:text-green-900",
  },
  joined: {
    Icon: Shield,
    roleKey: "player",
    accentBar: "before:bg-orangeColor",
    iconWrap: "bg-orangeColor/10 group-hover:bg-orangeColor/20",
    iconColor: "text-orangeColor",
    metaIcon: "text-orangeColor/70",
    hoverTitle: "group-hover:text-orangeColor",
    price: "text-orangeColor",
    arrow: "group-hover:text-orangeColor",
  },
};

function CampaignCard({
  campaign,
  t,
  locale,
  variant,
}: {
  campaign: CampaignWithSubs;
  t: (key: string) => string;
  locale: string;
  variant: CardVariant;
}) {
  const theme = variantTheme[variant];
  const RoleIcon = theme.Icon;

  return (
    <Link href={`/dnd/${campaign.id}`}>
      <Card
        className={`group relative overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-none shadow-sm h-full before:absolute before:inset-y-0 before:start-0 before:w-1 ${theme.accentBar}`}
      >
        <CardContent className="p-5 ps-6">
          <div className="flex items-start justify-between gap-2 mb-3">
            <div className="flex items-center gap-2.5 min-w-0">
              <div
                className={`p-1.5 rounded-md transition-colors shrink-0 ${theme.iconWrap}`}
              >
                <RoleIcon className={`h-4 w-4 ${theme.iconColor}`} />
              </div>
              <div className="min-w-0">
                <h3
                  className={`font-semibold text-base transition-colors line-clamp-1 ${theme.hoverTitle}`}
                >
                  {campaign.title}
                </h3>
                <span
                  className={`flex items-center gap-1 text-xs font-medium ${theme.iconColor}`}
                >
                  <RoleIcon className="h-3 w-3" />
                  {t(theme.roleKey)}
                </span>
              </div>
            </div>
            {variant === "owned" ? (
              <StatusBadge status={campaign.status} t={t} />
            ) : (
              <Badge
                variant="outline"
                className="text-orangeColor border-orangeColor/40 bg-orangeColor/5 text-xs shrink-0"
              >
                <CheckCircle className="h-3 w-3 me-1" /> {t("joined")}
              </Badge>
            )}
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CalendarDays className={`h-3.5 w-3.5 ${theme.metaIcon}`} />
              <span>
                {campaign.sessionsCount} {t("sessions")}
              </span>
              <span className="mx-1">·</span>
              <Users className={`h-3.5 w-3.5 ${theme.metaIcon}`} />
              <span>
                {campaign.playersCount} {t("players")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className={`h-3.5 w-3.5 ${theme.metaIcon}`} />
              <span>
                {locale === "ar" ? campaign.city?.ar : campaign.city?.en}
              </span>
            </div>
            {campaign.startDate && (
              <div className="flex items-center gap-1.5">
                <Clock className={`h-3.5 w-3.5 ${theme.metaIcon}`} />
                <span>{formatDate(new Date(campaign.startDate))}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <span className={`font-bold ${theme.price}`}>
              {campaign.price} SAR
            </span>
            {locale == "en" ? (
              <ArrowRight
                className={`h-4 w-4 text-muted-foreground/40 group-hover:translate-x-0.5 transition-all ${theme.arrow}`}
              />
            ) : (
              <ArrowLeft
                className={`h-4 w-4 text-muted-foreground/40 group-hover:-translate-x-0.5 transition-all ${theme.arrow}`}
              />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function SectionHeader({
  variant,
  title,
  description,
  count,
}: {
  variant: CardVariant;
  title: string;
  description: string;
  count: number;
}) {
  const owned = variant === "owned";
  const SectionIcon = owned ? Crown : Shield;
  return (
    <div className="flex items-center gap-3 mb-5">
      <span
        className={`w-1.5 self-stretch rounded-full ${
          owned ? "bg-green-900" : "bg-orangeColor"
        }`}
      />
      <div
        className={`p-2 rounded-lg ${
          owned ? "bg-green-900/10" : "bg-orangeColor/10"
        }`}
      >
        <SectionIcon
          className={`h-5 w-5 ${owned ? "text-green-900" : "text-orangeColor"}`}
        />
      </div>
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl font-bold">{title}</h2>
          <Badge
            variant="outline"
            className={`${
              owned
                ? "border-green-900/30 text-green-900 bg-green-900/5"
                : "border-orangeColor/30 text-orangeColor bg-orangeColor/5"
            }`}
          >
            {count}
          </Badge>
        </div>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}

export default function DnDPage() {
  const { user, initialLoading } = useAuth();
  const t = useTranslations("DnD");
  const locale = useLocale();

  // Fetch master's campaigns (if logged in)
  const { data: masterData, isLoading: loadingMaster } = useSWR<{
    campaigns: CampaignWithSubs[];
  }>(user ? `/api/campaigns?masterId=${user.id}` : null);

  // Fetch joined campaigns (if logged in)
  const { data: joinedData, isLoading: loadingJoined } = useSWR<{
    campaigns: CampaignWithSubs[];
  }>(user ? `/api/campaigns?userId=${user.id}&status=Published` : null);

  // Single loading gate: wait for auth + any in-flight fetches
  const isLoading = initialLoading || loadingMaster || loadingJoined;

  const masterCampaigns = masterData?.campaigns || [];
  const joinedCampaigns = joinedData?.campaigns || [];

  const isMaster = masterCampaigns.length > 0;
  const isPlayer = joinedCampaigns.length > 0;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="bg-green-900 text-primary-foreground">
        <section className="relative pt-12 pb-8 px-6 text-center overflow-hidden">
          <Image
            src="/assets/dnd/banner.svg"
            alt="dnd"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/40" />
          <div className="relative z-10">
            <div className="container mx-auto px-4 py-10 md:py-16">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
                <div className="flex flex-col items-center">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="p-2 rounded-lg bg-orangeColor/20 border border-orangeColor/30">
                      <Swords className="h-6 w-6 text-orangeColor" />
                    </div>
                    <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
                      {t("pageTitle")}
                    </h1>
                  </div>
                  {/*  TODO: replace this text with a description of dnd campaign
                  <p className="text-primary-foreground/60 max-w-md">
                    {t("noCampaignsDescription")} 
                  </p> */}
                </div>
                <Link href="/dnd/create-campaign">
                  <Button
                    size="lg"
                    className="bg-orangeColor hover:bg-orangeColor/90 text-white h-12 px-6"
                  >
                    <Plus className="h-5 w-5 me-2" />
                    {t("createCampaign")}
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="container mx-auto px-4 py-8 space-y-10">
        {/* Loading Skeletons */}
        {isLoading && (
          <div>
            <Skeleton className="w-32 h-6 bg-white mb-3" />

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <CampaignCardSkeleton key={i} />
              ))}
            </div>
          </div>
        )}

        {/* My Campaigns — you are the Dungeon Master */}
        {!isLoading && isMaster && (
          <section>
            <SectionHeader
              variant="owned"
              title={t("myCampaigns")}
              description={t("myCampaignsDesc")}
              count={masterCampaigns.length}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {masterCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  t={t}
                  locale={locale}
                  variant="owned"
                />
              ))}
            </div>
          </section>
        )}

        {/* Joined Campaigns — you are a Player */}
        {!isLoading && isPlayer && (
          <section>
            <SectionHeader
              variant="joined"
              title={t("joinedCampaigns")}
              description={t("joinedCampaignsDesc")}
              count={joinedCampaigns.length}
            />
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {joinedCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  t={t}
                  locale={locale}
                  variant="joined"
                />
              ))}
            </div>
          </section>
        )}

        {/* Empty state when logged in but no campaigns */}
        {!isLoading && user && !isMaster && !isPlayer && (
          <Card className="border-dashed border-2 border-muted-foreground/15 bg-transparent shadow-none">
            <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
              <div className="p-4 rounded-full bg-muted mb-4">
                <Swords className="h-8 w-8 opacity-40" />
              </div>
              <p className="text-lg font-medium">{t("noCampaigns")}</p>
              <p className="text-sm mt-1 mb-4">{t("noCampaignsDescription")}</p>
              <Link href="/dnd/create-campaign">
                <Button variant="outline" size="sm">
                  <Plus className="h-4 w-4 me-1" />
                  {t("createCampaign")}
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
