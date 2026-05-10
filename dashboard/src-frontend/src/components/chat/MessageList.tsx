// === Message List ===
// Scrollable list of chat messages

import { useEffect, useRef } from "react";
import type { ChatMessage } from "../../types";
import { MessageItem } from "./MessageItem";
import { StreamingIndicator } from "./StreamingIndicator";

interface MessageListProps {
	messages: ChatMessage[];
	isStreaming?: boolean;
	streamingContent?: string;
	className?: string;
}

export function MessageList({
	messages,
	isStreaming,
	streamingContent,
	className = "",
}: MessageListProps) {
	const scrollRef = useRef<HTMLDivElement>(null);
	const bottomRef = useRef<HTMLDivElement>(null);

	// Auto-scroll to bottom when messages change or streaming
	useEffect(() => {
		if (bottomRef.current) {
			bottomRef.current.scrollIntoView({ behavior: "smooth" });
		}
	}, [messages, streamingContent]);

	return (
		<div
			ref={scrollRef}
			className={`overflow-y-auto px-4 py-6 space-y-6 ${className}`}
		>
			{messages.length === 0 ? (
				<div className="flex flex-col items-center justify-center h-64 text-fg4">
					<div className="text-sm">No messages yet</div>
					<div className="text-xs mt-1">Start a conversation below</div>
				</div>
			) : (
				<>
					{messages.map((message, index) => (
						<MessageItem
							key={message.id}
							message={message}
							isLast={index === messages.length - 1}
						/>
					))}

					{/* Streaming message */}
					{isStreaming && streamingContent && (
						<MessageItem
							message={{
								id: "streaming",
								role: "assistant",
								content: streamingContent,
								timestamp: new Date().toISOString(),
							}}
							isStreaming
							isLast
						/>
					)}

					{/* Streaming indicator */}
					{isStreaming && !streamingContent && <StreamingIndicator />}

					<div ref={bottomRef} className="h-4" />
				</>
			)}
		</div>
	);
}
