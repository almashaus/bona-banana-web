import { EventDate } from "@/src/models/event";

export function formatDate(date: Date): string {
  return new Date(date).toLocaleString("en-UK", {
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export function formatTime(date: Date): string {
  return new Date(date).toLocaleString("en-UK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTime(date: Date): string {
  return new Date(date).toLocaleString("en-UK", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTime24H(date: Date): string {
  return new Date(date).toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export const eventDateTimeString = (date: EventDate): string => {
  return `${date.id}-${formatDate(date.date)}-${formatTime(
    date.startTime
  )}-${formatTime(date.endTime)}-${date.capacity}`;
};

export const eventDateTimeShortString = (date: EventDate): string => {
  return `${formatDate(date.date)} | ${formatTime(
    date.startTime
  )} - ${formatTime(date.endTime)}`;
};
