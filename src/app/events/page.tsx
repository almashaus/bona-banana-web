import type { Metadata } from "next";
import { Event } from "@/src/models/event";
import EventsPageClient from "./EventsPageClient";

const baseURL = process.env.NEXT_PUBLIC_BASE_URL;

export const metadata: Metadata = {
  title: "Events",
  description:
    "Discover and book tickets for the board game events happening near you.",
  alternates: { canonical: "/events" },
  openGraph: {
    title: "Events",
    description:
      "Discover and book tickets for the board game events happening near you.",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Events",
    description:
      "Discover and book tickets for the board game events happening near you.",
  },
};

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function EventsPage() {
  let events: Event[] = [];

  try {
    const res = await fetch(`${baseURL}/api/published-events`, {
      cache: "no-store",
    });
    if (res.ok) {
      events = await res.json();
    }
  } catch {
    // fallback to empty list; client shows empty state
  }

  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Events",
    url: `${baseURL}/events`,
    itemListElement: events.map((event, i) => ({
      "@type": "ListItem",
      position: i + 1,
      url: `${baseURL}/events/${event.slug}`,
      name: event.title,
    })),
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Home", item: baseURL },
      {
        "@type": "ListItem",
        position: 2,
        name: "Events",
        item: `${baseURL}/events`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <EventsPageClient events={events} />
    </>
  );
}
