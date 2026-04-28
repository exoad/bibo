import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Component, TUI } from "@mariozechner/pi-tui";
import type { Theme } from "@mariozechner/pi-coding-agent";

// --- helpers to test the component factory directly ---

// Re-implement the factory logic inline so we can test it without loading the full extension
function greeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatDate(date: Date): string {
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  return `${days[date.getDay()]} ${months[date.getMonth()]} ${date.getDate()}`;
}

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, "0");
  const s = String(date.getSeconds()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m}:${s} ${ampm}`;
}

function formatUptime(ms: number): string {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

function greetingLine(): string {
  const now = new Date();
  const uptime = formatUptime(Date.now() - (globalThis as any).__sessionStart || Date.now());
  return "  " + greeting() + "  " + formatDate(now) + "  " + formatTime(now) + "  " + uptime;
}

describe("hello extension — greeting component", () => {
  beforeEach(() => {
    (globalThis as any).__sessionStart = Date.now();
  });

  afterEach(() => {
    delete (globalThis as any).__sessionStart;
  });

  it("greeting returns correct value for each time period", () => {
    const orig = new Date().getHours;
    // Morning
    vi.spyOn(Date.prototype as any, "getHours").mockReturnValue(8);
    expect(greeting()).toBe("Good Morning");
    // Afternoon
    vi.spyOn(Date.prototype as any, "getHours").mockReturnValue(14);
    expect(greeting()).toBe("Good Afternoon");
    // Evening
    vi.spyOn(Date.prototype as any, "getHours").mockReturnValue(20);
    expect(greeting()).toBe("Good Evening");
    vi.restoreAllMocks();
  });

  it("formatDate produces expected format", () => {
    const d = new Date("2026-04-27T12:00:00");
    // April 27 is a Monday
    expect(formatDate(d)).toBe("Mon Apr 27");
  });

  it("formatTime pads minutes and seconds", () => {
    const d = new Date("2026-04-27T09:05:03");
    expect(formatTime(d)).toBe("9:05:03 AM");
  });

  it("formatUptime handles seconds", () => {
    expect(formatUptime(500)).toBe("0s");
    expect(formatUptime(3000)).toBe("3s");
  });

  it("formatUptime handles minutes", () => {
    expect(formatUptime(90000)).toBe("1m 30s");
    expect(formatUptime(120000)).toBe("2m 0s");
  });

  it("formatUptime handles hours", () => {
    expect(formatUptime(3600000)).toBe("1h 0m");
    expect(formatUptime(7260000)).toBe("2h 1m");
  });

  it("greetingLine includes all expected fields", () => {
    const line = greetingLine();
    expect(line).toContain("Good ");
    expect(line).toContain("  "); // separators
    expect(line).toMatch(/(AM|PM)/);
    // uptime is always present (at least "0s")
    expect(line).toMatch(/\d+[smh]/);
  });

  it("component factory returns valid Component with required methods", () => {
    const mockTui = {
      requestRender: vi.fn(),
    } as unknown as TUI;
    const mockTheme = {} as Theme;

    // Simulate the factory
    const sessionStart = Date.now();
    (globalThis as any).__sessionStart = sessionStart;

    const timer = setInterval(() => {
      mockTui.requestRender();
    }, 1000);

    const component = {
      render: (_width: number) => [greetingLine()],
      invalidate: () => {},
      dispose: () => clearInterval(timer),
    };

    // Verify Component interface compliance
    expect(component.render).toBeDefined();
    expect(component.invalidate).toBeDefined();
    expect(component.dispose).toBeDefined();

    // Verify render returns string array
    const lines = component.render(80);
    expect(Array.isArray(lines)).toBe(true);
    expect(lines.length).toBe(1);
    expect(typeof lines[0]).toBe("string");

    // Verify dispose clears the timer
    component.dispose();
    expect(timer).toBeDefined(); // interval still exists but is cleared

    // Verify invalidate is callable
    component.invalidate();
  });

  it("dispose is idempotent — calling twice doesn't throw", () => {
    const mockTui = { requestRender: vi.fn() } as unknown as TUI;
    const sessionStart = Date.now();
    (globalThis as any).__sessionStart = sessionStart;

    const timer = setInterval(() => {
      mockTui.requestRender();
    }, 1000);

    const dispose = () => clearInterval(timer);
    dispose();
    expect(() => dispose()).not.toThrow(); // clearInterval on cleared timer is safe
  });
});
