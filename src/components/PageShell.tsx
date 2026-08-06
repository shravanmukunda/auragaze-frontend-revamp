import { cn } from "@/lib/utils";

export const pageShellClass = "mx-auto w-full max-w-lg px-4 lg:max-w-6xl lg:px-8";
export const pageShellNarrowClass =
  "mx-auto w-full max-w-lg px-4 lg:max-w-3xl lg:px-8";
export const productGridClass =
  "grid grid-cols-2 gap-3 lg:grid-cols-3 lg:gap-5 xl:grid-cols-4";

interface PageShellProps {
  children: React.ReactNode;
  className?: string;
  narrow?: boolean;
  as?: "div" | "section" | "main";
}

export default function PageShell({
  children,
  className,
  narrow = false,
  as: Tag = "div",
}: PageShellProps) {
  return (
    <Tag className={cn(narrow ? pageShellNarrowClass : pageShellClass, className)}>
      {children}
    </Tag>
  );
}
