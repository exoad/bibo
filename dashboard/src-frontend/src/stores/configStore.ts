// === Client State Store (Zustand) ===
// Manages client-side state that doesn't need server synchronization

import { create } from "zustand";

interface ConfigState {
	pollInterval: number;
	theme: "dark" | "light";
	layout: "list" | "grid";
	searchQuery: string;
	selectedSessionId: string | null;
	selectedVaultSlug: string | null;
	activeView:
		| "chat"
		| "sessions"
		| "brain"
		| "vault"
		| "quests"
		| "skills"
		| "config";
	// Keyboard navigation
	selectedSection: number;
	selectedIndex: number;
	helpOpen: boolean;

	setPollInterval: (interval: number) => void;
	setTheme: (theme: "dark" | "light") => void;
	setLayout: (layout: "list" | "grid") => void;
	setSearchQuery: (query: string) => void;
	setSelectedSessionId: (id: string | null) => void;
	setSelectedVaultSlug: (slug: string | null) => void;
	setActiveView: (
		view:
			| "chat"
			| "sessions"
			| "brain"
			| "vault"
			| "quests"
			| "skills"
			| "config",
	) => void;
	setSearch: (updates: Partial<Omit<ConfigState, "activeView">>) => void;
	// Keyboard nav actions
	setSelectedSection: (section: number) => void;
	setSelectedIndex: (index: number) => void;
	setHelpOpen: (open: boolean) => void;
	moveUp: () => void;
	moveDown: () => void;
	nextSection: () => void;
	prevSection: () => void;
}

export const useConfigStore = create<ConfigState>((set) => ({
	pollInterval: 5000,
	theme: "dark",
	layout: "list",
	searchQuery: "",
	selectedSessionId: null,
	selectedVaultSlug: null,
	activeView: "sessions",
	selectedSection: 0,
	selectedIndex: 0,
	helpOpen: false,

	setPollInterval: (pollInterval) => set({ pollInterval }),
	setTheme: (theme) => set({ theme }),
	setLayout: (layout) => set({ layout }),
	setSearchQuery: (searchQuery) => set({ searchQuery }),
	setSelectedSessionId: (selectedSessionId) => set({ selectedSessionId }),
	setSelectedVaultSlug: (selectedVaultSlug) => set({ selectedVaultSlug }),
	setActiveView: (activeView) => set({ activeView }),
	setSearch: (updates) => set(updates),
	setSelectedSection: (selectedSection) => set({ selectedSection }),
	setSelectedIndex: (selectedIndex) => set({ selectedIndex }),
	setHelpOpen: (helpOpen) => set({ helpOpen }),
	moveUp: () =>
		set((state) => ({ selectedIndex: Math.max(0, state.selectedIndex - 1) })),
	moveDown: () => set((state) => ({ selectedIndex: state.selectedIndex + 1 })),
	nextSection: () =>
		set((state) => ({
			selectedSection: Math.min(4, state.selectedSection + 1),
			selectedIndex: 0,
		})),
	prevSection: () =>
		set((state) => ({
			selectedSection: Math.max(0, state.selectedSection - 1),
			selectedIndex: 0,
		})),
}));
