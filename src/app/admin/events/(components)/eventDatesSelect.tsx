"use client";

import type React from "react";
import { CalendarIcon, Plus, Repeat2, Trash2 } from "lucide-react";
import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Input } from "@/src/components/ui/input";
import { Label } from "@/src/components/ui/label";
import { format } from "date-fns";
import { Calendar } from "@/src/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/src/components/ui/radio-group";
import { cn } from "@/src/lib/utils/utils";
import { formatDate } from "@/src/lib/utils/formatDate";
import { EventDate } from "@/src/models/event";
import { useState } from "react";
import { RepeatDates } from "./repeatedDates";
import { Separator } from "@/src/components/ui/separator";

interface EventDatesSelectType {
  eventDates: EventDate[];
  addEventDate: () => void;
  removeEventDate: (eventDateId: string) => void;
  updateEventDate: (id: string, field: keyof EventDate, value: any) => void;
  setRepeatedDates: (eventDates: EventDate[]) => void;
}

export const EventDatesSelect = ({
  eventDates,
  removeEventDate,
  updateEventDate,
  addEventDate,
  setRepeatedDates,
}: EventDatesSelectType) => {
  const [selectedOption, setSelectedOption] = useState("fixed");

  return (
    <Card>
      <CardHeader>
        <CardTitle>Event Dates</CardTitle>
        <CardDescription>Add one or more dates for your event</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="my-6">
          <RadioGroup
            value={selectedOption}
            onValueChange={setSelectedOption}
            className="flex flex-row space-x-20"
          >
            <div className="flex items-center gap-3">
              <RadioGroupItem value="fixed" id="fixed" />
              <Label
                htmlFor="fixed"
                className={`text-lg cursor-pointer ${selectedOption !== "fixed" && "text-muted-foreground"}`}
              >
                Fixed Dates
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <RadioGroupItem value="repeated" id="repeated" />
              <Label
                htmlFor="repeated"
                className={`text-lg cursor-pointer ${selectedOption !== "repeated" && "text-muted-foreground"}`}
              >
                Repeated Date
              </Label>
            </div>
          </RadioGroup>
        </div>

        <Separator className="my-5" />
        <div>
          {/* Fixed date */}
          {selectedOption === "fixed" ? (
            <div className="space-y-6">
              {eventDates.map((eventDate, index) => (
                <div
                  key={eventDate.id}
                  className="space-y-4 mt-6 border-b last:border-b-0"
                >
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg md:text-xl font-medium text-orangeColor underline">
                      Date {index + 1}
                    </h3>
                    {eventDates.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="text-red-500 hover:text-red-500"
                        onClick={() => removeEventDate(eventDate.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                        Remove
                      </Button>
                    )}
                  </div>

                  <div className="grid grid-cols-1 lg:w-1/2 gap-4 mx-5">
                    <div className="grid sm:grid-cols-5 items-center gap-2">
                      <Label className="col-span-1">Date</Label>
                      <div className="col-span-4">
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button
                              variant="outline"
                              className={cn(
                                "justify-start text-left font-normal bg-white",
                                !eventDate.date && "text-muted-foreground"
                              )}
                            >
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {eventDate.date ? (
                                <span>{formatDate(eventDate.date)}</span>
                              ) : (
                                <span>Pick a date</span>
                              )}
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              dir="ltr"
                              mode="single"
                              selected={eventDate.date}
                              onSelect={(day) => {
                                if (day) {
                                  const startTime = new Date(
                                    eventDate.startTime
                                  );
                                  const newStartDate = new Date(day);
                                  newStartDate.setHours(
                                    Number(startTime.getHours())
                                  );
                                  newStartDate.setMinutes(
                                    Number(startTime.getMinutes())
                                  );

                                  updateEventDate(
                                    eventDate.id,
                                    "startTime",
                                    newStartDate
                                  );

                                  const endTime = new Date(eventDate.endTime);
                                  const newEndDate = new Date(day);
                                  newEndDate.setHours(
                                    Number(endTime.getHours())
                                  );
                                  newEndDate.setMinutes(
                                    Number(endTime.getMinutes())
                                  );

                                  updateEventDate(
                                    eventDate.id,
                                    "endTime",
                                    newEndDate
                                  );

                                  const newDate = new Date(day);

                                  updateEventDate(
                                    eventDate.id,
                                    "date",
                                    newDate
                                  );
                                }
                              }}
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="grid sm:grid-cols-5 items-center gap-2">
                      <Label className="col-span-1">Start Time</Label>
                      <div className="col-span-4 w-max">
                        <Input
                          dir="ltr"
                          type="time"
                          value={format(eventDate.startTime, "HH:mm")}
                          onChange={(e) => {
                            try {
                              const { value } = e.target;

                              if (!value) {
                                return;
                              }

                              const [hours, minutes] = value.split(":");
                              const newDate = new Date(eventDate.date);
                              newDate.setHours(Number(hours));
                              newDate.setMinutes(Number(minutes));

                              updateEventDate(
                                eventDate.id,
                                "startTime",
                                newDate
                              );
                            } catch (_) {}
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-5 items-center gap-2">
                      <Label className="col-span-1">End Time</Label>

                      <div className="col-span-4 w-max">
                        <Input
                          dir="ltr"
                          type="time"
                          value={format(eventDate.endTime, "HH:mm")}
                          onChange={(e) => {
                            try {
                              const { value } = e.target;

                              if (!value) {
                                return;
                              }

                              const [hours, minutes] = value.split(":");
                              const newDate = new Date(eventDate.date);
                              newDate.setHours(Number.parseInt(hours));
                              newDate.setMinutes(Number.parseInt(minutes));
                              updateEventDate(eventDate.id, "endTime", newDate);
                            } catch (_) {}
                          }}
                        />
                      </div>
                    </div>
                    <div className="grid sm:grid-cols-5 items-center gap-2 mb-8">
                      <Label
                        htmlFor={`capacity-${eventDate.id}`}
                        className="col-span-1"
                      >
                        Capacity
                      </Label>
                      <div className="col-span-4">
                        <Input
                          id={`capacity-${eventDate.id}`}
                          type="number"
                          min="1"
                          value={eventDate.capacity}
                          onChange={(e) => {
                            updateEventDate(
                              eventDate.id,
                              "capacity",
                              Number.parseInt(e.target.value)
                            );
                          }}
                          placeholder="20"
                          className="w-[114px]"
                          required
                        />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              <Button
                type="button"
                onClick={addEventDate}
                className="w-full text-black/80 bg-muted-foreground/30 hover:bg-muted-foreground/20"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Another Date
              </Button>
            </div>
          ) : (
            <RepeatDates setRepeatedDates={setRepeatedDates} />
          )}
        </div>
      </CardContent>
    </Card>
  );
};
