import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import type { Component, TUI, Theme } from "@mariozechner/pi-tui";

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

let sessionStart = Date.now();

function greetingLine(): string {
  const now = new Date();
  const uptime = formatUptime(Date.now() - sessionStart);
  return "  " + greeting() + "  " + formatDate(now) + "  " + formatTime(now) + "  " + uptime;
}

function greetingComponent(tui: TUI, _theme: Theme): Component & { dispose?(): void } {
  const render = () => {
    tui.setWidget("greeting", [greetingLine()], { placement: "above" });
    tui.requestRender();
  };

  const timer = setInterval(render, 1000);

  return {
    render: () => [greetingLine()],
    dispose: () => clearInterval(timer),
  };
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    sessionStart = Date.now();
    ctx.ui.setWidget("greeting", greetingComponent);
    ctx.ui.notify("kibi scaffold loaded", "info");
  });
}
