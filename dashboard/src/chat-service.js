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
			const stream = this.streamFromAgent(conversationContext, cwd, abortController.signal);

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
						yield { type: "tool_result", toolId: event.toolId, result: event.result };
						break;
					}

					case "tool_error": {
						const tc2 = toolCalls.find((t) => t.id === event.toolId);
						if (tc2) {
							tc2.error = event.error;
							tc2.status = "error";
							tc2.endTime = new Date().toISOString();
						}
						yield { type: "tool_error", toolId: event.toolId, error: event.error };
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
	 * Stream response from the agent using pi CLI
	 */
	async *streamFromAgent(context, cwd, signal) {
		const lastMessage = context[context.length - 1];
		const prompt = lastMessage?.content || "";

		// Spawn pi CLI with the prompt
		const piPath = join(HOME, ".pi", "bin", "pi");
		const child = spawn(piPath, ["--stdin"], {
			cwd,
			env: { ...process.env, PI_NON_INTERACTIVE: "1" },
		});

		let buffer = "";
		let finished = false;

		// Write prompt to stdin
		child.stdin.write(prompt + "\n");
		child.stdin.end();

		// Handle stdout data
		child.stdout.on("data", (data) => {
			buffer += data.toString();
		});

		// Handle stderr (for debugging)
		child.stderr.on("data", (data) => {
			console.error("pi stderr:", data.toString());
		});

		// Handle process exit
		child.on("close", (code) => {
			finished = true;
		});

		// Stream buffer content
		while (!finished || buffer.length > 0) {
			if (signal.aborted) {
				child.kill();
				return;
			}

			// Find complete lines or words to yield
			const newlineIndex = buffer.indexOf("\n");
			const spaceIndex = buffer.indexOf(" ");

			if (newlineIndex !== -1) {
				const line = buffer.substring(0, newlineIndex + 1);
				buffer = buffer.substring(newlineIndex + 1);
				yield { type: "content", content: line };
			} else if (spaceIndex !== -1 && buffer.length > 80) {
				// Yield word by word if no newline and buffer getting long
				const word = buffer.substring(0, spaceIndex + 1);
				buffer = buffer.substring(spaceIndex + 1);
				yield { type: "content", content: word };
			} else if (finished && buffer.length > 0) {
				// Yield remaining buffer when done
				yield { type: "content", content: buffer };
				buffer = "";
			} else {
				// Wait for more data
				await new Promise((r) => setTimeout(r, 50));
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
