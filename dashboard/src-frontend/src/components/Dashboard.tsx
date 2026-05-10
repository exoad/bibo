// === Dashboard Component ===
// Flat, utilitarian, information-dense layout.
// No icons, no decoration. Pure data with collapsible sections.
// This component is rendered within the Layout component's main area.

import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useStatus } from "../hooks/useData";
import { useConfigStore } from "../stores/configStore";
import { CollapsibleSection } from "./CollapsibleSection";
import { SessionsView } from "./sessions/SessionsView";
import { QuestsView } from "./quests/QuestsView";
import { BrainView } from "./brain/BrainView";
import { VaultView } from "./vault/VaultView";
import { SkillsView } from "./skills/SkillsView";
import { ConfigView } from "./config/ConfigView";
import { KeyboardShortcuts } from "./KeyboardShortcuts";
import { Footer } from "./layout/Footer";

export default function Dashboard() {
	const { data: status } = useStatus({ enabled: true });
	const location = useLocation();

	// Derive active view from URL path, syncing with store
	const pathView = location.pathname.replace("/", "") || "sessions";
	const storeActiveView = useConfigStore((s) => s.activeView);
	const setActiveView = useConfigStore((s) => s.setActiveView);

	// Sync URL with store on mount and when path changes
	useEffect(() => {
		const validViews = [
			"chat",
			"sessions",
			"brain",
			"vault",
			"quests",
			"skills",
			"config",
		];
		const newView = validViews.includes(pathView) ? pathView : "sessions";
		if (newView !== storeActiveView) {
			setActiveView(newView as typeof storeActiveView);
		}
	}, [pathView, storeActiveView, setActiveView]);

	// Use the URL-derived view for rendering
	const activeView = pathView as typeof storeActiveView;
	// Ticker for live uptime - setTick triggers re-renders
	const [, setTick] = useState(0);
	useEffect(() => {
		const id = setInterval(() => setTick(Date.now()), 1000);
		return () => clearInterval(id);
	}, []);

	const uptimeStr = status ? formatUptime(status.uptime || 0) : "0s";

	// Render specific view based on activeView
	const renderContent = () => {
		switch (activeView) {
			case "quests":
				return (
					<div className="max-w-[1400px] mx-auto">
						<QuestsView compact={false} />
					</div>
				);
			case "brain":
				return (
					<div className="max-w-[1400px] mx-auto">
						<BrainView compact={false} />
					</div>
				);
			case "vault":
				return (
					<div className="max-w-[1400px] mx-auto">
						<VaultView compact={false} />
					</div>
				);
			case "skills":
				return (
					<div className="max-w-[1400px] mx-auto">
						<SkillsView compact={false} />
					</div>
				);
			case "config":
				return (
					<div className="max-w-[1400px] mx-auto">
						<ConfigView />
					</div>
				);
			case "sessions":
			default:
				// Default dashboard view with all sections
				return (
					<div className="max-w-[1400px] mx-auto space-y-3">
						{/* Quests — always visible, always actionable */}
						<div data-section="0">
							<CollapsibleSection title="QUESTS" defaultOpen>
								<QuestsView compact={true} sectionIndex={0} />
							</CollapsibleSection>
						</div>

						{/* Sessions — show last 20, clickable to expand */}
						<div data-section="1">
							<CollapsibleSection title="SESSIONS" defaultOpen>
								<SessionsView compact={true} sectionIndex={1} />
							</CollapsibleSection>
						</div>

						{/* Brain memories */}
						<div data-section="2">
							<CollapsibleSection title="BRAIN" defaultOpen>
								<BrainView compact={true} sectionIndex={2} />
							</CollapsibleSection>
						</div>

						{/* Vault notes */}
						<div data-section="3">
							<CollapsibleSection title="VAULT">
								<VaultView compact={true} sectionIndex={3} />
							</CollapsibleSection>
						</div>

						{/* Skills */}
						<div data-section="4">
							<CollapsibleSection title="SKILLS">
								<SkillsView compact={true} sectionIndex={4} />
							</CollapsibleSection>
						</div>

						{/* Analytics */}
						<div data-section="5">
							<CollapsibleSection title="ANALYTICS">
								<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
									<div>
										<div className="text-xs text-fg4 p-2 bg-bg0-hard border border-bg2">
											Tool Usage Chart (recharts installed)
										</div>
									</div>
									<div>
										<div className="text-xs text-fg4 p-2 bg-bg0-hard border border-bg2">
											Cost Tracking (implemented)
										</div>
									</div>
								</div>
							</CollapsibleSection>
						</div>
					</div>
				);
		}
	};

	return (
		<div className="flex flex-col h-full bg-bg0 text-fg1 overflow-hidden">
			{/* Main content: flat sections */}
			<div className="flex-1 overflow-auto p-4">{renderContent()}</div>

			<KeyboardShortcuts />

			{/* Footer: model info + version */}
			<Footer uptime={uptimeStr} status={status} />
		</div>
	);
}

function formatUptime(seconds: number): string {
	const h = Math.floor(seconds / 3600);
	const m = Math.floor((seconds % 3600) / 60);
	const s = Math.floor(seconds % 60);
	if (h > 0) return `${h}h ${String(m).padStart(2, "0")}m`;
	if (m > 0) return `${m}m ${String(s).padStart(2, "0")}s`;
	return `${s}s`;
}
