"use client";

import { motion, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import type { Category } from "@/lib/data";
import { ArrowUpRight } from "lucide-react";

interface CategoryCardProps {
  category: Category;
  index: number;
}

export default function CategoryCard({ category, index }: CategoryCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  const x = useMotionValue(0);
  const y = useMotionValue(0);

  const springX = useSpring(x, { stiffness: 150, damping: 20 });
  const springY = useSpring(y, { stiffness: 150, damping: 20 });

  const rotateX = useTransform(springY, [-0.5, 0.5], [8, -8]);
  const rotateY = useTransform(springX, [-0.5, 0.5], [-8, 8]);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    x.set((e.clientX - centerX) / rect.width);
    y.set((e.clientY - centerY) / rect.height);
  };

  const handleMouseLeave = () => {
    x.set(0);
    y.set(0);
  };

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{
        delay: index * 0.08,
        duration: 0.5,
        ease: [0.23, 1, 0.32, 1],
      }}
      style={{
        perspective: 1000,
        rotateX,
        rotateY,
        transformStyle: "preserve-3d",
      }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileHover={{ scale: 1.03 }}
      className="group cursor-pointer"
    >
      <Link href={`/categories/${category.slug}`}>
        <div className="relative overflow-hidden rounded-2xl h-44 md:h-52">
          {/* Background Image */}
          <Image
            src={category.image}
            alt={category.name}
            fill
            className="object-cover transition-transform duration-700 group-hover:scale-110"
            sizes="(max-width: 768px) 50vw, 33vw"
          />

          {/* Gradient Overlay */}
          <div
            className={`absolute inset-0 bg-gradient-to-br ${category.gradient} opacity-70 transition-opacity duration-300 group-hover:opacity-80`}
          />

          {/* Dark Overlay for text contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Animated glow border */}
          <motion.div
            className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"
            style={{
              boxShadow: `inset 0 0 0 1.5px ${category.accentColor}60, 0 0 30px ${category.accentColor}30`,
            }}
          />

          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 opacity-0 group-hover:opacity-100"
            style={{
              background: `linear-gradient(135deg, transparent 40%, ${category.accentColor}20 50%, transparent 60%)`,
            }}
            animate={{
              backgroundPosition: ["200% 200%", "-200% -200%"],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              repeatDelay: 1,
            }}
          />

          {/* Content */}
          <div className="absolute inset-0 p-4 flex flex-col justify-end" style={{ transform: "translateZ(20px)" }}>
            <div className="flex items-end justify-between">
              <div>
                <h3 className="text-white font-bold text-lg leading-tight">{category.name}</h3>
                <p className="text-white/70 text-xs mt-0.5">{category.count} styles</p>
              </div>
              <motion.div
                className="w-8 h-8 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100"
                style={{ backgroundColor: `${category.accentColor}cc` }}
                initial={{ scale: 0, rotate: -45 }}
                whileHover={{ scale: 1, rotate: 0 }}
              >
                <ArrowUpRight size={16} className="text-white" />
              </motion.div>
            </div>
          </div>

          {/* Top description tag */}
          <div className="absolute top-3 left-3">
            <span
              className="text-[10px] font-semibold px-2 py-1 rounded-full text-white/90"
              style={{ backgroundColor: `${category.accentColor}40`, backdropFilter: "blur(8px)" }}
            >
              {category.description}
            </span>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
