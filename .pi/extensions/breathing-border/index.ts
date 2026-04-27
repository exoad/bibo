/**
 * Breathing Border - shimmer wave on editor border
 *
 * A single vibrant color with a brightness wave that sweeps across
 * the border line, creating a shimmer/shine effect.
 */

import { CustomEditor, type ExtensionAPI } from "@mariozechner/pi-coding-agent";

// Bright cyan - vivid and eye-catching
const COLOR: [number, number, number] = [190, 100, 75];

const FRAME_INTERVAL_MS = 40; // 25fps - moderate speed
const BASE_SPEED = 0.02; // base shimmer speed
const BASE_WIDTH = 0.15; // base shimmer width
const BASE_BRIGHTNESS = 0.6; // base brightness
const SHIMMER_BRIGHTNESS = 1.0;

function hslToAnsi(h: number, s: number, l: number): string {
	const c = (1 - Math.abs(2 * (l / 100) - 1)) * (s / 100);
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l / 100 - c / 2;

	let r = 0, g = 0, b = 0;
	if (h < 60) { r = c; g = x; b = 0; }
	else if (h < 120) { r = x; g = c; b = 0; }
	else if (h < 180) { r = 0; g = c; b = x; }
	else if (h < 240) { r = 0; g = x; b = c; }
	else if (h < 300) { r = x; g = 0; b = c; }
	else { r = c; g = 0; b = x; }

	const ri = Math.round((r + m) * 255);
	const gi = Math.round((g + m) * 255);
	const bi = Math.round((b + m) * 255);

	return `\x1b[38;2;${ri};${gi};${bi}m`;
}

function getColor(): [number, number, number] {
	return COLOR;
}

class BreathingEditor extends CustomEditor {
	private animationTimer?: ReturnType<typeof setInterval>;
	private frame = 0;
	private working = false;

	handleInput(data: string): void {
		super.handleInput(data);
	}

	startAnimation(): void {
		if (this.animationTimer || !this.working) return;
		this.frame = 0;
		this.animationTimer = setInterval(() => {
			this.frame++;
			this.tui.requestRender();
		}, FRAME_INTERVAL_MS);
	}

	stopAnimation(): void {
		if (this.animationTimer) {
			clearInterval(this.animationTimer);
			this.animationTimer = undefined;
		}
	}

	render(width: number): string[] {
		const lines = super.render(width);
		if (!this.working) {
			return lines;
		}

		const [h, s, l] = getColor();

		// Chaotic shimmer: random position jumps, width changes, brightness flicker
		const chaos = this.frame * 0.17; // pseudo-random seed
		const jitter = Math.sin(chaos * 3.7) * 0.3 + Math.sin(chaos * 7.1) * 0.2; // chaotic position
		const shimmerPos = ((this.frame * BASE_SPEED + jitter) % 1 + 1) % 1;
		const shimmerWidth = BASE_WIDTH + Math.sin(chaos * 5.3) * 0.08; // fluctuating width
		const brightness = BASE_BRIGHTNESS + Math.sin(chaos * 8.9) * 0.25; // flickering brightness

		return lines.map((line) => {
			if (!line.includes("─")) return line;

			// Replace the borderColor-styled ─ chars with chaotic shimmer effect
			const result = line.replace(/\x1b\[38;2;\d+;\d+;\d+m([─]+)\x1b\[39m/g, (_, dashes) => {
				const len = dashes.length;
				let output = "";
				for (let i = 0; i < len; i++) {
					const charPos = i / Math.max(len - 1, 1); // 0 to 1
					// Distance from shimmer center (0 = at shimmer, 1 = far from it)
					const dist = Math.abs(charPos - shimmerPos);
					// Smooth falloff - bright in center, fades at edges
					const brightness = dist < shimmerWidth
						? 0 + (SHIMMER_BRIGHTNESS - 5) * (1 - dist / shimmerWidth)
						: 0;
					const colorCode = hslToAnsi(h, s, l * brightness);
					output += colorCode + dashes[i];
				}
				return output;
			});

			if (result === line) {
				return line;
			}
			return result;
		});
	}
}

export default function (pi: ExtensionAPI) {
	let editor: BreathingEditor | undefined;

	pi.on("session_start", (_event, ctx) => {
		ctx.ui.setEditorComponent((tui, theme, kb) => {
			editor = new BreathingEditor(tui, theme, kb);
			return editor;
		});
	});

	pi.on("agent_start", (_event, ctx) => {
		if (editor) {
			editor.working = true;
			editor.startAnimation();
		}
	});

	pi.on("agent_end", (_event, _ctx) => {
		if (editor) {
			editor.working = false;
			editor.stopAnimation();
		}
	});
}
