"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface WaveformBarProps {
  /** Playback progress as a percentage (0-100). */
  progress: number;
  /** Total track duration in seconds, used to calculate seek position on click. */
  duration: number;
  /** Called with the target second when user clicks the waveform. */
  onSeek?: (seconds: number) => void;
  disabled?: boolean;
  /** Number of bars to render; more bars = finer resolution. */
  barCount?: number;
  className?: string;
  /** Seed string (for example, a track slug) for deterministic peak heights per track. */
  seed?: string;
  ariaLabel?: string;
}

function formatPreviewTime(seconds: number) {
  const minutes = Math.floor(seconds / 60);
  const remaining = Math.floor(seconds % 60);
  return `${minutes}:${remaining.toString().padStart(2, "0")}`;
}

/** Deterministic pseudo-random peak heights keyed to a seed string. */
function generatePeaks(count: number, seed: string): number[] {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const c = seed.charCodeAt(i);
    hash = (hash << 5) - hash + c;
    hash |= 0;
  }
  return Array.from({ length: count }, (_, i) => {
    const r = Math.sin(hash * 9301 + i * 49297 + 233280) * 233280;
    const rand = r - Math.floor(r);
    // Envelope: quieter at start/end, louder in the middle
    const envelope = Math.sin((i / count) * Math.PI);
    return Math.max(0.08, 0.1 + envelope * 0.65 * rand + 0.25 * rand);
  });
}

export function WaveformBar({
  progress,
  duration,
  onSeek,
  disabled = false,
  barCount = 90,
  className,
  seed = "track",
  ariaLabel = "Track waveform",
}: WaveformBarProps) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [hoverRatio, setHoverRatio] = React.useState<number | null>(null);
  const peaks = React.useMemo(() => generatePeaks(barCount, seed), [barCount, seed]);
  const normalizedProgress = Math.min(Math.max(progress, 0), 100);

  const updateHoverRatio = React.useCallback(
    (clientX: number) => {
      if (!containerRef.current || !duration) {
        setHoverRatio(null);
        return;
      }

      const rect = containerRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      setHoverRatio(ratio);
    },
    [duration],
  );

  const handleClick = React.useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (disabled || !onSeek || !containerRef.current || !duration) return;
      const rect = containerRef.current.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
      onSeek(ratio * duration);
    },
    [disabled, onSeek, duration],
  );

  const handleKeyDown = React.useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (disabled || !onSeek || !duration) return;
      if (e.key === "ArrowRight") {
        e.preventDefault();
        onSeek(Math.min(duration, (normalizedProgress / 100) * duration + 5));
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        onSeek(Math.max(0, (normalizedProgress / 100) * duration - 5));
      } else if (e.key === "Home") {
        e.preventDefault();
        onSeek(0);
      } else if (e.key === "End") {
        e.preventDefault();
        onSeek(duration);
      }
    },
    [disabled, onSeek, duration, normalizedProgress],
  );

  const previewSeconds = duration > 0 ? (normalizedProgress / 100) * duration : 0;

  return (
    <div
      ref={containerRef}
      role="slider"
      tabIndex={disabled ? -1 : 0}
      aria-label={ariaLabel}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={Math.round(normalizedProgress)}
      aria-valuetext={`${formatPreviewTime(previewSeconds)} / ${formatPreviewTime(duration)}`}
      aria-disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      onMouseMove={(event) => updateHoverRatio(event.clientX)}
      onMouseLeave={() => setHoverRatio(null)}
      className={cn(
        "relative flex items-end gap-px select-none",
        disabled ? "cursor-default opacity-40" : "cursor-pointer",
        className,
      )}
    >
      {hoverRatio !== null && duration > 0 && !disabled ? (
        <div
          className="pointer-events-none absolute -top-7 -translate-x-1/2 rounded-full bg-foreground px-2 py-0.5 text-[10px] font-medium text-background shadow-sm"
          style={{ left: `${hoverRatio * 100}%` }}
        >
          {formatPreviewTime(hoverRatio * duration)}
        </div>
      ) : null}
      {peaks.map((height, i) => {
        const barProgress = (i / barCount) * 100;
        const played = barProgress < normalizedProgress;
        const active = Math.abs(barProgress - normalizedProgress) < 100 / barCount;
        return (
          <div
            key={i}
            className="flex-1 rounded-sm transition-all duration-75"
            style={{
              height: `${Math.round(Math.max(12, height * 100))}%`,
              backgroundColor: played
                ? "hsl(var(--primary))"
                : active
                  ? "hsl(var(--primary) / 0.7)"
                  : "hsl(var(--border))",
            }}
          />
        );
      })}
    </div>
  );
}
