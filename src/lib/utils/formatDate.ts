import { EventDate } from "@/src/models/event";

export function formatDate(date: Date, language: string = "en"): string {
  const locale = language === "en" ? "en-UK" : "ar-UK";
  return new Date(date).toLocaleString(locale, {
    weekday: "long",
    year: "numeric",
    month: "numeric",
    day: "numeric",
    timeZone: "Asia/Riyadh",
  });
}

export function formatTime(date: Date, language: string = "en"): string {
  const locale = language === "en" ? "en-UK" : "ar-UK";
  return new Date(date).toLocaleString(locale, {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
    timeZone: "Asia/Riyadh",
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
    timeZone: "Asia/Riyadh",
  });
}

export function formatTime24H(date: Date): string {
  return new Date(date).toLocaleString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Riyadh",
  });
}

export const eventDateTimeString = (
  date: EventDate,
  language: string = "en",
): string => {
  return `${date.id}-${formatDate(date.date, language)}-${formatTime(
    date.startTime,
    language,
  )}-${formatTime(date.endTime, language)}-${date.capacity}`;
};

export const eventDateTimeShortString = (date: EventDate): string => {
  return `${formatDate(date.date)} | ${formatTime(
    date.startTime,
  )} - ${formatTime(date.endTime)}`;
};
