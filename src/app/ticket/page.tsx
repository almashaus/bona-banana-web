"use client";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import Loading from "@/src/components/ui/loading";
import { formatDate, formatTime } from "@/src/lib/utils/formatDate";
import { Event, EventDate } from "@/src/models/event";
import { Ticket, TicketStatus } from "@/src/models/ticket";
import { AppUser } from "@/src/models/user";
import { Calendar } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import useSWR from "swr";

function TicketView() {
  const [date, setDate] = useState<EventDate | null>(null);
  const [isValid, setIsValid] = useState<Boolean>();
  const searchParams = useSearchParams();
  const token = searchParams?.get("token");

  interface Response {
    user: AppUser;
    event: Event;
    ticket: Ticket;
  }

  const { data, error, isLoading } = useSWR<Response>(
    `/api/ticket?token=${token}`
  );

  useEffect(() => {
    if (data) {
      const matchDate =
        data.event.dates.find((d) => d.id == data.ticket.eventDateId) || null;
      setDate(matchDate);

      setIsValid(data.ticket.status === TicketStatus.VALID);
    }
  }, [data]);

  return (
    <div className="container py-6">
      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Loading />
        </div>
      )}

      {error && (
        <div className="flex justify-center items-center py-12">Error !</div>
      )}
      {data && (
        <div className="grid gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Event Details */}

            <Card>
              <CardHeader>
                <CardTitle className="flex items-end gap-2">
                  <Calendar className="h-5 w-5 text-redColor" />
                  Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Event Name
                  </Label>
                  <p className="font-medium">{data.event.title}</p>
                </div>

                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Date
                  </Label>
                  <p>{formatDate(date?.date!)}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Time
                  </Label>
                  <p>
                    {formatTime(date?.startTime!)} -{" "}
                    {formatTime(date?.endTime!)}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TicketPage() {
  return (
    <Suspense>
      <TicketView />
    </Suspense>
  );
}
