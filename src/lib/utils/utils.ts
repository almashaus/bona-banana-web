import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import imageCompression from "browser-image-compression";
import { nowDateInRiyadh } from "./formatDate";

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

export function getFileName(storageUrl: string) {
  const pathPart = storageUrl.split("/o/")[1]?.split("?")[0];
  if (!pathPart) return null;

  const decodedPath = decodeURIComponent(pathPart);

  return decodedPath.split("/").pop() || null;
}

export async function compressImage(file: File) {
  const options = {
    maxSizeMB: 5, // target max size
    maxWidthOrHeight: 1920, // optional resize
    useWebWorker: true,
  };

  try {
    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error("Compression failed:", error);
    return file; // fallback to original
  }
}

export async function cityMap(cityEn: string) {
  const response = await fetch("/api/admin/settings/city");
  if (response.ok) {
    const data = await response.json();
    const cityList: any[] = data.city;

    return cityList.find((city) => city.en === cityEn);
  }
  return { en: cityEn, ar: cityEn };
}

export function isBeforeToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today

  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0); // Set to start of the given date

  return compareDate < today;
}

export function isAfterToday(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0); // Set to start of today

  const compareDate = new Date(date);
  compareDate.setHours(0, 0, 0, 0); // Set to start of the given date

  return compareDate > today;
}

export function findFirstTodayOrAfter(dates: Date[]): Date | null {
  const today = nowDateInRiyadh();
  today.setHours(0, 0, 0, 0);

  for (const date of dates) {
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);

    if (compareDate >= today) {
      return date;
    }
  }

  return dates[0];
}

export function isAfterDate(a: Date, b: Date): boolean {
  return new Date(a) > new Date(b);
}

export function isBeforeDate(a: Date, b: Date): boolean {
  return new Date(a) < new Date(b);
}

export function isSameDate(a: Date, b: Date): boolean {
  return new Date(a) === new Date(b);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (
      typeof navigator !== "undefined" &&
      navigator.clipboard &&
      window.isSecureContext
    ) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback (deprecated but still supported)
    const textarea = document.createElement("textarea");
    textarea.value = text;
    textarea.style.position = "fixed";
    textarea.style.left = "-9999px";
    textarea.style.opacity = "0";

    document.body.appendChild(textarea);
    textarea.focus();
    textarea.select();

    const successful = document.execCommand("copy");
    document.body.removeChild(textarea);

    return successful;
  } catch (err) {
    console.error("Copy failed:", err);
    return false;
  }
}
