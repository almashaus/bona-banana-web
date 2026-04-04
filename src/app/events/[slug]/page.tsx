import type { Metadata } from "next";
import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import EventPageClient from "./EventPageClient";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const snapshot = await db
    .collection("events")
    .where("slug", "==", params.slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { title: "Bona Banana" };
  }

  const event = snapshot.docs[0].data();

  return {
    title: event.title,
    description:
      event.description?.slice(0, 155) ?? "Book your tickets on Bona Banana.",
    alternates: {
      canonical: `/events/${params.slug}`,
    },
    openGraph: {
      title: event.title,
      description: event.description?.slice(0, 155),
      images: event.eventImage
        ? [{ url: event.eventImage, alt: event.title }]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: event.title,
      description: event.description?.slice(0, 155),
      images: event.eventImage ? [event.eventImage] : [],
    },
  };
}

function EventJsonLd({ event }: { event: Record<string, any> }) {
  const base = process.env.NEXT_PUBLIC_BASE_URL;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    description: event.description,
    image: event.eventImage,
    url: `${base}/events/${event.slug}`,
    startDate: event.dates?.[0]?.startTime,
    endDate: event.dates?.[0]?.endTime,
    location: {
      "@type": "Place",
      name: event.venue,
      address: {
        "@type": "PostalAddress",
        addressLocality: event.city?.en ?? "Riyadh",
        addressCountry: "SA",
      },
    },
    organizer: {
      "@type": "Organization",
      name: "Bona Banana Tickets",
      url: base,
    },
    offers: {
      "@type": "Offer",
      url: `${base}/events/${event.slug}`,
      priceCurrency: "SAR",
      price: event.price,
      availability:
        (event.dates?.[event.dates.length - 1]?.availableTickets ?? 0) > 0
          ? "https://schema.org/InStock"
          : "https://schema.org/SoldOut",
    },
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: base,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Events",
        item: `${base}/events`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: event.title,
        item: `${base}/events/${event.slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
    </>
  );
}

export default async function EventPage({ params }: Props) {
  const snapshot = await db
    .collection("events")
    .where("slug", "==", params.slug)
    .limit(1)
    .get();

  const event = snapshot.empty ? null : snapshot.docs[0].data();

  return (
    <>
      {event && <EventJsonLd event={event} />}
      <EventPageClient />
    </>
  );
}
