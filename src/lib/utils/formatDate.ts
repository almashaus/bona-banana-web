import { DocumentData, Timestamp } from "firebase/firestore";
import { Event, EventDate } from "@/src/models/event";

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

export function formatEventsDates(data: DocumentData, isLoop: Boolean): Event {
  for (let i = 0; i < (isLoop ? data.dates.length : 1); i++) {
    const theDate = data.dates[i];

    if (theDate && theDate.date) {
      const timestamp: Timestamp = theDate.date;
      theDate.date = timestamp.toDate();

      const timestampStart: Timestamp = theDate.startTime;
      theDate.startTime = timestampStart.toDate();

      const timestampEnd: Timestamp = theDate.endTime;
      theDate.endTime = timestampEnd.toDate();
    }
  }
  return data as Event;
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
