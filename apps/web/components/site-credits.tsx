import Link from "next/link";

import { cn } from "@/lib/utils";

type SiteCreditsProps = {
  className?: string;
  emailClassName?: string;
  inverted?: boolean;
  compact?: boolean;
};

export function SiteCredits({
  className,
  emailClassName,
  inverted = false,
  compact = false,
}: SiteCreditsProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-start rounded-lg md:flex-row md:justify-between",
        compact
          ? "gap-2 px-4 py-3 text-sm md:items-center"
          : "gap-3 px-5 py-4 text-sm md:items-center",
        inverted
          ? "bg-[hsl(var(--muted))] text-[hsl(var(--muted-foreground))]"
          : "bg-[hsl(var(--card))] text-[hsl(var(--muted-foreground))]",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className="font-bold text-white">
          Portfolio project by Nguyễn Sơn
        </p>
        <p className={compact ? "max-w-xl" : "max-w-2xl"}>
          WaveStream is built for learning and portfolio purposes, and thoughtful feedback is
          always welcome.
        </p>
      </div>
      <Link
        href="mailto:jasonbmt06@gmail.com"
        className={cn(
          "inline-flex w-fit max-w-full items-center justify-center rounded-full border border-[#727272] font-bold transition hover:border-white hover:text-white",
          compact ? "px-3 py-1.5 text-sm" : "px-4 py-2",
          emailClassName,
        )}
      >
        jasonbmt06@gmail.com
      </Link>
    </div>
  );
}

