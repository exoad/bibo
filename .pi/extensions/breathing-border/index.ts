/**
 * Breathing Border - smooth breathing pulse on editor border
 *
 * A single color that gently pulses brighter and dimmer,
 * creating a calm breathing effect on the chatbox lines.
 */

import { CustomEditor, type ExtensionAPI } from "@mariozechner/pi-coding-agent";

// Soft warm white - gentle and calming
const COLOR: [number, number, number] = [255, 255, 255];

const BREATH_CYCLE_MS = 1200; // full inhale-exhale cycle
const FRAME_INTERVAL_MS = 30; // ~33fps

function rgbToAnsi(r: number, g: number, b: number): string {
	return `\x1b[38;2;${Math.round(r)};${Math.round(g)};${Math.round(b)}m`;
}

class BreathingEditor extends CustomEditor {
	private animationTimer?: ReturnType<typeof setInterval>;
	private startTime = 0;
	private working = false;

	handleInput(data: string): void {
		super.handleInput(data);
	}

	startAnimation(): void {
		if (this.animationTimer || !this.working) return;
		this.startTime = Date.now();
		this.animationTimer = setInterval(() => {
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

		const elapsed = Date.now() - this.startTime;
		const cyclePos = (elapsed % BREATH_CYCLE_MS) / BREATH_CYCLE_MS; // 0..1
		// Smooth sine breath: slow fade in, slow fade out
		const brightness = 0.5 + 0.5 * Math.sin(cyclePos * Math.PI * 2 - Math.PI / 2);

		const [r, g, b] = COLOR;
		const cr = Math.round(r * (0.3 + 0.7 * brightness));
		const cg = Math.round(g * (0.3 + 0.7 * brightness));
		const cb = Math.round(b * (0.3 + 0.7 * brightness));
		const colorCode = rgbToAnsi(cr, cg, cb);

		return lines.map((line) => {
			if (!line.includes("─")) return line;
			return line.replace(/\x1b\[38;2;\d+;\d+;\d+m([─]+)\x1b\[39m/g, () => {
				return colorCode + "─".repeat(1) + "\x1b[39m";
			});
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
