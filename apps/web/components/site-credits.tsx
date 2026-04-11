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
        "flex flex-col gap-3 rounded-[2rem] border px-5 py-4 text-sm shadow-[0_20px_60px_-35px_rgba(10,13,25,0.35)] sm:flex-row sm:items-center sm:justify-between",
        inverted
          ? "border-white/10 bg-white/5 text-white/70"
          : "border-border/70 bg-background/70 text-muted-foreground",
        className,
      )}
    >
      <div className="space-y-1">
        <p className={cn("font-medium", inverted ? "text-white" : "text-foreground")}>
          Portfolio project by Nguyễn Sơn
        </p>
        <p className={compact ? "max-w-2xl" : undefined}>
          WaveStream is built for learning and portfolio purposes, and thoughtful feedback is
          always welcome.
        </p>
      </div>
      <Link
        href="mailto:jasonbmt06@gmail.com"
        className={cn(
          "inline-flex items-center justify-center rounded-full border px-4 py-2 font-medium transition",
          inverted
            ? "border-white/20 text-white hover:border-cyan-300/40 hover:text-cyan-200"
            : "border-border bg-card text-foreground hover:border-primary/40 hover:text-primary",
          emailClassName,
        )}
      >
        jasonbmt06@gmail.com
      </Link>
    </div>
  );
}
