"use client";

import * as React from "react";

import { recordTrackPlay } from "@/lib/wavestream-api";
import { usePlayerStore } from "@/lib/player-store";

const RECORD_PLAY_THRESHOLD_SECONDS = 5;

const isTypingTarget = (target: EventTarget | null) => {
  if (!(target instanceof HTMLElement)) {
    return false;
  }

  const tagName = target.tagName.toLowerCase();
  return (
    tagName === "input" ||
    tagName === "textarea" ||
    tagName === "select" ||
    target.isContentEditable
  );
};

export function PlayerProvider({ children }: React.PropsWithChildren) {
  const audioRef = React.useRef<HTMLAudioElement | null>(null);
  const lastTrackIdRef = React.useRef<string | null>(null);
  const recordedPlayRef = React.useRef<string | null>(null);

  const currentTrack = usePlayerStore((state) => state.currentTrack);
  const isPlaying = usePlayerStore((state) => state.isPlaying);
  const volume = usePlayerStore((state) => state.volume);
  const muted = usePlayerStore((state) => state.muted);
  const playbackRate = usePlayerStore((state) => state.playbackRate);
  const seekTarget = usePlayerStore((state) => state.seekTarget);
  const togglePlay = usePlayerStore((state) => state.togglePlay);
  const nextTrack = usePlayerStore((state) => state.nextTrack);
  const previousTrack = usePlayerStore((state) => state.previousTrack);
  const toggleMute = usePlayerStore((state) => state.toggleMute);
  const toggleShuffle = usePlayerStore((state) => state.toggleShuffle);
  const syncProgress = usePlayerStore((state) => state.syncProgress);
  const setDuration = usePlayerStore((state) => state.setDuration);
  const setPlaying = usePlayerStore((state) => state.setPlaying);
  const setBuffering = usePlayerStore((state) => state.setBuffering);
  const setError = usePlayerStore((state) => state.setError);
  const clearSeekTarget = usePlayerStore((state) => state.clearSeekTarget);
  const handleTrackEnded = usePlayerStore((state) => state.handleTrackEnded);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.volume = muted ? 0 : volume;
  }, [muted, volume]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.playbackRate = playbackRate;
  }, [playbackRate]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    if (!currentTrack?.streamUrl) {
      lastTrackIdRef.current = null;
      recordedPlayRef.current = null;
      audio.pause();
      audio.removeAttribute("src");
      audio.load();
      syncProgress(0);
      setDuration(0);
      setBuffering(false);
      return;
    }

    if (lastTrackIdRef.current !== currentTrack.id) {
      lastTrackIdRef.current = currentTrack.id;
      recordedPlayRef.current = null;
      setError(null);
      setBuffering(true);
      setDuration(currentTrack.durationSeconds ?? 0);
      syncProgress(0);
      audio.src = currentTrack.streamUrl;
      audio.load();
    }
  }, [currentTrack, setBuffering, setDuration, setError, syncProgress]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || seekTarget === null) {
      return;
    }

    const nextTime = Math.min(Math.max(seekTarget, 0), Number.isFinite(audio.duration) ? audio.duration : seekTarget);
    if (Math.abs(audio.currentTime - nextTime) > 0.1) {
      audio.currentTime = nextTime;
    }

    clearSeekTarget();
  }, [clearSeekTarget, seekTarget]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack?.streamUrl) {
      return;
    }

    if (!isPlaying) {
      audio.pause();
      return;
    }

    const playPromise = audio.play();
    if (playPromise && typeof playPromise.catch === "function") {
      playPromise.catch(() => {
        setPlaying(false);
        setError("Playback was blocked or the stream could not start.");
      });
    }
  }, [currentTrack?.streamUrl, isPlaying, setError, setPlaying]);

  React.useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    const maybeRecordPlay = (force = false) => {
      if (!currentTrack || recordedPlayRef.current === currentTrack.id) {
        return;
      }

      const listened = Math.floor(audio.currentTime || 0);
      const duration = Number.isFinite(audio.duration)
        ? audio.duration
        : currentTrack.durationSeconds ?? 0;
      const threshold = force
        ? 0
        : Math.min(
            15,
            duration > 0 ? Math.max(RECORD_PLAY_THRESHOLD_SECONDS, duration * 0.25) : RECORD_PLAY_THRESHOLD_SECONDS,
          );

      if (!force && listened < threshold) {
        return;
      }

      recordedPlayRef.current = currentTrack.id;
      void recordTrackPlay(currentTrack.id, {
        durationListened: listened,
        source: "player",
      }).catch(() => null);
    };

    const onLoadedMetadata = () => {
      setDuration(Number.isFinite(audio.duration) ? audio.duration : currentTrack?.durationSeconds ?? 0);
    };

    const onDurationChange = () => {
      if (Number.isFinite(audio.duration)) {
        setDuration(audio.duration);
      }
    };

    const onTimeUpdate = () => {
      syncProgress(audio.currentTime);
      maybeRecordPlay();
    };

    const onPlay = () => {
      setPlaying(true);
      setBuffering(false);
      setError(null);
    };

    const onPause = () => {
      if (!audio.ended) {
        setPlaying(false);
        setBuffering(false);
      }
    };

    const onWaiting = () => {
      setBuffering(true);
    };

    const onCanPlay = () => {
      setBuffering(false);
    };

    const onEnded = () => {
      maybeRecordPlay(true);
      handleTrackEnded();
    };

    const onError = () => {
      setError("This track could not be played. Try another upload.");
    };

    audio.addEventListener("loadedmetadata", onLoadedMetadata);
    audio.addEventListener("durationchange", onDurationChange);
    audio.addEventListener("timeupdate", onTimeUpdate);
    audio.addEventListener("play", onPlay);
    audio.addEventListener("pause", onPause);
    audio.addEventListener("waiting", onWaiting);
    audio.addEventListener("canplay", onCanPlay);
    audio.addEventListener("playing", onCanPlay);
    audio.addEventListener("ended", onEnded);
    audio.addEventListener("error", onError);

    return () => {
      audio.removeEventListener("loadedmetadata", onLoadedMetadata);
      audio.removeEventListener("durationchange", onDurationChange);
      audio.removeEventListener("timeupdate", onTimeUpdate);
      audio.removeEventListener("play", onPlay);
      audio.removeEventListener("pause", onPause);
      audio.removeEventListener("waiting", onWaiting);
      audio.removeEventListener("canplay", onCanPlay);
      audio.removeEventListener("playing", onCanPlay);
      audio.removeEventListener("ended", onEnded);
      audio.removeEventListener("error", onError);
    };
  }, [
    currentTrack,
    handleTrackEnded,
    setBuffering,
    setDuration,
    setError,
    setPlaying,
    syncProgress,
  ]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.metaKey || event.ctrlKey || event.altKey || isTypingTarget(event.target)) {
        return;
      }

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

  return (
    <>
      {children}
      <audio ref={audioRef} preload="metadata" hidden />
    </>
  );
}
