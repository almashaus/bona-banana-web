import React, { useCallback, useState } from "react";
import { EmblaOptionsType, EmblaCarouselType } from "embla-carousel";
import {
  DotButton,
  useDotButton,
} from "@/src/components/ui/EmblaCarouselDotButton";
import Autoplay from "embla-carousel-autoplay";
import useEmblaCarousel from "embla-carousel-react";
import { useRouter } from "next/navigation";
import {
  NextButton,
  PrevButton,
  usePrevNextButtons,
} from "@/src/components/ui/EmblaCarouselArrowButtons";
import { Dialog, DialogContent, DialogTitle } from "@/src/components/ui/dialog";

type PropType = {
  slides?: number[];
  images?: string[];
  options?: EmblaOptionsType;
  autoplay?: boolean;
};

const EmblaCarousel: React.FC<PropType> = (props) => {
  const { slides = [], images, options, autoplay = true } = props;
  const slideCount =
    images && images.length > 0 ? images.length : Math.max(slides.length, 1);
  const slideIndices = Array.from({ length: slideCount }, (_, i) => i);

  const [emblaRef, emblaApi] = useEmblaCarousel(
    options,
    autoplay
      ? [Autoplay({ playOnInit: true, delay: 4000, stopOnInteraction: false })]
      : undefined,
  );
  const [selectedImage, setSelectedImage] = useState<number | null>(null);
  const router = useRouter();

  const { selectedIndex, scrollSnaps, onDotButtonClick } =
    useDotButton(emblaApi);

  const {
    prevBtnDisabled,
    nextBtnDisabled,
    onPrevButtonClick,
    onNextButtonClick,
  } = usePrevNextButtons(emblaApi);

  const handleImageClick = useCallback(
    (index: number) => {
      setSelectedImage(index);
    },
    [router, images],
  );

  return (
    <section className="embla" dir="ltr">
      <div className="embla__viewport rounded-2xl" ref={emblaRef}>
        <div className="embla__container">
          {slideIndices.map((index) => {
            const src =
              images && images[index] ? images[index] : "/no-image.svg";
            const alt = images ? `Product image ${index + 1}` : "slider";
            return (
              <div className="embla__slide" key={index}>
                <div className="embla__slide__number">
                  <img
                    src={src}
                    alt={alt}
                    className="rounded-2xl w-full h-full object-cover cursor-pointer"
                    onClick={() => handleImageClick(index)}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="embla__controls">
        <div className="embla__buttons">
          <PrevButton onClick={onPrevButtonClick} disabled={prevBtnDisabled} />
          <NextButton onClick={onNextButtonClick} disabled={nextBtnDisabled} />
        </div>

        <div className="embla__dots">
          {scrollSnaps.map((_, index) => (
            <DotButton
              key={index}
              onClick={() => onDotButtonClick(index)}
              className={"embla__dot".concat(
                index === selectedIndex ? " embla__dot--selected" : "",
              )}
            />
          ))}
        </div>
      </div>

      <Dialog
        open={selectedImage !== null}
        onOpenChange={(open) => !open && setSelectedImage(null)}
      >
        <DialogTitle></DialogTitle>
        <DialogContent className="max-w-screen-lg max-h-[70vh] p-0 gap-0 overflow-hidden border-0 bg-black/25 [&>button]:text-white [&>button]:hover:text-white/90">
          <div className="flex items-center justify-center min-h-[70vh] overflow-auto p-4">
            {selectedImage !== null && (
              <img
                src={images?.[selectedImage] ?? "/no-image.svg"}
                alt={`Product image ${selectedImage + 1}`}
                className="max-w-full object-contain transition-transform duration-150 select-none scale-100 md:scale-150"
                draggable={false}
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default EmblaCarousel;
