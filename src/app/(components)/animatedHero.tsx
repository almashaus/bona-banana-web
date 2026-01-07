"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";

function Hero() {
  const t = useTranslations("Home");
  const [titleNumber, setTitleNumber] = useState(0);
  const titles = [t("hero1"), t("hero2"), t("hero3")];

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

            <p className="text-lg md:text-xl leading-relaxed text-muted-foreground max-w-lg md:max-w-2xl text-center">
              {t("heroSubtitle")}
            </p>
          </div>
          {/* <div className="flex flex-row gap-3">
            <Button size="lg" className="gap-4" variant="outline">
              click here <MoveRight className="w-4 h-4" />
            </Button>
            <Button size="lg" className="gap-4">
              click here <MoveRight className="w-4 h-4" />
            </Button>
          </div> */}
        </div>
      </div>
    </div>
  );
}

export { Hero };
