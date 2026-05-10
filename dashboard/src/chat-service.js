// === Chat Service ===
// Handles streaming chat responses and tool call management

import { EventEmitter } from "node:events";
import { loadChat, saveMessage, updateChat } from "./data.js";
import { spawn } from "node:child_process";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const __dirname = import.meta.dirname;
const HOME = homedir();

/**
 * ChatService manages streaming conversations with the agent
 */
export class ChatService extends EventEmitter {
	constructor() {
		super();
		this.activeStreams = new Map(); // chatId -> abort controller
		this.sessions = new Map(); // chatId -> persistent pi process
	}

	/**
	 * Get or create a persistent pi session for a chat
	 */
	getOrCreateSession(chatId, cwd) {
		if (this.sessions.has(chatId)) {
			const session = this.sessions.get(chatId);
			// Check if process is still alive
			if (session.process.exitCode === null && !session.process.killed) {
				return session;
			}
			// Process died, clean up
			this.sessions.delete(chatId);
		}

		// Create new persistent session
		const piPath = join(HOME, ".pi", "bin", "pi");
		const child = spawn(piPath, [], {
			cwd,
			env: { ...process.env, PI_NON_INTERACTIVE: "1", PI_SESSION_MODE: "1" },
		});

		const session = {
			process: child,
			chatId,
			buffer: "",
			responseBuffer: "",
			waitingForResponse: false,
			messageQueue: [],
		};

		// Handle stdout
		child.stdout.on("data", (data) => {
			session.responseBuffer += data.toString();
		});

		// Handle stderr
		child.stderr.on("data", (data) => {
			console.error(`[pi session ${chatId}]:`, data.toString());
		});

		// Handle process exit
		child.on("close", (code) => {
			console.log(`[pi session ${chatId}] exited with code ${code}`);
			this.sessions.delete(chatId);
		});

		// Send initial context to establish session
		child.stdin.write("# Session started\n");

		this.sessions.set(chatId, session);
		return session;
	}

	/**
	 * End a persistent session
	 */
	endSession(chatId) {
		const session = this.sessions.get(chatId);
		if (session) {
			session.process.stdin.end();
			session.process.kill();
			this.sessions.delete(chatId);
		}
	}

	/**
	 * Stream a response from the agent
	 * @param {string} chatId - Chat ID
	 * @param {string} userMessage - User message content
	 * @param {string} cwd - Working directory
	 * @returns {AsyncGenerator} Yields streaming events
	 */
	async *streamResponse(chatId, userMessage, cwd = process.cwd()) {
		// Load existing chat for context
		const chat = await loadChat(chatId);
		const messages = chat?.messages || [];

		// Create abort controller for this stream
		const abortController = new AbortController();
		this.activeStreams.set(chatId, abortController);

		// Build conversation context
		const conversationContext = this.buildContext(messages, userMessage);

		try {
			// Save user message
			const userMsg = {
				id: `msg_${Date.now()}_user`,
				role: "user",
				content: userMessage,
				timestamp: new Date().toISOString(),
			};
			await saveMessage(chatId, userMsg);
			yield { type: "user_message", message: userMsg };

			// Start assistant message
			const assistantMsgId = `msg_${Date.now()}_assistant`;
			let assistantContent = "";
			const toolCalls = [];

			// Stream from agent using pi CLI
			const stream = this.streamFromAgent(
				chatId,
				conversationContext,
				cwd,
				abortController.signal,
			);

			for await (const event of stream) {
				if (abortController.signal.aborted) {
					yield { type: "aborted" };
					return;
				}

				switch (event.type) {
					case "content":
						assistantContent += event.content;
						yield {
							type: "content",
							content: event.content,
							fullContent: assistantContent,
						};
						break;

					case "tool_call":
						toolCalls.push(event.tool);
						yield { type: "tool_call", tool: event.tool };
						break;

					case "tool_result": {
						// Update tool call with result
						const tc = toolCalls.find((t) => t.id === event.toolId);
						if (tc) {
							tc.result = event.result;
							tc.status = "completed";
							tc.endTime = new Date().toISOString();
						}
						yield {
							type: "tool_result",
							toolId: event.toolId,
							result: event.result,
						};
						break;
					}

					case "tool_error": {
						const tc2 = toolCalls.find((t) => t.id === event.toolId);
						if (tc2) {
							tc2.error = event.error;
							tc2.status = "error";
							tc2.endTime = new Date().toISOString();
						}
						yield {
							type: "tool_error",
							toolId: event.toolId,
							error: event.error,
						};
						break;
					}

					case "error":
						yield { type: "error", message: event.message };
						return;

					case "done": {
						// Save assistant message
						const assistantMsg = {
							id: assistantMsgId,
							role: "assistant",
							content: assistantContent,
							toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
							timestamp: new Date().toISOString(),
						};
						await saveMessage(chatId, assistantMsg);

						// Update chat title if first exchange
						if (messages.length === 0) {
							const title = this.generateTitle(userMessage, assistantContent);
							await updateChat(chatId, { title });
						}

						yield { type: "done", message: assistantMsg };
						return;
					}
				}
			}
		} catch (error) {
			console.error("Stream error:", error);
			yield { type: "error", message: error.message };
		} finally {
			this.activeStreams.delete(chatId);
		}
	}

	/**
	 * Stop an active stream
	 */
	stopStream(chatId) {
		const controller = this.activeStreams.get(chatId);
		if (controller) {
			controller.abort();
			return true;
		}
		return false;
	}

	/**
	 * Build conversation context for the agent
	 */
	buildContext(messages, newUserMessage) {
		// Convert to simple format for the agent
		const context = messages.map((m) => ({
			role: m.role,
			content: m.content,
		}));

		// Add new user message
		context.push({
			role: "user",
			content: newUserMessage,
		});

		return context;
	}

	/**
	 * Stream response from the agent using persistent pi session
	 */
	async *streamFromAgent(chatId, context, cwd, signal) {
		const session = this.getOrCreateSession(chatId, cwd);
		const lastMessage = context[context.length - 1];
		const prompt = lastMessage?.content || "";

		// Clear previous response buffer
		session.responseBuffer = "";
		session.waitingForResponse = true;

		// Build conversation context for the agent
		// Send previous messages as context, then the new prompt
		const contextMessages = context.slice(0, -1); // All except last

		// Send context as a formatted conversation
		if (contextMessages.length > 0) {
			session.process.stdin.write("# Previous conversation:\n");
			for (const msg of contextMessages) {
				const role = msg.role === "user" ? "User" : "Assistant";
				session.process.stdin.write(`${role}: ${msg.content}\n`);
			}
			session.process.stdin.write("\n# New message:\n");
		}

		// Send the new prompt
		session.process.stdin.write(`${prompt}\n`);

		// Wait for and stream the response
		let lastYieldTime = Date.now();
		const startTime = Date.now();
		const timeout = 120000; // 2 minute timeout

		while (session.waitingForResponse) {
			if (signal.aborted) {
				session.waitingForResponse = false;
				return;
			}

			// Check timeout
			if (Date.now() - startTime > timeout) {
				session.waitingForResponse = false;
				yield { type: "error", message: "Response timeout" };
				return;
			}

			// Check if we have content to yield
			const buffer = session.responseBuffer;
			const newlineIndex = buffer.indexOf("\n");
			const spaceIndex = buffer.indexOf(" ");

			if (newlineIndex !== -1) {
				const line = buffer.substring(0, newlineIndex + 1);
				session.responseBuffer = buffer.substring(newlineIndex + 1);
				yield { type: "content", content: line };
				lastYieldTime = Date.now();
			} else if (spaceIndex !== -1 && buffer.length > 100) {
				// Yield word by word if buffer getting long
				const word = buffer.substring(0, spaceIndex + 1);
				session.responseBuffer = buffer.substring(spaceIndex + 1);
				yield { type: "content", content: word };
				lastYieldTime = Date.now();
			} else if (buffer.length > 0 && Date.now() - lastYieldTime > 500) {
				// Yield remaining content if no new data for 500ms
				session.responseBuffer = "";
				yield { type: "content", content: buffer };
				lastYieldTime = Date.now();
			} else {
				// Wait for more data
				await new Promise((r) => setTimeout(r, 50));
			}

			// Check if process has ended
			if (session.process.exitCode !== null || session.process.killed) {
				// Process ended, yield remaining buffer
				if (session.responseBuffer.length > 0) {
					yield { type: "content", content: session.responseBuffer };
				}
				session.waitingForResponse = false;
				this.sessions.delete(chatId);
				break;
			}
		}

		yield { type: "done" };
	}

	/**
	 * Generate a title from the first exchange
	 */
	generateTitle(userMessage, assistantResponse) {
		// Use first 40 chars of user message, or fallback
		const title = userMessage.substring(0, 40).trim();
		return title + (userMessage.length > 40 ? "..." : "");
	}
}

/**
 * Singleton instance
 */
export const chatService = new ChatService();
