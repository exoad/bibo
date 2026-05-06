import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, extname } from "node:path";
import { homedir } from "node:os";

// === Data Layer ===
// Reads from pi-coding-agent data sources and returns formatted data

const HOME = homedir();
const PI_SESSIONS_DIR = join(HOME, ".pi", "agent", "sessions");
const BRAIN_FILE = join(HOME, ".rho", "brain", "brain.jsonl");
const VAULT_DIR = join(HOME, ".rho", "vault");

// === In-memory cache with TTL ===
const CACHE_TTL_MS = 5000; // 5 seconds — balances freshness vs disk I/O
const cache = new Map();

function cached(key, computeFn) {
	const entry = cache.get(key);
	if (entry && Date.now() - entry.ts < CACHE_TTL_MS) {
		return entry.data;
	}
	// computeFn is async — we store a Promise to avoid duplicate computations
	const promise = computeFn();
	cache.set(key, { ts: Date.now(), data: promise });
	return promise;
}

// === Session Data ===

/**
 * Load all sessions from ~/.pi/agent/sessions/
 * Returns array of session summaries
 */
export async function loadSessions() {
	return cached("sessions", async () => {
		try {
			if (!existsSync(PI_SESSIONS_DIR)) {
				return [];
			}

			const sessions = [];
			const projects = await readdir(PI_SESSIONS_DIR, { withFileTypes: true });

			for (const project of projects) {
				if (!project.isDirectory()) continue;

				const projectDir = join(PI_SESSIONS_DIR, project.name);
				const files = await readdir(projectDir, { withFileTypes: true });

				for (const file of files) {
					if (!file.isFile() || extname(file.name) !== ".jsonl") continue;

					try {
						const content = await readFile(join(projectDir, file.name), "utf8");
						const lines = content.split("\n").filter((l) => l.trim());

						if (lines.length === 0) continue;

						// Parse first line as session header
						let header = null;
						try {
							header = JSON.parse(lines[0]);
						} catch {
							continue;
						}

						// Count messages and extract preview
						let messageCount = 0;
						let preview = "";
						let lastTimestamp = header.timestamp;

						for (let i = 1; i < lines.length; i++) {
							try {
								const line = JSON.parse(lines[i]);
								if (line.type === "message" && line.message) {
									messageCount++;
									if (!preview) {
										const content = line.message.content;
										if (Array.isArray(content)) {
											const textEntry = content.find(
												(c) =>
													c.type === "text" && line.message.role === "user",
											);
											if (textEntry) {
												preview = textEntry.text?.substring(0, 100) || "";
											}
										}
									}
									if (line.message.timestamp) {
										lastTimestamp = line.message.timestamp;
									}
								}
							} catch {}
						}

						sessions.push({
							id: header.id || file.name.replace(".jsonl", ""),
							title: preview || "Untitled",
							timestamp: header.timestamp,
							cwd: header.cwd || "",
							messageCount,
							preview,
							lastMessageAt: lastTimestamp,
							provider: header.provider,
							modelId: header.modelId,
						});
					} catch (e) {}
				}
			}

			// Sort by timestamp descending
			sessions.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
			return sessions;
		} catch (e) {
			console.error("Failed to load sessions:", e.message);
			return [];
		}
	});
}

/**
 * Load full session detail by ID
 * Returns session with all messages, tool calls, usage
 */
export async function loadSessionDetail(id) {
	try {
		if (!existsSync(PI_SESSIONS_DIR)) {
			return null;
		}

		const projects = await readdir(PI_SESSIONS_DIR, { withFileTypes: true });

		for (const project of projects) {
			if (!project.isDirectory()) continue;

			const projectDir = join(PI_SESSIONS_DIR, project.name);
			const files = await readdir(projectDir, { withFileTypes: true });

			for (const file of files) {
				if (!file.isFile() || extname(file.name) !== ".jsonl") continue;

				// Check if ID matches filename or header
				if (
					!file.name.includes(id) &&
					!file.name.replace(".jsonl", "").includes(id)
				) {
					continue;
				}

				const content = await readFile(join(projectDir, file.name), "utf8");
				const lines = content.split("\n").filter((l) => l.trim());

				if (lines.length === 0) continue;

				let header = null;
				try {
					header = JSON.parse(lines[0]);
				} catch {
					continue;
				}

				if (header.id !== id && !file.name.includes(id)) {
					continue;
				}

				// Parse all messages
				const messages = [];
				let totalTokens = 0;
				let firstTimestamp = header.timestamp;
				let lastTimestamp = header.timestamp;

				for (let i = 1; i < lines.length; i++) {
					try {
						const line = JSON.parse(lines[i]);
						if (line.type === "message" && line.message) {
							const msg = line.message;

							if (msg.timestamp) {
								if (!firstTimestamp) firstTimestamp = msg.timestamp;
								lastTimestamp = msg.timestamp;
							}

							const messageObj = {
								id: line.id,
								role: msg.role,
								content: "",
								timestamp: msg.timestamp,
								toolCalls: [],
								usage: msg.usage,
							};

							// Extract text content
							if (Array.isArray(msg.content)) {
								msg.content.forEach((c) => {
									if (c.type === "text") {
										messageObj.content += c.text;
									} else if (c.type === "toolCall") {
										messageObj.toolCalls.push({
											name: c.name,
											arguments: c.arguments,
											result: null,
											isError: false,
										});
									}
								});
							}

							// Look for tool results
							if (msg.role === "toolResult") {
								messageObj.content = msg.content?.[0]?.text || "";
							}

							// Sum tokens
							if (msg.usage) {
								totalTokens += (msg.usage.input || 0) + (msg.usage.output || 0);
							}

							messages.push(messageObj);
						}
					} catch {}
				}

				// Calculate duration
				const durationMs = new Date(lastTimestamp) - new Date(firstTimestamp);
				const duration = formatDuration(durationMs / 1000);

				return {
					header: {
						version: header.version || 3,
						id: header.id,
						timestamp: header.timestamp,
						cwd: header.cwd,
						provider: header.provider,
						modelId: header.modelId,
					},
					messages,
					totalTokens,
					duration,
				};
			}
		}

		return null;
	} catch (e) {
		console.error("Failed to load session detail:", e.message);
		return null;
	}
}

/**
 * Export session to Markdown
 */
export async function exportSession(id) {
	const session = await loadSessionDetail(id);
	if (!session) return null;

	let md = `# Session Export\n\n`;
	md += `**ID:** ${session.header.id}\n`;
	md += `**Model:** ${session.header.modelId}\n`;
	md += `**Provider:** ${session.header.provider}\n`;
	md += `**Duration:** ${session.duration}\n`;
	md += `**Total Tokens:** ${session.totalTokens}\n\n`;
	md += `---\n\n`;

	session.messages.forEach((msg) => {
		md += `## ${msg.role.toUpperCase()}\n\n`;
		md += `${msg.content || "(no content)"}\n\n`;

		if (msg.toolCalls && msg.toolCalls.length > 0) {
			md += `### Tool Calls\n\n`;
			msg.toolCalls.forEach((tc) => {
				md += `**${tc.name}:**\n`;
				md += `\`\`\`\n`;
				md += JSON.stringify(tc.arguments, null, 2);
				md += `\n\`\`\`\n\n`;
			});
		}

		if (msg.usage) {
			md += `**Usage:** Input: ${msg.usage.input}, Output: ${msg.usage.output}\n\n`;
		}
	});

	return md;
}

function formatDuration(seconds) {
	if (seconds < 60) return Math.round(seconds) + "s";
	if (seconds < 3600) return Math.round(seconds / 60) + "m";
	return (
		Math.round(seconds / 3600) + "h " + Math.round((seconds % 3600) / 60) + "m"
	);
}

// === Brain Data ===

/**
 * Load brain entries from ~/.rho/brain/brain.jsonl
 * Returns object with entries grouped by type
 */
export async function loadBrain() {
	return cached("brain", async () => {
		try {
			if (!existsSync(BRAIN_FILE)) {
				return {
					learning: [],
					behavior: [],
					preference: [],
					identity: [],
					user: [],
					context: [],
					task: [],
					reminder: [],
				};
			}

			const content = await readFile(BRAIN_FILE, "utf8");
			const lines = content.split("\n").filter((l) => l.trim());

			const result = {
				learning: [],
				behavior: [],
				preference: [],
				identity: [],
				user: [],
				context: [],
				task: [],
				reminder: [],
			};

			for (const line of lines) {
				try {
					const entry = JSON.parse(line);
					const type = entry.type;
					if (result[type]) {
						result[type].push({
							id: entry.id,
							type: entry.type,
							text: entry.text,
							created: entry.created,
							category: entry.category,
							path: entry.path,
							project: entry.project,
						});
					}
				} catch {}
			}

			return result;
		} catch (e) {
			console.error("Failed to load brain:", e.message);
			return {
				learning: [],
				behavior: [],
				preference: [],
				identity: [],
				user: [],
				context: [],
				task: [],
				reminder: [],
			};
		}
	});
}

// === Vault Data ===

/**
 * Load vault notes from ~/.rho/vault/
 * Returns array of note summaries
 */
export async function loadVault() {
	try {
		if (!existsSync(VAULT_DIR)) {
			return [];
		}

		const notes = [];

		// Read all .md files recursively, skipping _inbox and _index
		const dirs = await readdir(VAULT_DIR, { withFileTypes: true });

		for (const dir of dirs) {
			if (!dir.isFile() || extname(dir.name) !== ".md") continue;

			const slug = dir.name.replace(".md", "");
			if (slug === "_inbox" || slug === "_index") continue;

			try {
				const content = await readFile(join(VAULT_DIR, dir.name), "utf8");
				const parsed = parseVaultNote(content);

				notes.push({
					slug: parsed.slug || slug,
					name: parsed.name || slug,
					type: parsed.type || "reference",
					created: parsed.created,
					updated: parsed.updated,
					content: parsed.content?.substring(0, 200) || "",
				});
			} catch {}
		}

		// Also read notes in subdirectories (concepts/, log/, projects/, references/, patterns/)
		for (const dir of dirs) {
			if (!dir.isDirectory()) continue;

			try {
				const subFiles = await readdir(join(VAULT_DIR, dir.name), {
					withFileTypes: true,
				});

				for (const file of subFiles) {
					if (!file.isFile() || extname(file.name) !== ".md") continue;

					const slug = file.name.replace(".md", "");

					try {
						const content = await readFile(
							join(VAULT_DIR, dir.name, file.name),
							"utf8",
						);
						const parsed = parseVaultNote(content);

						notes.push({
							slug: parsed.slug || slug,
							name: parsed.name || slug,
							type: parsed.type || dir.name,
							created: parsed.created,
							updated: parsed.updated,
							content: parsed.content?.substring(0, 200) || "",
							category: dir.name,
						});
					} catch {}
				}
			} catch {}
		}

		return notes;
	} catch (e) {
		console.error("Failed to load vault:", e.message);
		return [];
	}
}

/**
 * Load full vault note by slug
 */
export async function loadVaultNote(slug) {
	try {
		const filePath = join(VAULT_DIR, slug + ".md");
		if (!existsSync(filePath)) {
			return null;
		}

		const content = await readFile(filePath, "utf8");
		return parseVaultNote(content);
	} catch (e) {
		console.error("Failed to load vault note:", e.message);
		return null;
	}
}

/**
 * Parse vault note content (frontmatter + markdown)
 */
function parseVaultNote(content) {
	const lines = content.split("\n");
	const frontmatter = {};
	let bodyStart = 0;

	// Parse frontmatter
	if (lines[0] === "---") {
		bodyStart = 2;
		for (let i = 1; i < lines.length; i++) {
			if (lines[i] === "---") {
				bodyStart = i + 1;
				break;
			}
			const match = lines[i].match(/^(\w+):\s*(.*)$/);
			if (match) {
				frontmatter[match[1]] = match[2].trim();
			}
		}
	}

	const body = lines.slice(bodyStart).join("\n");

	// Extract wikilinks
	const wikilinks = [...body.matchAll(/\[\[(.+?)\]\]/g)].map((m) => m[1]);

	return {
		slug: frontmatter.slug || "",
		name: frontmatter.name || "",
		type: frontmatter.type || "reference",
		source: frontmatter.source,
		created: frontmatter.created,
		updated: frontmatter.updated,
		content: body,
		wikilinks,
	};
}

// === Quests Data ===

/**
 * Load quests from pi quest system
 * Uses file-based approach as fallback
 */
export async function loadQuests() {
	// Quests are managed by the pi tool system
	// For now, return empty array - the actual implementation
	// will proxy to the pi tool system
	return [];
}

/**
 * Complete a quest
 */
export async function completeQuest(id) {
	// Proxy to pi tool system
	return { success: true, id };
}

// === Status Data ===

/**
 * Load current system status
 * Returns model, provider, thinking level, etc.
 */
export async function loadStatus() {
	return {
		model: "bibo-qwen3.6",
		provider: "jackbox",
		thinkingLevel: "off",
		active: false,
		uptime: process.uptime(),
		version: "0.70.6",
	};
}

// === Skills Data ===

/**
 * Load available skills from pi skills directory
 */
export async function loadSkills() {
	return cached("skills", async () => {
		const skills = [];
		const seen = new Set();

		// Find the project root by looking for package.json or .pi directory
		let projectRoot = process.cwd();
		let current = process.cwd();
		while (current !== "/" && current !== ".") {
			if (existsSync(join(current, ".pi", "npm", "node_modules"))) {
				projectRoot = current;
				break;
			}
			current = join(current, "..");
		}

		// Try multiple skill directories in priority order
		const candidateDirs = [
			join(
				projectRoot,
				".pi",
				"npm",
				"node_modules",
				"@rhobot-dev",
				"rho",
				"skills",
			),
			join(
				projectRoot,
				".pi",
				"npm",
				"node_modules",
				"pi-web-access",
				"skills",
			),
			join(HOME, ".pi", "npm", "node_modules", "@rhobot-dev", "rho", "skills"),
			join(HOME, ".pi", "npm", "node_modules", "pi-web-access", "skills"),
		];

		for (const skillsDir of candidateDirs) {
			if (!existsSync(skillsDir)) continue;

			try {
				const dirs = await readdir(skillsDir, { withFileTypes: true });

				for (const dir of dirs) {
					if (!dir.isDirectory()) continue;

					const skillMd = join(skillsDir, dir.name, "SKILL.md");
					if (!existsSync(skillMd)) continue;

					// Skip duplicates
					if (seen.has(dir.name)) continue;
					seen.add(dir.name);

					try {
						const content = await readFile(skillMd, "utf8");
						const lines = content.split("\n");

						let description = "";

						// Parse frontmatter
						if (lines[0] === "---") {
							for (let i = 1; i < lines.length; i++) {
								if (lines[i] === "---") break;
								const match = lines[i].match(/^(\w+):\s*(.*)$/);
								if (match) {
									if (match[1] === "description") description = match[2].trim();
								}
							}
						}

						skills.push({
							name: dir.name,
							description: description || "No description",
						});
					} catch {}
				}
			} catch {}
		}

		return skills;
	});
}

// === Search ===

/**
 * Search across sessions and brain entries
 */
export async function search(query) {
	const results = [];

	// Search sessions
	try {
		const sessions = await loadSessions();
		const q = query.toLowerCase();

		for (const s of sessions) {
			const title = (s.title || "").toLowerCase();
			const preview = (s.preview || "").toLowerCase();

			if (title.includes(q) || preview.includes(q)) {
				results.push({
					type: "session",
					id: s.id,
					title: s.title,
					timestamp: s.timestamp,
					snippet: preview?.substring(0, 100),
				});
			}
		}
	} catch {
		// Skip session search errors
	}

	// Search brain
	try {
		const brain = await loadBrain();
		const q = query.toLowerCase();

		Object.keys(brain).forEach((type) => {
			(brain[type] || []).forEach((entry) => {
				if (entry.text?.toLowerCase().includes(q)) {
					results.push({
						type: "brain",
						id: entry.id,
						title: entry.text?.substring(0, 50),
						timestamp: entry.created,
						snippet: entry.text?.substring(0, 100),
					});
				}
			});
		});
	} catch {
		// Skip brain search errors
	}

	return results;
}
