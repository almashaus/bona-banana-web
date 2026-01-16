"use client";

import {
  BentoCell,
  BentoGrid,
  ContainerScroll,
  ContainerScale,
} from "@/src/components/blocks/gridScrollAnimation";
import { useLocale, useTranslations } from "next-intl";
import { useEffect, useState } from "react";
import useSWR from "swr";

type GalleryKeys = "image1" | "image2" | "image3" | "image4" | "image5";
type GalleryImages = Record<GalleryKeys, string>;

type ImagesApiResponse = {
  images: Partial<GalleryImages>;
};

const fetcher = async (url: string) => {
  const res = await fetch(url, { method: "GET" });
  if (!res.ok) throw new Error(`Failed to fetch: ${res.status}`);
  return (await res.json()) as ImagesApiResponse;
};
const DEFAULT_IMAGES: GalleryImages = {
  image1: "/images/20.jpeg",
  image2: "/images/60.jpeg",
  image3: "/images/50.jpeg",
  image4: "/images/40.jpeg",
  image5: "/images/10.jpeg",
};

const AnimatedImages = () => {
  const { data, error, isLoading, mutate } = useSWR<ImagesApiResponse>(
    "/api/admin/settings/images",
    fetcher
  );

  const [images, setImages] = useState<GalleryImages>(DEFAULT_IMAGES);
  const t = useTranslations("Home");
  const locale = useLocale();

  useEffect(() => {
    const apiImages = data?.images ?? {};
    if (!apiImages) return;

    setImages((prev) => ({
      image1: apiImages.image1 ?? prev.image1,
      image2: apiImages.image2 ?? prev.image2,
      image3: apiImages.image3 ?? prev.image3,
      image4: apiImages.image4 ?? prev.image4,
      image5: apiImages.image5 ?? prev.image5,
    }));
  }, [data]);

  return (
    <ContainerScroll className="md:container h-[250vh] px-6 lg:px-24 xl:px-48 mb-8">
      <BentoGrid className="sticky left-0 top-0 z-0 h-screen w-full p-1 pt-20">
        {Object.values(images).map((image, index) => (
          <BentoCell
            key={index}
            className="overflow-hidden rounded-xl shadow-xl"
          >
            <img
              className="size-full object-cover object-center"
              src={image}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </BentoCell>
        ))}
        <ContainerScale className="absolute top-1/4 md:top-1/2 left-1/2 z-0 text-center mt-12 md:mt-4 mb-8 w-full md:w-fit space-y-3">
          <h1 className="w-full text-4xl md:text-5xl font-bold tracking-tighter">
            {locale === "ar" && t("gallery")}
            <span className="text-yellowColor mx-3">Bona Banana</span>
            {locale === "en" && t("gallery")}
          </h1>
          <p className="text-md md:text-xl text-muted-foreground">
            {t("gallerySubtitle")}
          </p>
        </ContainerScale>
      </BentoGrid>
    </ContainerScroll>
  );
};

export { AnimatedImages };
