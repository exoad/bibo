import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
}

function formatTime(date: Date): string {
  const h = date.getHours();
  const m = String(date.getMinutes()).padStart(2, "0");
  const ampm = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 || 12;
  return `${hour12}:${m} ${ampm}`;
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    const now = new Date();
    ctx.ui.setWidget("greeting", ["  " + greeting() + " | " + formatTime(now)], { placement: "above" });
    ctx.ui.notify("kibi scaffold loaded", "info");
  });
}
