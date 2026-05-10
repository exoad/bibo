// === Message Item ===
// Claude/ChatGPT-style message with full markdown support

import { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
	User,
	Robot,
	Copy,
	Check,
	ArrowClockwise,
	Lightbulb,
} from "@phosphor-icons/react";
import type { ChatMessage } from "../../types";
import { ToolCall } from "./ToolCall";
import { FollowUpChips } from "./FollowUpChips";
import { MessageFeedback } from "./MessageFeedback";
import hljs from "highlight.js";
import "highlight.js/styles/github-dark.css";

interface MessageItemProps {
	message: ChatMessage;
	isStreaming?: boolean;
	isLast?: boolean;
	onChipClick?: (prompt: string) => void;
	onRegenerate?: (messageId: string) => void;
}

export function MessageItem({
	message,
	isStreaming,
	onChipClick,
	onRegenerate,
}: MessageItemProps) {
	const isUser = message.role === "user";
	const [copied, setCopied] = useState(false);

	const handleCopy = () => {
		navigator.clipboard.writeText(message.content);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	const formatTime = (timestamp: string) => {
		const date = new Date(timestamp);
		return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
	};

	// Highlight code blocks after render
	useEffect(() => {
		hljs.highlightAll();
	}, [message.content]);

	// Parse thinking sections (Claude-style <thinking> or markdown blockquote with "thinking")
	const [showThinking, setShowThinking] = useState(false);
	const { mainContent, thinkingContent } = (() => {
		const thinkingMatch = message.content.match(
			/<thinking>([\s\S]*?)<\/thinking>/,
		);
		if (thinkingMatch) {
			return {
				mainContent: message.content
					.replace(/<thinking>[\s\S]*?<\/thinking>/, "")
					.trim(),
				thinkingContent: thinkingMatch[1].trim(),
			};
		}
		// Check for markdown blockquote starting with "thinking" or "reasoning"
		const blockquoteMatch = message.content.match(
			/>\s*(?:thinking|reasoning|analysis)[\s\S]*?(?=\n\n[^>]|$)/i,
		);
		if (blockquoteMatch) {
			return {
				mainContent: message.content.replace(blockquoteMatch[0], "").trim(),
				thinkingContent: blockquoteMatch[0].replace(/^>\s?/gm, "").trim(),
			};
		}
		return { mainContent: message.content, thinkingContent: null };
	})();

	// User message - centered layout with max-width
	if (isUser) {
		return (
			<div className="py-6">
				<div className="flex items-start gap-3">
					<div className="w-7 h-7 bg-blue flex items-center justify-center flex-shrink-0 mt-0.5">
						<User className="w-4 h-4 text-bg0-hard" weight="fill" />
					</div>
					<div className="flex-1 min-w-0">
						<div className="text-sm text-fg1 whitespace-pre-wrap leading-relaxed">
							{message.content}
						</div>
						<div className="flex items-center gap-2 mt-2">
							<span className="text-[10px] text-fg4">
								{formatTime(message.timestamp)}
							</span>
							<button
								onClick={handleCopy}
								className="p-1 text-fg4 hover:text-fg2"
								title="Copy message"
							>
								{copied ? (
									<Check className="w-3 h-3" />
								) : (
									<Copy className="w-3 h-3" />
								)}
							</button>
						</div>
					</div>
				</div>
			</div>
		);
	}

	// Assistant message - centered layout with full-width content
	return (
		<div className="py-6 border-b border-bg2/30">
			<div className="flex items-start gap-3">
				<div className="w-7 h-7 bg-green flex items-center justify-center flex-shrink-0 mt-0.5">
					<Robot className="w-4 h-4 text-bg0-hard" weight="fill" />
				</div>
				<div className="flex-1 min-w-0">
					{/* Thinking section (Claude-style reasoning) */}
					{thinkingContent && (
						<div className="mb-4">
							<button
								onClick={() => setShowThinking(!showThinking)}
								className="flex items-center gap-1.5 text-[10px] text-yellow hover:text-yellow/80 transition-colors"
							>
								<Lightbulb className="w-3 h-3" />
								<span>{showThinking ? "Hide thinking" : "Show thinking"}</span>
							</button>
							{showThinking && (
								<div className="mt-2 p-3 bg-yellow/5 border border-yellow/20 rounded-none text-[11px] text-fg3 whitespace-pre-wrap font-mono leading-relaxed">
									{thinkingContent}
								</div>
							)}
						</div>
					)}

					{/* Markdown content */}
					<div className="prose prose-invert prose-sm max-w-none chat-markdown">
						<ReactMarkdown
							remarkPlugins={[remarkGfm]}
							components={{
								// Code blocks with language detection
								pre: ({ children }) => {
									const child = children as unknown as {
										props?: { className?: string; children?: React.ReactNode };
									};
									const codeClass = child?.props?.className || "";
									const language = codeClass.replace("language-", "") || "text";
									const codeContent = child?.props?.children || "";

									return (
										<div className="relative group my-2 overflow-hidden">
											<div className="flex items-center justify-between bg-bg0-hard px-2 py-1 text-[10px] text-fg4 border border-bg2 border-b-0">
												<span className="font-mono">{language}</span>
												<div className="flex items-center gap-1">
													<button
														onClick={() =>
															navigator.clipboard.writeText(String(codeContent))
														}
														className="p-1 hover:text-fg2"
														title="Copy code"
													>
														<Copy className="w-3 h-3" />
													</button>
												</div>
											</div>
											<pre className="!m-0 !rounded-none !border !border-bg2 !border-t-0 !bg-[#1d2021] !p-3 overflow-x-auto">
												{children}
											</pre>
										</div>
									);
								},
								code: ({ children, className, ...props }) => {
									const isInline = !className;
									if (isInline) {
										return (
											<code className="bg-bg1 px-1 py-0.5 text-xs font-mono rounded-none border border-bg2">
												{children}
											</code>
										);
									}
									return (
										<code className={`${className} !bg-transparent`} {...props}>
											{children}
										</code>
									);
								},
								// Headings
								h1: ({ children }) => (
									<h1 className="text-lg font-bold text-fg1 mt-4 mb-2 pb-1 border-b border-bg2">
										{children}
									</h1>
								),
								h2: ({ children }) => (
									<h2 className="text-base font-semibold text-fg1 mt-3 mb-2">
										{children}
									</h2>
								),
								h3: ({ children }) => (
									<h3 className="text-sm font-semibold text-fg1 mt-2 mb-1">
										{children}
									</h3>
								),
								h4: ({ children }) => (
									<h4 className="text-xs font-semibold text-fg1 mt-2 mb-1">
										{children}
									</h4>
								),
								// Lists
								ul: ({ children }) => (
									<ul className="list-disc pl-4 my-2 space-y-0.5">
										{children}
									</ul>
								),
								ol: ({ children }) => (
									<ol className="list-decimal pl-4 my-2 space-y-0.5">
										{children}
									</ol>
								),
								li: ({ children }) => (
									<li className="text-xs text-fg2">{children}</li>
								),
								// Paragraphs
								p: ({ children }) => (
									<p className="text-xs text-fg2 my-1.5 leading-relaxed">
										{children}
									</p>
								),
								// Blockquotes
								blockquote: ({ children }) => (
									<blockquote className="border-l-2 border-green pl-3 my-2 text-fg4 text-xs italic">
										{children}
									</blockquote>
								),
								// Tables
								table: ({ children }) => (
									<div className="overflow-x-auto my-2">
										<table className="w-full text-xs border border-bg2">
											{children}
										</table>
									</div>
								),
								thead: ({ children }) => (
									<thead className="bg-bg1">{children}</thead>
								),
								th: ({ children }) => (
									<th className="px-2 py-1 text-left text-fg1 font-semibold border-b border-bg2">
										{children}
									</th>
								),
								td: ({ children }) => (
									<td className="px-2 py-1 text-fg2 border-b border-bg2">
										{children}
									</td>
								),
								// Horizontal rule
								hr: () => <hr className="my-3 border-bg2" />,
								// Links
								a: ({ children, href }) => (
									<a
										href={href}
										className="text-blue hover:underline text-xs"
										target="_blank"
										rel="noopener noreferrer"
									>
										{children}
									</a>
								),
								// Strong/em
								strong: ({ children }) => (
									<strong className="font-semibold text-fg1">{children}</strong>
								),
								em: ({ children }) => (
									<em className="italic text-fg3">{children}</em>
								),
							}}
						>
							{mainContent}
						</ReactMarkdown>
					</div>

					{/* Tool calls */}
					{message.toolCalls && message.toolCalls.length > 0 && (
						<div className="mt-1.5 space-y-1">
							{message.toolCalls.map((tool) => (
								<ToolCall key={tool.id} tool={tool} />
							))}
						</div>
					)}

					{/* Footer */}
					<div className="flex items-center justify-between mt-1 pt-1 border-t border-bg2">
						<span className="text-xs text-fg4">
							{formatTime(message.timestamp)}
							{isStreaming && (
								<span className="ml-2 text-green">● streaming</span>
							)}
						</span>
						<div className="flex items-center gap-1">
							{!isStreaming && <MessageFeedback messageId={message.id} />}
							{!isStreaming && onRegenerate && (
								<button
									onClick={() => onRegenerate(message.id)}
									className="p-1 text-fg4 hover:text-fg2"
									title="Regenerate response"
								>
									<ArrowClockwise className="w-3 h-3" />
								</button>
							)}
							<button
								onClick={handleCopy}
								className="p-1 text-fg4 hover:text-fg2"
								title="Copy message"
							>
								{copied ? (
									<Check className="w-3 h-3" />
								) : (
									<Copy className="w-3 h-3" />
								)}
							</button>
						</div>
					</div>

					{/* Follow-up chips */}
					{!isStreaming && onChipClick && (
						<FollowUpChips message={message} onChipClick={onChipClick} />
					)}
				</div>
			</div>
		</div>
	);
}
