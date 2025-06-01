import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function generateOrderNumber(): string {
  return `ORDER-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generateQRCode(text: string): string {
  // In a real app, this would generate a QR code
  // For now, we'll just return a placeholder
  return `/no-image.svg?height=200&width=200&text=${encodeURIComponent(text)}`;
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
