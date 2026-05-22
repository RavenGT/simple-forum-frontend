import { describe, expect, it } from "vitest";
import { relativeTime } from "./relativeTime";

const NOW = new Date("2026-05-22T12:00:00Z").getTime();

describe("relativeTime", () => {
  it("'just now' for under a minute", () => {
    expect(relativeTime(new Date(NOW - 30_000), NOW)).toBe("just now");
  });

  it("minutes", () => {
    expect(relativeTime(new Date(NOW - 5 * 60_000), NOW)).toBe("5m ago");
  });

  it("hours", () => {
    expect(relativeTime(new Date(NOW - 3 * 3600_000), NOW)).toBe("3h ago");
  });

  it("days", () => {
    expect(relativeTime(new Date(NOW - 2 * 86400_000), NOW)).toBe("2d ago");
  });

  it("weeks", () => {
    expect(relativeTime(new Date(NOW - 14 * 86400_000), NOW)).toBe("2w ago");
  });

  it("falls back to a date for >= 1 year", () => {
    expect(relativeTime(new Date("2024-01-15T00:00:00Z"), NOW))
      .toMatch(/^Jan 15, 2024$/);
  });

  it("accepts ISO strings", () => {
    expect(relativeTime("2026-05-22T11:55:00Z", NOW)).toBe("5m ago");
  });
});
