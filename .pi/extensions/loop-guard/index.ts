import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";

// Loop Guard — detects and breaks repetitive patterns in smaller/quantized models.
//
// Smaller local models (e.g. Qwen 3.6 35B A3B IQ3) often get stuck in loops:
//   - Repeating the same tool calls with identical arguments
//   - Rambling the same text over and over
//   - Toggling tools on/off without making progress
//
// This extension tracks per-turn fingerprints and aborts + nudges the model
// when a loop is detected.

interface TurnFingerprint {
	turnIndex: number;
	toolCalls: string[]; // "toolName|jsonInput"
	textHash: string; // normalized content fingerprint
	hasToolCalls: boolean;
}

const HISTORY_WINDOW = 8; // turns to look back for loops
const LOOP_REPEAT_THRESHOLD = 4; // same fingerprint must appear this many times
const RAMBLE_THRESHOLD = 8; // consecutive turns with no tool calls = rambling loop
const TEXT_LOOP_THRESHOLD = 6; // higher threshold for text-only loops (was same as tool loop)

// State
let turnHistory: TurnFingerprint[] = [];
let currentTurnTools: string[] = [];
let currentText = "";
let currentTurnIndex = 0;
let loopDetected = false;
let consecutiveNoToolTurns = 0;

function normalizeText(text: string): string {
	return text
		.toLowerCase()
		.replace(/\s+/g, " ")
		.replace(/[^a-z0-9 ]/g, "")
		.trim()
		.slice(0, 300);
}

function hashText(text: string): string {
	// Simple hash for fingerprinting — not cryptographic, just for comparison
	let hash = 0;
	for (let i = 0; i < text.length; i++) {
		const char = text.charCodeAt(i);
		hash = ((hash << 5) - hash + char) | 0;
	}
	return String(hash);
}

function getToolFingerprint(toolName: string, input: unknown): string {
	try {
		return `${toolName}|${JSON.stringify(input)}`;
	} catch {
		return `${toolName}|${String(input)}`;
	}
}

function checkToolLoop(history: TurnFingerprint[]): boolean {
	if (history.length < 2) return false;
	// Check if the last turn's tool calls match any previous turn in the window
	const last = history[history.length - 1];
	if (last.toolCalls.length === 0) return false;

	const lastKey = last.toolCalls.join(";;");
	let repeats = 1;

	for (
		let i = history.length - 2;
		i >= Math.max(0, history.length - HISTORY_WINDOW);
		i--
	) {
		const prev = history[i];
		if (prev.toolCalls.join(";;") === lastKey) {
			repeats++;
			if (repeats >= LOOP_REPEAT_THRESHOLD) return true;
		}
	}
	return false;
}

function checkTextLoop(history: TurnFingerprint[]): boolean {
	if (history.length < 2) return false;
	const last = history[history.length - 1];
	if (last.textHash === "") return false;
	// Only flag text loops if the turn also had no tool calls (pure rambling)
	if (last.hasToolCalls) return false;

	let repeats = 1;
	for (
		let i = history.length - 2;
		i >= Math.max(0, history.length - HISTORY_WINDOW);
		i--
	) {
		if (history[i].textHash === last.textHash) {
			repeats++;
			if (repeats >= TEXT_LOOP_THRESHOLD) return true;
		}
	}
	return false;
}

function checkRambleLoop(history: TurnFingerprint[]): boolean {
	// Count consecutive turns with no tool calls in the window
	let count = 0;
	for (
		let i = history.length - 1;
		i >= Math.max(0, history.length - HISTORY_WINDOW);
		i--
	) {
		if (!history[i].hasToolCalls) count++;
		else break;
	}
	return count >= RAMBLE_THRESHOLD;
}

export default function (pi: ExtensionAPI) {
	pi.on("before_agent_start", async () => {
		turnHistory = [];
		currentTurnTools = [];
		currentText = "";
		loopDetected = false;
		consecutiveNoToolTurns = 0;
	});

	pi.on("turn_start", async (event) => {
		const ev = event as any;

		// If previous turn was aborted for looping, just reset state —
		// don't send follow-up nudges that force extra turns.
		if (loopDetected) {
			loopDetected = false;
			pi.setThinkingLevel("off");
		}

		currentTurnIndex = ev.turnIndex ?? 0;
		currentTurnTools = [];
		currentText = "";
	});

	pi.on("tool_call", async (event) => {
		const ev = event as any;
		const toolName = ev.toolName;
		const input = ev.input ?? ev.arguments ?? {};
		if (typeof toolName === "string") {
			currentTurnTools.push(getToolFingerprint(toolName, input));
		}
	});

	pi.on("message_update", async (event) => {
		const ev = event as any;
		const ame = ev.assistantMessageEvent;
		if (!ame) return;
		if (ame.type === "text_delta" && typeof ame.delta === "string") {
			currentText += ame.delta;
		}
	});

	pi.on("turn_end", async (event, ctx) => {
		if (loopDetected) return;

		const fingerprint: TurnFingerprint = {
			turnIndex: currentTurnIndex,
			toolCalls: currentTurnTools,
			textHash: hashText(normalizeText(currentText)),
			hasToolCalls: currentTurnTools.length > 0,
		};

		turnHistory.push(fingerprint);

		// Trim to prevent unbounded growth — only need HISTORY_WINDOW back
		if (turnHistory.length > HISTORY_WINDOW * 2) {
			turnHistory = turnHistory.slice(-HISTORY_WINDOW * 2);
		}

		// Update consecutive no-tool counter
		if (!fingerprint.hasToolCalls) {
			consecutiveNoToolTurns++;
		} else {
			consecutiveNoToolTurns = 0;
		}

		// Check for loops
		const isToolLoop = checkToolLoop(turnHistory);
		const isTextLoop = checkTextLoop(turnHistory);
		const isRambleLoop = checkRambleLoop(turnHistory);

		if (isToolLoop || isTextLoop || isRambleLoop) {
			loopDetected = true;
			const reason = isToolLoop
				? "repeating the same tool calls"
				: isTextLoop
					? "repeating the same text"
					: "rambling without using tools";

			ctx.ui.notify(
				`loop-guard: detected loop (${reason}) — aborting turn and forcing progress`,
				"warning",
			);
			ctx.abort();
		}
	});
}
