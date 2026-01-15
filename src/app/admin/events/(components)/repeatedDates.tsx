"use client";

import { useEffect, useState } from "react";
import { format } from "date-fns";
import { ArrowRight, CalendarIcon, Lightbulb, X } from "lucide-react";
import { cn, isAfterDate, isBeforeDate } from "@/src/lib/utils/utils";
import { Button } from "@/src/components/ui/button";
import { Separator } from "@/src/components/ui/separator";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { Label } from "@/src/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/src/components/ui/select";
import { ToggleGroup, ToggleGroupItem } from "@/src/components/ui/toggle-group";
import { Input } from "@/src/components/ui/input";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { formatDate } from "@/src/lib/utils/formatDate";
import { EventDate } from "@/src/models/event";
import { getRepeatedDates } from "@/src/lib/utils/getRepeatedDates";
import { useToast } from "@/src/hooks/use-toast";

type Repeats = "daily" | "weekly" | "monthly";
type EndsMode = "after" | "onDate";
type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

const WEEKDAYS = [
  { key: 0, label: "Sun" },
  { key: 1, label: "Mon" },
  { key: 2, label: "Tue" },
  { key: 3, label: "Wed" },
  { key: 4, label: "Thu" },
  { key: 5, label: "Fri" },
  { key: 6, label: "Sat" },
] as const;

interface RepeatDatesInterface {
  setRepeatedDates: (eventsDates: EventDate[]) => void;
}

export function RepeatDates({ setRepeatedDates }: RepeatDatesInterface) {
  const { toast } = useToast();
  const [repeats, setRepeats] = useState<Repeats>("weekly");
  const [repeatEvery, setRepeatEvery] = useState<number>(1);

  const [repeatOn, setRepeatOn] = useState<Weekday[]>([2, 4]);

  const [startsOnDate, setStartsOnDate] = useState<Date | undefined>(
    new Date()
  );

  const [endsMode, setEndsMode] = useState<EndsMode>("onDate");
  const [endsAfter, setEndsAfter] = useState<string>("3");
  const [endsOnDate, setEndsOnDate] = useState<Date | undefined>(() => {
    const date = new Date(startsOnDate!);
    date.setMonth(date.getMonth() + 1);
    return date;
  });

  const [startTime, setStartTime] = useState(() => {
    const date = new Date(startsOnDate!);
    date.setHours(18, 0, 0, 0); // 6:00 PM
    return date;
  });
  const [endTime, setEndTime] = useState(() => {
    const date = new Date(startsOnDate!);
    date.setHours(23, 0, 0, 0); // 11:00 PM
    return date;
  });

  const [capacity, setCapacity] = useState<number>(20);

  const [highlightDates, setHighlightDates] = useState<Date[]>();
  const [savedDates, setSavedDates] = useState<Date[]>([]);

  const [startsOnPopoverOpen, setStartsOnPopoverOpen] = useState(false);
  const [endsOnPopoverOpen, setEndsOnPopoverOpen] = useState(false);
  const [endsOnError, setEndsOnError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const getRepeatLabel = (repeat: Repeats) => {
    switch (repeat) {
      case "daily":
        return "day";

      case "weekly":
        return "week";

      case "monthly":
        return "month";
      default:
        break;
    }
  };

  function updatedRepeatedDates(dates: Date[]): EventDate[] {
    const repeatedEventDates: EventDate[] = dates.map(getEventDate);

    return repeatedEventDates;
  }

  function getEventDate(date: Date): EventDate {
    const eventDate: EventDate = {
      id: `date${date.getTime()}`,
      date: date,
      startTime: startTime,
      endTime: endTime,
      capacity: capacity,
      availableTickets: capacity,
      eventId: "",
    };
    return eventDate;
  }

  useEffect(() => {
    const dates = getRepeatedDates({
      startsOn: startsOnDate!,
      repeats: repeats,
      interval: repeatEvery,
      repeatOnWeekdays: repeatOn,
      endsMode: endsMode,
      afterOccurrences: endsMode === "after" ? Number(endsAfter) : undefined,
      endsOnDate: endsOnDate,
      weekStartsOn: 0,
    });

    setHighlightDates(dates);
  }, [
    startsOnDate,
    endsOnDate,
    repeats,
    repeatEvery,
    repeatOn,
    endsMode,
    endsAfter,
    startTime,
    endTime,
    capacity,
  ]);

  return (
    <div className="md:px-4">
      {/* Body: left form + right calendar */}
      <div className="flex flex-col lg:flex-row justify-start 2xl:gap-10">
        {/* Left: form */}
        <div className="space-y-8">
          <div className="grid gap-4 grid-cols-1 sm:items-center">
            <div className="grid sm:grid-cols-5 items-center gap-2">
              <Label className="col-span-1 text-sm">Repeats</Label>
              <div className="col-span-4">
                <Select
                  value={repeats}
                  onValueChange={(v) => setRepeats(v as Repeats)}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue placeholder="Select" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid sm:grid-cols-5 items-center gap-2">
              <Label className="col-span-1 text-sm">Repeat every</Label>
              <div className="col-span-4">
                <Select
                  value={String(repeatEvery)}
                  onValueChange={(v) => setRepeatEvery(Number(v))}
                >
                  <SelectTrigger className="h-10">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.from({ length: 12 }).map((_, i) => {
                      const val = i + 1;
                      return (
                        <SelectItem key={val} value={String(val)}>
                          {`${val} ${getRepeatLabel(repeats)}${val > 1 ? "s" : ""}`}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Repeat on */}
          <div className="grid sm:grid-cols-5 items-center gap-2">
            <Label className="col-span-1 text-sm">Repeat on</Label>
            <div className="col-span-4">
              <ToggleGroup
                type="multiple"
                value={repeatOn.map(String)}
                onValueChange={(vals) => {
                  if (vals.length > 0) {
                    setRepeatOn(
                      Array.isArray(vals)
                        ? (vals.map((v) => Number(v)) as Weekday[])
                        : []
                    );
                  }
                }}
                className="flex flex-wrap justify-start gap-2"
                disabled={repeats !== "weekly"}
              >
                {WEEKDAYS.map((d) => (
                  <ToggleGroupItem
                    key={d.key}
                    value={String(d.key)}
                    className={cn(
                      "h-9 w-[54px] rounded-md border text-sm",
                      "data-[state=on]:border-transparent data-[state=on]:bg-primary data-[state=on]:text-primary-foreground"
                    )}
                  >
                    {d.label}
                  </ToggleGroupItem>
                ))}
              </ToggleGroup>
            </div>
          </div>

          {/* Starts on */}
          <div className="grid sm:grid-cols-5 items-center gap-2">
            <Label className="col-span-1">Starts on</Label>
            <div className="col-span-4">
              <Popover
                open={startsOnPopoverOpen}
                onOpenChange={setStartsOnPopoverOpen}
              >
                <PopoverTrigger asChild>
                  <Button variant="outline" className={"font-normal"}>
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {startsOnDate ? (
                      formatDate(startsOnDate)
                    ) : (
                      <span>Pick a date</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    dir="ltr"
                    mode="single"
                    selected={startsOnDate}
                    onSelect={(day) => {
                      if (day) {
                        setStartsOnDate(day);

                        const newEndDate = new Date(day);
                        newEndDate.setMonth(newEndDate.getMonth() + 1);
                        setEndsOnDate(newEndDate);

                        setStartsOnPopoverOpen(false);
                      }
                    }}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Ends */}
          <div className="grid sm:grid-cols-5 items-center gap-2">
            <Label className="col-span-1">Ends</Label>
            <div className="col-span-4">
              <RadioGroup
                value={endsMode}
                onValueChange={(v) => setEndsMode(v as EndsMode)}
                className="space-y-1"
              >
                <label className="flex items-center gap-3">
                  <RadioGroupItem value="onDate" />
                  <span className="text-sm">On</span>
                  <div className="">
                    <Popover
                      open={endsOnPopoverOpen}
                      onOpenChange={setEndsOnPopoverOpen}
                    >
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className="font-normal"
                          disabled={endsMode !== "onDate"}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {endsMode === "onDate" && endsOnDate ? (
                            formatDate(endsOnDate)
                          ) : (
                            <span>Pick a date</span>
                          )}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="flex flex-col items-center w-auto">
                        <Calendar
                          dir="ltr"
                          mode="single"
                          selected={endsOnDate}
                          onSelect={(day) => {
                            if (day) {
                              if (isBeforeDate(day, startsOnDate!)) {
                                setEndsOnError(true);
                                setEndsOnPopoverOpen(true);
                                return;
                              }
                              setEndsOnError(false);
                              setEndsOnDate(day);
                              setEndsOnPopoverOpen(false);
                            }
                          }}
                        />
                        {endsOnError && (
                          <span dir="ltr" className="text-redColor text-sm">
                            You should select a date after start date!
                          </span>
                        )}
                      </PopoverContent>
                    </Popover>
                  </div>
                </label>

                <div className="flex items-center gap-3">
                  <RadioGroupItem value="after" />
                  <span className="text-sm">After</span>
                  <Input
                    value={endsAfter}
                    type="number"
                    onChange={(e) => {
                      const value = e.target.value;
                      if (Number.parseInt(value) > 0) {
                        setEndsAfter(value);
                      }
                    }}
                    className="h-9 w-20"
                    inputMode="numeric"
                    placeholder=""
                    disabled={endsMode !== "after"}
                  />
                  <span className="text-sm">events</span>
                </div>
              </RadioGroup>
            </div>
          </div>

          {/* Time */}
          <div className="grid sm:grid-cols-5 items-center gap-2">
            <Label className="col-span-1">Time</Label>
            <div className="col-span-4">
              <div className="flex flex-row items-center space-x-2">
                <div>
                  <Input
                    dir="ltr"
                    type="time"
                    value={format(startTime, "HH:mm")}
                    onChange={(e) => {
                      try {
                        const { value } = e.target;

                        if (!value) {
                          return;
                        }

                        const [hours, minutes] = value.split(":");
                        const startDate = new Date(startsOnDate!);
                        startDate.setHours(Number.parseInt(hours));
                        startDate.setMinutes(Number.parseInt(minutes));

                        setStartTime(startDate);
                      } catch (_) {}
                    }}
                  />
                </div>

                <ArrowRight className="w-5 h-5" />
                <div>
                  <Input
                    dir="ltr"
                    type="time"
                    value={format(endTime, "HH:mm")}
                    onChange={(e) => {
                      try {
                        const { value } = e.target;

                        if (!value) {
                          return;
                        }

                        const [hours, minutes] = value.split(":");
                        const endDate = new Date(startsOnDate!);
                        endDate.setHours(Number.parseInt(hours));
                        endDate.setMinutes(Number.parseInt(minutes));

                        setEndTime(endDate);
                      } catch (_) {}
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-5 items-center gap-2">
            <Label htmlFor={`capacity-`}>Capacity</Label>
            <Input
              id={`capacity-`}
              type="number"
              min="1"
              value={capacity}
              onChange={(e) => {
                setCapacity(Number.parseInt(e.target.value));
              }}
              placeholder="20"
              className="w-[114px]"
              required
            />
          </div>
        </div>

        {/* Right: calendar preview */}
        <div className="py-10 lg:py-0 lg:px-10 w-min space-y-6">
          <Label>Preview</Label>
          <div className="w-[300px]">
            <Calendar
              key={
                startsOnDate ? startsOnDate.toISOString() : "preview-calendar"
              }
              mode="multiple"
              selected={highlightDates}
              onSelect={(dates) => {}}
              defaultMonth={startsOnDate}
            />

            <div className="flex fle-row items-center ms-6 mt-3 text-xs text-muted-foreground">
              <Lightbulb className="w-4 h-4 me-1" /> You can see the repeated
              dates here
            </div>
          </div>
        </div>
      </div>
      <div className="flex justify-center my-3">
        <Button
          type="button"
          disabled={isSaving}
          className={`${isSaving && "px-16"} ${savedDates === highlightDates && " bg-gray-300 hover:bg-gray-300"}`}
          onClick={() => {
            setIsSaving(true);
            setRepeatedDates(updatedRepeatedDates(highlightDates!));
            setSavedDates(highlightDates!);

            setTimeout(() => {
              setIsSaving(false);
            }, 2000);
          }}
        >
          {isSaving ? "..." : "Save Repeated Dates"}
        </Button>
      </div>
    </div>
  );
}
