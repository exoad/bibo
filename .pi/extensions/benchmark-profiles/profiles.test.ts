import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const settingsPath = join(here, "..", "..", "settings.json");

// Mirror the resolution logic so we can test it as a pure function without
// instantiating the extension.
interface ModelProfile {
	thinking_budget?: number;
	max_turns?: number;
	temperature?: number;
	context_limit?: number;
	benchmark_overrides?: Record<string, Partial<ModelProfile>>;
}

function resolveProfile(
	settings: {
		model_profiles?: Record<string, ModelProfile>;
		default_model_profile?: ModelProfile;
	},
	key: string,
	benchmark?: string,
): ModelProfile {
	const profiles = settings.model_profiles ?? {};
	let base: ModelProfile | undefined = profiles[key];
	if (!base) {
		for (const [pattern, p] of Object.entries(profiles)) {
			if (key.startsWith(pattern)) {
				base = p;
				break;
			}
		}
	}
	if (!base) base = settings.default_model_profile ?? {};
	const { benchmark_overrides, ...basePlain } = { ...base };
	if (benchmark && benchmark_overrides && benchmark_overrides[benchmark]) {
		return { ...basePlain, ...benchmark_overrides[benchmark] };
	}
	return basePlain;
}

describe("benchmark-profiles resolution against real settings.json", () => {
	const settings = JSON.parse(readFileSync(settingsPath, "utf-8")).bibo;

	it("resolves base profile for jackbox/bibo-qwen3.6", () => {
		const p = resolveProfile(settings, "jackbox/bibo-qwen3.6");
		expect(p.thinking_budget).toBe(8192);
		expect(p.context_limit).toBe(131072);
	});

	it("applies terminal_bench overrides when present", () => {
		const p = resolveProfile(
			settings,
			"jackbox/bibo-qwen3.6",
			"terminal_bench",
		);
		// No benchmark_overrides defined in current settings — falls through to base
		expect(p.thinking_budget).toBe(8192);
		expect(p.context_limit).toBe(131072);
	});

	it("applies gaia overrides when present", () => {
		const p = resolveProfile(settings, "jackbox/bibo-qwen3.6", "gaia");
		// No benchmark_overrides defined in current settings — falls through to base
		expect(p.thinking_budget).toBe(8192);
		expect(p.context_limit).toBe(131072);
	});

	it("unknown model falls back to default_model_profile", () => {
		const p = resolveProfile(settings, "fake-provider/fake-model");
		expect(p.thinking_budget).toBe(8192);
		expect(p.context_limit).toBe(131072);
	});

	it("unknown benchmark name yields base profile unchanged", () => {
		const p = resolveProfile(
			settings,
			"jackbox/bibo-qwen3.6",
			"totally_made_up",
		);
		expect(p.thinking_budget).toBe(8192);
	});
});
