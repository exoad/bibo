// === Chat Input ===
// Message input with auto-resize, slash commands, and keyboard shortcuts

import { useState, useRef, useEffect, useCallback } from "react";
import { PaperPlaneRight, Stop } from "@phosphor-icons/react";
import { useChatStore } from "../../stores/chatStore";
import {
	SlashCommandDropdown,
	SLASH_COMMANDS,
	type SlashCommand,
} from "./SlashCommands";

interface ChatInputProps {
	isStreaming?: boolean;
	disabled?: boolean;
}

export function ChatInput({ isStreaming, disabled }: ChatInputProps) {
	const [input, setInput] = useState("");
	const [cursorPos, setCursorPos] = useState(0);
	const textareaRef = useRef<HTMLTextAreaElement>(null);
	const { sendMessage, stopStreaming } = useChatStore();

	// Derive slash menu visibility from input state (no effect needed)
	const textBeforeCursor = input.substring(0, cursorPos);
	const showSlashMenu = /\/\w*:?\w*$/.test(textBeforeCursor);

	// Auto-resize textarea
	useEffect(() => {
		const textarea = textareaRef.current;
		if (textarea) {
			textarea.style.height = "auto";
			textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
		}
	}, [input]);

	const handleSend = async () => {
		if (!input.trim() || isStreaming || disabled) return;

		const message = input.trim();
		setInput("");

		// Reset textarea height
		if (textareaRef.current) {
			textareaRef.current.style.height = "auto";
		}

		await sendMessage(message);
	};

	const handleSlashSelect = useCallback(
		(cmd: SlashCommand) => {
			const textBeforeCursor = input.substring(0, cursorPos);
			const textAfterCursor = input.substring(cursorPos);
			const newText =
				textBeforeCursor.replace(/\/\w*:?\w*$/, cmd.command + " ") +
				textAfterCursor;
			setInput(newText);
			setTimeout(() => {
				if (textareaRef.current) {
					textareaRef.current.focus();
				}
			}, 0);
		},
		[input, cursorPos],
	);

	const handleKeyDown = (e: React.KeyboardEvent) => {
		// Enter to send, Shift+Enter for new line
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}

		if (e.key === "Escape") {
			if (showSlashMenu) {
				setInput(""); // close menu by clearing slash
			} else if (isStreaming) {
				stopStreaming();
			}
		}

		// Tab to accept slash command suggestion
		if (e.key === "Tab" && showSlashMenu) {
			e.preventDefault();
			const textBeforeCursor = input.substring(0, cursorPos);
			const slashMatch = textBeforeCursor.match(/\/(\w*:?\w*)$/);
			if (slashMatch) {
				const partial = slashMatch[1].toLowerCase();
				const match = SLASH_COMMANDS.find((cmd) =>
					cmd.command.toLowerCase().includes("/" + partial.replace(":", ":")),
				);
				if (match) {
					handleSlashSelect(match);
				}
			}
		}
	};

	return (
		<div className="border-t border-bg2 py-2 bg-bg0-hard relative">
			{/* Slash command dropdown */}
			<SlashCommandDropdown
				input={input}
				cursorPosition={cursorPos}
				onSelect={handleSlashSelect}
				visible={showSlashMenu}
			/>

			<div className="flex gap-2 items-end px-4">
				<textarea
					ref={textareaRef}
					value={input}
					onChange={(e) => {
						setInput(e.target.value);
						setCursorPos(e.target.selectionStart);
					}}
					onKeyUp={(e) =>
						setCursorPos((e.target as HTMLTextAreaElement).selectionStart)
					}
					onKeyDown={handleKeyDown}
					placeholder={
						disabled
							? "Select a chat..."
							: "Message bibo..."
					}
					disabled={disabled || isStreaming}
					rows={1}
					className="flex-1 bg-bg0 border border-bg2 px-3 py-2 text-sm text-fg1 placeholder:text-fg4/60 resize-none min-h-[40px] max-h-[200px] focus:outline-none focus:border-green disabled:opacity-50 disabled:cursor-not-allowed leading-relaxed"
				/>

				{isStreaming ? (
					<button
						onClick={stopStreaming}
						className="px-3 py-2 bg-red text-bg0-hard hover:bg-red/90 flex items-center gap-1 self-end h-[40px]"
						title="Stop"
					>
						<Stop className="w-4 h-4" />
					</button>
				) : (
					<button
						onClick={handleSend}
						disabled={!input.trim() || disabled}
						className="px-3 py-2 bg-green text-bg0-hard disabled:opacity-50 disabled:cursor-not-allowed hover:bg-green/90 flex items-center gap-1 self-end h-[40px]"
						title="Send"
					>
						<PaperPlaneRight className="w-4 h-4" />
					</button>
				)}
			</div>

			{isStreaming && (
			<div className="flex justify-end px-4 pb-2">
				<span className="text-[10px] text-green animate-pulse">● Generating...</span>
			</div>
		)}
		</div>
	);
}
