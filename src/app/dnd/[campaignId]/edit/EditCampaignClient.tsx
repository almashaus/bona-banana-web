"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  campaignEditSchema,
  type CampaignEditData,
} from "@/src/models/campaign/campaignSchemas";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useLocale, useTranslations } from "next-intl";
import { getAuth } from "firebase/auth";
import useSWR, { useSWRConfig } from "swr";
import { format } from "date-fns";
import {
  Swords,
  Users,
  CalendarDays,
  ArrowLeft,
  User,
  Scroll,
  MapPin,
  Coins,
  ArrowRight,
  CalendarIcon,
  BookOpen,
  AlertTriangle,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { useToast } from "@/src/components/ui/use-toast";
import { cn } from "@/src/lib/utils/utils";
import { formatDate } from "@/src/lib/utils/formatDate";
import {
  Campaign,
  CampaignPlayer,
  CampaignSession,
  CampaignBooking,
} from "@/src/models/campaign/campaign";

interface CityResponse {
  city: { ar: string; en: string }[];
}

interface CampaignDetail extends Campaign {
  players: CampaignPlayer[];
  sessions: CampaignSession[];
  bookings: CampaignBooking[];
}

function DateTimePicker({
  value,
  onChange,
  hasError,
  label,
}: {
  value: string;
  onChange: (iso: string) => void;
  hasError?: boolean;
  label?: string;
}) {
  const [open, setOpen] = useState(false);

  const selected = value ? new Date(value) : undefined;

  const handleDaySelect = (day: Date | undefined) => {
    if (!day) return;
    const existing = selected ?? new Date();
    day.setHours(existing.getHours(), existing.getMinutes(), 0, 0);
    onChange(day.toISOString());
    setOpen(false);
  };

  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [h, m] = e.target.value.split(":").map(Number);
    const base = selected ?? new Date();
    const next = new Date(base);
    next.setHours(h, m, 0, 0);
    onChange(next.toISOString());
  };

  return (
    <div className="flex items-center gap-2">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              "h-9 font-normal justify-start text-start flex-1 bg-white/70 border-orangeColor/20",
              !selected && "text-muted-foreground",
              hasError && "border-redColor focus-visible:ring-redColor",
            )}
          >
            <CalendarIcon className="h-4 w-4 me-2 shrink-0" />
            {selected ? formatDate(selected) : (label ?? "Pick a date")}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0">
          <Calendar
            dir="ltr"
            mode="single"
            selected={selected}
            onSelect={handleDaySelect}
            defaultMonth={selected}
          />
        </PopoverContent>
      </Popover>

      <Input
        dir="ltr"
        type="time"
        className={cn(
          "h-9 w-28 bg-white/70 border-orangeColor/20",
          hasError && "border-redColor focus-visible:ring-redColor",
        )}
        value={selected ? format(selected, "HH:mm") : ""}
        onChange={handleTimeChange}
      />
    </div>
  );
}

export default function EditCampaignClient({
  campaignId,
}: {
  campaignId: string;
}) {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const locale = useLocale();
  const t = useTranslations("DnD");
  const auth = getAuth();
  const authUser = auth.currentUser;
  const { mutate } = useSWRConfig();

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: cityData } = useSWR<CityResponse>("/api/admin/settings/city");
  const { data: campaign, isLoading } = useSWR<CampaignDetail>(
    `/api/campaigns/${campaignId}`,
  );

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<CampaignEditData>({
    resolver: zodResolver(campaignEditSchema),
    defaultValues: {
      title: "",
      price: 0,
      startDate: "",
      city: { ar: "", en: "" },
      players: [],
      sessions: [],
    },
  });

  // Populate the form once the campaign data has loaded.
  useEffect(() => {
    if (!campaign) return;
    reset({
      title: campaign.title,
      price: campaign.price,
      startDate: campaign.startDate
        ? new Date(campaign.startDate).toISOString()
        : "",
      city: { ar: campaign.city?.ar ?? "", en: campaign.city?.en ?? "" },
      players: campaign.players.map((p) => ({ id: p.id, name: p.name })),
      sessions: [...campaign.sessions]
        .sort((a, b) => a.sessionNumber - b.sessionNumber)
        .map((s) => ({
          id: s.id,
          sessionNumber: s.sessionNumber,
          dateTime: s.dateTime ? new Date(s.dateTime).toISOString() : "",
        })),
    });
  }, [campaign, reset]);

  const players = watch("players");
  const sessions = watch("sessions");

  const onSubmit = async (data: CampaignEditData) => {
    if (!authUser) {
      toast({
        title: t("updateFailed"),
        description: "You must be logged in.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const idToken = await authUser.getIdToken();

      const response = await fetch(`/api/campaigns/${campaignId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          title: data.title,
          price: data.price,
          city: data.city,
          startDate: data.startDate,
          updatePlayers: data.players.map((p) => ({
            id: p.id,
            name: p.name,
          })),
          updateSessions: data.sessions.map((s) => ({
            id: s.id,
            dateTime: s.dateTime,
          })),
        }),
      });

      if (response.ok) {
        toast({
          title: t("updateSuccess"),
          description: t("updateSuccessDescription"),
          variant: "success",
        });
        mutate(`/api/campaigns/${campaignId}`);
        router.push(`/dnd/${campaignId}`);
      } else {
        const errorData = await response.json();
        toast({
          title: t("updateFailed"),
          description: errorData?.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("updateFailed"),
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // ── Loading / guards ──────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-muted/30 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orangeColor/30 border-t-orangeColor rounded-full animate-spin" />
      </div>
    );
  }

  if (!campaign) {
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

  // Only the campaign master may edit.
  if (user?.id !== campaign.masterId) {
    return (
      <div className="min-h-screen bg-muted/30 flex flex-col items-center justify-center text-center px-4">
        <div className="p-4 rounded-full bg-muted mb-4">
          <AlertTriangle className="h-10 w-10 text-muted-foreground/40" />
        </div>
        <h2 className="text-xl font-bold mb-2">{t("accessDenied")}</h2>
        <p className="text-muted-foreground mb-4">
          {t("accessDeniedDescription")}
        </p>
        <Button onClick={() => router.push(`/dnd/${campaignId}`)}>
          {t("backToCampaigns")}
        </Button>
      </div>
    );
  }

  return (
    <>
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Almendra:wght@400;700&family=Cairo:wght@200..1000&family=Reem+Kufi:wght@400..700&family=Tajawal:wght@200;300;400;500;700;800;900&display=swap");

        .font-whimsical {
          font-family: ${locale === "ar"
            ? "'Reem Kufi', sans-serif"
            : "'Almendra', serif"};
        }

        @keyframes float {
          0% {
            transform: translateY(0px);
          }
          50% {
            transform: translateY(-5px);
          }
          100% {
            transform: translateY(0px);
          }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }

        .enchanted-panel {
          background: rgba(250, 247, 240, 0.6);
          backdrop-filter: blur(6px);
          -webkit-backdrop-filter: blur(12px);
          border: 1px solid rgba(212, 175, 55, 0.3);
          box-shadow: 0 8px 32px 0 rgba(31, 38, 135, 0.07);
        }
      `}</style>

      <div
        className="min-h-screen bg-cover bg-fixed bg-center selection:bg-orangeColor/30"
        style={{
          backgroundImage: 'url("/assets/dnd/bg.png")',
        }}
      >
        <div className="min-h-screen bg-white/10 py-8 md:py-12">
          {/* Header */}
          <div className="container mx-auto px-4 mb-12">
            <div className="flex flex-col items-center text-center">
              <Button
                variant="ghost"
                onClick={() => router.push(`/dnd/${campaignId}`)}
                className="text-darkColor/60 hover:text-darkColor hover:bg-orangeColor/10 mb-8 font-medium transition-all group"
              >
                {locale == "en" ? (
                  <ArrowLeft className="h-4 w-4 me-2 group-hover:-translate-x-1 transition-transform" />
                ) : (
                  <ArrowRight className="h-4 w-4 me-2 group-hover:translate-x-1 transition-transform" />
                )}
                {t("backToCampaigns")}
              </Button>

              <div className="relative mb-6">
                <div className="absolute inset-0 bg-gold/20 blur-2xl rounded-full scale-150 animate-pulse" />
                <div className="relative p-5 rounded-2xl bg-white/70 enchanted-panel animate-float">
                  <Swords className="h-10 w-10 text-orangeColor" />
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold tracking-tight font-whimsical text-darkColor mb-2">
                {t("editCampaign")}
              </h1>
              <div className="flex items-center gap-2 text-darkColor/60 font-medium">
                <span>
                  {t("master")} &mdash; {user?.name}
                </span>
              </div>
            </div>
          </div>

          {/* Form */}
          <div className="container mx-auto px-4 py-8 max-w-3xl">
            {/* Re-approval warning */}
            <div className="flex items-start gap-3 mb-6 p-4 rounded-2xl bg-orangeColor/20 border border-orangeColor/30">
              <AlertTriangle className="h-5 w-5 text-orangeColor shrink-0 mt-0.5" />
              <p className="text-sm text-darkColor/80 font-medium">
                {t("editWarning")}
              </p>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Section 1: Basic Info */}
              <div className="enchanted-panel rounded-[2rem] p-6 md:p-8 space-y-6 relative overflow-hidden group">
                <div
                  className={`absolute top-0 ${locale == "en" ? "right-0" : "left-0"} p-4 opacity-10 group-hover:opacity-20 transition-opacity`}
                >
                  <Scroll className="h-20 w-20 text-orangeColor rotate-12" />
                </div>

                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-orangeColor text-white shadow-lg shadow-orangeColor/20 animate-float">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold font-whimsical text-darkColor">
                    {t("basicInfo")}
                  </h2>
                </div>

                <div className="grid gap-6">
                  {/* Title */}
                  <div className="space-y-2">
                    <Label
                      htmlFor="title"
                      className="flex items-center gap-2 text-darkColor/80 font-bold ml-1"
                    >
                      <Scroll className="h-4 w-4 text-orangeColor" />
                      {t("title")}
                    </Label>
                    <Input
                      id="title"
                      {...register("title")}
                      placeholder="The Lost Mines of Phandelver"
                      className={cn(
                        "bg-white/70 border-orangeColor/20 rounded-xl transition-all",
                        errors.title &&
                          "border-redColor focus-visible:ring-redColor",
                      )}
                    />
                    {errors.title && (
                      <p className="text-sm text-redColor font-medium flex items-center gap-1.5 ml-1">
                        {errors.title.message}
                      </p>
                    )}
                  </div>

                  {/* Price & City */}
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label
                        htmlFor="price"
                        className="flex items-center gap-2 text-darkColor/80 font-bold ml-1"
                      >
                        <Coins className="h-4 w-4 text-orangeColor" />
                        {t("pricePerSession")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="price"
                          type="number"
                          step="any"
                          {...register("price", { valueAsNumber: true })}
                          placeholder="50"
                          className={cn(
                            "pe-12 bg-white/70 border-orangeColor/20 rounded-xl transition-all",
                            errors.price &&
                              "border-redColor focus-visible:ring-redColor",
                          )}
                        />
                        <span className="absolute end-4 top-1/2 -translate-y-1/2 text-sm text-darkColor/40 font-bold">
                          SAR
                        </span>
                      </div>
                      {errors.price && (
                        <p className="text-sm text-redColor font-medium ml-1">
                          {errors.price.message}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label className="flex items-center gap-2 text-darkColor/80 font-bold ml-1">
                        <MapPin className="h-4 w-4 text-orangeColor" />
                        {t("city")}
                      </Label>
                      <Select
                        dir={locale == "en" ? "ltr" : "rtl"}
                        value={watch("city")?.en || ""}
                        onValueChange={(value) => {
                          const selected = cityData?.city?.find(
                            (c) => c.en === value,
                          );
                          if (selected) {
                            setValue("city", selected, {
                              shouldValidate: true,
                            });
                          }
                        }}
                      >
                        <SelectTrigger
                          className={cn(
                            "py-[19px] bg-white/70 border-orangeColor/20 rounded-xl transition-all",
                            errors.city &&
                              "border-redColor focus-visible:ring-redColor",
                          )}
                        >
                          <SelectValue placeholder={t("selectCity")} />
                        </SelectTrigger>
                        <SelectContent className="enchanted-panel rounded-xl">
                          {cityData?.city?.map((c) => (
                            <SelectItem key={c.en} value={c.en}>
                              {locale === "ar" ? c.ar : c.en}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {errors.city && (
                        <p className="text-sm text-redColor font-medium ml-1">
                          {errors.city.en?.message || errors.city.ar?.message}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Start Date */}
                  <div className="space-y-2 sm:w-2/3">
                    <Label className="flex items-center gap-2 text-darkColor/80 font-bold ml-1">
                      <CalendarDays className="h-4 w-4 text-orangeColor" />
                      {t("startDate")}
                    </Label>
                    <DateTimePicker
                      value={watch("startDate")}
                      onChange={(iso) =>
                        setValue("startDate", iso, { shouldValidate: true })
                      }
                      hasError={!!errors.startDate}
                      label={t("startDate")}
                    />
                    {errors.startDate && (
                      <p className="text-sm text-redColor font-medium ml-1">
                        {errors.startDate.message}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 2: Sessions */}
              <div className="enchanted-panel rounded-[2rem] p-6 md:p-8 space-y-6 relative overflow-hidden group">
                <div
                  className={`absolute top-0 ${locale == "en" ? "right-0" : "left-0"} p-4 opacity-10 group-hover:opacity-20 transition-opacity`}
                >
                  <CalendarDays className="h-20 w-20 text-orangeColor -rotate-12" />
                </div>

                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-orangeColor text-white shadow-lg shadow-orangeColor/20 animate-float">
                    <CalendarDays className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold font-whimsical text-darkColor">
                    {t("sessionsInfo")}
                  </h2>
                </div>

                <div className="grid gap-4">
                  {sessions.map((session, index) => (
                    <div
                      key={session.id}
                      className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-white/30 border border-yellowColor/30 transition-all hover:bg-white/50 group/item"
                    >
                      <div className="flex items-center gap-3 shrink-0">
                        <div
                          className={cn(
                            "flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold transition-colors",
                            session.dateTime
                              ? "bg-orangeColor text-white"
                              : "bg-orangeColor/10 text-orangeColor",
                          )}
                        >
                          {session.sessionNumber}
                        </div>
                        <Label className="text-sm font-bold text-darkColor/70">
                          {t("sessionNo", { number: session.sessionNumber })}
                        </Label>
                      </div>
                      <div className="flex-1">
                        <DateTimePicker
                          value={watch(`sessions.${index}.dateTime`) ?? ""}
                          onChange={(iso) =>
                            setValue(`sessions.${index}.dateTime`, iso, {
                              shouldValidate: true,
                            })
                          }
                          hasError={!!errors.sessions?.[index]?.dateTime}
                          label={t("sessionDate", {
                            number: session.sessionNumber,
                          })}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: Players */}
              <div className="enchanted-panel rounded-[2rem] p-6 md:p-8 space-y-6 relative overflow-hidden group">
                <div
                  className={`absolute top-0 ${locale == "en" ? "right-0" : "left-0"} p-4 opacity-10 group-hover:opacity-20 transition-opacity`}
                >
                  <Users className="h-20 w-20 text-orangeColor rotate-6" />
                </div>

                <div className="flex items-center gap-4 mb-2">
                  <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-orangeColor text-white shadow-lg shadow-orangeColor/20 animate-float">
                    <Users className="h-5 w-5" />
                  </div>
                  <h2 className="text-2xl font-bold font-whimsical text-darkColor">
                    {t("playersInfo")}
                  </h2>
                </div>

                <div className="grid gap-4">
                  {players.map((player, index) => (
                    <div
                      key={player.id}
                      className="flex items-center gap-4 p-4 rounded-2xl bg-white/30 border border-yellowColor/30 transition-all hover:bg-white/50 group/item"
                    >
                      <div
                        className={cn(
                          "flex items-center justify-center w-10 h-10 rounded-xl transition-colors shrink-0 text-greenColor",
                          player.name ? "bg-yellowColor" : "bg-greenColor/10",
                        )}
                      >
                        <User className="h-5 w-5" />
                      </div>
                      <div className="flex-1 space-y-1">
                        <Label
                          htmlFor={`players.${index}.name`}
                          className="text-xs font-bold text-darkColor/70 ml-1"
                        >
                          {t("playerName")} {index + 1}
                        </Label>
                        <Input
                          id={`players.${index}.name`}
                          {...register(`players.${index}.name`)}
                          placeholder={`Player ${index + 1}`}
                          className={cn(
                            "h-10 bg-white/70 rounded-xl transition-all",
                            errors.players?.[index]?.name &&
                              "border-redColor focus-visible:ring-redColor",
                          )}
                        />
                        {errors.players?.[index]?.name && (
                          <p className="text-sm text-redColor font-medium ml-1">
                            {errors.players[index]?.name?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-6 pb-12">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.push(`/dnd/${campaignId}`)}
                  className="h-12 px-10 rounded-2xl border-orangeColor/20 hover:bg-orangeColor/10 text-darkColor/60 font-bold transition-all"
                >
                  {locale == "en" ? (
                    <ArrowLeft className="h-4 w-4 me-2 group-hover:-translate-x-1 transition-transform" />
                  ) : (
                    <ArrowRight className="h-4 w-4 me-2 group-hover:translate-x-1 transition-transform" />
                  )}
                  {t("backToCampaigns")}
                </Button>
                <Button
                  type="submit"
                  variant="default"
                  disabled={isSubmitting}
                  className="h-12 px-10 rounded-2xl bg-orangeColor hover:bg-orangeColor/90 text-white shadow-lg shadow-orangeColor/20 font-bold transition-all hover:scale-105 active:scale-95"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      {t("saving")}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Swords className="h-5 w-5" />
                      {t("saveChanges")}
                    </div>
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
