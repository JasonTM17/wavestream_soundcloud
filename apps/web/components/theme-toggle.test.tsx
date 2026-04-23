import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";

const setTheme = vi.fn();

vi.mock("next-themes", () => ({
  useTheme: () => ({
    resolvedTheme: "light",
    setTheme,
    theme: "system",
  }),
}));

import { ThemeToggle } from "./theme-toggle";

describe("ThemeToggle", () => {
  beforeEach(() => {
    setTheme.mockClear();
  });

  it.each([
    // Vietnamese labels (default locale is 'vi')
    ["Sáng", "light"],
    ["Tối", "dark"],
    ["Hệ thống", "system"],
  ] as const)("selects the %s theme option", async (label, theme) => {
    const user = userEvent.setup();

    render(<ThemeToggle />);

    // Button aria-label is t.theme ("Giao diện") from common namespace
    const toggleButtons = screen.getAllByRole("button");
    await user.click(toggleButtons[0]);
    await user.click(screen.getByRole("menuitem", { name: label }));

    expect(setTheme).toHaveBeenCalledWith(theme);
  });
});
