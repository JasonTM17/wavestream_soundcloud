import { describe, expect, it } from "vitest";

import { formatCompactNumber } from "@/lib/wavestream-api";

describe("library page utilities", () => {
  it("formats large counts in compact form", () => {
    expect(formatCompactNumber(18)).toBe("18");
    expect(formatCompactNumber(1000)).toBe("1K");
    expect(formatCompactNumber(5000000)).toBe("5M");
  });
});
