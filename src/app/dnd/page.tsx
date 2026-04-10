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
  User,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
  ArrowLeft,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Card, CardContent } from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { formatDate } from "@/src/lib/utils/formatDate";
import { Campaign, CampaignStatus } from "@/src/models/campaign/campaign";

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

function CampaignCard({
  campaign,
  t,
  locale,
}: {
  campaign: CampaignWithSubs;
  t: (key: string) => string;
  locale: string;
}) {
  return (
    <Link href={`/dnd/${campaign.id}`}>
      <Card className="group hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 border-none shadow-sm h-full">
        <CardContent className="p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-md bg-greenColor/10 group-hover:bg-greenColor/20 transition-colors">
                <Swords className="h-4 w-4 text-greenColor" />
              </div>
              <h3 className="font-semibold text-base group-hover:text-greenColor transition-colors line-clamp-1">
                {campaign.title}
              </h3>
            </div>
            <StatusBadge status={campaign.status} t={t} />
          </div>

          <div className="space-y-2 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <CalendarDays className="h-3.5 w-3.5 text-orangeColor" />
              <span>
                {campaign.sessionsCount} {t("sessions")}
              </span>
              <span className="mx-1">·</span>
              <Users className="h-3.5 w-3.5 text-orangeColor" />
              <span>
                {campaign.playersCount} {t("players")}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5 text-orangeColor" />
              <span>
                {locale === "ar" ? campaign.city?.ar : campaign.city?.en}
              </span>
            </div>
            {campaign.startDate && (
              <div className="flex items-center gap-1.5">
                <Clock className="h-3.5 w-3.5 text-orangeColor" />
                <span>{formatDate(new Date(campaign.startDate))}</span>
              </div>
            )}
          </div>

          <div className="mt-3 pt-3 border-t flex items-center justify-between">
            <span className="font-bold text-greenColor">
              {campaign.price} SAR
            </span>
            {locale == "en" ? (
              <ArrowRight className="h-4 w-4 text-muted-foreground/40 group-hover:text-greenColor group-hover:translate-x-0.5 transition-all" />
            ) : (
              <ArrowLeft className="h-4 w-4 text-muted-foreground/40 group-hover:text-greenColor group-hover:translate-x-0.5 transition-all" />
            )}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

export default function DnDPage() {
  const { user } = useAuth();
  const t = useTranslations("DnD");
  const locale = useLocale();

  // Fetch all published campaigns
  const { data: publishedData, isLoading: loadingPublished } = useSWR<{
    campaigns: CampaignWithSubs[];
  }>("/api/campaigns?status=Published");

  // Fetch master's campaigns (if logged in)
  const { data: masterData, isLoading: loadingMaster } = useSWR<{
    campaigns: CampaignWithSubs[];
  }>(user ? `/api/campaigns?masterId=${user.id}` : null);

  // Fetch joined campaigns (if logged in)
  const { data: joinedData, isLoading: loadingJoined } = useSWR<{
    campaigns: CampaignWithSubs[];
  }>(user ? `/api/campaigns?userId=${user.id}&status=Published` : null);

  const isLoading = loadingPublished || loadingMaster || loadingJoined;

  const publishedCampaigns = publishedData?.campaigns || [];
  const masterCampaigns = masterData?.campaigns || [];
  const joinedCampaigns = joinedData?.campaigns || [];

  // Filter out master's own campaigns from published list
  const otherPublished = publishedCampaigns.filter(
    (c) => !masterCampaigns.some((m) => m.id === c.id),
  );

  const isMaster = masterCampaigns.length > 0;
  const isPlayer = joinedCampaigns.length > 0;

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Hero */}
      <div className="bg-greenColor text-primary-foreground">
        <section className="relative pt-12 pb-8 px-6 text-center overflow-hidden">
          <Image
            src="/images/dnd.svg"
            alt=""
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/50" />
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
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <CampaignCardSkeleton key={i} />
            ))}
          </div>
        )}

        {/* Master's Campaigns */}
        {!isLoading && isMaster && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <User className="h-5 w-5 text-orangeColor" />
              <h2 className="text-xl font-bold">{t("myCampaigns")}</h2>
              <Badge variant="outline" className="ms-1 mt-1">
                {masterCampaigns.length}
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {masterCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  t={t}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        )}

        {/* Joined Campaigns */}
        {!isLoading && isPlayer && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Users className="h-5 w-5 text-orangeColor" />
              <h2 className="text-xl font-bold">{t("joinedCampaigns")}</h2>
              <Badge variant="outline" className="ms-1">
                {joinedCampaigns.length}
              </Badge>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {joinedCampaigns.map((campaign) => (
                <CampaignCard
                  key={campaign.id}
                  campaign={campaign}
                  t={t}
                  locale={locale}
                />
              ))}
            </div>
          </section>
        )}

        {/* Published Campaigns */}
        {!isLoading && (
          <section>
            <div className="flex items-center gap-2 mb-4">
              <Swords className="h-5 w-5 text-orangeColor" />
              <h2 className="text-xl font-bold">{t("publishedCampaigns")}</h2>
            </div>
            {otherPublished.length === 0 ? (
              <Card className="border-dashed border-2 border-muted-foreground/15 bg-transparent shadow-none">
                <CardContent className="flex flex-col items-center justify-center py-16 text-muted-foreground">
                  <div className="p-4 rounded-full bg-muted mb-4">
                    <Swords className="h-8 w-8 opacity-40" />
                  </div>
                  <p className="text-lg font-medium">{t("noCampaigns")}</p>
                  <p className="text-sm mt-1 mb-4">
                    {t("noCampaignsDescription")}
                  </p>
                  <Link href="/dnd/create-campaign">
                    <Button variant="outline" size="sm">
                      <Plus className="h-4 w-4 me-1" />
                      {t("createCampaign")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherPublished.map((campaign) => (
                  <CampaignCard
                    key={campaign.id}
                    campaign={campaign}
                    t={t}
                    locale={locale}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </div>
    </div>
  );
}
