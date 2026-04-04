import type { MetadataRoute } from "next";
import { db } from "@/src/lib/firebase/firebaseAdminConfig";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_BASE_URL!;

  const staticPages: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${base}/events`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/products`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
  ];

  const eventsSnapshot = await db
    .collection("events")
    .where("status", "==", "published")
    .get();
  const eventPages: MetadataRoute.Sitemap = eventsSnapshot.docs.map((doc) => ({
    url: `${base}/events/${doc.data().slug}`,
    lastModified: doc.updateTime?.toDate() ?? new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  const productsSnapshot = await db
    .collection("digitalProducts")
    .where("status", "==", "published")
    .get();
  const productPages: MetadataRoute.Sitemap = productsSnapshot.docs.map(
    (doc) => ({
      url: `${base}/products/${doc.data().slug}`,
      lastModified: doc.updateTime?.toDate() ?? new Date(),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }),
  );

  return [...staticPages, ...eventPages, ...productPages];
}
