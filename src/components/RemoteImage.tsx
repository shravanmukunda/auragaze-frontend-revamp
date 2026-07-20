import { cn } from "@/lib/utils";

interface RemoteImageProps {
  src: string;
  alt: string;
  className?: string;
  fill?: boolean;
}

/** Renders arbitrary product image URLs without next/image hostname restrictions. */
export default function RemoteImage({
  src,
  alt,
  className,
  fill,
}: RemoteImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className={cn(fill && "absolute inset-0 h-full w-full", className)}
    />
  );
}
