import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

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

function updateGreeting(ctx: ExtensionAPI["ui"]): void {
  const now = new Date();
  const line = "  " + greeting() + "  " + formatDate(now) + "  " + formatTime(now);
  ctx.setWidget("greeting", [line], { placement: "above" });
}

export default function (pi: ExtensionAPI) {
  let timer: ReturnType<typeof setInterval> | undefined;

  pi.on("session_start", async (_event, ctx) => {
    updateGreeting(ctx.ui);
    ctx.ui.notify("kibi scaffold loaded", "info");
    timer = setInterval(() => updateGreeting(ctx.ui), 1000);
  });

  pi.on("session_shutdown", async () => {
    if (timer) clearInterval(timer);
  });
}
