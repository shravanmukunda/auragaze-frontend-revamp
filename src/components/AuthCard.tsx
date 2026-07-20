"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowLeft, Sparkles } from "lucide-react";

interface AuthCardProps {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}

export default function AuthCard({
  eyebrow,
  title,
  description,
  children,
}: AuthCardProps) {
  return (
    <main className="min-h-screen px-4 py-8 pb-32">
      <div className="mx-auto max-w-lg">
        <Link
          href="/"
          className="mb-10 inline-flex items-center gap-2 text-sm font-semibold text-muted"
        >
          <ArrowLeft size={16} />
          Back to store
        </Link>

        <motion.section
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="surface-card overflow-hidden rounded-3xl"
        >
          <div className="bg-gradient-primary px-6 py-8 text-white">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
              <Sparkles size={13} />
              {eyebrow}
            </div>
            <h1 className="font-heading text-3xl font-black tracking-tight">
              {title}
            </h1>
            <p className="mt-2 max-w-sm text-sm leading-6 text-blue-100">
              {description}
            </p>
          </div>

          <div className="p-6">{children}</div>
        </motion.section>
      </div>
    </main>
  );
}
