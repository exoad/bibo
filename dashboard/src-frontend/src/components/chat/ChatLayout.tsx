// === Chat Layout ===
// Claude/ChatGPT-style centered conversation layout

import { useEffect, useState } from "react";
import { useChatStore } from "../../stores/chatStore";
import { ChatList } from "./ChatList";
import { MessageList } from "./MessageList";
import { ChatInput } from "./ChatInput";
import { Loading } from "../shared/Loading";
import { Plus, List, ChatCircle } from "@phosphor-icons/react";

interface ChatLayoutProps {
	compact?: boolean;
}

export function ChatLayout({ compact = false }: ChatLayoutProps) {
	const {
		chats,
		activeChatId,
		messages,
		isLoading,
		isStreaming,
		loadChats,
		createChat,
		loadChat,
	} = useChatStore();

	const [showSidebar, setShowSidebar] = useState(false);

	// Load chats on mount
	useEffect(() => {
		loadChats();
	}, [loadChats]);

	// Load active chat when ID changes
	useEffect(() => {
		if (activeChatId) {
			loadChat(activeChatId);
		}
	}, [activeChatId, loadChat]);

	const handleNewChat = async () => {
		const chat = await createChat({
			title: "New Chat",
			cwd: window.location.pathname,
		});
		if (chat) {
			setShowSidebar(false);
		}
	};

	const handleSelectChat = (id: string) => {
		loadChat(id);
		setShowSidebar(false);
	};

	if (compact) {
		return (
			<div className="h-full flex flex-col">
				<div className="flex items-center justify-between p-2 border-b border-bg2 bg-bg0-hard">
					<h2 className="text-xs font-semibold text-fg1">CHAT</h2>
					<button
						onClick={handleNewChat}
						className="px-2 py-1 bg-green text-bg0-hard text-xs font-medium hover:bg-green/90"
					>
						+ New
					</button>
				</div>
				<div className="flex-1 overflow-auto p-1">
					{chats.length === 0 ? (
						<div className="text-center text-xs text-fg4 py-4">
							No chats yet
						</div>
					) : (
						<div className="space-y-0.5">
							{chats.slice(0, 5).map((chat) => (
								<div
									key={chat.id}
									onClick={() => loadChat(chat.id)}
									className={`p-1.5 cursor-pointer text-xs border border-bg2 ${
										activeChatId === chat.id
											? "bg-bg1 border-l-2 border-l-green"
											: "hover:bg-bg1"
									}`}
								>
									<div className="truncate font-medium">{chat.title}</div>
									<div className="text-fg4 text-[10px]">
										{chat.messageCount} msgs
									</div>
								</div>
							))}
						</div>
					)}
				</div>
			</div>
		);
	}

	return (
		<div className="h-full flex flex-col bg-bg0 relative">
			{/* Top Navigation Bar */}
			<header className="flex items-center justify-between px-4 py-2 border-b border-bg2 bg-bg0-hard">
				<button
					onClick={() => setShowSidebar(!showSidebar)}
					className="p-1.5 text-fg4 hover:text-fg2 hover:bg-bg1"
					title="History"
				>
					<List className="w-4 h-4" />
				</button>

				<div className="flex items-center gap-2">
					{activeChatId && (
						<span className="text-[10px] text-fg4 truncate max-w-[200px]">
							{chats.find((c) => c.id === activeChatId)?.title}
						</span>
					)}
					<button
						onClick={handleNewChat}
						className="p-1.5 bg-green text-bg0-hard hover:bg-green/90"
						title="New chat"
					>
						<Plus className="w-4 h-4" />
					</button>
				</div>
			</header>

			{/* Sidebar Drawer (overlay) */}
			{showSidebar && (
				<>
					<div
						className="fixed inset-0 bg-bg0/50 z-40"
						onClick={() => setShowSidebar(false)}
					/>
					<div className="fixed left-0 top-[56px] bottom-0 w-[240px] bg-bg0-hard border-r border-bg2 z-50 flex flex-col">
						<ChatList
							chats={chats}
							activeChatId={activeChatId}
							onSelectChat={handleSelectChat}
							onNewChat={handleNewChat}
							isLoading={isLoading}
						/>
					</div>
				</>
			)}

			{/* Main Content - Centered */}
			<div className="flex-1 overflow-hidden flex flex-col">
				{isLoading && !messages.length ? (
					<div className="flex-1 flex items-center justify-center">
						<Loading />
					</div>
				) : !activeChatId ? (
					<div className="flex-1 flex flex-col items-center justify-center px-4">
						<div className="text-center max-w-md">
							<div className="w-12 h-12 bg-green/20 flex items-center justify-center mx-auto mb-4">
								<ChatCircle className="w-6 h-6 text-green" weight="fill" />
							</div>
							<h2 className="text-lg font-semibold text-fg1 mb-2">
								Start a conversation
							</h2>
							<p className="text-xs text-fg4 mb-4">
								Ask me to help with coding, debugging, research, or any task.
							</p>
							<button
								onClick={handleNewChat}
								className="px-4 py-2 bg-green text-bg0-hard text-sm font-medium hover:bg-green/90"
							>
								New Chat
							</button>
						</div>
					</div>
				) : (
					<>
						{/* Centered Message Area */}
						<div className="flex-1 overflow-y-auto">
							<div className="max-w-3xl mx-auto">
								<MessageList
									messages={messages}
									isStreaming={isStreaming}
									className="min-h-full"
								/>
							</div>
						</div>

						{/* Full-width Input Area - connected to bottom */}
						<div className="border-t border-bg2 bg-bg0-hard">
							<ChatInput isStreaming={isStreaming} disabled={!activeChatId} />
						</div>
					</>
				)}
			</div>
		</div>
	);
}
