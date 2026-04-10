"use client";

import { cleanup, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { ShareActionButton } from "./share-action-button";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe("ShareActionButton", () => {
  it("copies the canonical URL to the clipboard when native sharing is unavailable", async () => {
    const user = userEvent.setup();
    const writeText = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();

    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });
    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: undefined,
    });

    render(
      <ShareActionButton
        title="Night Sets"
        text="Listen to Night Sets by Luna Echo."
        url="https://wavestream.local/playlist/night-sets"
        successLabel="Shared"
        onSuccess={onSuccess}
      >
        Share playlist
      </ShareActionButton>,
    );

    await user.click(screen.getByRole("button", { name: "Share playlist" }));

    await waitFor(() =>
      expect(writeText).toHaveBeenCalledWith("https://wavestream.local/playlist/night-sets"),
    );
    expect(onSuccess).toHaveBeenCalledWith(
      "clipboard",
      "https://wavestream.local/playlist/night-sets",
    );
    expect(screen.getByRole("button", { name: "Shared" })).toBeInTheDocument();
  });

  it("uses the native share sheet when it is available", async () => {
    const user = userEvent.setup();
    const share = vi.fn().mockResolvedValue(undefined);
    const onSuccess = vi.fn();
    const writeText = vi.fn();

    Object.defineProperty(navigator, "share", {
      configurable: true,
      value: share,
    });
    Object.defineProperty(navigator, "clipboard", {
      configurable: true,
      value: { writeText },
    });

    render(
      <ShareActionButton
        title="Night Sets"
        text="Listen to Night Sets by Luna Echo."
        url="https://wavestream.local/playlist/night-sets"
        successLabel="Shared"
        onSuccess={onSuccess}
      >
        Share playlist
      </ShareActionButton>,
    );

    await user.click(screen.getByRole("button", { name: "Share playlist" }));

    await waitFor(() =>
      expect(share).toHaveBeenCalledWith({
        title: "Night Sets",
        text: "Listen to Night Sets by Luna Echo.",
        url: "https://wavestream.local/playlist/night-sets",
      }),
    );
    expect(writeText).not.toHaveBeenCalled();
    expect(onSuccess).toHaveBeenCalledWith("native", "https://wavestream.local/playlist/night-sets");
    expect(screen.getByRole("button", { name: "Shared" })).toBeInTheDocument();
  });
});
