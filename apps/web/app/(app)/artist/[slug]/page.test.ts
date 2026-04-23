import { describe, expect, it } from "vitest";

import { formatCompactNumber } from "@/lib/wavestream-api";

describe("artist page utilities", () => {
  it("formats follower counts in compact form", () => {
    expect(formatCompactNumber(12800)).toBe("13K");
    expect(formatCompactNumber(84321)).toBe("84K");
    expect(formatCompactNumber(0)).toBe("0");
  });
});
