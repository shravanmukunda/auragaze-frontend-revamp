"use client";

import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-8 px-4 pt-5 pb-28 border-t border-[var(--border)]">
      <div className="max-w-lg mx-auto flex flex-col gap-2.5">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0">
            <p className="font-heading font-black text-sm tracking-[0.18em] leading-none" style={{ color: "var(--foreground)" }}>
              AURAGAZE
            </p>
            <p className="text-[10px] mt-1 truncate" style={{ color: "var(--muted)" }}>
              Dress With Intention
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link
              href="/refund"
              className="shrink-0 text-[10px] font-semibold label-accent uppercase tracking-widest no-select"
            >
              Refund
            </Link>
            <Link
              href="/privacy"
              className="shrink-0 text-[10px] font-semibold label-accent uppercase tracking-widest no-select"
            >
              Privacy
            </Link>
            <Link
              href="/terms"
              className="shrink-0 text-[10px] font-semibold label-accent uppercase tracking-widest no-select"
            >
              Terms
            </Link>
          </div>
        </div>
        <p className="text-[10px] leading-relaxed" style={{ color: "var(--muted)" }}>
          &copy; {new Date().getFullYear()} AURAGAZE. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
