import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

function greeting(): string {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return "Good Morning";
  if (hour >= 12 && hour < 17) return "Good Afternoon";
  return "Good Evening";
}

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setWidget("greeting", ["  " + greeting() + "!"], { placement: "above" });
    ctx.ui.notify("kibi scaffold loaded", "info");
  });
}
