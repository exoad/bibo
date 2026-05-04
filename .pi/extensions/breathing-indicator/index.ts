/**
 * Breathing Indicator - full-width white pulsing bar during agent activity
 *
 * Uses setWorkingIndicator API instead of modifying the editor.
 * This avoids text duplication bugs caused by requestRender() loops.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// Full-width block bar using Unicode full block character
const BAR_WIDTH = 40;
const FULL_BLOCK = "█".repeat(BAR_WIDTH);

// White color breathing effect using ANSI codes
// Brightness levels from dim to bright white
const BREATH_FRAMES = [
  `\x1b[38;2;140;140;140m${FULL_BLOCK}\x1b[39m`,  // dimmest
  `\x1b[38;2;170;170;170m${FULL_BLOCK}\x1b[39m`,
  `\x1b[38;2;200;200;200m${FULL_BLOCK}\x1b[39m`,
  `\x1b[38;2;230;230;230m${FULL_BLOCK}\x1b[39m`,
  `\x1b[38;2;255;255;255m${FULL_BLOCK}\x1b[39m`,  // bright white
  `\x1b[38;2;230;230;230m${FULL_BLOCK}\x1b[39m`,
  `\x1b[38;2;200;200;200m${FULL_BLOCK}\x1b[39m`,
  `\x1b[38;2;170;170;170m${FULL_BLOCK}\x1b[39m`,
];

const BREATH_INTERVAL_MS = 180; // ~5.5fps, smooth breathing cycle

export default function (pi: ExtensionAPI) {
  pi.on("agent_start", async (_event, ctx) => {
    // Set full-width breathing white bar during agent activity
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
