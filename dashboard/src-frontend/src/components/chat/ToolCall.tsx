// === Tool Call ===
// Expandable tool call display with arguments and results

import { useState, useMemo } from "react";
import {
	CaretDown,
	CaretRight,
	Gear,
	Check,
	X,
	Spinner,
} from "@phosphor-icons/react";
import type { ChatToolCall } from "../../types";

interface ToolCallProps {
	tool: ChatToolCall;
}

function formatResult(result: unknown): string {
	if (result === null) return "null";
	if (result === undefined) return "undefined";
	if (typeof result === "string") return result;
	try {
		return JSON.stringify(result, null, 2);
	} catch {
		return String(result);
	}
}

export function ToolCall({ tool }: ToolCallProps) {
	const [isExpanded, setIsExpanded] = useState(false);
	const [now] = useState(() => Date.now());

	const getStatusIcon = () => {
		switch (tool.status) {
			case "completed":
				return <Check className="w-3 h-3 text-green" weight="bold" />;
			case "error":
				return <X className="w-3 h-3 text-red" weight="bold" />;
			case "running":
			case "pending":
			default:
				return (
					<Spinner className="w-3 h-3 text-yellow animate-spin" weight="bold" />
				);
		}
	};

	const getStatusColor = () => {
		switch (tool.status) {
			case "completed":
				return "border-green/30 bg-green/5";
			case "error":
				return "border-red/30 bg-red/5";
			case "running":
				return "border-yellow/30 bg-yellow/5";
			default:
				return "border-bg2 bg-bg0";
		}
	};

	const duration = useMemo(() => {
		if (!tool.startTime) return "";
		const start = new Date(tool.startTime).getTime();
		const end = tool.endTime ? new Date(tool.endTime).getTime() : now;
		const ms = end - start;
		if (ms < 1000) return `${ms}ms`;
		return `${(ms / 1000).toFixed(1)}s`;
	}, [tool.startTime, tool.endTime, now]);

	return (
		<div className={`border ${getStatusColor()}`}>
			{/* Header - always visible */}
			<button
				onClick={() => setIsExpanded(!isExpanded)}
				className="w-full flex items-center justify-between p-2 text-xs hover:bg-bg1/50 transition-colors"
			>
				<div className="flex items-center gap-2">
					{getStatusIcon()}
					<Gear className="w-3 h-3 text-fg4" />
					<span className="font-medium text-fg2">{tool.name}</span>
					<span className="text-fg4">({duration})</span>
				</div>
				<div className="flex items-center gap-1">
					<span className="text-fg4 capitalize">{tool.status}</span>
					{isExpanded ? (
						<CaretDown className="w-3 h-3 text-fg4" />
					) : (
						<CaretRight className="w-3 h-3 text-fg4" />
					)}
				</div>
			</button>

			{/* Expanded content */}
			{isExpanded && (
				<div className="border-t border-bg2 p-2 space-y-2">
					{/* Arguments */}
					<div>
						<div className="text-xs text-fg4 mb-1 font-medium">Arguments:</div>
						<pre className="text-xs bg-bg0-hard p-2 overflow-x-auto border border-bg2">
							{JSON.stringify(tool.args, null, 2)}
						</pre>
					</div>

					{/* Result or Error */}
					{tool.status === "completed" && tool.result !== undefined && (
						<div>
							<div className="text-xs text-fg4 mb-1 font-medium">Result:</div>
							<pre className="text-xs bg-bg0-hard p-2 overflow-x-auto border border-bg2 max-h-40 overflow-y-auto">
								{formatResult(tool.result)}
							</pre>
						</div>
					)}

					{tool.status === "error" &&
						tool.error !== undefined &&
						tool.error !== null && (
							<div>
								<div className="text-xs text-red mb-1 font-medium">Error:</div>
								<pre className="text-xs bg-red/5 border border-red/30 p-2 overflow-x-auto text-red">
									{typeof tool.error === "string"
										? tool.error
										: formatResult(tool.error)}
								</pre>
							</div>
						)}

					{/* Timing */}
					<div className="text-xs text-fg4 pt-1 border-t border-bg2">
						Started: {new Date(tool.startTime).toLocaleTimeString()}
						{tool.endTime && (
							<span className="ml-3">
								Ended: {new Date(tool.endTime).toLocaleTimeString()}
							</span>
						)}
					</div>
				</div>
			)}
		</div>
	);
}
