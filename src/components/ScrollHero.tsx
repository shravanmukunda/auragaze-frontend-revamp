"use client";

import { useLayoutEffect, useRef } from "react";

interface ScrollHeroProps {
  videoSrc: string;
  children?: React.ReactNode;
}

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

export default function ScrollHero({ videoSrc, children }: ScrollHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const video = videoRef.current;
    if (!section || !sticky || !video) return;

    let duration = 0;
    let ready = false;
    let rafId = 0;
    let scrollRange = getViewportHeight();

    const syncLayout = () => {
      const vh = getViewportHeight();
      scrollRange = vh;
      sticky.style.height = `${vh}px`;
      // Pin full-screen hero for 1 viewport of scroll, then release to next section
      section.style.height = `${vh * 2}px`;
    };

    const scrub = () => {
      if (!ready || duration <= 0 || scrollRange <= 0) return;

      const scrolled = window.scrollY - section.offsetTop;
      const progress = Math.min(1, Math.max(0, scrolled / scrollRange));
      video.currentTime = progress * duration;
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(scrub);
    };

    const onReady = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      duration = video.duration;
      video.pause();
      video.currentTime = 0;
      ready = true;
      scrub();
    };

    const onResize = () => {
      syncLayout();
      scrub();
    };

    syncLayout();
    scrub();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);

    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("loadeddata", onReady);
    if (video.readyState >= 1) onReady();

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
    };
  }, [videoSrc]);

  return (
    <section ref={sectionRef} className="relative">
      <div ref={stickyRef} className="sticky top-0 w-full overflow-hidden">
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />

        {/* Two-sided vignette — contained inside hero, never reaches category */}
        <div
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-[30%]"
          aria-hidden
          style={{
            background: `linear-gradient(
              to bottom,
              color-mix(in srgb, var(--background) 42%, transparent) 0%,
              color-mix(in srgb, var(--background) 14%, transparent) 55%,
              transparent 100%
            )`,
          }}
        />
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 z-[1] h-[34%]"
          aria-hidden
          style={{
            background: `linear-gradient(
              to top,
              color-mix(in srgb, var(--background) 48%, transparent) 0%,
              color-mix(in srgb, var(--background) 16%, transparent) 55%,
              transparent 100%
            )`,
          }}
        />

        {children}
      </div>
    </section>
  );
}
