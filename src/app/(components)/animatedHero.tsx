"use client";

import React, { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import { Button } from "@/src/components/ui/button";
import { ChevronDown, ChevronUp, MailIcon, MoveRight } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/src/components/ui/popover";

const BONA_PHONE = process.env.NEXT_PUBLIC_BONA_PHONE;
const BONA_EMAIL = process.env.NEXT_PUBLIC_BONA_EMAIL;
const BONA_INSTAGRAM = process.env.NEXT_PUBLIC_BONA_INSTAGRAM;
const BONA_TIKTOK = process.env.NEXT_PUBLIC_BONA_TIKTOK;
const BONA_DISCORD = process.env.NEXT_PUBLIC_BONA_DISCORD;
const BONA_MEETUP = process.env.NEXT_PUBLIC_BONA_MEETUP;

function Hero() {
  const t = useTranslations("Home");
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = [t("hero1"), t("hero2"), t("hero3")];
  const [isDown, setisDown] = useState(true);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (titleNumber === titles.length - 1) {
        setTitleNumber(0);
      } else {
        setTitleNumber(titleNumber + 1);
      }
    }, 2000);
    return () => clearTimeout(timeoutId);
  }, [titleNumber, titles]);

  return (
    <div className="w-full">
      <div className="container">
        <div className="flex flex-col gap-8 py-20 lg:pt-30 items-center justify-center">
          <div className="flex flex-col justify-center items-center md:gap-2">
            <h1 className="text-[42px] sm:text-6xl md:text-7xl w-full tracking-tighter text-center font-regular">
              <span className="relative flex w-full justify-center overflow-hidden text-center pb-4 pt-1">
                &nbsp;
                {titles.map((title, index) => (
                  <motion.span
                    key={index}
                    className={`absolute font-semibold ${index === 0 ? "text-orangeColor" : index === 1 ? "text-green-800" : "text-redColor"}`}
                    initial={{ opacity: 0, y: -100 }}
                    transition={{ type: "spring", stiffness: 50 }}
                    animate={
                      titleNumber === index
                        ? {
                            y: 0,
                            opacity: 1,
                          }
                        : {
                            y: titleNumber > index ? -150 : 150,
                            opacity: 0,
                          }
                    }
                  >
                    {title}
                  </motion.span>
                ))}
              </span>
            </h1>

            <h2 className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-lg md:max-w-2xl text-center">
              {t("heroSubtitle")}
            </h2>
          </div>
          <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4">
              {t("discoverEvents")}
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button
                  size="lg"
                  className="gap-4"
                  variant="outline"
                  onClick={() => setisDown(!isDown)}
                >
                  {t("contactUs")}{" "}
                  {isDown ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronUp className="w-4 h-4" />
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-darkColor">
                <div className="flex justify-center items-center gap-4">
                  <a
                    href={`https://wa.me/${BONA_PHONE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75"
                  >
                    <img
                      src="/icons/socials/whatsapp.svg"
                      alt="Whatsapp"
                      width={24}
                      height={24}
                    />
                  </a>
                  <a
                    href={`mailto:${BONA_EMAIL}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75"
                  >
                    <MailIcon strokeWidth={1.5} className="h-6 text-white" />
                  </a>
                  <a
                    href={`https://instagram.com/${BONA_INSTAGRAM}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75"
                  >
                    <img
                      src="/icons/socials/instagram.svg"
                      alt="Instagram"
                      width={24}
                      height={24}
                    />
                  </a>
                  <a
                    href={`https://www.tiktok.com/@${BONA_TIKTOK}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75"
                  >
                    <img
                      src="/icons/socials/tiktok.svg"
                      alt="tiktok"
                      width={28}
                      height={28}
                    />
                  </a>
                  <a
                    href={`https://discord.com/invite/${BONA_DISCORD}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75"
                  >
                    <img
                      src="/icons/socials/discord.svg"
                      alt="discord"
                      width={28}
                      height={30}
                    />
                  </a>
                  <a
                    href={`https://www.meetup.com/${BONA_MEETUP}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:opacity-75"
                  >
                    <img
                      src="/icons/socials/meetup.svg"
                      alt="meetup"
                      width={24}
                      height={24}
                    />
                  </a>
                </div>
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>
    </div>
  );
}

export { Hero };
