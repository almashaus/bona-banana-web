"use client";

import * as React from "react";
import { VariantProps, cva } from "class-variance-authority";
import {
  HTMLMotionProps,
  MotionValue,
  motion,
  useScroll,
  useTransform,
} from "motion/react";

import { cn } from "@/src/lib/utils/utils";

const bentoGridVariants = cva(
  "relative grid gap-4 [&>*:first-child]:origin-top-right [&>*:nth-child(2)]:origin-bottom-right [&>*:nth-child(3)]:origin-bottom-right [&>*:nth-child(4)]:origin-bottom-right [&>*:nth-child(5)]:origin-top-center",
  {
    variants: {
      variant: {
        default: `
          /* ============ SMALL SCREENS (MOBILE) ============ */
          grid-cols-2 grid-rows-3
          [&>*:first-child]:col-span-2 [&>*:first-child]:row-span-1
          [&>*:nth-child(2)]:col-span-1 [&>*:nth-child(2)]:row-span-1
          [&>*:nth-child(3)]:col-span-1 [&>*:nth-child(3)]:row-span-1
          [&>*:nth-child(4)]:col-span-1 [&>*:nth-child(4)]:row-span-1
          [&>*:nth-child(5)]:block

          /* ============ MEDIUM+ SCREENS (DESKTOP) ============ */
          md:grid-cols-8 md:grid-rows-[1fr_0.5fr_0.5fr_1fr]
          md:[&>*:first-child]:col-span-6 md:[&>*:first-child]:row-span-3
          md:[&>*:nth-child(2)]:col-span-2 md:[&>*:nth-child(2)]:row-span-2  
          md:[&>*:nth-child(3)]:col-span-2 md:[&>*:nth-child(3)]:row-span-2 
          md:[&>*:nth-child(4)]:col-span-4 md:[&>*:nth-child(4)]:col-span-3
          md:[&>*:nth-child(5)]:col-span-4 md:[&>*:nth-child(5)]:col-span-3 
        `,
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

interface ContainerScrollContextValue {
  scrollYProgress: MotionValue<number>;
}
const ContainerScrollContext = React.createContext<
  ContainerScrollContextValue | undefined
>(undefined);
function useContainerScrollContext() {
  const context = React.useContext(ContainerScrollContext);
  if (!context) {
    throw new Error(
      "useContainerScrollContext must be used within a ContainerScroll Component"
    );
  }
  return context;
}
const ContainerScroll = ({
  children,
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) => {
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: scrollRef,
  });
  return (
    <ContainerScrollContext.Provider value={{ scrollYProgress }}>
      <div
        ref={scrollRef}
        className={cn("relative min-h-screen w-full", className)}
        {...props}
      >
        {children}
      </div>
    </ContainerScrollContext.Provider>
  );
};

const BentoGrid = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & VariantProps<typeof bentoGridVariants>
>(({ variant, className, ...props }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(bentoGridVariants({ variant }), className)}
      {...props}
    />
  );
});
BentoGrid.displayName = "BentoGrid";

const BentoCell = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, style, ...props }, ref) => {
    const { scrollYProgress } = useContainerScrollContext();
    const translate = useTransform(scrollYProgress, [0.1, 0.9], ["-35%", "0%"]);
    const scale = useTransform(scrollYProgress, [0, 0.9], [0.5, 1]);

    return (
      <motion.div
        ref={ref}
        className={className}
        style={{ translate, scale, ...style }}
        {...props}
      ></motion.div>
    );
  }
);
BentoCell.displayName = "BentoCell";

const ContainerScale = React.forwardRef<HTMLDivElement, HTMLMotionProps<"div">>(
  ({ className, style, ...props }, ref) => {
    const { scrollYProgress } = useContainerScrollContext();
    const opacity = useTransform(scrollYProgress, [0, 0, 0.5], [0, 1, 0]);
    const scale = useTransform(scrollYProgress, [0.1, 0.5], [1, 0]);

    return (
      <motion.div
        ref={ref}
        className={cn("", className)}
        style={{
          translate: "-50% -20%",
          scale,
          opacity,
          ...style,
        }}
        {...props}
      />
    );
  }
);

ContainerScale.displayName = "ContainerScale";

export { ContainerScroll, BentoGrid, BentoCell, ContainerScale };
