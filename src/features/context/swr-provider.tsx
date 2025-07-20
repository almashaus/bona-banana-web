"use client";
import { SWRConfig } from "swr";

export const fetcher = async (
  url: string,
  options?: RequestInit
): Promise<any> => {
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers || {}),
    },
    ...options,
  });
  if (!res.ok) {
    const err = new Error("Error") as any;
    err.status = res.status;
    throw err;
  }
  return res.json();
};

export function MySWRProvider({ children }: { children: React.ReactNode }) {
  return <SWRConfig value={{ fetcher: fetcher }}>{children}</SWRConfig>;
}
