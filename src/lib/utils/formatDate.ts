import { DocumentData, Timestamp } from "firebase/firestore";
import { Event, EventDate } from "@/src/models/event";

export function formatDate(date: Date): string {
  return date.toLocaleString("en-UK", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleString("en-UK", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatDateTime(date: Date): string {
  return date.toLocaleString("en-UK", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatTime24H(date: Date): string {
  return date.toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

export function formatEventsDates(data: DocumentData, isLoop: Boolean): Event {
  for (let i = 0; i < (isLoop ? data.dates.length : 1); i++) {
    const theDate = data.dates[i];

    if (theDate && theDate.date) {
      const timestamp: Timestamp = theDate.date;
      theDate.date = timestamp.toDate();

      const timestamp_start: Timestamp = theDate.start_time;
      theDate.start_time = timestamp_start.toDate();

      const timestamp_end: Timestamp = theDate.end_time;
      theDate.end_time = timestamp_end.toDate();
    }
  }
  return data as Event;
}

export const eventDateTimeString = (date: EventDate): string => {
  return `${date.event_date_id}-${formatDate(date.date)}-${formatTime(
    date.start_time
  )}-${formatTime(date.end_time)}-${date.capacity}`;
};

export const eventDateTimeShortString = (date: EventDate): string => {
  return `${formatDate(date.date)} | ${formatTime(
    date.start_time
  )} - ${formatTime(date.end_time)}`;
};
