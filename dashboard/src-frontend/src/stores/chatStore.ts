// === Chat Store ===
// Zustand store for chat state management

import { create } from "zustand";
import { api } from "../lib/api";
import type { Chat, ChatMessage, ChatToolCall, StreamingEvent } from "../types";

interface ChatState {
	// Data
	chats: Chat[];
	activeChatId: string | null;
	messages: ChatMessage[];

	// UI State
	isLoading: boolean;
	isStreaming: boolean;
	streamingContent: string;
	streamingMessageId: string | null;
	activeToolCalls: Map<string, ChatToolCall>;
	error: string | null;

	// Actions
	loadChats: () => Promise<void>;
	createChat: (params?: {
		title?: string;
		cwd?: string;
	}) => Promise<Chat | null>;
	loadChat: (id: string) => Promise<void>;
	setActiveChat: (id: string | null) => void;
	sendMessage: (content: string, cwd?: string) => Promise<void>;
	stopStreaming: () => void;
	deleteChat: (id: string) => Promise<void>;
	updateChat: (id: string, updates: Partial<Chat>) => Promise<void>;
	clearError: () => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
	// Initial state
	chats: [],
	activeChatId: null,
	messages: [],
	isLoading: false,
	isStreaming: false,
	streamingContent: "",
	streamingMessageId: null,
	activeToolCalls: new Map(),
	error: null,

	// Load all chats
	loadChats: async () => {
		set({ isLoading: true, error: null });
		try {
			const chats = await api.getChats();
			set({ chats, isLoading: false });
		} catch (e) {
			set({ error: (e as Error).message, isLoading: false });
		}
	},

	// Create new chat
	createChat: async (params) => {
		set({ isLoading: true, error: null });
		try {
			const chat = await api.createChat(params);
			const { chats } = get();
			set({
				chats: [chat, ...chats],
				activeChatId: chat.id,
				messages: [],
				isLoading: false,
			});
			return chat;
		} catch (e) {
			set({ error: (e as Error).message, isLoading: false });
			return null;
		}
	},

	// Load specific chat with messages
	loadChat: async (id) => {
		set({ isLoading: true, error: null });
		try {
			const chat = await api.getChat(id);
			set({
				activeChatId: id,
				messages: chat.messages || [],
				isLoading: false,
			});
		} catch (e) {
			set({ error: (e as Error).message, isLoading: false });
		}
	},

	// Set active chat (without loading)
	setActiveChat: (id) => {
		set({ activeChatId: id });
	},

	// Send message and stream response
	sendMessage: async (content, cwd) => {
		const { activeChatId } = get();

		if (!activeChatId) {
			// Create new chat if none active
			const chat = await get().createChat({ cwd });
			if (!chat) return;
		}

		const chatId = get().activeChatId!;

		set({
			isStreaming: true,
			streamingContent: "",
			streamingMessageId: `msg_${Date.now()}_assistant`,
			error: null,
			activeToolCalls: new Map(),
		});

		const streamController = api.streamMessage(
			chatId,
			content,
			cwd,
			(event: StreamingEvent) => {
				const state = get();

				switch (event.type) {
					case "user_message":
						set({ messages: [...state.messages, event.message] });
						break;

					case "content":
						set({
							streamingContent:
								event.fullContent || state.streamingContent + event.content,
						});
						break;

					case "tool_call": {
						const toolCalls = new Map(state.activeToolCalls);
						toolCalls.set(event.tool.id, event.tool);
						set({ activeToolCalls: toolCalls });
						break;
					}

					case "tool_result":
					case "tool_error": {
						const updatedToolCalls = new Map(state.activeToolCalls);
						const tool = updatedToolCalls.get(event.toolId);
						if (tool) {
							if (event.type === "tool_result") {
								tool.result = event.result as string | Record<string, unknown>;
								tool.status = "completed";
							} else {
								tool.error = event.error as string;
								tool.status = "error";
							}
							tool.endTime = new Date().toISOString();
							updatedToolCalls.set(event.toolId, tool);
							set({ activeToolCalls: updatedToolCalls });
						}
						break;
					}

					case "done": {
						if (event.message) {
							set({
								messages: [...state.messages, event.message],
								isStreaming: false,
								streamingContent: "",
								streamingMessageId: null,
							});
						} else {
							// Create message from streaming content
							const assistantMsg: ChatMessage = {
								id: state.streamingMessageId!,
								role: "assistant",
								content: state.streamingContent,
								toolCalls: Array.from(state.activeToolCalls.values()),
								timestamp: new Date().toISOString(),
							};
							set({
								messages: [...state.messages, assistantMsg],
								isStreaming: false,
								streamingContent: "",
								streamingMessageId: null,
							});
						}
						// Refresh chats list to update message count
						get().loadChats();
						break;
					}

					case "error":
						set({
							error: event.message,
							isStreaming: false,
							streamingContent: "",
							streamingMessageId: null,
						});
						break;

					case "aborted":
						set({
							isStreaming: false,
							streamingContent: "",
							streamingMessageId: null,
						});
						break;
				}
			},
			(error) => {
				set({
					error: error.message,
					isStreaming: false,
					streamingContent: "",
					streamingMessageId: null,
				});
			},
		);

		// Store controller for aborting
		set({
			// @ts-expect-error - storing controller in closure
			_streamController: streamController,
		});
	},

	// Stop streaming
	stopStreaming: () => {
		const state = get();
		// @ts-expect-error - accessing stored controller
		const controller = state._streamController as
			| { abort: () => void }
			| undefined;
		if (controller) {
			controller.abort();
		}
		set({
			isStreaming: false,
			streamingContent: "",
			streamingMessageId: null,
		});
	},

	// Delete chat
	deleteChat: async (id) => {
		set({ isLoading: true, error: null });
		try {
			await api.deleteChat(id);
			const { chats, activeChatId } = get();
			const filtered = chats.filter((c) => c.id !== id);
			set({
				chats: filtered,
				activeChatId: activeChatId === id ? null : activeChatId,
				messages: activeChatId === id ? [] : get().messages,
				isLoading: false,
			});
		} catch (e) {
			set({ error: (e as Error).message, isLoading: false });
		}
	},

	// Update chat metadata
	updateChat: async (id, updates) => {
		set({ isLoading: true, error: null });
		try {
			const { chat } = await api.updateChat(id, updates);
			const { chats } = get();
			const updated = chats.map((c) => (c.id === id ? { ...c, ...chat } : c));
			set({ chats: updated, isLoading: false });
		} catch (e) {
			set({ error: (e as Error).message, isLoading: false });
		}
	},

	// Clear error
	clearError: () => set({ error: null }),
}));
