"use client";

import {
  BentoCell,
  BentoGrid,
  ContainerScroll,
  ContainerScale,
} from "@/src/components/blocks/gridScrollAnimation";
import { useLocale, useTranslations } from "next-intl";

const IMAGES = [
  "/images/20.jpeg",
  "/images/10.jpeg",
  "/images/60.jpeg",
  "/images/40.jpeg",
  "/images/50.jpeg",
];
const AnimatedImages = () => {
  const t = useTranslations("Home");
  const locale = useLocale();

  return (
    <ContainerScroll className="md:container h-[250vh] px-6 lg:px-24 xl:px-48 mb-8">
      <BentoGrid className="sticky left-0 top-0 z-0 h-screen w-full p-1 pt-20">
        {IMAGES.map((imageUrl, index) => (
          <BentoCell
            key={index}
            className="overflow-hidden rounded-xl shadow-xl"
          >
            <img
              className="size-full object-cover object-center"
              src={imageUrl}
              alt=""
              loading="lazy"
              decoding="async"
            />
          </BentoCell>
        ))}
        <ContainerScale className="absolute top-1/4 md:top-1/2 left-1/2 z-0 text-center mt-12 md:mt-4 mb-8 w-full md:w-fit space-y-3">
          <h1 className="w-full text-4xl md:text-5xl font-bold tracking-tighter">
            {locale === "ar" && t("gallary")}
            <span className="text-yellowColor mx-3">Bona Banana</span>
            {locale === "en" && t("gallary")}
          </h1>
          <p className="text-md md:text-xl text-muted-foreground">
            {t("gallarySubtitle")}
          </p>
        </ContainerScale>
      </BentoGrid>
    </ContainerScroll>
  );
};

export { AnimatedImages };
