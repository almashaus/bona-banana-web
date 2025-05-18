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
  });
}

export function formatTime(date: Date): string {
  return date.toLocaleString("en-UK", {
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
