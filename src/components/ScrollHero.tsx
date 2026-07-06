"use client";

import { useLayoutEffect, useRef } from "react";

interface ScrollHeroProps {
  videoSrc: string;
  children?: React.ReactNode;
}

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

const MAX_FRAMES = 30;
const CAPTURE_MAX_WIDTH = 540;

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

export default function ScrollHero({ videoSrc, children }: ScrollHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!section || !sticky || !video || !canvas) return;

    const ctx = canvas.getContext("2d", { alpha: false });
    if (!ctx) return;

    canvas.style.visibility = "hidden";

    let duration = 0;
    let scrollRange = getViewportHeight();
    let sectionTop = 0;
    let rafId = 0;
    let cancelled = false;
    let frames: ImageBitmap[] = [];
    let frameWidth = 0;
    let frameHeight = 0;
    let currentFrame = -1;
    let lastProgress = -1;
    let useFrameCache = false;

    const syncLayout = () => {
      const vh = getViewportHeight();
      scrollRange = vh;
      sectionTop = section.offsetTop;
      sticky.style.height = `${vh}px`;
      section.style.height = `${vh * 2}px`;
      canvas.width = sticky.clientWidth;
      canvas.height = sticky.clientHeight;
      currentFrame = -1;
      lastProgress = -1;
    };

    const getProgress = () => {
      if (scrollRange <= 0) return 0;
      const scrolled = window.scrollY - sectionTop;
      return Math.min(1, Math.max(0, scrolled / scrollRange));
    };

    const drawFrame = (index: number) => {
      if (index < 0 || index >= frames.length) return;
      if (index === currentFrame) return;
      currentFrame = index;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      drawCover(ctx, frames[index], frameWidth, frameHeight, canvas.width, canvas.height);
    };

    const scrubVideo = (progress: number) => {
      if (duration <= 0) return;
      const targetTime = progress * duration;
      if (Math.abs(video.currentTime - targetTime) < 0.033) return;
      if (typeof video.fastSeek === "function") {
        video.fastSeek(targetTime);
      } else {
        video.currentTime = targetTime;
      }
    };

    const scrub = () => {
      const progress = getProgress();
      if (progress === lastProgress) return;
      lastProgress = progress;

      if (useFrameCache && frames.length > 0) {
        const index = Math.min(
          frames.length - 1,
          Math.round(progress * (frames.length - 1)),
        );
        drawFrame(index);
        return;
      }

      scrubVideo(progress);
    };

    const onScroll = () => {
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(scrub);
    };

    const onResize = () => {
      syncLayout();
      scrub();
    };

    const captureFrames = async () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;

      duration = video.duration;
      const frameCount = Math.min(
        MAX_FRAMES,
        Math.max(12, Math.round(duration * 20)),
      );

      const scale = Math.min(1, CAPTURE_MAX_WIDTH / video.videoWidth);
      frameWidth = Math.round(video.videoWidth * scale);
      frameHeight = Math.round(video.videoHeight * scale);

      const captureCanvas = document.createElement("canvas");
      captureCanvas.width = frameWidth;
      captureCanvas.height = frameHeight;
      const captureCtx = captureCanvas.getContext("2d", { alpha: false });
      if (!captureCtx || typeof createImageBitmap !== "function") return;

      video.pause();

      const nextFrames: ImageBitmap[] = [];
      for (let i = 0; i < frameCount; i++) {
        if (cancelled) {
          nextFrames.forEach((frame) => frame.close());
          return;
        }

        const time = frameCount === 1 ? 0 : (i / (frameCount - 1)) * duration;
        video.currentTime = time;
        await new Promise<void>((resolve) => {
          video.addEventListener("seeked", () => resolve(), { once: true });
        });

        captureCtx.drawImage(video, 0, 0, frameWidth, frameHeight);
        nextFrames.push(await createImageBitmap(captureCanvas));
      }

      if (cancelled) {
        nextFrames.forEach((frame) => frame.close());
        return;
      }

      frames.forEach((frame) => frame.close());
      frames = nextFrames;
      useFrameCache = true;
      video.style.visibility = "hidden";
      canvas.style.visibility = "visible";
      currentFrame = -1;
      lastProgress = -1;
      scrub();
    };

    const onReady = () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      duration = video.duration;
      video.pause();
      video.currentTime = 0;
      void captureFrames();
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
      cancelled = true;
      cancelAnimationFrame(rafId);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("loadeddata", onReady);
      frames.forEach((frame) => frame.close());
    };
  }, [videoSrc]);

  return (
    <section ref={sectionRef} className="relative">
      <div
        ref={stickyRef}
        className="sticky top-0 w-full overflow-hidden will-change-transform"
      >
        <video
          ref={videoRef}
          src={videoSrc}
          muted
          playsInline
          preload="auto"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />
        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full"
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
