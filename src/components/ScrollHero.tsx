"use client";

import { useLayoutEffect, useRef } from "react";
import heroManifest from "../../public/hero-frames-manifest.json";

interface ScrollHeroProps {
  posterSrc: string;
  children?: React.ReactNode;
}

interface FrameSet {
  id: string;
  count: number;
  width: number;
  fps: number;
  duration: number;
  ext: string;
  basePath: string;
}

interface DeviceProfile {
  maxDpr: number;
  smoothing: ImageSmoothingQuality;
  frameStride: number;
  batchSize: number;
}

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

function getFrameSet(): FrameSet {
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const set = heroManifest.sets.find((entry) => entry.id === (isMobile ? "mobile" : "desktop"));
  return (set ?? heroManifest.sets[0]) as FrameSet;
}

function getDeviceProfile(): DeviceProfile {
  const cores = navigator.hardwareConcurrency || 4;
  const memory =
    (navigator as Navigator & { deviceMemory?: number }).deviceMemory ?? 4;
  const isMobile = window.matchMedia("(max-width: 768px)").matches;
  const isLowEnd = memory <= 4 || cores <= 4 || (isMobile && memory <= 6);

  if (isLowEnd) {
    return {
      maxDpr: 1,
      smoothing: "low",
      frameStride: 2,
      batchSize: 6,
    };
  }

  return {
    maxDpr: isMobile ? 1.5 : 2,
    smoothing: "medium",
    frameStride: 1,
    batchSize: 10,
  };
}

function frameUrl(set: FrameSet, sourceIndex: number) {
  return `${set.basePath}/frame_${String(sourceIndex + 1).padStart(4, "0")}.${set.ext}`;
}

function drawCover(
  ctx: CanvasRenderingContext2D,
  source: CanvasImageSource,
  sourceWidth: number,
  sourceHeight: number,
  canvasWidth: number,
  canvasHeight: number,
) {
  const sourceRatio = sourceWidth / sourceHeight;
  const canvasRatio = canvasWidth / canvasHeight;
  let drawWidth: number;
  let drawHeight: number;
  let offsetX: number;
  let offsetY: number;

  if (sourceRatio > canvasRatio) {
    drawHeight = canvasHeight;
    drawWidth = sourceWidth * (canvasHeight / sourceHeight);
    offsetX = (canvasWidth - drawWidth) / 2;
    offsetY = 0;
  } else {
    drawWidth = canvasWidth;
    drawHeight = sourceHeight * (canvasWidth / sourceWidth);
    offsetX = 0;
    offsetY = (canvasHeight - drawHeight) / 2;
  }

  ctx.drawImage(source, offsetX, offsetY, drawWidth, drawHeight);
}

function buildFrameIndices(totalSourceFrames: number, stride: number) {
  const indices: number[] = [];
  for (let i = 0; i < totalSourceFrames; i += stride) {
    indices.push(i);
  }
  const last = totalSourceFrames - 1;
  if (indices[indices.length - 1] !== last) {
    indices.push(last);
  }
  return indices;
}

export default function ScrollHero({ posterSrc, children }: ScrollHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const posterRef = useRef<HTMLImageElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const canvas = canvasRef.current;
    const poster = posterRef.current;
    if (!section || !sticky || !canvas) return;

    const frameSet = getFrameSet();
    const profile = getDeviceProfile();
    const sourceIndices = buildFrameIndices(frameSet.count, profile.frameStride);
    const frameCount = sourceIndices.length;

    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });
    if (!ctx) return;

    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = profile.smoothing;

    let cancelled = false;
    let scrollRange = getViewportHeight();
    let sectionTop = 0;
    let scrolling = false;
    let scrollEndTimer = 0;
    let tickId = 0;
    let frameWidth = frameSet.width;
    let frameHeight = 0;
    let frames: (ImageBitmap | HTMLImageElement | null)[] = Array(frameCount).fill(null);
    let loading = new Set<number>();
    let canvasReady = false;
    let lastDrawnIndex = -1;

    const syncLayout = () => {
      const vh = getViewportHeight();
      scrollRange = vh;
      sectionTop = section.offsetTop;
      sticky.style.height = `${vh}px`;
      section.style.height = `${vh * 2}px`;

      const dpr = Math.min(window.devicePixelRatio || 1, profile.maxDpr);
      canvas.width = Math.round(sticky.clientWidth * dpr);
      canvas.height = Math.round(sticky.clientHeight * dpr);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = profile.smoothing;
    };

    const getProgress = () => {
      if (scrollRange <= 0) return 0;
      const scrolled = window.scrollY - sectionTop;
      return Math.min(1, Math.max(0, scrolled / scrollRange));
    };

    const drawFrame = (index: number) => {
      const img = frames[index];
      if (!img) return false;

      if (!frameHeight) {
        frameHeight =
          "naturalHeight" in img ? img.naturalHeight : img.height;
      }

      // Opaque cover draw — no clearRect (avoids blank flashes on slow GPUs)
      drawCover(ctx, img, frameWidth, frameHeight, canvas.width, canvas.height);
      lastDrawnIndex = index;
      return true;
    };

    const drawAtProgress = (progress: number) => {
      if (!canvasReady) return;

      const index = Math.round(progress * (frameCount - 1));

      // Only draw if this exact frame is ready; otherwise keep last drawn frame
      if (frames[index]) {
        if (index !== lastDrawnIndex) {
          drawFrame(index);
        }
        return;
      }

      // First paint only: fall back to nearest ready frame once
      if (lastDrawnIndex < 0) {
        for (let i = index; i >= 0; i--) {
          if (frames[i] && drawFrame(i)) return;
        }
        for (let i = index + 1; i < frameCount; i++) {
          if (frames[i] && drawFrame(i)) return;
        }
      }
    };

    const scrub = () => {
      drawAtProgress(getProgress());
    };

    const tick = () => {
      scrub();
      if (scrolling) tickId = requestAnimationFrame(tick);
    };

    const onScroll = () => {
      if (!scrolling) {
        scrolling = true;
        tickId = requestAnimationFrame(tick);
      }
      window.clearTimeout(scrollEndTimer);
      scrollEndTimer = window.setTimeout(() => {
        scrolling = false;
        cancelAnimationFrame(tickId);
        scrub();
      }, 80);
    };

    const loadFrame = async (index: number) => {
      if (cancelled || frames[index] || loading.has(index)) return;
      loading.add(index);

      try {
        const response = await fetch(frameUrl(frameSet, sourceIndices[index]));
        if (!response.ok || cancelled) return;

        const blob = await response.blob();
        if (cancelled) return;

        if (typeof createImageBitmap === "function") {
          const bitmap = await createImageBitmap(blob);
          if (cancelled) {
            bitmap.close();
            return;
          }
          frames[index] = bitmap;
          if (index === 0) frameHeight = bitmap.height;
        } else {
          const img = await new Promise<HTMLImageElement | null>((resolve) => {
            const image = new Image();
            image.decoding = "async";
            image.onload = () => resolve(image);
            image.onerror = () => resolve(null);
            image.src = URL.createObjectURL(blob);
          });
          if (!img || cancelled) return;
          frames[index] = img;
          if (index === 0) frameHeight = img.naturalHeight;
        }
      } catch {
        // Skip failed frames; keep last good draw
      } finally {
        loading.delete(index);
      }
    };

    const prioritizeLoadOrder = (center: number) => {
      const order: number[] = [];
      const seen = new Set<number>();
      const push = (i: number) => {
        if (i < 0 || i >= frameCount || seen.has(i)) return;
        seen.add(i);
        order.push(i);
      };

      push(center);
      for (let radius = 1; radius < frameCount; radius++) {
        push(center - radius);
        push(center + radius);
      }
      return order;
    };

    const loadFrames = async () => {
      await loadFrame(0);
      if (cancelled || !frames[0]) return;

      canvasReady = true;
      canvas.style.visibility = "visible";
      if (poster) poster.style.opacity = "0";
      scrub();

      // Fill remaining frames by proximity to current scroll progress
      while (!cancelled) {
        const center = Math.round(getProgress() * (frameCount - 1));
        const pending = prioritizeLoadOrder(center).filter(
          (i) => !frames[i] && !loading.has(i),
        );
        if (pending.length === 0) break;

        const batch = pending.slice(0, profile.batchSize);
        await Promise.all(batch.map(loadFrame));
        scrub();
      }
    };

    const onResize = () => {
      syncLayout();
      // Force redraw after canvas buffer resize
      lastDrawnIndex = -1;
      scrub();
    };

    syncLayout();
    void loadFrames();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);

    return () => {
      cancelled = true;
      cancelAnimationFrame(tickId);
      window.clearTimeout(scrollEndTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);

      for (const frame of frames) {
        if (frame && "close" in frame && typeof frame.close === "function") {
          frame.close();
        }
      }
    };
  }, []);

  return (
    <section ref={sectionRef} className="relative min-h-[200dvh]">
      <div
        ref={stickyRef}
        className="sticky top-0 relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden will-change-transform"
      >
        <img
          ref={posterRef}
          src={posterSrc}
          alt=""
          decoding="sync"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover transition-opacity duration-300"
          aria-hidden
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full [transform:translateZ(0)]"
          style={{ visibility: "hidden" }}
          aria-hidden
        />

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
