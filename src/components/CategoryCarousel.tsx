"use client";

import { motion, PanInfo, type Transition } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { carouselCategories, type CarouselCategory } from "@/lib/data";
import { cn } from "@/lib/utils";

const CARD_W = 248;
const CARD_H = 372;
const DRAG_THRESHOLD = 48;
const WHEEL_COOLDOWN_MS = 520;

const SPRING: Transition = {
  type: "spring",
  stiffness: 340,
  damping: 34,
  mass: 0.85,
};

function wrapOffset(index: number, active: number, total: number): number {
  let diff = index - active;
  if (diff > total / 2) diff -= total;
  if (diff < -total / 2) diff += total;
  return diff;
}

function getCardStyle(offset: number) {
  if (offset === 0) {
    return { x: 0, scale: 1, opacity: 1, zIndex: 30 };
  }
  if (offset === -1) {
    return { x: -CARD_W * 0.54, scale: 0.895, opacity: 0.9, zIndex: 18 };
  }
  if (offset === 1) {
    return { x: 44, scale: 0.958, opacity: 0.97, zIndex: 26 };
  }
  if (offset === 2) {
    return { x: 82, scale: 0.918, opacity: 0.91, zIndex: 24 };
  }
  if (offset === 3) {
    return { x: 118, scale: 0.878, opacity: 0.84, zIndex: 22 };
  }
  if (offset < -1) {
    return { x: -CARD_W * 0.9, scale: 0.82, opacity: 0, zIndex: 10 };
  }
  return { x: 154 + (offset - 4) * 38, scale: 0.84, opacity: 0, zIndex: 20 };
}

interface CarouselCardProps {
  category: CarouselCategory;
  offset: number;
  isActive: boolean;
  onSelect: () => void;
  didDragRef: RefObject<boolean>;
}

function CarouselCard({ category, offset, isActive, onSelect, didDragRef }: CarouselCardProps) {
  const style = getCardStyle(offset);
  const visible = Math.abs(offset) <= 3;

  const cardInner = (
    <div className="group relative h-full w-full overflow-hidden rounded-[28px] bg-white">
      <Image
        src={category.image}
        alt={category.name}
        fill
        className={cn(
          "object-cover transition-transform duration-700 ease-out",
          isActive && "group-hover:scale-[1.06]"
        )}
        sizes="248px"
        draggable={false}
      />
      <p className="absolute bottom-5 left-0 right-0 text-center text-[13px] font-semibold tracking-wide text-white drop-shadow-[0_2px_8px_rgba(0,0,0,0.65)]">
        {category.name}
      </p>
    </div>
  );

  return (
    <motion.div
      animate={{
        x: style.x,
        scale: style.scale,
        opacity: visible ? style.opacity : 0,
      }}
      transition={SPRING}
      className={cn(
        "absolute left-1/2 top-1/2 cursor-grab active:cursor-grabbing",
        !visible && "pointer-events-none"
      )}
      style={{
        width: CARD_W,
        height: CARD_H,
        marginLeft: -CARD_W / 2,
        marginTop: -CARD_H / 2,
        zIndex: style.zIndex,
      }}
      onClick={() => {
        if (!isActive) onSelect();
      }}
    >
      {isActive ? (
        <Link
          href={`/shop?category=${category.slug}`}
          className="block h-full w-full"
          onClick={(e) => {
            if (didDragRef.current) {
              e.preventDefault();
              didDragRef.current = false;
            }
          }}
        >
          {cardInner}
        </Link>
      ) : (
        cardInner
      )}
    </motion.div>
  );
}

export default function CategoryCarousel() {
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const wheelLocked = useRef(false);
  const didDrag = useRef(false);

  const total = carouselCategories.length;

  const paginate = useCallback(
    (direction: 1 | -1) => {
      setActiveIndex((prev) => (prev + direction + total) % total);
    },
    [total]
  );

  const handleDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.x < -DRAG_THRESHOLD || info.velocity.x < -400) {
      didDrag.current = true;
      paginate(1);
    } else if (info.offset.x > DRAG_THRESHOLD || info.velocity.x > 400) {
      didDrag.current = true;
      paginate(-1);
    }
  };

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (wheelLocked.current) return;
      if (Math.abs(e.deltaY) < 8) return;

      wheelLocked.current = true;
      if (e.deltaY > 0) paginate(1);
      else paginate(-1);

      window.setTimeout(() => {
        wheelLocked.current = false;
      }, WHEEL_COOLDOWN_MS);
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [paginate]);

  const sortedCards = carouselCategories
    .map((category, index) => ({
      category,
      index,
      offset: wrapOffset(index, activeIndex, total),
    }))
    .sort((a, b) => getCardStyle(a.offset).zIndex - getCardStyle(b.offset).zIndex);

  return (
    <section className="relative px-1 pt-6 pb-1 max-w-lg mx-auto">
      <motion.div
        ref={containerRef}
        className="relative mx-auto h-[408px] w-full touch-pan-y select-none overflow-visible"
        drag="x"
        dragConstraints={{ left: 0, right: 0 }}
        dragElastic={0.14}
        onDragStart={() => {
          didDrag.current = false;
        }}
        onDragEnd={handleDragEnd}
      >
        {sortedCards.map(({ category, index, offset }) => (
          <CarouselCard
            key={category.id}
            category={category}
            offset={offset}
            isActive={offset === 0}
            onSelect={() => setActiveIndex(index)}
            didDragRef={didDrag}
          />
        ))}
      </motion.div>
    </section>
  );
}
