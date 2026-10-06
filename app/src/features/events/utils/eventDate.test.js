import { describe, expect, it } from "vitest";
import { eventToDate, isPastEvent } from "./eventDate.js";

describe("eventToDate", () => {
  it("returns null when there is no date", () => {
    expect(eventToDate({})).toBeNull();
  });

  it("combines date and time into a local Date", () => {
    const d = eventToDate({ date: "2026-01-15", time: "14:30" });
    expect(d).not.toBeNull();
    expect(d.getFullYear()).toBe(2026);
    expect(d.getMonth()).toBe(0);
    expect(d.getDate()).toBe(15);
    expect(d.getHours()).toBe(14);
    expect(d.getMinutes()).toBe(30);
  });

  it("defaults to midnight when time is missing", () => {
    const d = eventToDate({ date: "2026-01-15" });
    expect(d.getHours()).toBe(0);
    expect(d.getMinutes()).toBe(0);
  });

  it("parses a full ISO date string directly", () => {
    const d = eventToDate({ date: "2026-01-15T14:30:00.000Z" });
    expect(d).not.toBeNull();
    expect(d.toISOString()).toBe("2026-01-15T14:30:00.000Z");
  });
});

describe("isPastEvent", () => {
  it("returns false when the event has no date", () => {
    expect(isPastEvent({})).toBe(false);
  });

  it("returns true for a date before `now`", () => {
    const now = new Date("2026-06-01T00:00:00");
    expect(isPastEvent({ date: "2026-01-01" }, now)).toBe(true);
  });

  it("returns false for a date after `now`", () => {
    const now = new Date("2026-01-01T00:00:00");
    expect(isPastEvent({ date: "2026-06-01" }, now)).toBe(false);
  });
});
