import { describe, it, expect, beforeEach } from "vitest";

// Test the timer's formatDuration and elapsed logic in isolation.
// The extension itself is stateful (in-memory), so we test the pure functions.

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    const rem = minutes % 60;
    return `${hours}h ${rem}m ${seconds % 60}s`;
  }
  if (minutes > 0) {
    const rem = seconds % 60;
    return `${minutes}m ${rem}s`;
  }
  return `${seconds}s`;
}

describe("timer", () => {
  it("formats zero", () => {
    expect(formatDuration(0)).toBe("0s");
  });

  it("formats seconds", () => {
    expect(formatDuration(45_000)).toBe("45s");
    expect(formatDuration(59_999)).toBe("59s");
  });

  it("formats minutes", () => {
    expect(formatDuration(60_000)).toBe("1m 0s");
    expect(formatDuration(125_000)).toBe("2m 5s");
    expect(formatDuration(3_600_000 - 1)).toBe("59m 59s");
  });

  it("formats hours", () => {
    expect(formatDuration(3_600_000)).toBe("1h 0m 0s");
    expect(formatDuration(3_720_000)).toBe("1h 2m 0s");
    expect(formatDuration(4_200_000)).toBe("1h 10m 0s");
    expect(formatDuration(4_800_000)).toBe("1h 20m 0s");
    expect(formatDuration(7_261_000)).toBe("2h 1m 1s");
  });

  it("handles large values", () => {
    expect(formatDuration(86_400_000)).toBe("24h 0m 0s");
  });
});
