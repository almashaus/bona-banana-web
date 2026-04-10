"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  campaignFormSchema,
  type CampaignFormData,
} from "@/src/models/campaign/campaignSchemas";
import { useAuth } from "@/src/features/auth/auth-provider";
import { useLocale, useTranslations } from "next-intl";
import { getAuth } from "firebase/auth";
import useSWR from "swr";
import {
  Swords,
  Users,
  CalendarDays,
  Plus,
  Trash2,
  ArrowLeft,
  User,
  Scroll,
  MapPin,
  Coins,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { useToast } from "@/src/components/ui/use-toast";
import { cn } from "@/src/lib/utils/utils";

interface CityResponse {
  city: { ar: string; en: string }[];
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
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <div className="bg-greenColor text-primary-foreground">
        <div className="container mx-auto px-4 py-8 md:py-12">
          <Button
            variant="ghost"
            onClick={() => router.back()}
            className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-white/10 mb-4 -ms-2"
          >
            {locale == "en" ? (
              <ArrowLeft className="h-4 w-4 me-2" />
            ) : (
              <ArrowRight className="h-4 w-4 me-2" />
            )}
            {t("backToCampaigns")}
          </Button>
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-orangeColor/20 border border-orangeColor/30">
              <Swords className="h-6 w-6 text-orangeColor" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                {t("createCampaign")}
              </h1>
              <p className="text-primary-foreground/60 text-sm mt-0.5">
                {t("master")} &mdash; {user?.name}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="container mx-auto px-4 py-8 max-w-3xl">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Section 1: Basic Info */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-greenColor text-white text-sm font-bold">
                  1
                </div>
                <CardTitle className="text-lg">{t("basicInfo")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Title */}
              <div className="space-y-2">
                <Label htmlFor="title" className="flex items-center gap-1.5">
                  <Scroll className="h-3.5 w-3.5 text-orangeColor" />
                  {t("title")}
                </Label>
                <Input
                  id="title"
                  {...register("title")}
                  placeholder="The Lost Mines of Phandelver"
                  className={cn(
                    "h-11",
                    errors.title &&
                      "border-redColor focus-visible:ring-redColor",
                  )}
                />
                {errors.title && (
                  <p className="text-sm text-redColor">
                    {errors.title.message}
                  </p>
                )}
              </div>

              {/* Price & City */}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="price" className="flex items-center gap-1.5">
                    <Coins className="h-3.5 w-3.5 text-orangeColor" />
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
                        "h-11 pe-12",
                        errors.price &&
                          "border-redColor focus-visible:ring-redColor",
                      )}
                    />
                    <span className="absolute end-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">
                      SAR
                    </span>
                  </div>
                  {errors.price && (
                    <p className="text-sm text-redColor">
                      {errors.price.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-orangeColor" />
                    {t("city")}
                  </Label>
                  <Select
                    dir={locale == "en" ? "ltr" : "rtl"}
                    onValueChange={(value) => {
                      const selected = cityData?.city?.find(
                        (c) => c.en === value,
                      );
                      if (selected) {
                        setValue("city", selected, { shouldValidate: true });
                      }
                    }}
                  >
                    <SelectTrigger
                      className={cn(
                        "h-11",
                        errors.city &&
                          "border-redColor focus-visible:ring-redColor",
                      )}
                    >
                      <SelectValue placeholder={t("selectCity")} />
                    </SelectTrigger>
                    <SelectContent>
                      {cityData?.city?.map((c) => (
                        <SelectItem key={c.en} value={c.en}>
                          {c.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.city && (
                    <p className="text-sm text-redColor">
                      {errors.city.en?.message || errors.city.ar?.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Start Date */}
              <div className="space-y-2 sm:w-1/2">
                <Label
                  htmlFor="startDate"
                  className="flex items-center gap-1.5"
                >
                  <CalendarDays className="h-3.5 w-3.5 text-orangeColor" />
                  {t("startDate")}
                </Label>
                <Input
                  id="startDate"
                  type="datetime-local"
                  {...register("startDate")}
                  className={cn(
                    "h-11",
                    errors.startDate &&
                      "border-redColor focus-visible:ring-redColor",
                  )}
                />
                {errors.startDate && (
                  <p className="text-sm text-redColor">
                    {errors.startDate.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 2: Sessions */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-greenColor text-white text-sm font-bold">
                  2
                </div>
                <CardTitle className="text-lg">{t("sessionsInfo")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Sessions Count */}
              <div className="space-y-2 sm:w-1/2">
                <Label className="flex items-center gap-1.5">
                  <CalendarDays className="h-3.5 w-3.5 text-orangeColor" />
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
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 6, 7].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {t("sessions")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Session Date Fields */}
              <div className="space-y-3">
                {Array.from({ length: sessionsCount }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-beigeColor/30 border border-beigeColor/60"
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-orangeColor/15 text-orangeColor text-xs font-bold shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={`sessionDates.${index}`}
                        className="text-xs text-muted-foreground"
                      >
                        {t("sessionNo", { number: index + 1 })}
                      </Label>
                      <Input
                        id={`sessionDates.${index}`}
                        type="datetime-local"
                        {...register(`sessionDates.${index}`)}
                        className={cn(
                          "h-9 bg-white",
                          errors.sessionDates?.[index] &&
                            "border-redColor focus-visible:ring-redColor",
                        )}
                      />
                    </div>
                  </div>
                ))}
                {errors.sessionDates && !Array.isArray(errors.sessionDates) && (
                  <p className="text-sm text-redColor">
                    {errors.sessionDates.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Section 3: Players */}
          <Card className="border-none shadow-sm">
            <CardHeader className="pb-4">
              <div className="flex items-center gap-2.5">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-greenColor text-white text-sm font-bold">
                  3
                </div>
                <CardTitle className="text-lg">{t("playersInfo")}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {/* Players Count */}
              <div className="space-y-2 sm:w-1/2">
                <Label className="flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5 text-orangeColor" />
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
                  <SelectTrigger className="h-11">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {[3, 4, 5, 6, 7].map((n) => (
                      <SelectItem key={n} value={String(n)}>
                        {n} {t("players")}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic Player Name Fields */}
              <div className="space-y-3">
                {Array.from({ length: playersCount }).map((_, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-3 p-3 rounded-lg bg-beigeColor/30 border border-beigeColor/60"
                  >
                    <div className="flex items-center justify-center w-7 h-7 rounded-full bg-greenColor/10 text-greenColor text-xs font-bold shrink-0">
                      <User className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <Label
                        htmlFor={`playerNames.${index}`}
                        className="text-xs text-muted-foreground"
                      >
                        {t("playerName")} {index + 1}
                      </Label>
                      <Input
                        id={`playerNames.${index}`}
                        {...register(`playerNames.${index}`)}
                        placeholder={`Player ${index + 1}`}
                        className={cn(
                          "h-9 bg-white",
                          errors.playerNames?.[index] &&
                            "border-redColor focus-visible:ring-redColor",
                        )}
                      />
                    </div>
                  </div>
                ))}
                {errors.playerNames && !Array.isArray(errors.playerNames) && (
                  <p className="text-sm text-redColor">
                    {errors.playerNames.message}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex items-center justify-end gap-3 pt-2 pb-8">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
              className="h-11 px-6"
            >
              {t("backToCampaigns")}
            </Button>
            <Button
              type="submit"
              variant="default"
              disabled={isSubmitting}
              className="h-11 px-8 "
            >
              <Swords className="h-4 w-4 me-2" />
              {isSubmitting ? t("creating") : t("createCampaign")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
