import localFont from "next/font/local";

export const DINNextLT = localFont({
  src: [
    {
      path: "../../public/font/din-next-lt/DINNextLTArabic-UltraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/font/din-next-lt/DINNextLTArabic-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/font/din-next-lt/DINNextLTArabic-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/font/din-next-lt/DINNextLTArabic-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/font/din-next-lt/DINNextLTArabic-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-custom",
});
