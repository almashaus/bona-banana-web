import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(amount)
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

export function generateOrderNumber(): string {
  return `ORDER-${Math.floor(100000 + Math.random() * 900000)}`
}

export function generateQRCode(text: string): string {
  // In a real app, this would generate a QR code
  // For now, we'll just return a placeholder
  return `/placeholder.svg?height=200&width=200&text=${encodeURIComponent(text)}`
}

