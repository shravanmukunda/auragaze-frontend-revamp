"use client";

import { useLayoutEffect, useRef, useState } from "react";

interface ScrollHeroProps {
  videoSrc: string;
  mobileVideoSrc?: string;
  posterSrc: string;
  children?: React.ReactNode;
}

type FrameStore = HTMLCanvasElement | ImageBitmap;

interface DeviceProfile {
  isMobile: boolean;
  isAndroid: boolean;
  maxFrames: number;
  captureWidth: number;
  displayScale: number;
}

function getViewportHeight() {
  return window.visualViewport?.height ?? window.innerHeight;
}

function getDeviceProfile(): DeviceProfile {
  const isAndroid = /Android/i.test(navigator.userAgent);
  const isMobile = window.matchMedia("(max-width: 768px)").matches;

  if (isAndroid) {
    return {
      isMobile,
      isAndroid: true,
      maxFrames: 22,
      captureWidth: 360,
      displayScale: 0.85,
    };
  }

  if (isMobile) {
    return {
      isMobile: true,
      isAndroid: false,
      maxFrames: 32,
      captureWidth: 480,
      displayScale: 1,
    };
  }

  return {
    isMobile: false,
    isAndroid: false,
    maxFrames: 44,
    captureWidth: 720,
    displayScale: 1,
  };
}

function buildCaptureOrder(count: number, focus: number) {
  const order: number[] = [];
  const seen = new Set<number>();
  const add = (index: number) => {
    if (index < 0 || index >= count || seen.has(index)) return;
    seen.add(index);
    order.push(index);
  };

  add(focus);
  for (let offset = 1; offset < count; offset++) {
    add(focus + offset);
    add(focus - offset);
  }

  return order;
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

function waitForSeek(video: HTMLVideoElement) {
  return new Promise<void>((resolve) => {
    if (!video.seeking) {
      resolve();
      return;
    }
    video.addEventListener("seeked", () => resolve(), { once: true });
  });
}

function resolveFrameIndex(frames: (FrameStore | null)[], index: number) {
  if (frames[index]) return index;

  let lower = index;
  while (lower >= 0 && !frames[lower]) lower--;
  if (lower >= 0) return lower;

  let higher = index;
  while (higher < frames.length && !frames[higher]) higher++;
  return higher < frames.length ? higher : -1;
}

export default function ScrollHero({
  videoSrc,
  mobileVideoSrc,
  posterSrc,
  children,
}: ScrollHeroProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stickyRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [videoVisible, setVideoVisible] = useState(false);

  useLayoutEffect(() => {
    const section = sectionRef.current;
    const sticky = stickyRef.current;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!section || !sticky || !video || !canvas) return;

    const profile = getDeviceProfile();
    const ctx = canvas.getContext("2d", {
      alpha: false,
      desynchronized: true,
    });
    if (!ctx) return;

    const resolvedSrc =
      mobileVideoSrc && profile.isMobile ? mobileVideoSrc : videoSrc;

    video.setAttribute("webkit-playsinline", "true");
    video.src = resolvedSrc;
    video.load();

    canvas.style.visibility = "hidden";

    let duration = 0;
    let ready = false;
    let scrollRange = getViewportHeight();
    let sectionTop = 0;
    let lastTargetTime = -1;
    let cancelled = false;
    let frames: (FrameStore | null)[] = [];
    let frameWidth = 0;
    let frameHeight = 0;
    let frameCount = 0;
    let currentFrame = -1;
    let useFrameCache = false;
    let scrolling = false;
    let scrollEndTimer = 0;
    let tickId = 0;
    let captureStarted = false;
    let initialized = false;

    const syncLayout = () => {
      const vh = getViewportHeight();
      scrollRange = vh;
      sectionTop = section.offsetTop;
      sticky.style.height = `${vh}px`;
      section.style.height = `${vh * 2}px`;

      const scale = profile.displayScale;
      canvas.width = Math.round(sticky.clientWidth * scale);
      canvas.height = Math.round(sticky.clientHeight * scale);
      canvas.style.width = "100%";
      canvas.style.height = "100%";
      currentFrame = -1;
    };

    const getProgress = () => {
      if (scrollRange <= 0) return 0;
      const scrolled = window.scrollY - sectionTop;
      return Math.min(1, Math.max(0, scrolled / scrollRange));
    };

    const drawFrame = (index: number) => {
      const resolved = resolveFrameIndex(frames, index);
      if (resolved < 0) return;
      if (resolved === currentFrame) return;

      const frame = frames[resolved];
      if (!frame) return;

      currentFrame = resolved;
      drawCover(ctx, frame, frameWidth, frameHeight, canvas.width, canvas.height);
    };

    const scrubVideo = (progress: number) => {
      if (duration <= 0) return;
      const targetTime = progress * duration;
      if (Math.abs(targetTime - lastTargetTime) < 0.03) return;
      lastTargetTime = targetTime;

      // fastSeek queues async keyframe jumps on Android Chrome — feels laggy
      if (!profile.isAndroid && typeof video.fastSeek === "function") {
        video.fastSeek(targetTime);
      } else {
        video.currentTime = targetTime;
      }
    };

    const scrub = () => {
      if (!ready || scrollRange <= 0) return;

      const progress = getProgress();

      if (useFrameCache && frames.length > 0) {
        const index = Math.min(
          frameCount - 1,
          Math.round(progress * (frameCount - 1)),
        );
        drawFrame(index);
        return;
      }

      if (video.readyState >= HTMLMediaElement.HAVE_CURRENT_DATA) {
        scrubVideo(progress);
      }
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

    const enableCanvasIfReady = () => {
      const captured = frames.filter(Boolean).length;
      const progressIndex = Math.round(getProgress() * Math.max(frameCount - 1, 0));
      const hasCurrentFrame = Boolean(frames[progressIndex]);

      if (!useFrameCache && captured >= Math.min(8, frameCount) && hasCurrentFrame) {
        useFrameCache = true;
        video.style.visibility = "hidden";
        canvas.style.visibility = "visible";
        currentFrame = -1;
        scrub();
      }
    };

    const captureFrames = async () => {
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      if (captureStarted) return;
      captureStarted = true;

      frameCount = Math.min(
        profile.maxFrames,
        Math.max(14, Math.round(duration * 22)),
      );

      const scale = Math.min(1, profile.captureWidth / video.videoWidth);
      frameWidth = Math.round(video.videoWidth * scale);
      frameHeight = Math.round(video.videoHeight * scale);

      const captureCanvas = document.createElement("canvas");
      captureCanvas.width = frameWidth;
      captureCanvas.height = frameHeight;
      const captureCtx = captureCanvas.getContext("2d", { alpha: false });
      if (!captureCtx) return;

      frames = Array.from({ length: frameCount }, () => null);
      video.pause();

      const focusIndex = Math.round(getProgress() * (frameCount - 1));
      const captureOrder = buildCaptureOrder(frameCount, focusIndex);

      for (const frameIndex of captureOrder) {
        if (cancelled) return;

        const time =
          frameCount === 1 ? 0 : (frameIndex / (frameCount - 1)) * duration;
        video.currentTime = time;
        await waitForSeek(video);
        captureCtx.drawImage(video, 0, 0, frameWidth, frameHeight);

        if (profile.isAndroid) {
          const copy = document.createElement("canvas");
          copy.width = frameWidth;
          copy.height = frameHeight;
          const copyCtx = copy.getContext("2d", { alpha: false });
          copyCtx?.drawImage(captureCanvas, 0, 0);
          frames[frameIndex] = copy;
        } else if (typeof createImageBitmap === "function") {
          frames[frameIndex] = await createImageBitmap(captureCanvas);
        } else {
          const copy = document.createElement("canvas");
          copy.width = frameWidth;
          copy.height = frameHeight;
          const copyCtx = copy.getContext("2d", { alpha: false });
          copyCtx?.drawImage(captureCanvas, 0, 0);
          frames[frameIndex] = copy;
        }

        enableCanvasIfReady();
      }

      if (cancelled) return;

      useFrameCache = true;
      video.style.visibility = "hidden";
      canvas.style.visibility = "visible";
      currentFrame = -1;
      scrub();
    };

    const startCapture = () => {
      if (cancelled) return;
      if (profile.isAndroid) {
        void captureFrames();
        return;
      }

      const run = () => {
        if (!cancelled) void captureFrames();
      };

      if ("requestIdleCallback" in window) {
        requestIdleCallback(run, { timeout: 800 });
      } else {
        setTimeout(run, 200);
      }
    };

    const onReady = () => {
      if (initialized) return;
      if (!Number.isFinite(video.duration) || video.duration <= 0) return;
      initialized = true;
      duration = video.duration;
      video.pause();
      ready = true;
      lastTargetTime = -1;
      setVideoVisible(true);
      scrub();
      startCapture();
    };

    const onResize = () => {
      syncLayout();
      lastTargetTime = -1;
      currentFrame = -1;
      scrub();
    };

    syncLayout();

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);
    window.visualViewport?.addEventListener("resize", onResize);

    video.addEventListener("loadedmetadata", onReady);
    video.addEventListener("canplaythrough", onReady, { once: true });
    video.addEventListener("canplay", onReady);
    if (video.readyState >= HTMLMediaElement.HAVE_METADATA) onReady();

    return () => {
      cancelled = true;
      cancelAnimationFrame(tickId);
      window.clearTimeout(scrollEndTimer);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
      window.visualViewport?.removeEventListener("resize", onResize);
      video.removeEventListener("loadedmetadata", onReady);
      video.removeEventListener("canplaythrough", onReady);
      video.removeEventListener("canplay", onReady);
      frames.forEach((frame) => {
        if (frame && "close" in frame) frame.close();
      });
    };
  }, [videoSrc, mobileVideoSrc]);

  return (
    <section ref={sectionRef} className="relative min-h-[200dvh]">
      <div
        ref={stickyRef}
        className="sticky top-0 relative h-[100dvh] min-h-[100dvh] w-full overflow-hidden will-change-transform"
      >
        <img
          src={posterSrc}
          alt=""
          decoding="sync"
          fetchPriority="high"
          className="absolute inset-0 h-full w-full object-cover"
          aria-hidden
        />

        <video
          ref={videoRef}
          muted
          playsInline
          preload="auto"
          className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
            videoVisible ? "opacity-100" : "opacity-0"
          }`}
          aria-hidden
        />

        <canvas
          ref={canvasRef}
          className="absolute inset-0 h-full w-full [transform:translateZ(0)]"
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
