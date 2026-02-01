"use client";

import { Card } from "@/src/components/ui/card";
import { Event } from "@/src/models/event";
import { AppUser } from "@/src/models/user";
import useSWR, { mutate } from "swr";
import { Checkbox } from "@/src/components/ui/checkbox";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSet,
} from "@/src/components/ui/field";
import { Button } from "@/src/components/ui/button";
import { getAuth } from "firebase/auth";
import { useToast } from "@/src/components/ui/use-toast";
import { useEffect, useState } from "react";

export default function EventsAccess({
  member,
}: {
  member: AppUser | undefined | null;
}) {
  const auth = getAuth();
  const authUser = auth.currentUser!;
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { toast } = useToast();

  const { data: events } = useSWR<Event[]>("/api/admin/members/events");

  const [selectedEvents, setSelectedEvents] = useState<string[]>([]);

  useEffect(() => {
    setSelectedEvents(
      member?.dashboard?.eventsAccess ??
        (events ? events.map((e) => e.id) : []),
    );
  }, [member, events]);

  const handleSelectEvent = (id: string, checked: boolean) => {
    setSelectedEvents((prev) => {
      const next = prev ? [...prev] : [];
      if (checked) {
        if (!next.includes(id)) next.push(id);
        return next;
      }
      return next.filter((e) => e !== id);
    });
  };

  const handleSaveEvents = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const idToken = await authUser.getIdToken();

      const response = await fetch(`/api/admin/members/events`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          id: member?.id,
          data: {
            dashboard: { ...member?.dashboard, eventsAccess: selectedEvents },
          },
        }),
      });

      if (response.ok) {
        await mutate("/api/admin/members");
        await mutate("/api/admin/customers");
        await mutate(`/api/profile/${member?.id}`);

        toast({
          title: "Member updated",
          description: "Member details have been successfully updated.",
          variant: "success",
        });
      } else {
        toast({
          title: "Error updating member",
          description: "Failed to update member details. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Error updating member",
        description: "Failed to update member details. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div>
      <h1 className="text-2xl font-semibold">Events Access</h1>
      <FieldSet>
        <FieldDescription>
          Select the events that can member access to
        </FieldDescription>
        <Card className="space-y-3 p-3">
          {events?.map((event, index) => (
            <FieldGroup key={index} className="gap-3 mb-1">
              <Field orientation="horizontal">
                <Checkbox
                  id={event.id}
                  name={event.id}
                  checked={selectedEvents.includes(event.id)}
                  onCheckedChange={(checked) =>
                    handleSelectEvent(event.id, checked === true)
                  }
                />
                <FieldLabel
                  htmlFor={event.id}
                  className="font-normal flex items-center"
                >
                  {event.title}{" "}
                  <span className="text-xs text-orangeColor">
                    {event.city.en}
                  </span>
                </FieldLabel>
              </Field>
            </FieldGroup>
          ))}
          <Button
            onClick={handleSaveEvents}
            disabled={isSubmitting}
            className="w-32"
          >
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </Card>
      </FieldSet>
    </div>
  );
}
