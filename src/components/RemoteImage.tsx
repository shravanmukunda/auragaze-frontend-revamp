import { optimizeCloudinaryUrl } from "@/lib/cloudinary-url";
import { cn } from "@/lib/utils";

interface RemoteImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
  /** Requested display width for Cloudinary auto-format/resize. */
  width?: number;
}

/** Renders arbitrary product image URLs without next/image hostname restrictions. */
export default function RemoteImage({
  src,
  alt,
  className,
  fill,
  width = 800,
}: RemoteImageProps) {
  const optimizedSrc = optimizeCloudinaryUrl(src, { width });

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={optimizedSrc}
      alt={alt}
      loading="lazy"
      decoding="async"
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
    />
  );
}
