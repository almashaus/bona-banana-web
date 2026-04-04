import type { Metadata } from "next";
import { db } from "@/src/lib/firebase/firebaseAdminConfig";
import ProductPageClient from "./ProductPageClient";

type Props = { params: { slug: string } };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const snapshot = await db
    .collection("digitalProducts")
    .where("slug", "==", params.slug)
    .limit(1)
    .get();

  if (snapshot.empty) {
    return { title: "Bona Banana" };
  }

  const product = snapshot.docs[0].data();

  return {
    title: product.title,
    description:
      product.description?.slice(0, 155) ??
      "Buy digital products on Bona Banana.",
    alternates: {
      canonical: `/products/${params.slug}`,
    },
    openGraph: {
      title: product.title,
      description: product.description?.slice(0, 155),
      images: product.coverImage
        ? [{ url: product.coverImage, alt: product.title }]
        : [],
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: product.title,
      description: product.description?.slice(0, 155),
      images: product.coverImage ? [product.coverImage] : [],
    },
  };
}

function ProductBreadcrumbJsonLd({
  product,
}: {
  product: Record<string, any>;
}) {
  const base = process.env.NEXT_PUBLIC_BASE_URL;

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
        name: "Products",
        item: `${base}/products`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `${base}/products/${product.slug}`,
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
    />
  );
}

export default async function ProductPage({ params }: Props) {
  const snapshot = await db
    .collection("digitalProducts")
    .where("slug", "==", params.slug)
    .limit(1)
    .get();

  const product = snapshot.empty ? null : snapshot.docs[0].data();

  return (
    <>
      {product && <ProductBreadcrumbJsonLd product={product} />}
      <ProductPageClient />
    </>
  );
}
