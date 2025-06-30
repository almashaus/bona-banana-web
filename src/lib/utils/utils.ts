import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// generate ticket number
export function generateIDNumber(type: string): string {
  const timestamp = Date.now();
  const lastFive = String(timestamp).slice(-5);
  const randomFour = Math.floor(1000 + Math.random() * 9000);
  return `${type}-${lastFive}${randomFour}`;
}

export function generateQRCode(text: string): string {
  // In a real app, this would generate a QR code
  // For now, we'll just return a placeholder
  return `/images/qr-code.png?height=200&width=200&text=${encodeURIComponent(
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

export function isSafeImageUrl(url?: string) {
  if (!url) return false;
  return (
    url.startsWith("/") ||
    url.startsWith("https://") ||
    url.startsWith("http://")
  );
}
