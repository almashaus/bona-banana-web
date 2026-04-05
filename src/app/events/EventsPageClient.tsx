"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { Search, TriangleAlert, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { Event } from "@/src/models/event";
import { Input } from "@/src/components/ui/input";
import { Button } from "@/src/components/ui/button";
import { cn } from "@/src/lib/utils/utils";
import { EventCard } from "../(components)/eventCard";

type SortKey = "soonest" | "latest" | "price-asc" | "price-desc";
type DateRange = "all" | "this-week" | "this-month";

function getNearestDate(event: Event): Date {
  const now = new Date();
  const dates = event.dates.map((d) => new Date(d.date));
  const upcoming = dates.filter((d) => d >= now);
  if (upcoming.length)
    return upcoming.sort((a, b) => a.getTime() - b.getTime())[0];
  return dates.sort((a, b) => b.getTime() - a.getTime())[0];
}

interface PillProps {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  variant?: "red" | "green" | "yellow";
}

function FilterPill({ active, onClick, children, variant = "red" }: PillProps) {
  const base =
    "px-4 py-1 pb-2 rounded-full text-sm border transition-colors cursor-pointer whitespace-nowrap";
  const styles = {
    red: active
      ? "bg-redColor text-white border-redColor"
      : "border-redColor text-redColor hover:bg-redColor/10",
    green: active
      ? "bg-greenColor text-white border-greenColor"
      : "border-greenColor text-greenColor hover:bg-greenColor/10",
    yellow: active
      ? "bg-yellowColor text-white border-yellowColor"
      : "border-yellowColor text-yellowColor hover:bg-yellowColor/10",
  };
  return (
    <button onClick={onClick} className={cn(base, styles[variant])}>
      {children}
    </button>
  );
}

export default function EventsPageClient({ events }: { events: Event[] }) {
  const locale = useLocale();
  const t = useTranslations("EventsPage");
  const dir = locale === "en" ? "ltr" : "rtl";

  const [search, setSearch] = useState("");
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<SortKey>("soonest");
  const [dateRange, setDateRange] = useState<DateRange>("all");
  const [freeOnly, setFreeOnly] = useState(false);

  // Extract unique cities from the event list
  const cities = useMemo(() => {
    const seen = new Set<string>();
    return events
      .map((e) => ({ en: e.city.en, ar: e.city.ar }))
      .filter((c) => {
        if (seen.has(c.en)) return false;
        seen.add(c.en);
        return true;
      });
  }, [events]);

  // Filter → sort pipeline (all client-side, no extra fetches)
  const filtered = useMemo(() => {
    const now = new Date();
    const weekEnd = new Date(now);
    weekEnd.setDate(weekEnd.getDate() + 7);
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    return events
      .filter((event) => {
        // Full-text search across title / venue / city
        if (search.trim()) {
          const q = search.toLowerCase();
          const haystack = [
            event.title,
            event.titleAr,
            event.venue,
            event.city.en,
            event.city.ar,
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }

        // City filter
        if (selectedCity && event.city.en !== selectedCity) return false;

        // Free-only toggle
        if (freeOnly && event.price !== 0) return false;

        // Date range — compare nearest upcoming event date
        if (dateRange !== "all") {
          const nearest = getNearestDate(event);
          if (dateRange === "this-week" && nearest > weekEnd) return false;
          if (dateRange === "this-month" && nearest > monthEnd) return false;
        }

        return true;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case "soonest":
            return getNearestDate(a).getTime() - getNearestDate(b).getTime();
          case "latest":
            return getNearestDate(b).getTime() - getNearestDate(a).getTime();
          case "price-asc":
            return a.price - b.price;
          case "price-desc":
            return b.price - a.price;
        }
      });
  }, [events, search, selectedCity, freeOnly, dateRange, sortBy]);

  const hasActiveFilters =
    !!search ||
    !!selectedCity ||
    freeOnly ||
    dateRange !== "all" ||
    sortBy !== "soonest";

  const clearFilters = () => {
    setSearch("");
    setSelectedCity(null);
    setFreeOnly(false);
    setDateRange("all");
    setSortBy("soonest");
  };

  return (
    <div dir={dir} className="min-h-screen bg-lightBeigeColor">
      {/* ── Hero ── */}
      <section className="relative pt-12 pb-8 px-6 text-center overflow-hidden">
        <Image
          src="/images/events-background.jpg"
          alt=""
          fill
          className="object-cover"
          priority
        />
        <div className="absolute inset-0 bg-black/50" />
        <div className="relative z-10">
          <h1 className="text-4xl font-bold tracking-tight md:text-5xl text-white">
            {t("title")} <span className="text-2xl md:text-3xl">🎲</span>
          </h1>
          <p className="mt-3 max-w-xl mx-auto text-white/80 text-base md:text-lg">
            {t("subtitle")}
          </p>
        </div>
      </section>

      {/* ── Sticky filter bar ── */}
      <div className="sticky top-16 z-30 bg-beigeColor border-b border-beigeColor/80 shadow-sm">
        <div className="max-w-5xl mx-auto px-4 py-4 md:py-6 space-y-3">
          {/* Row 1: search + sort + clear */}
          <div className="flex items-center gap-2 flex-wrap">
            <div className="relative flex-1 min-w-[180px]">
              <Search
                className={cn(
                  "absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none",
                  locale === "en" ? "left-3" : "right-3",
                )}
              />
              <Input
                className={cn(
                  "bg-white border-neutral-200 focus-visible:ring-orangeColor",
                  locale === "en" ? "pl-9" : "pr-9",
                )}
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                aria-label={t("searchPlaceholder")}
              />
            </div>

            {/* <Select
              value={sortBy}
              onValueChange={(v) => setSortBy(v as SortKey)}
              dir={dir}
            >
              <SelectTrigger className="w-48 bg-white border-neutral-200 shrink-0">
                <ArrowUpDown className="h-4 w-4 me-2 text-muted-foreground shrink-0" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent dir={dir}>
                <SelectItem value="soonest">{t("sortSoonest")}</SelectItem>
                <SelectItem value="latest">{t("sortLatest")}</SelectItem>
                <SelectItem value="price-asc">{t("sortPriceAsc")}</SelectItem>
                <SelectItem value="price-desc">{t("sortPriceDesc")}</SelectItem>
              </SelectContent>
            </Select> */}

            {hasActiveFilters && (
              <Button
                variant="ghost"
                size="sm"
                onClick={clearFilters}
                className="text-redColor hover:bg-redColor/10 hover:text-redColor gap-1 shrink-0"
              >
                <X className="h-3.5 w-3.5 mt-1" />
                {t("clearFilters")}
              </Button>
            )}
          </div>

          {/* Row 2: city pills + date range pills + free toggle */}
          <div className="flex flex-col md:flex-row items-center justify-center gap-2 ">
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">📍</span>
              {/* City pills */}
              <FilterPill
                active={selectedCity === null}
                onClick={() => setSelectedCity(null)}
                variant="red"
              >
                {t("allCities")}
              </FilterPill>
              {cities.map((city) => (
                <FilterPill
                  key={city.en}
                  active={selectedCity === city.en}
                  onClick={() =>
                    setSelectedCity(selectedCity === city.en ? null : city.en)
                  }
                  variant="red"
                >
                  {locale === "en" ? city.en : city.ar}
                </FilterPill>
              ))}
              <span className="w-px h-5 bg-stone-400 mx-0.5 shrink-0 hidden md:inline" />
            </div>
            <div className="flex items-center justify-center gap-2">
              <span className="text-xl">🗓️</span>
              {/* Date range pills */}
              <FilterPill
                active={dateRange === "all"}
                onClick={() => setDateRange("all")}
                variant="green"
              >
                {t("dateAll")}
              </FilterPill>
              <FilterPill
                active={dateRange === "this-week"}
                onClick={() => setDateRange("this-week")}
                variant="green"
              >
                {t("dateThisWeek")}
              </FilterPill>
              <FilterPill
                active={dateRange === "this-month"}
                onClick={() => setDateRange("this-month")}
                variant="green"
              >
                {t("dateThisMonth")}
              </FilterPill>
              <span className="w-px h-5 bg-stone-400 mx-0.5 shrink-0 hidden md:inline" />
            </div>
            <div className="flex items-center justify-center gap-2">
              {/* Free-only toggle */}
              <span className="text-xl">💰</span>
              <FilterPill
                active={freeOnly}
                onClick={() => setFreeOnly(!freeOnly)}
                variant="yellow"
              >
                {t("freeOnly")}
              </FilterPill>
            </div>
          </div>
        </div>
      </div>

      {/* ── Results grid ── */}
      <main className="p-6">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center space-y-3">
            <TriangleAlert className="h-10 w-10 text-stone-400" />
            <p className="text-lg font-semibold">{t("noResults")}</p>
            <p className="text-muted-foreground text-sm">
              {t("noResultsSubtitle")}
            </p>
            {hasActiveFilters && (
              <Button
                variant="ghost"
                className="mt-2 border-redColor text-redColor hover:bg-redColor hover:text-white transition-colors gap-1"
                onClick={clearFilters}
              >
                <X className="h-3.5 w-3.5 mt-1" />
                {t("clearFilters")}
              </Button>
            )}
          </div>
        ) : (
          <div className="grid max-w-5xl justify-center items-center gap-6 m-6 lg:mx-auto md:grid-cols-2 lg:grid-cols-3">
            {filtered.map((event) => (
              <EventCard key={event.id} event={event} locale={locale} t={t} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
