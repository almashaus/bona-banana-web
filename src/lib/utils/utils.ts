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

export function generateQRCode(id: string): string {
  const url = `${process.env.NEXT_PUBLIC_BASE_URL}/ticket?token=${id}`;

  return `${process.env.NEXT_PUBLIC_QR_SERVER}/?data=${encodeURIComponent(url)}&size=200x200`;
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
