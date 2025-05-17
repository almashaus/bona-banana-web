import { DocumentData, Timestamp } from "@firebase/firestore";
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { Event } from "@/data/models";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: Date): string {
  return date.toLocaleString("en-UK", {
    year: "numeric",
    month: "numeric",
    day: "numeric",
    hour12: true,
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleString("en-UK", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
}

export function formatEventsDates(data: DocumentData, isLoop: Boolean): Event {
  for (let i = 0; i < (isLoop ? data.dates.length : 1); i++) {
    const theDate = data.dates[i];

    if (theDate && theDate.date) {
      const timestamp: Timestamp = theDate.date;
      const date: Date = timestamp.toDate();

      theDate.date = date.toLocaleString("en-UK", {
        year: "numeric",
        month: "numeric",
        day: "numeric",
        hour12: true,
      });

      const timestamp_start: Timestamp = theDate.start_time;
      const start_time: Date = timestamp_start.toDate();
      theDate.start_time = start_time.toLocaleString("en-UK", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });

      const timestamp_end: Timestamp = theDate.end_time;
      const end_time: Date = timestamp_end.toDate();
      theDate.end_time = end_time.toLocaleString("en-UK", {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      });
    }
  }
  return data as Event;
}

export function generateOrderNumber(): string {
  return `ORDER-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generateQRCode(text: string): string {
  // In a real app, this would generate a QR code
  // For now, we'll just return a placeholder
  return `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(
    text
  )}`;
}

export function generateEventId(length = 10) {
  const characters = "abcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * characters.length);
    result += characters.charAt(randomIndex);
  }

  return result;
}

export function dateTimeStringToDate(dateStr: string, timeStr: string): Date {
  // Parse date: "14/05/2025"
  const [day, month, year] = dateStr.split("/").map(Number);

  // Parse time: "12:00 am"
  let [time, period] = timeStr.trim().split(" ");
  let [hours, minutes] = time.split(":").map(Number);

  if (period.toLowerCase() === "pm" && hours !== 12) {
    hours += 12;
  }
  if (period.toLowerCase() === "am" && hours === 12) {
    hours = 0;
  }

  return new Date(year, month - 1, day, hours, minutes);
}
