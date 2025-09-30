"use client"
import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Area } from "@/lib/taxonomy";
import { CategoryCard } from "./CategoryCard";

interface CategoryCarouselProps {
  categories: Area[];
}

export function CategoryCarousel({ categories }: CategoryCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  const scrollByAmount = (direction: "left" | "right") => {
    const container = scrollRef.current;
    if (!container) return;
    const itemWidth = container.clientWidth * 0.8; // approx one viewport item
    const delta = direction === "left" ? -itemWidth : itemWidth;
    container.scrollBy({ left: delta, behavior: "smooth" });
  };

  return (
    <div className="relative">
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button variant="outline" size="icon" onClick={() => scrollByAmount("left")} aria-label="Anterior">
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <Button variant="outline" size="icon" onClick={() => scrollByAmount("right")} aria-label="Siguiente">
          <ChevronRight className="h-5 w-5" />
        </Button>
      </div>

      <div className="relative">
        <div
          ref={scrollRef}
          className="carousel-3d flex gap-4 overflow-x-auto scroll-smooth snap-x snap-mandatory pb-2 pr-12 sm:pr-16 no-scrollbar fade-right-mask"
        >
          {categories.map((category, i) => (
            <div
              key={category.id}
              className="snap-start shrink-0 basis-[240px] sm:basis-[260px] md:basis-[280px] lg:basis-[270px] transition-[flex-basis] duration-300 ease-out hover:basis-[320px] sm:hover:basis-[320px] md:hover:basis-[340px] lg:hover:basis-[380px]"
            >
              <div className="h-[360px]">
                <CategoryCard category={category} priority={i < 4} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}