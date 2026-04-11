"use client";

import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { Button } from "./button";

afterEach(() => {
  cleanup();
});

describe("Button", () => {
  it.each([
    ["default", "bg-primary text-primary-foreground"],
    ["secondary", "bg-secondary text-secondary-foreground"],
    ["outline", "border-border/85 bg-card/92 text-foreground"],
    ["ghost", "text-foreground/84 hover:bg-muted/88"],
    ["accent", "bg-accent text-accent-foreground"],
  ] as const)("applies the %s variant classes", (variant, expectedClass) => {
    render(<Button variant={variant}>WaveStream CTA</Button>);

    expect(screen.getByRole("button", { name: "WaveStream CTA" })).toHaveClass(expectedClass);
  });

  it("forwards CTA styling through asChild links", () => {
    render(
      <Button asChild variant="outline" size="lg" className="rounded-full px-6">
        <a href="/discover">Explore discovery</a>
      </Button>,
    );

    const cta = screen.getByRole("link", { name: "Explore discovery" });

    expect(cta).toHaveAttribute("href", "/discover");
    expect(cta).toHaveClass("border-border/85 bg-card/92 text-foreground");
    expect(cta).toHaveClass("rounded-full px-6");
  });

  it("keeps disabled buttons non-interactive", () => {
    render(<Button disabled>Start free</Button>);

    const cta = screen.getByRole("button", { name: "Start free" });

    expect(cta).toBeDisabled();
    expect(cta).toHaveClass("disabled:pointer-events-none");
    expect(cta).toHaveClass("disabled:translate-y-0 disabled:shadow-none disabled:saturate-50 disabled:opacity-60");
  });
});
