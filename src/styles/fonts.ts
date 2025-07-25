import localFont from "next/font/local";

export const DINNextLT = localFont({
  src: [
    {
      path: "../../public/font/din-next-lt/DINNextLT-UltraLight.ttf",
      weight: "200",
      style: "normal",
    },
    {
      path: "../../public/font/din-next-lt/DINNextLT-Light.ttf",
      weight: "300",
      style: "normal",
    },
    {
      path: "../../public/font/din-next-lt/DINNextLT-Regular.ttf",
      weight: "400",
      style: "normal",
    },
    {
      path: "../../public/font/din-next-lt/DINNextLT-Medium.ttf",
      weight: "500",
      style: "normal",
    },
    {
      path: "../../public/font/din-next-lt/DINNextLT-Bold.ttf",
      weight: "700",
      style: "normal",
    },
  ],
  variable: "--font-custom",
});
