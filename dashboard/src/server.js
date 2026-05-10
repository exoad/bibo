#!/usr/bin/env node
import { createServer } from "node:http";
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import {
	loadSessions,
	loadSessionDetail,
	exportSession,
	loadBrain,
	loadVault,
	loadVaultNote,
	loadQuests,
	completeQuest,
	loadStatus,
	loadSkills,
	search,
	loadChats,
	loadChat,
	createChat,
	deleteChat,
	updateChat,
} from "./data.js";
import { chatService } from "./chat-service.js";

const __dirname = import.meta.dirname;
const FRONTEND_DIR = join(__dirname, "frontend");
const DIST_DIR = join(__dirname, "..", "src-frontend", "dist");
const PORT = 3000;
const HOST = "127.0.0.1";
const USE_VITE_BUILD =
	process.env.USE_VITE_BUILD === "1" ||
	(existsSync(DIST_DIR) && existsSync(join(DIST_DIR, "index.html")));
console.log(
	"USE_VITE_BUILD:",
	USE_VITE_BUILD,
	"DIST_DIR:",
	DIST_DIR,
	"DIST_EXISTS:",
	existsSync(DIST_DIR),
);

// MIME types
const MIME_TYPES = {
	".html": "text/html; charset=utf-8",
	".css": "text/css; charset=utf-8",
	".js": "application/javascript; charset=utf-8",
	".json": "application/json; charset=utf-8",
	".png": "image/png",
	".jpg": "image/jpeg",
	".svg": "image/svg+xml",
};

// Simple route handler
async function handleRequest(req, res) {
	const url = new URL(req.url, `http://${req.headers.host}`);
	const pathname = url.pathname;

	if (pathname === "/api/health") {
		res.writeHead(200, { "Content-Type": "application/json" });
		return res.end(JSON.stringify({ status: "ok", uptime: process.uptime() }));
	}

	if (pathname === "/api/version") {
		const pkg = JSON.parse(
			readFileSync(join(__dirname, "..", "package.json"), "utf8"),
		);
		res.writeHead(200, { "Content-Type": "application/json" });
		return res.end(JSON.stringify({ name: pkg.name, version: pkg.version }));
	}

	if (pathname.startsWith("/api/")) {
		return handleApi(req, res, pathname, url);
	}

	if (pathname === "/" || pathname === "/index.html") {
		if (USE_VITE_BUILD) {
			return serveFile(res, join(DIST_DIR, "index.html"), ".html");
		}
		return serveFile(res, join(FRONTEND_DIR, "index.html"), ".html");
	}

	// SPA fallback: serve index.html for any non-API, non-asset route
	// so React Router can handle client-side routing
	if (!pathname.startsWith("/api/") && !pathname.startsWith("/assets/")) {
		if (USE_VITE_BUILD) {
			return serveFile(res, join(DIST_DIR, "index.html"), ".html");
		}
		return serveFile(res, join(FRONTEND_DIR, "index.html"), ".html");
	}

	// Vite build: serve asset files
	if (USE_VITE_BUILD) {
		const filePath = join(DIST_DIR, pathname);
		const ext = "." + filePath.split(".").pop();
		if (MIME_TYPES[ext]) {
			return serveFile(res, filePath, ext);
		}
	}

	res.writeHead(404, { "Content-Type": "text/plain" });
	res.end("Not Found");
}

async function handleApi(req, res, pathname, url) {
	const parts = pathname.split("/").filter(Boolean);
	// parts[0] = 'api', parts[1] = resource, parts[2] = id
	const resource = parts[1] || "";
	const id = parts[2] || "";
	const subResource = parts[2] || "";
	const subId = parts[3] || "";

	if (resource === "sessions") {
		if (!id) {
			return await handleSessionsList(req, res);
		}
		return await handleSessionDetail(req, res, id);
	}

	if (resource === "brain") {
		return await handleBrain(req, res);
	}

	if (resource === "vault") {
		if (!id) {
			return await handleVaultList(req, res);
		}
		return await handleVaultNote(req, res, id);
	}

	if (resource === "quests") {
		return await handleQuests(req, res);
	}

	if (resource === "status") {
		return await handleStatus(req, res);
	}

	if (resource === "skills") {
		return await handleSkills(req, res);
	}
	if (resource === "search") {
		return await handleSearch(req, res, url);
	}
	if (resource === "config") {
		return await handleConfig(req, res);
	}

	if (resource === "export") {
		return await handleExport(req, res, id);
	}

	if (resource === "quest" && subResource === "complete") {
		return await handleQuestComplete(req, res, subId);
	}

	if (resource === "skill" && subResource === "trigger") {
		return await handleSkillTrigger(req, res, subId);
	}

	// Chat routes
	if (resource === "chats") {
		if (!id) {
			if (req.method === "GET") {
				return await handleChatsList(req, res);
			}
			if (req.method === "POST") {
				return await handleChatCreate(req, res);
			}
		}
		if (id) {
			if (req.method === "GET") {
				return await handleChatDetail(req, res, id);
			}
			if (req.method === "DELETE") {
				return await handleChatDelete(req, res, id);
			}
			if (req.method === "PATCH") {
				return await handleChatUpdate(req, res, id);
			}
		}
	}

	if (resource === "chat" && subResource === "stream") {
		return await handleChatStream(req, res, url);
	}

	// Unknown API route
	res.writeHead(404, { "Content-Type": "application/json" });
	res.end(JSON.stringify({ error: "Unknown API route", route: pathname }));
}

async function handleSessionsList(req, res) {
	try {
		const sessions = await loadSessions();
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ sessions, count: sessions.length }));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "DATA_READ_ERROR" }));
	}
}

async function handleSessionDetail(req, res, id) {
	try {
		const session = await loadSessionDetail(id);
		if (!session) {
			res.writeHead(404, { "Content-Type": "application/json" });
			return res.end(
				JSON.stringify({
					error: "Session not found",
					code: "SESSION_NOT_FOUND",
				}),
			);
		}
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify(session));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "DATA_READ_ERROR" }));
	}
}

async function handleBrain(req, res) {
	try {
		const brain = await loadBrain();
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify(brain));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "DATA_READ_ERROR" }));
	}
}

async function handleVaultList(req, res) {
	try {
		const notes = await loadVault();
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ notes, count: notes.length }));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "DATA_READ_ERROR" }));
	}
}

async function handleVaultNote(req, res, slug) {
	try {
		const note = await loadVaultNote(slug);
		if (!note) {
			res.writeHead(404, { "Content-Type": "application/json" });
			return res.end(
				JSON.stringify({
					error: "Vault note not found",
					code: "VAULT_NOTE_NOT_FOUND",
				}),
			);
		}
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ note }));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "DATA_READ_ERROR" }));
	}
}

async function handleQuests(req, res) {
	try {
		const quests = await loadQuests();
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ quests }));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "DATA_READ_ERROR" }));
	}
}

async function handleStatus(req, res) {
	try {
		const status = await loadStatus();
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify(status));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "DATA_READ_ERROR" }));
	}
}

async function handleSkills(req, res) {
	try {
		const skills = await loadSkills();
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ skills }));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "DATA_READ_ERROR" }));
	}
}

async function handleSearch(req, res, url) {
	try {
		const q = url.searchParams.get("q") || "";
		const results = await search(q);
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ results, query: q, count: results.length }));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "SEARCH_ERROR" }));
	}
}

async function handleConfig(req, res) {
	try {
		const status = await loadStatus();
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ config: status }));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "DATA_READ_ERROR" }));
	}
}

async function handleExport(req, res, id) {
	try {
		const md = await exportSession(id);
		if (!md) {
			res.writeHead(404, { "Content-Type": "text/markdown" });
			return res.end("Session not found");
		}
		res.writeHead(200, { "Content-Type": "text/markdown; charset=utf-8" });
		res.end(md);
	} catch (e) {
		res.writeHead(500, { "Content-Type": "text/plain" });
		res.end("Export failed: " + e.message);
	}
}

async function handleQuestComplete(req, res, id) {
	try {
		const result = await completeQuest(id);
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify(result));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "TOOL_CALL_FAILED" }));
	}
}

async function handleSkillTrigger(req, res, name) {
	res.writeHead(200, { "Content-Type": "application/json" });
	res.end(
		JSON.stringify({
			success: true,
			name,
			message: `Skill triggered: ${name}`,
		}),
	);
}

// === Chat Handlers ===

async function handleChatsList(req, res) {
	try {
		const chats = await loadChats();
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ chats, count: chats.length }));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "DATA_READ_ERROR" }));
	}
}

async function handleChatCreate(req, res) {
	try {
		let body = "";
		req.on("data", (chunk) => (body += chunk));
		req.on("end", async () => {
			try {
				const params = body ? JSON.parse(body) : {};
				const chat = await createChat(params);
				res.writeHead(201, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ chat }));
			} catch (e) {
				res.writeHead(400, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ error: e.message, code: "CREATE_FAILED" }));
			}
		});
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "CREATE_FAILED" }));
	}
}

async function handleChatDetail(req, res, id) {
	try {
		const chat = await loadChat(id);
		if (!chat) {
			res.writeHead(404, { "Content-Type": "application/json" });
			return res.end(
				JSON.stringify({
					error: "Chat not found",
					code: "CHAT_NOT_FOUND",
				}),
			);
		}
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ chat }));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "DATA_READ_ERROR" }));
	}
}

async function handleChatDelete(req, res, id) {
	try {
		await deleteChat(id);
		res.writeHead(200, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ success: true, id }));
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "DELETE_FAILED" }));
	}
}

async function handleChatUpdate(req, res, id) {
	try {
		let body = "";
		req.on("data", (chunk) => (body += chunk));
		req.on("end", async () => {
			try {
				const updates = body ? JSON.parse(body) : {};
				const chat = await updateChat(id, updates);
				res.writeHead(200, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ chat }));
			} catch (e) {
				res.writeHead(400, { "Content-Type": "application/json" });
				res.end(JSON.stringify({ error: e.message, code: "UPDATE_FAILED" }));
			}
		});
	} catch (e) {
		res.writeHead(500, { "Content-Type": "application/json" });
		res.end(JSON.stringify({ error: e.message, code: "UPDATE_FAILED" }));
	}
}

async function handleChatStream(req, res, url) {
	const chatId = url.searchParams.get("chatId");
	const message = url.searchParams.get("message");
	const cwd = url.searchParams.get("cwd") || process.cwd();

	if (!chatId || !message) {
		res.writeHead(400, { "Content-Type": "application/json" });
		return res.end(
			JSON.stringify({
				error: "Missing required parameters: chatId, message",
				code: "MISSING_PARAMS",
			}),
		);
	}

	// Set up SSE headers
	res.writeHead(200, {
		"Content-Type": "text/event-stream",
		"Cache-Control": "no-cache",
		Connection: "keep-alive",
	});

	// Send initial connection event
	res.write(`event: connected\ndata: ${JSON.stringify({ chatId })}\n\n`);

	try {
		// Stream response
		const stream = chatService.streamResponse(chatId, message, cwd);

		for await (const event of stream) {
			res.write(`event: ${event.type}\ndata: ${JSON.stringify(event)}\n\n`);

			// End stream on completion or error
			if (event.type === "done" || event.type === "error") {
				break;
			}
		}
	} catch (e) {
		res.write(
			`event: error\ndata: ${JSON.stringify({ message: e.message })}\n\n`,
		);
	} finally {
		res.end();
	}
}

function serveFile(res, filePath, ext) {
	try {
		const content = readFileSync(filePath);
		const contentType = MIME_TYPES[ext] || "application/octet-stream";
		res.writeHead(200, { "Content-Type": contentType });
		res.end(content);
	} catch (e) {
		res.writeHead(404, { "Content-Type": "text/plain" });
		res.end("Not Found");
	}
}

const server = createServer(handleRequest);

// Request timeout — prevent hanging connections from leaking resources
server.timeout = 30_000; // 30s timeout for idle connections
server.headersTimeout = 35_000;
server.requestTimeout = 30_000;

server.listen(PORT, HOST, () => {
	console.log(`Bibo Dashboard running on http://${HOST}:${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", () => {
	console.log("\nShutting down...");
	server.close(() => process.exit(0));
});

process.on("SIGTERM", () => {
	console.log("\nShutting down...");
	server.close(() => process.exit(0));
});
