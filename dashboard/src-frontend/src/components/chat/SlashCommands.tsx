// === Slash Commands ===
// Autocomplete dropdown for / commands and /skill:___ in chat input

import { useState, useEffect, useRef } from "react";
import {
	Bug,
	MagnifyingGlass,
	Gear,
	Brain,
	Notebook,
	Clipboard,
	ArrowClockwise,
	Download,
	Info,
	Lightning,
} from "@phosphor-icons/react";
import { api } from "../../lib/api";

export interface SlashCommand {
	command: string;
	label: string;
	description: string;
	icon: typeof Bug;
	action?: () => void;
}

const BASE_COMMANDS: SlashCommand[] = [
	{
		command: "/debug",
		label: "Debug",
		description: "Enter debugging mode",
		icon: Bug,
	},
	{
		command: "/search",
		label: "Search",
		description: "Search vault, brain, sessions",
		icon: MagnifyingGlass,
	},
	{
		command: "/skill:",
		label: "Skill",
		description: "Trigger a skill (type : to list)",
		icon: Lightning,
	},
	{
		command: "/model",
		label: "Model",
		description: "Switch the active model",
		icon: Gear,
	},
	{
		command: "/clear",
		label: "Clear",
		description: "Clear conversation history",
		icon: ArrowClockwise,
	},
	{
		command: "/export",
		label: "Export",
		description: "Export chat to markdown",
		icon: Download,
	},
	{
		command: "/context",
		label: "Context",
		description: "Show current context info",
		icon: Info,
	},
	{
		command: "/brain",
		label: "Brain",
		description: "Include brain memories as context",
		icon: Brain,
	},
	{
		command: "/vault",
		label: "Vault",
		description: "Reference a vault note",
		icon: Notebook,
	},
	{
		command: "/quest",
		label: "Quest",
		description: "Reference or manage quests",
		icon: Clipboard,
	},
];

interface SlashCommandDropdownProps {
	input: string;
	cursorPosition: number;
	onSelect: (command: SlashCommand) => void;
	visible: boolean;
}

export function SlashCommandDropdown({
	input,
	cursorPosition,
	onSelect,
	visible,
}: SlashCommandDropdownProps) {
	const [selectedIndex, setSelectedIndex] = useState(0);
	const [skills, setSkills] = useState<{ name: string; description: string }[]>(
		[],
	);
	const listRef = useRef<HTMLDivElement>(null);

	// Load skills once on mount
	useEffect(() => {
		api
			.getSkills()
			.then((s) =>
				setSkills(
					s.map((sk) => ({ name: sk.name, description: sk.description || "" })),
				),
			)
			.catch(() => {});
	}, []);

	// Extract the current slash command being typed
	const textBeforeCursor = input.substring(0, cursorPosition);

	// Check if user is typing /skill:___ (skill subcommand)
	const skillMatch = textBeforeCursor.match(/\/skill:(\w*)$/);
	const slashMatch = textBeforeCursor.match(/\/(\w*:?)$/);
	const currentCommand = slashMatch ? slashMatch[1].toLowerCase() : "";

	// Build filtered list: either skill sub-items or base commands
	const filteredCommands: SlashCommand[] = skillMatch
		? skills
				.filter((s) =>
					s.name.toLowerCase().includes(skillMatch[1].toLowerCase()),
				)
				.map((s) => ({
					command: `/skill:${s.name}`,
					label: s.name,
					description: s.description || "",
					icon: Lightning,
				}))
		: currentCommand
			? BASE_COMMANDS.filter(
					(cmd) =>
						cmd.command.toLowerCase().includes("/" + currentCommand) ||
						cmd.label.toLowerCase().includes(currentCommand.replace(":", "")),
				)
			: BASE_COMMANDS;

	// Scroll selected item into view
	useEffect(() => {
		if (listRef.current) {
			const selected = listRef.current.children[selectedIndex] as HTMLElement;
			if (selected) selected.scrollIntoView({ block: "nearest" });
		}
	}, [selectedIndex]);

	if (!visible || filteredCommands.length === 0) return null;

	return (
		<div
			className="absolute bottom-full left-0 right-0 mb-1 bg-bg0-hard border border-bg2 shadow-lg max-h-52 overflow-auto"
			ref={listRef}
		>
			<div className="px-2 py-1 text-[10px] text-fg4 border-b border-bg2">
				{skillMatch ? `Skills (${filteredCommands.length})` : "Commands"}
			</div>
			{filteredCommands.map((cmd, index) => (
				<button
					key={cmd.command}
					onClick={() => onSelect(cmd)}
					onMouseEnter={() => setSelectedIndex(index)}
					className={`w-full flex items-center gap-2 px-2 py-1 text-left text-xs transition-colors ${
						index === selectedIndex
							? "bg-bg1 text-fg1"
							: "text-fg2 hover:bg-bg1"
					}`}
				>
					<cmd.icon className="w-3.5 h-3.5 text-fg4 flex-shrink-0" />
					<div className="flex-1 min-w-0">
						<span className="font-medium">{cmd.command}</span>
						<span className="text-fg4 ml-2">{cmd.description}</span>
					</div>
				</button>
			))}
		</div>
	);
}

export { BASE_COMMANDS as SLASH_COMMANDS };
