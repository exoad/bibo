import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const SPLASH = [
  "  ╔══════════════════════════════╗",
  "  ║   ┌─┐   ┬ ┬┌─┐┌─┐┬─┐┌─┐    ║",
  "  ║   ├─┤┌┐ ├─┤├┤ └─┐├┬┘├┤     ║",
  "  ║   ┴ ┴ └─┘┴ ┴└─┘└─┘┴└─└─┘   ║",
  "  ║                              ║",
  "  ║   personal coding agent     ║",
  "  ╚══════════════════════════════╝",
];

export default function (pi: ExtensionAPI) {
  pi.on("session_start", async (_event, ctx) => {
    ctx.ui.setWidget("splash", SPLASH, { placement: "above" });
    ctx.ui.notify("kibi scaffold loaded", "info");
  });
}
