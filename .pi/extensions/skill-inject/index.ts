import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseSkillFile } from "./frontmatter.ts";
// Anti-loop follow-ups removed — let the model work freely

// ── Tool-skill registry ─────────────────────────────────────────────────
// Port of local/skill_augment.py. Loads skills/tools/*.md once, hooks
// `before_agent_start` to append a `## Tool Usage Guidance` block to the
// system prompt. Per-user-prompt selection using the whitepaper's 3-priority
// algorithm (error recovery > recency > intent). Budget-guarded, cached.

interface ToolSkill {
	targetTool: string;
	body: string;
	tokenCost: number;
}

const skills = new Map<string, ToolSkill>();
const selectionCache = new Map<string, string>();
let loaded = false;
// antiLoopSkill removed — no longer injecting anti-loop guidance

// State tracked across the session so we have error-recovery + recency
// signals by the time the next `before_agent_start` fires.
const recentToolCalls: string[] = []; // most-recent-first, capped at 8
let lastFailedTool: string | null = null;
// Anti-loop state removed — let the model use whatever tools it needs

// ── Intent keywords → likely tools (exact port of _INTENT_MAP) ──────────
const INTENT_MAP: Record<string, string[]> = {
	read: ["Read"],
	show: ["Read"],
	view: ["Read"],
	cat: ["Read"],
	write: ["Write"],
	create: ["Write", "Bash"],
	implement: ["Write", "Read"],
	code: ["Write", "Read"],
	function: ["Write", "Edit"],
	class: ["Write", "Edit"],
	edit: ["Edit"],
	change: ["Edit"],
	modify: ["Edit"],
	fix: ["Edit"],
	update: ["Edit"],
	replace: ["Edit"],
	add: ["Edit", "Write"],
	refactor: ["Edit", "Read"],
	run: ["Bash"],
	execute: ["Bash"],
	install: ["Bash"],
	build: ["Bash"],
	test: ["Bash"],
	find: ["Glob", "Grep"],
	search: ["Grep"],
	grep: ["Grep"],
	glob: ["Glob"],
	fetch: ["WebFetch"],
	download: ["WebFetch"],
	url: ["WebFetch"],
	web: ["WebSearch"],
	agent: ["Agent"],
	delegate: ["Agent"],
	spawn: ["Agent"],
};

function skillsDir(): string {
	// Extension lives at .pi/extensions/skill-inject/, repo root is 3 levels up
	const here = dirname(fileURLToPath(import.meta.url));
	return join(here, "..", "..", "..", "skills", "tools");
}

function loadSkills(): void {
	if (loaded) return;
	loaded = true;
	const dir = skillsDir();
	if (!existsSync(dir)) return;
	for (const file of readdirSync(dir)) {
		if (!file.endsWith(".md")) continue;
		const parsed = parseSkillFile(readFileSync(join(dir, file), "utf-8"));
		if (!parsed) continue;
		const target = parsed.frontmatter.target_tool;
		if (typeof target !== "string" || !target) continue;
		const cost =
			typeof parsed.frontmatter.token_cost === "number"
				? parsed.frontmatter.token_cost
				: 150;
		// Skip META skills (anti-loop guidance removed)
		if (target === "META") continue;
		skills.set(target, {
			targetTool: target,
			body: parsed.body,
			tokenCost: cost,
		});
	}
}

function predictTools(userText: string): string[] {
	const words = new Set(userText.toLowerCase().split(/\s+/).filter(Boolean));
	const predicted: string[] = [];
	for (const [kw, toolNames] of Object.entries(INTENT_MAP)) {
		if (!words.has(kw)) continue;
		for (const tn of toolNames) if (!predicted.includes(tn)) predicted.push(tn);
	}
	return predicted;
}

function selectSkills(
	prompt: string,
	budget: number,
	allowed?: Set<string>,
): ToolSkill[] {
	const selected: ToolSkill[] = [];
	let used = 0;

	// Cap budget but allow more for fast models that can handle context
	const effectiveBudget = Math.min(budget, 400);
	const maxSkills = 4;

	const tryAdd = (name: string): void => {
		if (selected.length >= maxSkills) return;
		const sk = skills.get(name);
		if (!sk || selected.includes(sk)) return;
		if (allowed && !allowed.has(name)) return;
		if (used + sk.tokenCost > effectiveBudget) return;

		selected.push(sk);
		used += sk.tokenCost;
	};

	// 1. Error recovery — last failed tool
	if (lastFailedTool) tryAdd(lastFailedTool);

	// 2. Recency — last tool calls, but skip the most recent after a
	//    repeated_tool_call correction. Only pick ONE recency tool.
	const recencyCandidates = recentToolCalls.slice(0, 2);
	let recencyUsed = false;
	for (const name of recencyCandidates) {
		if (used >= effectiveBudget) break;
		if (recencyUsed) break;
		tryAdd(name);
		recencyUsed = true;
	}

	// 3. Intent prediction on the user's current prompt
	if (used < effectiveBudget) {
		for (const name of predictTools(prompt)) {
			if (used >= effectiveBudget) break;
			tryAdd(name);
		}
	}

	return selected;
}

function buildBlock(selected: ToolSkill[]): string {
	let out = "\n\n## Tool Usage Guidance\n";
	for (const s of selected) out += `\n### ${s.targetTool}\n${s.body}\n`;
	return out;
}

export default function (pi: ExtensionAPI) {
	// Track tool usage across the whole session so recency + error-recovery
	// state is available on the next before_agent_start.
	pi.on("session_shutdown", async () => {
		// Clear caches to prevent memory leak across sessions in long-running processes
		selectionCache.clear();
		recentToolCalls.length = 0;
		lastFailedTool = null;
	});
	pi.on("tool_result", async (event) => {
		const name = (event as any).toolName || (event as any).name;
		if (typeof name === "string") {
			// prepend, keep deduplicated recency list capped
			const idx = recentToolCalls.indexOf(name);
			if (idx !== -1) recentToolCalls.splice(idx, 1);
			recentToolCalls.unshift(name);
			if (recentToolCalls.length > 8) recentToolCalls.length = 8;
		}
		const isError = (event as any).isError === true;
		lastFailedTool = isError && typeof name === "string" ? name : null;
	});

	pi.on("before_agent_start", async (event, ctx) => {
		loadSkills();
		if (skills.size === 0) return;

		const opts: any = (event as any).systemPromptOptions ?? {};
		const lc = opts.littleCoder ?? {};
		const budget: number = lc.skillTokenBudget ?? 300;
		if (budget <= 0) return;

		const allowedList: string[] | undefined = lc.allowedTools;
		const allowed = allowedList ? new Set(allowedList) : undefined;

		// Knowledge-inject may publish required_tools on systemPromptOptions —
		// pre-add those before selecting so they win even when budget is tight.
		const preferred: string[] = Array.isArray(lc.requiredTools)
			? lc.requiredTools
			: [];
		for (const t of preferred) {
			if (!recentToolCalls.includes(t)) recentToolCalls.unshift(t);
		}

		const selected = selectSkills(event.prompt ?? "", budget, allowed);

		if (selected.length === 0) return;

		const key = selected
			.map((s) => s.targetTool)
			.sort()
			.join("|");
		let block = selectionCache.get(key);
		if (block === undefined) {
			block = buildBlock(selected);
			selectionCache.set(key, block);
		}



		// Fire-and-forget notify so the benchmark harness can count per-turn
		// skill injections without having to reconstruct the system prompt.
		try {
			ctx.ui.notify(
				`skill-inject: +${selected.length} [${selected.map((s) => s.targetTool).join(",")}]`,
				"info",
			);
		} catch {
			// UI unavailable in some run modes — silent best-effort
		}

		return { systemPrompt: (event.systemPrompt ?? "") + block };
	});
}
