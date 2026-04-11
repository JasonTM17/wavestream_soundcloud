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
        "flex flex-col items-start rounded-[2rem] border shadow-[0_20px_60px_-35px_rgba(10,13,25,0.35)] md:flex-row md:justify-between",
        compact
          ? "gap-2.5 px-4 py-3 text-[0.92rem] md:items-center"
          : "gap-3.5 px-5 py-4 text-sm md:items-center",
        inverted
          ? "border-white/12 bg-white/8 text-white/72"
          : "border-border/80 bg-card/92 text-muted-foreground",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        <p className={cn("font-medium", inverted ? "text-white" : "text-foreground")}>
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
          "inline-flex w-fit max-w-full items-center justify-center rounded-full border font-medium transition",
          compact ? "px-3.5 py-1.5 text-sm" : "px-4 py-2",
          inverted
            ? "border-white/24 bg-white/10 text-white hover:border-cyan-300/40 hover:bg-white/14 hover:text-cyan-100"
            : "border-border/85 bg-background/90 text-foreground hover:border-primary/40 hover:bg-primary/5 hover:text-foreground",
          emailClassName,
        )}
      >
        jasonbmt06@gmail.com
      </Link>
    </div>
  );
}
