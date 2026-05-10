// === Dashboard TypeScript Types ===

// === Chat Types ===

export interface ChatToolCall extends ToolCall {
	status: "pending" | "running" | "completed" | "error";
	startTime: string;
	endTime?: string;
}

export interface ChatMessage {
	id: string;
	chatId?: string;
	role: "user" | "assistant" | "system";
	content: string;
	toolCalls?: ChatToolCall[];
	timestamp: string;
	metadata?: {
		model?: string;
		provider?: string;
		tokens?: number;
	};
}

export interface Chat {
	id: string;
	title: string;
	createdAt: string;
	updatedAt: string;
	messageCount: number;
	cwd: string;
	model?: string;
	provider?: string;
	messages?: ChatMessage[];
}

export type StreamingEvent =
	| { type: "connected"; chatId: string }
	| { type: "user_message"; message: ChatMessage }
	| { type: "content"; content: string; fullContent: string }
	| { type: "tool_call"; tool: ChatToolCall }
	| { type: "tool_result"; toolId: string; result: unknown }
	| { type: "tool_error"; toolId: string; error: string }
	| { type: "done"; message?: ChatMessage }
	| { type: "error"; message: string }
	| { type: "aborted" };

// === Existing Types ===

export interface Session {
	id: string;
	title: string;
	timestamp: string;
	cwd: string;
	messageCount: number;
	preview: string;
	lastMessageAt: string;
	provider?: string;
	modelId?: string;
}

export interface ContentBlock {
	type: string;
	text?: string;
	[key: string]: unknown;
}

export interface ToolCall {
	id: string;
	name: string;
	args?: string | Record<string, unknown>;
	result?: string | Record<string, unknown>;
	[key: string]: unknown;
}

export interface Message {
	role: "user" | "assistant" | "system";
	content: string | ContentBlock[];
	timestamp: string;
	toolCalls?: ToolCall[];
}

export interface SessionDetail extends Session {
	messages: Message[];
	usage?: {
		tokens?: number;
		duration?: number;
		[key: string]: unknown;
	};
}

export interface Memory {
	id: string;
	type:
		| "learning"
		| "behavior"
		| "preference"
		| "identity"
		| "user"
		| "context"
		| "task"
		| "reminder";
	text: string;
	created: string;
	[key: string]: unknown;
}

export interface VaultNote {
	slug: string;
	title: string;
	type: "concept" | "reference" | "pattern" | "project" | "log" | "moc";
	content: string;
	tags?: string[];
	[key: string]: unknown;
}

export interface Quest {
	id: string;
	description: string;
	status: "pending" | "done" | "cancelled";
	type?: string;
	category?: string;
	priority?: string;
	project?: string;
	due?: string;
	[key: string]: unknown;
}

export interface Skill {
	name: string;
	type: string;
	target_tool?: string;
	description?: string;
	priority?: number;
	token_cost?: number;
	user_invocable?: boolean;
	[key: string]: unknown;
}

export interface Status {
	uptime: number;
	model: string;
	provider: string;
	temperature: number;
	[key: string]: unknown;
}

export interface Config {
	pollInterval: number;
	theme: "dark" | "light";
	layout: "list" | "grid";
	[key: string]: unknown;
}

export interface SearchResults {
	sessions?: Session[];
	brain?: Memory[];
	vault?: VaultNote[];
	[key: string]: unknown;
}

export interface ExportData {
	session?: SessionDetail;
	brain?: Memory[];
	vault?: VaultNote[];
	quests?: Quest[];
	skills?: Skill[];
	[key: string]: unknown;
}
