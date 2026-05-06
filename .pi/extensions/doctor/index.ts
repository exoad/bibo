import type { ExtensionAPI } from "@mariozechner/pi-coding-agent";
import { Type } from "@sinclair/typebox";
import { readFileSync, existsSync, readdirSync, statSync } from "fs";
import { join, resolve } from "path";
import { execSync } from "child_process";
import { homedir } from "os";

// Doctor extension — comprehensive diagnostics for bibo
// Provides the `doctor` tool for system health checks

interface CheckResult {
	name: string;
	status: "pass" | "fail" | "warn";
	message: string;
	details?: string;
}

interface DiagnosticReport {
	timestamp: string;
	biboVersion: string;
	piVersion: string;
	checks: CheckResult[];
}

const BIBO_ROOT = resolve(join(homedir(), "bibo"));
const PI_DIR = join(BIBO_ROOT, ".pi");
const EXTENSIONS_DIR = join(PI_DIR, "extensions");

// ── Utility Functions ───────────────────────────────────────────────

function tryReadJson(path: string): unknown | null {
	try {
		return JSON.parse(readFileSync(path, "utf-8"));
	} catch {
		return null;
	}
}

function tryExec(command: string, timeout = 5000): string | null {
	try {
		return execSync(command, {
			encoding: "utf-8",
			timeout,
			cwd: BIBO_ROOT,
		}).trim();
	} catch {
		return null;
	}
}

function formatBytes(bytes: number): string {
	if (bytes === 0) return "0 B";
	const k = 1024;
	const sizes = ["B", "KB", "MB", "GB"];
	const i = Math.floor(Math.log(bytes) / Math.log(k));
	return `${(bytes / k ** i).toFixed(1)} ${sizes[i]}`;
}

function getDirSize(dirPath: string): number {
	let size = 0;
	try {
		const files = readdirSync(dirPath);
		for (const file of files) {
			const filePath = join(dirPath, file);
			const stats = statSync(filePath);
			if (stats.isDirectory()) {
				size += getDirSize(filePath);
			} else {
				size += stats.size;
			}
		}
	} catch {
		// Ignore errors
	}
	return size;
}

// ── Diagnostic Checks ────────────────────────────────────────────────

async function checkNodeVersion(): Promise<CheckResult> {
	const version = process.version;
	const major = parseInt(version.slice(1).split(".")[0]);
	if (major >= 20) {
		return { name: "Node.js Version", status: "pass", message: version };
	}
	return {
		name: "Node.js Version",
		status: "warn",
		message: version,
		details: "Node.js 20+ recommended",
	};
}

async function checkBiboStructure(): Promise<CheckResult> {
	const required = [
		"package.json",
		".pi/settings.json",
		".pi/extensions",
		"AGENTS.md",
		"SELF.md",
	];
	const missing = required.filter((f) => !existsSync(join(BIBO_ROOT, f)));
	if (missing.length === 0) {
		return {
			name: "Bibo Structure",
			status: "pass",
			message: "All required files present",
		};
	}
	return {
		name: "Bibo Structure",
		status: "fail",
		message: `Missing: ${missing.join(", ")}`,
	};
}

async function checkProviderConfig(): Promise<CheckResult> {
	const providerPath = join(BIBO_ROOT, "provider.json");
	if (!existsSync(providerPath)) {
		return {
			name: "Provider Config",
			status: "fail",
			message: "provider.json not found",
			details: "Copy provider.json.example to provider.json",
		};
	}
	const config = tryReadJson(providerPath);
	if (!config || typeof config !== "object") {
		return {
			name: "Provider Config",
			status: "fail",
			message: "Invalid JSON in provider.json",
		};
	}
	const providers = (config as Record<string, unknown>).providers;
	if (!Array.isArray(providers) || providers.length === 0) {
		return {
			name: "Provider Config",
			status: "warn",
			message: "No providers configured",
		};
	}
	return {
		name: "Provider Config",
		status: "pass",
		message: `${providers.length} provider(s) configured`,
	};
}

async function checkProviderConnectivity(): Promise<CheckResult> {
	const providerPath = join(BIBO_ROOT, "provider.json");
	const config = tryReadJson(providerPath) as Record<string, unknown> | null;
	if (!config?.providers) {
		return {
			name: "Provider Connectivity",
			status: "warn",
			message: "Skipped (no config)",
		};
	}

	const providers = config.providers as Array<{
		baseUrl?: string;
		name?: string;
	}>;
	const results: string[] = [];
	let hasFail = false;

	for (const provider of providers) {
		if (!provider.baseUrl) continue;
		try {
			// Try to connect with a short timeout
			const url = provider.baseUrl.replace(/\/v1$/, "");
			execSync(
				`curl -s -o /dev/null -w "%{http_code}" --max-time 3 "${url}/models" 2>/dev/null || echo "000"`,
				{ encoding: "utf-8", timeout: 5000 },
			);
			results.push(`${provider.name || "unknown"}: reachable`);
		} catch {
			results.push(`${provider.name || "unknown"}: unreachable`);
			hasFail = true;
		}
	}

	if (results.length === 0) {
		return {
			name: "Provider Connectivity",
			status: "warn",
			message: "No providers to check",
		};
	}

	return {
		name: "Provider Connectivity",
		status: hasFail ? "warn" : "pass",
		message: results.join(", "),
	};
}

async function checkSettings(): Promise<CheckResult> {
	const settingsPath = join(PI_DIR, "settings.json");
	if (!existsSync(settingsPath)) {
		return {
			name: "Settings",
			status: "fail",
			message: "settings.json not found",
		};
	}
	const settings = tryReadJson(settingsPath);
	if (!settings || typeof settings !== "object") {
		return { name: "Settings", status: "fail", message: "Invalid JSON" };
	}
	const s = settings as Record<string, unknown>;
	const issues: string[] = [];

	const bibo = s.bibo as Record<string, unknown> | undefined;
	if (!bibo?.model_profiles) {
		issues.push("No model_profiles");
	}
	if (!Array.isArray(s.packages)) {
		issues.push("No packages array");
	}

	if (issues.length > 0) {
		return { name: "Settings", status: "warn", message: issues.join(", ") };
	}
	return { name: "Settings", status: "pass", message: "Valid configuration" };
}

async function checkExtensions(): Promise<CheckResult> {
	if (!existsSync(EXTENSIONS_DIR)) {
		return {
			name: "Extensions",
			status: "fail",
			message: "Extensions directory not found",
		};
	}
	try {
		const entries = readdirSync(EXTENSIONS_DIR, { withFileTypes: true });
		const extensions = entries
			.filter((e) => e.isDirectory())
			.map((e) => e.name);
		return {
			name: "Extensions",
			status: "pass",
			message: `${extensions.length} extensions found`,
		};
	} catch (e) {
		return { name: "Extensions", status: "fail", message: `Error: ${e}` };
	}
}

async function checkNpmPackages(): Promise<CheckResult> {
	const packagePath = join(BIBO_ROOT, "package.json");
	if (!existsSync(packagePath)) {
		return {
			name: "NPM Packages",
			status: "fail",
			message: "package.json not found",
		};
	}

	const nodeModulesPath = join(BIBO_ROOT, "node_modules");
	if (!existsSync(nodeModulesPath)) {
		return {
			name: "NPM Packages",
			status: "fail",
			message: "node_modules not found",
			details: "Run: npm install",
		};
	}

	// Check for key packages
	const keyPackages = ["@mariozechner/pi-coding-agent", "@sinclair/typebox"];
	const missing = keyPackages.filter(
		(pkg) => !existsSync(join(nodeModulesPath, pkg)),
	);

	if (missing.length > 0) {
		return {
			name: "NPM Packages",
			status: "warn",
			message: `Missing: ${missing.join(", ")}`,
		};
	}

	return {
		name: "NPM Packages",
		status: "pass",
		message: "Core dependencies installed",
	};
}

async function checkCostTrackerState(): Promise<CheckResult> {
	const statePath = join(
		homedir(),
		".pi",
		"extensions",
		"cost-tracker",
		"state.json",
	);
	if (!existsSync(statePath)) {
		return {
			name: "Cost Tracker",
			status: "warn",
			message: "No state file (will be created on first run)",
		};
	}
	try {
		const state = tryReadJson(statePath) as { totalCost?: number } | null;
		const cost = state?.totalCost ?? 0;
		return {
			name: "Cost Tracker",
			status: "pass",
			message: `Accumulated: $${(cost / 100).toFixed(2)}`,
		};
	} catch {
		return {
			name: "Cost Tracker",
			status: "warn",
			message: "Corrupt state file",
		};
	}
}

async function checkBrainVault(): Promise<CheckResult> {
	const brainPath = join(homedir(), ".rho", "brain", "brain.jsonl");
	const vaultPath = join(homedir(), ".rho", "vault");

	const hasBrain = existsSync(brainPath);
	const hasVault = existsSync(vaultPath);

	if (!hasBrain && !hasVault) {
		return { name: "Brain/Vault", status: "warn", message: "Not initialized" };
	}

	const parts: string[] = [];
	if (hasBrain) {
		try {
			const stats = statSync(brainPath);
			parts.push(`brain: ${formatBytes(stats.size)}`);
		} catch {
			parts.push("brain: exists");
		}
	}
	if (hasVault) {
		try {
			const vaultSize = getDirSize(vaultPath);
			const noteCount = readdirSync(vaultPath).filter((f) =>
				f.endsWith(".md"),
			).length;
			parts.push(`vault: ${noteCount} notes, ${formatBytes(vaultSize)}`);
		} catch {
			parts.push("vault: exists");
		}
	}

	return { name: "Brain/Vault", status: "pass", message: parts.join(" | ") };
}

async function checkCheckpoints(): Promise<CheckResult> {
	const checkpointsPath = join(homedir(), ".bibo", "checkpoints");
	if (!existsSync(checkpointsPath)) {
		return {
			name: "Checkpoints",
			status: "warn",
			message: "No checkpoints yet",
		};
	}
	try {
		const sessions = readdirSync(checkpointsPath).filter((f) =>
			statSync(join(checkpointsPath, f)).isDirectory(),
		);
		return {
			name: "Checkpoints",
			status: "pass",
			message: `${sessions.length} session(s) backed up`,
		};
	} catch {
		return {
			name: "Checkpoints",
			status: "warn",
			message: "Error reading checkpoints",
		};
	}
}

async function checkGitStatus(): Promise<CheckResult> {
	const gitDir = join(BIBO_ROOT, ".git");
	if (!existsSync(gitDir)) {
		return { name: "Git", status: "warn", message: "Not a git repository" };
	}

	const status = tryExec("git status --porcelain");
	if (status === null) {
		return { name: "Git", status: "warn", message: "Git command failed" };
	}

	if (status === "") {
		return { name: "Git", status: "pass", message: "Working tree clean" };
	}

	const lines = status.split("\n").filter((l) => l.trim());
	return {
		name: "Git",
		status: "warn",
		message: `${lines.length} uncommitted change(s)`,
	};
}

async function checkSkills(): Promise<CheckResult> {
	const skillsDir = join(BIBO_ROOT, "skills");
	if (!existsSync(skillsDir)) {
		return {
			name: "Skills",
			status: "warn",
			message: "Skills directory not found",
		};
	}

	const categories = ["tools", "knowledge", "protocols"];
	const counts: string[] = [];

	for (const cat of categories) {
		const catPath = join(skillsDir, cat);
		if (existsSync(catPath)) {
			try {
				const files = readdirSync(catPath).filter((f) => f.endsWith(".md"));
				counts.push(`${cat}: ${files.length}`);
			} catch {
				counts.push(`${cat}: ?`);
			}
		}
	}

	return { name: "Skills", status: "pass", message: counts.join(" | ") };
}

async function checkEnvironment(): Promise<CheckResult> {
	const envVars = [
		"LITTLE_CODER_ALLOWED_TOOLS",
		"LITTLE_CODER_PERMISSION_MODE",
		"LITTLE_CODER_MAX_TURNS",
		"LITTLE_CODER_THINKING_BUDGET",
		"LLAMACPP_BASE_URL",
		"OLLAMA_BASE_URL",
	];
	const setVars = envVars.filter((v) => process.env[v]);

	if (setVars.length === 0) {
		return {
			name: "Environment",
			status: "pass",
			message: "No overrides (using defaults)",
		};
	}
	return {
		name: "Environment",
		status: "pass",
		message: `${setVars.length} override(s) active`,
	};
}

// ── Main Doctor Function ─────────────────────────────────────────────

async function runDiagnostics(): Promise<DiagnosticReport> {
	const packageJson = tryReadJson(join(BIBO_ROOT, "package.json")) as {
		version?: string;
		dependencies?: Record<string, string>;
	} | null;
	const piVersion =
		packageJson?.dependencies?.["@mariozechner/pi-coding-agent"] ?? "unknown";

	const checks = await Promise.all([
		checkNodeVersion(),
		checkBiboStructure(),
		checkProviderConfig(),
		checkProviderConnectivity(),
		checkSettings(),
		checkExtensions(),
		checkNpmPackages(),
		checkCostTrackerState(),
		checkBrainVault(),
		checkCheckpoints(),
		checkGitStatus(),
		checkSkills(),
		checkEnvironment(),
	]);

	return {
		timestamp: new Date().toISOString(),
		biboVersion: packageJson?.version ?? "unknown",
		piVersion,
		checks,
	};
}

function formatReport(report: DiagnosticReport): string {
	const lines: string[] = [];
	lines.push("# 🔬 bibo Doctor Report");
	lines.push("");
	lines.push(`**Version:** ${report.biboVersion} (pi: ${report.piVersion})`);
	lines.push(`**Time:** ${new Date(report.timestamp).toLocaleString()}`);
	lines.push("");

	const pass = report.checks.filter((c) => c.status === "pass").length;
	const warn = report.checks.filter((c) => c.status === "warn").length;
	const fail = report.checks.filter((c) => c.status === "fail").length;

	lines.push(`## Summary: ${pass} ✅  ${warn} ⚠️  ${fail} ❌`);
	lines.push("");

	lines.push("## Checks");
	lines.push("");

	for (const check of report.checks) {
		const icon =
			check.status === "pass" ? "✅" : check.status === "warn" ? "⚠️" : "❌";
		lines.push(`### ${icon} ${check.name}`);
		lines.push(`**Status:** ${check.status.toUpperCase()}`);
		lines.push(`**Message:** ${check.message}`);
		if (check.details) {
			lines.push(`**Details:** ${check.details}`);
		}
		lines.push("");
	}

	return lines.join("\n");
}

// ── Extension Export ──────────────────────────────────────────────────

export default function (pi: ExtensionAPI) {
	pi.registerTool({
		name: "doctor",
		label: "Doctor",
		description:
			"Run comprehensive diagnostics on bibo setup. Checks Node.js, configuration, extensions, dependencies, provider connectivity, and more.",
		parameters: Type.Object({}),
		async execute(_id) {
			const report = await runDiagnostics();
			const formatted = formatReport(report);
			return {
				content: [{ type: "text", text: formatted }],
				details: { report },
			};
		},
	});
}
