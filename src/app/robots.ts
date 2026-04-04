import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = process.env.NEXT_PUBLIC_BASE_URL!;
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/events/", "/products/"],
        disallow: [
          "/admin/",
          "/api/",
          "/checkout/",
          "/confirmation/",
          "/profile/",
          "/ticket/",
        ],
      },
    ],
    sitemap: `${base}/sitemap.xml`,
  };
}
