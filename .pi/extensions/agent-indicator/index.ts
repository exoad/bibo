/**
 * Agent Indicator - Premium status bar for agent activity
 *
 * Sleek, professional visualization of agent state with rapid
 * but smooth color transitions. Always visible.
 *
 * STATE VISUALIZATION:
 * - IDLE (no session): Deep pulse - slow, subtle
 * - READY (session active, waiting): Gentle wave - calm
 * - THINKING (agent processing): Flowing gradient - active
 * - STREAMING (tokens arriving): Rapid shimmer - intense
 *
 * Each state has distinct color palette and animation speed.
 */

import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

const BAR_WIDTH = 40;
const BAR = "█".repeat(BAR_WIDTH);

// COLOR PALETTES - Premium, saturated colors
const PALETTE = {
	// IDLE: Deep indigo/purple - elegant, always on
	idle: [
		"\x1b[38;2;60;20;120m",   // Deep indigo
		"\x1b[38;2;80;40;160m",   // Rich purple
		"\x1b[38;2;100;60;200m",  // Violet
		"\x1b[38;2;120;80;255m",  // Bright violet
	],
	// READY: Teal/cyan - calm, waiting
	ready: [
		"\x1b[38;2;0;100;120m",   // Deep teal
		"\x1b[38;2;0;140;160m",   // Sea green
		"\x1b[38;2;0;180;200m",   // Cyan
		"\x1b[38;2;0;220;255m",   // Bright cyan
	],
	// THINKING: Amber/gold - processing, working
	thinking: [
		"\x1b[38;2;180;100;0m",   // Deep amber
		"\x1b[38;2;220;140;0m",   // Gold
		"\x1b[38;2;255;180;0m",   // Yellow
		"\x1b[38;2;255;220;50m",  // Bright yellow
	],
	// STREAMING: Magenta/pink - intense, active
	streaming: [
		"\x1b[38;2;180;0;100m",    // Deep magenta
		"\x1b[38;2;220;40;140m",   // Hot pink
		"\x1b[38;2;255;80;180m",   // Bright pink
		"\x1b[38;2;255;120;220m",  // Light pink
	],
};

// TIMING - Smooth but responsive
const TIMING = {
	idle: 800,      // Slow, elegant pulse
	ready: 400,     // Gentle wave
	thinking: 150,  // Flowing gradient
	streaming: 60,  // Rapid shimmer
};

// State tracking
let currentState: "idle" | "ready" | "thinking" | "streaming" = "idle";
let tokenTimestamps: number[] = [];
let lastUpdateTime = 0;
let initialized = false;

/**
 * Generate smooth wave frames for a palette
 * Creates flowing animation with proper easing
 */
function generateWaveFrames(
	palette: string[],
	frameCount: number,
): string[] {
	const frames: string[] = [];
	
	for (let i = 0; i < frameCount; i++) {
		// Smooth sine wave for color selection
		const t = i / frameCount;
		const wave = Math.sin(t * Math.PI * 2); // -1 to 1
		const normalized = (wave + 1) / 2; // 0 to 1
		
		// Pick color based on wave position
		const colorIndex = Math.floor(normalized * (palette.length - 1));
		const color = palette[Math.min(colorIndex, palette.length - 1)];
		
		frames.push(`${color}${BAR}\x1b[39m`);
	}
	
	return frames;
}

/**
 * Generate shimmer frames for streaming state
 * Rapid, energetic but smooth
 */
function generateShimmerFrames(palette: string[]): string[] {
	const frames: string[] = [];
	const steps = 16; // More frames for smoother rapid animation
	
	for (let i = 0; i < steps; i++) {
		// Rapid color cycling with smooth interpolation
		const t = i / steps;
		const position = t * palette.length;
		const index = Math.floor(position) % palette.length;
		const nextIndex = (index + 1) % palette.length;
		const blend = position - Math.floor(position);
		
		// Use current or next color based on blend
		const color = blend > 0.5 ? palette[nextIndex] : palette[index];
		frames.push(`${color}${BAR}\x1b[39m`);
	}
	
	return frames;
}

/**
 * Get indicator config for current state
 */
function getStateConfig(state: typeof currentState): { frames: string[]; intervalMs: number } {
	switch (state) {
		case "idle":
			return {
				frames: generateWaveFrames(PALETTE.idle, 8),
				intervalMs: TIMING.idle,
			};
		case "ready":
			return {
				frames: generateWaveFrames(PALETTE.ready, 12),
				intervalMs: TIMING.ready,
			};
		case "thinking":
			return {
				frames: generateWaveFrames(PALETTE.thinking, 16),
				intervalMs: TIMING.thinking,
			};
		case "streaming":
			return {
				frames: generateShimmerFrames(PALETTE.streaming),
				intervalMs: TIMING.streaming,
			};
	}
}

/**
 * Calculate tokens per second
 */
function calculateTPS(): number {
	const now = Date.now();
	tokenTimestamps = tokenTimestamps.filter(ts => now - ts < 1000);
	return tokenTimestamps.length;
}

/**
 * Update indicator to new state
 */
function setState(
	ctx: { ui: { setWorkingIndicator: (indicator: { frames: string[]; intervalMs: number } | undefined) => void } },
	newState: typeof currentState,
) {
	if (newState === currentState && initialized) return;
	
	currentState = newState;
	const config = getStateConfig(newState);
	
	ctx.ui.setWorkingIndicator({
		frames: config.frames,
		intervalMs: config.intervalMs,
	});
	
	initialized = true;
}

export default function (pi: ExtensionAPI) {
	// IDLE: No active session yet
	// Will transition to READY on session_start
	
	// Session begins - agent is ready and waiting
	pi.on("session_start", async (_event, ctx) => {
		setState(ctx, "ready");
	});
	
	// Agent starts processing
	pi.on("agent_start", async (_event, ctx) => {
		setState(ctx, "thinking");
	});
	
	// Tokens arriving - streaming state
	pi.on("message_update", async (event, ctx) => {
		const msgEvent = event.assistantMessageEvent;
		if (
			msgEvent?.type === "text_delta" ||
			msgEvent?.type === "thinking_delta" ||
			msgEvent?.type === "toolcall_delta"
		) {
			tokenTimestamps.push(Date.now());
			
			const now = Date.now();
			if (now - lastUpdateTime > 50) {
				lastUpdateTime = now;
				setState(ctx, "streaming");
			}
		}
	});
	
	// Check if we should return to thinking state (tokens slowed down)
	setInterval(() => {
		if (currentState === "streaming") {
			const tps = calculateTPS();
			if (tps < 5) {
				// Tokens stopped, go back to thinking
				currentState = "thinking";
			}
		}
	}, 500);
	
	// Agent done - back to ready
	pi.on("agent_end", async (_event, ctx) => {
		tokenTimestamps = [];
		setState(ctx, "ready");
	});
	
	// Turn boundaries
	pi.on("turn_start", async (_event, ctx) => {
		if (currentState !== "streaming") {
			setState(ctx, "thinking");
		}
	});
	
	pi.on("turn_end", async (_event, ctx) => {
		setState(ctx, "ready");
	});
	
	// Tool execution
	pi.on("tool_execution_start", async (_event, ctx) => {
		setState(ctx, "thinking");
	});
	
	pi.on("tool_execution_end", async (_event, ctx) => {
		setState(ctx, "ready");
	});
	
	// Message lifecycle
	pi.on("message_start", async (_event, ctx) => {
		setState(ctx, "thinking");
	});
	
	pi.on("message_end", async (_event, ctx) => {
		setState(ctx, "ready");
	});
}
