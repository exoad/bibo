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

// DRAMATIC high-contrast breathing effect for peripheral vision
// Dark gray (barely visible) to pure bright white - high visibility
const DIM = "\x1b[38;2;50;50;50m"; // Very dim - almost invisible
const MID = "\x1b[38;2;120;120;120m"; // Medium gray
const BRIGHT = "\x1b[38;2;255;255;255m"; // Pure bright white
const RESET = "\x1b[39m";

// Staccato heartbeat: quick flash, hold bright, fade fast
// Pattern: dim → dim → build → FLASH → hold → hold → fade → dim
const BREATH_FRAMES = [
	`${DIM}${FULL_BLOCK}${RESET}`, // 0 - barely visible (rest)
	`${DIM}${FULL_BLOCK}${RESET}`, // 1 -
	`${MID}${FULL_BLOCK}${RESET}`, // 2 - building up
	`${BRIGHT}${FULL_BLOCK}${RESET}`, // 3 - FLASH bright
	`${BRIGHT}${FULL_BLOCK}${RESET}`, // 4 - hold bright
	`${BRIGHT}${FULL_BLOCK}${RESET}`, // 5 - hold bright
	`${MID}${FULL_BLOCK}${RESET}`, // 6 - quick fade
	`${DIM}${FULL_BLOCK}${RESET}`, // 7 - back to dim
];

const BREATH_INTERVAL_MS = 100; // ~10fps, snappy dramatic pulse

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
