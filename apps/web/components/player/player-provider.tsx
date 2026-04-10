"use client";

import * as React from "react";

import { usePlayerStore } from "@/lib/player-store";

export function PlayerProvider({ children }: React.PropsWithChildren) {
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const nextTrack = usePlayerStore((state) => state.nextTrack);
  const previousTrack = usePlayerStore((state) => state.previousTrack);
  const toggleMute = usePlayerStore((state) => state.toggleMute);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey) return;

      if (event.code === "Space") {
        event.preventDefault();
        togglePlay();
      }

      if (event.code === "ArrowRight") {
        nextTrack();
      }

      if (event.code === "ArrowLeft") {
        previousTrack();
      }

      if (event.key.toLowerCase() === "m") {
        toggleMute();
      }

      if (event.key.toLowerCase() === "s") {
        toggleShuffle();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [nextTrack, previousTrack, toggleMute, togglePlay, toggleShuffle]);

  return children;
}
