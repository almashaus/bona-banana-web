"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  campaignFormSchema,
  type CampaignFormData,
} from "@/src/models/campaign/campaignSchemas";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useLocale, useTranslations } from "next-intl";
import { getAuth } from "firebase/auth";
import useSWR from "swr";
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
import { formatDate, formatDateTime } from "@/src/lib/utils/formatDate";

interface CityResponse {
  city: { ar: string; en: string }[];
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

export default function CreateCampaignPage() {
  const router = useRouter();
  const { toast } = useToast();
  const { user } = useAuth();
  const locale = useLocale();
  const t = useTranslations("DnD");
  const auth = getAuth();
  const authUser = auth.currentUser;

  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: cityData } = useSWR<CityResponse>("/api/admin/settings/city");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<CampaignFormData>({
    resolver: zodResolver(campaignFormSchema),
    defaultValues: {
      title: "",
      sessionsCount: 3,
      playersCount: 3,
      playerNames: ["", "", ""],
      price: 0,
      startDate: "",
      sessionDates: ["", "", ""],
      city: { ar: "", en: "" },
    },
  });

  const sessionsCount = watch("sessionsCount");
  const playersCount = watch("playersCount");
  const playerNames = watch("playerNames");
  const sessionDates = watch("sessionDates");

  // Sync playerNames array with playersCount
  useEffect(() => {
    const current = playerNames || [];
    if (current.length < playersCount) {
      const extended = [
        ...current,
        ...Array(playersCount - current.length).fill(""),
      ];
      setValue("playerNames", extended);
    } else if (current.length > playersCount) {
      setValue("playerNames", current.slice(0, playersCount));
    }
  }, [playersCount]);

  // Sync sessionDates array with sessionsCount
  useEffect(() => {
    const current = sessionDates || [];
    if (current.length < sessionsCount) {
      const extended = [
        ...current,
        ...Array(sessionsCount - current.length).fill(""),
      ];
      setValue("sessionDates", extended);
    } else if (current.length > sessionsCount) {
      setValue("sessionDates", current.slice(0, sessionsCount));
    }
  }, [sessionsCount]);

  const onSubmit = async (data: CampaignFormData) => {
    if (!authUser) {
      toast({
        title: "Error",
        description: "You must be logged in to create a campaign.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const idToken = await authUser.getIdToken();

      const response = await fetch("/api/campaigns", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        toast({
          title: t("createSuccess"),
          description: t("createSuccessDescription"),
          variant: "success",
        });
        router.push("/dnd");
      } else {
        const errorData = await response.json();
        toast({
          title: t("createFailed"),
          description: errorData?.error || "Something went wrong",
          variant: "destructive",
        });
      }
    } catch {
      toast({
        title: t("createFailed"),
        description: "Something went wrong",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

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
                onClick={() => router.back()}
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
                {t("createCampaign")}
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
                              {c.en}
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

                <div className="grid gap-6">
                  {/* Sessions Count */}
                  <div className="space-y-2 sm:w-1/2">
                    <Label className="flex items-center gap-2 text-darkColor/80 font-bold ml-1">
                      <CalendarIcon className="h-4 w-4 text-orangeColor" />
                      {t("sessionsCount")}
                    </Label>
                    <Select
                      dir={locale == "en" ? "ltr" : "rtl"}
                      value={String(sessionsCount)}
                      onValueChange={(val) =>
                        setValue("sessionsCount", Number(val), {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger className="h-12 bg-white/70 border-orangeColor/20 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="enchanted-panel rounded-xl">
                        {[3, 4, 5, 6, 7].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} {t("sessions")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic Session Date Fields */}
                  <div className="grid gap-4">
                    {Array.from({ length: sessionsCount }).map((_, index) => (
                      <div
                        key={index}
                        className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 rounded-2xl bg-white/30 border border-yellowColor/30 transition-all hover:bg-white/50 group/item"
                      >
                        <div className="flex items-center gap-3 shrink-0">
                          <div
                            className={cn(
                              "flex items-center justify-center w-8 h-8 rounded-xl text-sm font-bold transition-colors",
                              sessionDates[index]
                                ? "bg-orangeColor text-white"
                                : "bg-orangeColor/10 text-orangeColor",
                            )}
                          >
                            {index + 1}
                          </div>
                          <Label className="text-sm font-bold text-darkColor/70">
                            {t("sessionNo", { number: index + 1 })}
                          </Label>
                        </div>
                        <div className="flex-1">
                          <DateTimePicker
                            value={watch(`sessionDates.${index}`) ?? ""}
                            onChange={(iso) =>
                              setValue(`sessionDates.${index}`, iso, {
                                shouldValidate: true,
                              })
                            }
                            hasError={!!errors.sessionDates?.[index]}
                            label={t("sessionDate", { number: index + 1 })}
                          />
                        </div>
                      </div>
                    ))}
                    {errors.sessionDates &&
                      !Array.isArray(errors.sessionDates) && (
                        <p className="text-sm text-redColor font-medium ml-1">
                          {errors.sessionDates.message}
                        </p>
                      )}
                  </div>
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

                <div className="grid gap-6">
                  {/* Players Count */}
                  <div className="space-y-2 sm:w-1/2">
                    <Label className="flex items-center gap-2 text-darkColor/80 font-bold ml-1">
                      <Swords className="h-4 w-4 text-orangeColor" />
                      {t("playersCount")}
                    </Label>
                    <Select
                      dir={locale == "en" ? "ltr" : "rtl"}
                      value={String(playersCount)}
                      onValueChange={(val) =>
                        setValue("playersCount", Number(val), {
                          shouldValidate: true,
                        })
                      }
                    >
                      <SelectTrigger className="h-12 bg-white/70 border-orangeColor/20 rounded-xl">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="enchanted-panel rounded-xl">
                        {[3, 4, 5, 6, 7].map((n) => (
                          <SelectItem key={n} value={String(n)}>
                            {n} {t("players")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Dynamic Player Name Fields */}
                  <div className="grid gap-4">
                    {Array.from({ length: playersCount }).map((_, index) => (
                      <div
                        key={index}
                        className="flex items-center gap-4 p-4 rounded-2xl bg-white/30 border border-yellowColor/30 transition-all hover:bg-white/50 group/item"
                      >
                        <div
                          className={cn(
                            "flex items-center justify-center w-10 h-10 rounded-xl transition-colors shrink-0 text-greenColor",
                            playerNames[index]
                              ? "bg-yellowColor"
                              : "bg-greenColor/10 ",
                          )}
                        >
                          <User className="h-5 w-5" />
                        </div>
                        <div className="flex-1 space-y-1">
                          <Label
                            htmlFor={`playerNames.${index}`}
                            className="text-xs font-bold text-darkColor/70 ml-1"
                          >
                            {t("playerName")} {index + 1}
                          </Label>
                          <Input
                            id={`playerNames.${index}`}
                            {...register(`playerNames.${index}`)}
                            placeholder={`Player ${index + 1}`}
                            className={cn(
                              "h-10 bg-white/70 rounded-xl transition-all",
                              errors.playerNames?.[index] &&
                                "border-redColor focus-visible:ring-redColor",
                            )}
                          />
                        </div>
                      </div>
                    ))}
                    {errors.playerNames &&
                      !Array.isArray(errors.playerNames) && (
                        <p className="text-sm text-redColor font-medium ml-1">
                          {errors.playerNames.message}
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* Submit */}
              <div className="flex flex-col md:flex-row items-center justify-end gap-4 pt-6 pb-12">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                  className="h-12 px-10 rounded-2xl border-orangeColor/20 hover:bg-orangeColor/10 text-darkColor/60 font-bold transition-all"
                >
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
                      {t("creating")}
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Swords className="h-5 w-5" />
                      {t("createCampaign")}
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
