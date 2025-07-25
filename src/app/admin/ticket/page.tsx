"use client";

import { Button } from "@/src/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/src/components/ui/card";
import { Label } from "@/src/components/ui/label";
import Loading from "@/src/components/ui/loading";
import { formatDate, formatTime } from "@/src/lib/utils/formatDate";
import { getTicketStatusBadgeColor } from "@/src/lib/utils/styles";
import { Event, EventDate } from "@/src/models/event";
import { Ticket, TicketStatus } from "@/src/models/ticket";
import { AppUser } from "@/src/models/user";
import { Check, Calendar, User, CheckCircle, CheckCheck } from "lucide-react";
import { useSearchParams } from "next/navigation";

import { useEffect, useState } from "react";
import useSWR, { mutate } from "swr";

export default function ValidateTicketPage() {
  const [date, setDate] = useState<EventDate | null>(null);
  const [isValid, setIsValid] = useState<Boolean>();
  const [isUpdating, setIsUpdating] = useState<Boolean>(false);
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

  const validateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsUpdating(true);
    try {
      const res = await fetch(`/api/ticket/validate?token=${token}`);
      const data = await res.json();
      if (!data.valid) {
        await mutate(`/api/ticket?token=${token}`);
      }
    } catch (error) {
    } finally {
      setIsUpdating(false);
    }
  };

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
            {/* Customer Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-end gap-2">
                  <User className="h-5 w-5 text-redColor" />
                  Customer Information
                </CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 gap-4">
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Name
                  </Label>
                  <p className="font-medium">{data.user.name}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Email
                  </Label>
                  <p>{data.user.email}</p>
                </div>
                <div>
                  <Label className="text-sm font-medium text-muted-foreground">
                    Phone
                  </Label>
                  <p>{data.user.phone}</p>
                </div>
              </CardContent>
            </Card>

            {/* Event & Order Details */}

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
                    {formatTime(date?.endTime!)}{" "}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="flex justify-center">
            <Card className="w-full sm:max-w-xs text-center">
              <CardHeader>
                <CardTitle className="flex justify-center items-end gap-2">
                  <Check className="h-5 w-5 text-redColor" />
                  Confirm attendance
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  {isValid ? (
                    <div>
                      <Button
                        className="w-24 h-24 mb-2"
                        onClick={validateTicket}
                      >
                        {isUpdating ? <Loading /> : <CheckCircle size={50} />}
                      </Button>
                      <h3
                        className={`text-lg font-medium ${data.ticket.status === TicketStatus.VALID ? "text-orangeColor" : "text-green-600"}`}
                      >
                        {data.ticket.status}
                      </h3>
                    </div>
                  ) : (
                    <div>
                      <Button className="w-24 h-24 bg-green-600  mb-2" disabled>
                        <CheckCheck size={50} />
                      </Button>
                      <h3
                        className={`text-lg font-medium ${data.ticket.status === TicketStatus.VALID ? "text-orangeColor" : "text-green-600"}`}
                      >
                        {data.ticket.status}
                      </h3>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
