/**
 * Breathing Indicator - white pulsing animation during agent activity
 *
 * Uses setWorkingIndicator API instead of modifying the editor.
 * This avoids text duplication bugs caused by requestRender() loops.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// White color breathing effect using ANSI codes
// Brightness levels from dim to bright white
const BREATH_FRAMES = [
  "\x1b[38;2;180;180;180m●\x1b[39m",  // dim
  "\x1b[38;2;200;200;200m●\x1b[39m",
  "\x1b[38;2;220;220;220m●\x1b[39m",
  "\x1b[38;2;240;240;240m●\x1b[39m",
  "\x1b[38;2;255;255;255m●\x1b[39m",  // bright
  "\x1b[38;2;240;240;240m●\x1b[39m",
  "\x1b[38;2;220;220;220m●\x1b[39m",
  "\x1b[38;2;200;200;200m●\x1b[39m",
];

const BREATH_INTERVAL_MS = 150; // ~6.6fps, smooth but not aggressive

export default function (pi: ExtensionAPI) {
  pi.on("agent_start", async (_event, ctx) => {
    // Set breathing white indicator during agent activity
    ctx.ui.setWorkingIndicator({
      frames: BREATH_FRAMES,
      intervalMs: BREATH_INTERVAL_MS,
    });
  });

  pi.on("agent_end", async (_event, ctx) => {
    // Restore default indicator when agent finishes
    ctx.ui.setWorkingIndicator(undefined);
  });
}
