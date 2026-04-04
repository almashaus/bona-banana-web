import Home from "./home";

const organizationJsonLd = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "Bona Banana Tickets",
  url: process.env.NEXT_PUBLIC_BASE_URL,
  logo: `${process.env.NEXT_PUBLIC_BASE_URL}/images/bona-banana.svg`,
  sameAs: [
    process.env.NEXT_PUBLIC_BONA_INSTAGRAM,
    process.env.NEXT_PUBLIC_BONA_TIKTOK,
    process.env.NEXT_PUBLIC_BONA_DISCORD,
    process.env.NEXT_PUBLIC_BONA_MEETUP,
  ].filter(Boolean),
  contactPoint: {
    "@type": "ContactPoint",
    telephone: process.env.NEXT_PUBLIC_BONA_PHONE,
    contactType: "customer service",
    availableLanguage: ["Arabic", "English"],
  },
};

export default function HomePage() {
  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationJsonLd) }}
      />
      <Home />
    </div>
  );
}
