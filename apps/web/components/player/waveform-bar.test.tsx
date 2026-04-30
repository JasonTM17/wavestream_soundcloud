import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { afterEach, describe, expect, it, vi } from "vitest";

import { WaveformBar } from "./waveform-bar";

afterEach(() => {
  cleanup();
});

describe("WaveformBar", () => {
  it("exposes a localized slider label and time value", () => {
    render(
      <WaveformBar
        progress={50}
        duration={120}
        onSeek={vi.fn()}
        ariaLabel="Nhấn để tua"
      />,
    );

    const slider = screen.getByRole("slider", { name: "Nhấn để tua" });

    expect(slider).toHaveAttribute("aria-valuenow", "50");
    expect(slider).toHaveAttribute("aria-valuetext", "1:00 / 2:00");
  });

  it("supports keyboard seeking with arrow, home, and end keys", async () => {
    const user = userEvent.setup();
    const onSeek = vi.fn();

    render(
      <WaveformBar
        progress={50}
        duration={120}
        onSeek={onSeek}
        ariaLabel="Seek waveform"
      />,
    );

    const slider = screen.getByRole("slider", { name: "Seek waveform" });
    slider.focus();

    await user.keyboard("{ArrowRight}{ArrowLeft}{Home}{End}");

    expect(onSeek.mock.calls.map(([seconds]) => Math.round(seconds))).toEqual([
      65,
      55,
      0,
      120,
    ]);
  });

  it("seeks from click position and clamps out-of-range progress", () => {
    const onSeek = vi.fn();

    render(
      <WaveformBar
        progress={160}
        duration={120}
        onSeek={onSeek}
        ariaLabel="Seek waveform"
      />,
    );

    const slider = screen.getByRole("slider", { name: "Seek waveform" });
    vi.spyOn(slider, "getBoundingClientRect").mockReturnValue({
      x: 10,
      y: 0,
      left: 10,
      right: 210,
      top: 0,
      bottom: 40,
      width: 200,
      height: 40,
      toJSON: () => ({}),
    });

    expect(slider).toHaveAttribute("aria-valuenow", "100");

    fireEvent.click(slider, { clientX: 110 });

    expect(onSeek).toHaveBeenCalledWith(60);
  });
});
