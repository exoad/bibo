// === Vault View Component ===
// Enhanced vault with search, grouping by type, grid layout, and tag filtering

import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useVault } from "../../hooks/useData";
import { Loading } from "../shared/Loading";
import { EmptyState } from "../shared/EmptyState";
import { ErrorState } from "../shared/ErrorState";
import {
	Lightbulb,
	BookBookmark,
	PuzzlePiece,
	Folder,
	Scroll,
	MapTrifold,
	MagnifyingGlass,
	X,
	Funnel,
	SquaresFour,
	List as ListIcon,
	Clock,
	Tag as TagIcon,
} from "@phosphor-icons/react";
import type { VaultNote } from "../../types";

interface Props {
	compact?: boolean;
	sectionIndex?: number;
}

const typeConfig: Record<
	VaultNote["type"],
	{
		label: string;
		icon: typeof Lightbulb;
		color: string;
		bgColor: string;
		description: string;
	}
> = {
	concept: {
		label: "Concepts",
		icon: Lightbulb,
		color: "text-yellow-bright",
		bgColor: "bg-yellow/10",
		description: "Ideas, principles, and core concepts",
	},
	reference: {
		label: "References",
		icon: BookBookmark,
		color: "text-green-bright",
		bgColor: "bg-green/10",
		description: "Documentation, APIs, and resources",
	},
	pattern: {
		label: "Patterns",
		icon: PuzzlePiece,
		color: "text-purple-bright",
		bgColor: "bg-purple/10",
		description: "Reusable solutions and best practices",
	},
	project: {
		label: "Projects",
		icon: Folder,
		color: "text-orange-bright",
		bgColor: "bg-orange/10",
		description: "Active work and initiatives",
	},
	log: {
		label: "Logs",
		icon: Scroll,
		color: "text-fg3",
		bgColor: "bg-bg2",
		description: "Chronological records and notes",
	},
	moc: {
		label: "Maps of Content",
		icon: MapTrifold,
		color: "text-red-bright",
		bgColor: "bg-red/10",
		description: "Index pages and navigation hubs",
	},
};

function getPreview(content: string, maxLength = 120): string {
	if (!content) return "";
	const clean = content
		.replace(/^#+ /gm, "")
		.replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
		.replace(/`{3}[\s\S]*?`{3}/g, "[code]")
		.replace(/`([^`]+)`/g, "$1")
		.replace(/\n+/g, " ")
		.trim();
	return clean.length > maxLength ? clean.slice(0, maxLength) + "..." : clean;
}

function formatDate(dateStr?: string): string {
	if (!dateStr) return "";
	const date = new Date(dateStr);
	const now = new Date();
	const diff = now.getTime() - date.getTime();
	const days = Math.floor(diff / (1000 * 60 * 60 * 24));
	if (days === 0) return "Today";
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days} days ago`;
	if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
	return date.toLocaleDateString();
}

export function VaultView({ compact = false }: Props) {
	const navigate = useNavigate();
	const { data: notes, isLoading, error } = useVault({ enabled: true });

	const [searchQuery, setSearchQuery] = useState("");
	const [selectedTags, setSelectedTags] = useState<string[]>([]);
	const [selectedTypes, setSelectedTypes] = useState<VaultNote["type"][]>([]);
	const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
	const [expandedSections, setExpandedSections] = useState<
		Record<string, boolean>
	>({
		concept: true,
		reference: true,
		pattern: true,
		project: true,
		log: false,
		moc: true,
	});

	const allTags = useMemo(() => {
		if (!notes) return [];
		const tags = new Set<string>();
		notes.forEach((note) => note.tags?.forEach((tag) => tags.add(tag)));
		return Array.from(tags).sort();
	}, [notes]);

	const filteredNotes = useMemo(() => {
		if (!notes) return [];
		return notes.filter((note) => {
			const matchesSearch =
				!searchQuery ||
				note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
				note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
				note.slug.toLowerCase().includes(searchQuery.toLowerCase());
			const matchesTags =
				selectedTags.length === 0 ||
				selectedTags.every((tag) => note.tags?.includes(tag));
			const matchesTypes =
				selectedTypes.length === 0 || selectedTypes.includes(note.type);
			return matchesSearch && matchesTags && matchesTypes;
		});
	}, [notes, searchQuery, selectedTags, selectedTypes]);

	const groupedNotes = useMemo(() => {
		const groups: Record<VaultNote["type"], VaultNote[]> = {
			concept: [],
			reference: [],
			pattern: [],
			project: [],
			log: [],
			moc: [],
		};
		filteredNotes.forEach((note) => {
			groups[note.type].push(note);
		});
		return groups;
	}, [filteredNotes]);

	if (compact) {
		if (isLoading)
			return <div className="text-[10px] text-gray py-1">Loading...</div>;
		if (error)
			return (
				<div className="text-[10px] text-red py-1">Error loading notes</div>
			);
		if (!notes || notes.length === 0) {
			return <div className="text-[10px] text-gray py-1">(empty)</div>;
		}
		return (
			<div className="font-mono">
				{notes.slice(0, 10).map((note, i) => (
					<button
						key={note.slug}
						onClick={() => navigate(`/vault/${note.slug}`)}
						data-index={i}
						className="w-full text-left px-1 py-0.5 text-[11px] hover:bg-bg1 hover:text-fg0 transition-colors"
					>
						<span className="text-gray">[{note.type}]</span>{" "}
						<span className="text-fg1 truncate">{note.title || note.slug}</span>
						{note.tags && note.tags.length > 0 && (
							<span className="text-fg5 ml-1">#{note.tags[0]}</span>
						)}
					</button>
				))}
				{notes.length > 10 && (
					<div className="text-[10px] text-fg4 px-1 py-0.5">
						...and {notes.length - 10} more
					</div>
				)}
			</div>
		);
	}

	if (isLoading) return <Loading />;
	if (error)
		return (
			<ErrorState
				message={error.message}
				onRetry={() => window.location.reload()}
			/>
		);
	if (!notes || notes.length === 0) {
		return <EmptyState message="No vault notes found." />;
	}

	const hasActiveFilters =
		searchQuery || selectedTags.length > 0 || selectedTypes.length > 0;
	const totalFiltered = filteredNotes.length;

	return (
		<div className="space-y-6">
			<div className="flex items-center justify-between">
				<div className="flex items-center gap-3">
					<h1 className="text-xl font-semibold text-fg0">Vault</h1>
					<span className="text-sm text-fg4 bg-bg1 px-3 py-1 rounded-full">
						{hasActiveFilters
							? `${totalFiltered} of ${notes.length}`
							: `${notes.length} notes`}
					</span>
				</div>
				<div className="flex items-center gap-2">
					<button
						onClick={() => setViewMode("grid")}
						className={`p-2 rounded transition-colors ${
							viewMode === "grid"
								? "bg-bg2 text-fg0"
								: "text-fg4 hover:text-fg2"
						}`}
						title="Grid view"
					>
						<SquaresFour className="w-5 h-5" />
					</button>
					<button
						onClick={() => setViewMode("list")}
						className={`p-2 rounded transition-colors ${
							viewMode === "list"
								? "bg-bg2 text-fg0"
								: "text-fg4 hover:text-fg2"
						}`}
						title="List view"
					>
						<ListIcon className="w-5 h-5" />
					</button>
				</div>
			</div>

			<div className="relative">
				<MagnifyingGlass className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-fg4" />
				<input
					type="text"
					placeholder="Search notes by title, content, or slug..."
					value={searchQuery}
					onChange={(e) => setSearchQuery(e.target.value)}
					className="w-full pl-10 pr-10 py-3 bg-bg0-hard border border-bg2 rounded-lg text-fg1 placeholder-fg4 focus:outline-none focus:border-green transition-colors"
				/>
				{searchQuery && (
					<button
						onClick={() => setSearchQuery("")}
						className="absolute right-3 top-1/2 -translate-y-1/2 text-fg4 hover:text-fg2"
					>
						<X className="w-5 h-5" />
					</button>
				)}
			</div>

			<div className="flex flex-wrap gap-2">
				{Object.entries(typeConfig).map(([type, config]) => {
					const isSelected = selectedTypes.includes(type as VaultNote["type"]);
					const count = groupedNotes[type as VaultNote["type"]].length;
					if (count === 0 && !isSelected) return null;
					const Icon = config.icon;
					return (
						<button
							key={type}
							onClick={() => {
								setSelectedTypes((prev) =>
									isSelected
										? prev.filter((t) => t !== type)
										: [...prev, type as VaultNote["type"]],
								);
							}}
							className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-sm transition-all ${
								isSelected
									? `${config.bgColor} ${config.color} border border-current`
									: "bg-bg1 text-fg3 hover:bg-bg2"
							}`}
						>
							<Icon
								className="w-4 h-4"
								weight={isSelected ? "fill" : "regular"}
							/>
							<span className="capitalize">{config.label}</span>
							<span className="text-xs opacity-70">({count})</span>
						</button>
					);
				})}
			</div>

			{allTags.length > 0 && (
				<div className="flex flex-wrap gap-2 items-center">
					<TagIcon className="w-4 h-4 text-fg4" />
					{allTags.slice(0, 15).map((tag) => {
						const isSelected = selectedTags.includes(tag);
						return (
							<button
								key={tag}
								onClick={() => {
									setSelectedTags((prev) =>
										isSelected ? prev.filter((t) => t !== tag) : [...prev, tag],
									);
								}}
								className={`px-2 py-1 rounded text-xs transition-all ${
									isSelected
										? "bg-green text-bg0-hard"
										: "bg-bg1 text-fg4 hover:bg-bg2 hover:text-fg2"
								}`}
							>
								#{tag}
							</button>
						);
					})}
					{allTags.length > 15 && (
						<span className="text-xs text-fg4">
							+{allTags.length - 15} more
						</span>
					)}
					{selectedTags.length > 0 && (
						<button
							onClick={() => setSelectedTags([])}
							className="text-xs text-fg4 hover:text-fg2 underline"
						>
							Clear tags
						</button>
					)}
				</div>
			)}

			{hasActiveFilters && (
				<div className="flex items-center gap-2">
					<button
						onClick={() => {
							setSearchQuery("");
							setSelectedTags([]);
							setSelectedTypes([]);
						}}
						className="flex items-center gap-1.5 text-sm text-fg4 hover:text-fg2 transition-colors"
					>
						<Funnel className="w-4 h-4" />
						Clear all filters
					</button>
				</div>
			)}

			{totalFiltered === 0 ? (
				<div className="text-center py-12">
					<p className="text-fg4">No notes match your filters</p>
				</div>
			) : (
				<div className="space-y-8">
					{Object.entries(typeConfig).map(([type, config]) => {
						const typeNotes = groupedNotes[type as VaultNote["type"]];
						if (typeNotes.length === 0) return null;

						const isExpanded = expandedSections[type];
						const Icon = config.icon;
						const displayNotes = isExpanded ? typeNotes : typeNotes.slice(0, 6);

						return (
							<section key={type} className="space-y-3">
								<button
									onClick={() =>
										setExpandedSections((prev) => ({
											...prev,
											[type]: !prev[type],
										}))
									}
									className="flex items-center gap-3 w-full group"
								>
									<div className={`p-2 rounded-lg ${config.bgColor}`}>
										<Icon className={`w-5 h-5 ${config.color}`} weight="fill" />
									</div>
									<div className="flex-1 text-left">
										<h2 className={`font-semibold ${config.color}`}>
											{config.label}
										</h2>
										<p className="text-xs text-fg4">{config.description}</p>
									</div>
									<span className="text-sm text-fg4 bg-bg1 px-2 py-1 rounded-full">
										{typeNotes.length}
									</span>
									<span
										className={`text-fg4 transition-transform ${
											isExpanded ? "rotate-180" : ""
										}`}
									>
										▼
									</span>
								</button>

								<div
									className={
										viewMode === "grid"
											? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
											: "space-y-2"
									}
								>
									{displayNotes.map((note) => (
										<NoteCard
											key={note.slug}
											note={note}
											viewMode={viewMode}
											onClick={() => navigate(`/vault/${note.slug}`)}
										/>
									))}
								</div>

								{typeNotes.length > 6 && (
									<button
										onClick={() =>
											setExpandedSections((prev) => ({
												...prev,
												[type]: !prev[type],
											}))
										}
										className="text-sm text-fg4 hover:text-fg2 transition-colors"
									>
										{isExpanded
											? `Show less`
											: `Show all ${typeNotes.length} ${config.label.toLowerCase()}`}
									</button>
								)}
							</section>
						);
					})}
				</div>
			)}
		</div>
	);
}

function NoteCard({
	note,
	viewMode,
	onClick,
}: {
	note: VaultNote;
	viewMode: "grid" | "list";
	onClick: () => void;
}) {
	const config = typeConfig[note.type];
	const Icon = config.icon;
	const preview = getPreview(note.content);

	if (viewMode === "list") {
		return (
			<button
				onClick={onClick}
				className="w-full flex items-center gap-4 p-3 bg-bg0-hard border border-bg2 rounded-lg hover:border-green/30 transition-all group text-left"
			>
				<div className={`p-2 rounded ${config.bgColor}`}>
					<Icon className={`w-4 h-4 ${config.color}`} />
				</div>
				<div className="flex-1 min-w-0">
					<h3 className="font-medium text-fg1 group-hover:text-green-bright transition-colors truncate">
						{note.title || note.slug}
					</h3>
					{preview && (
						<p className="text-xs text-fg4 truncate mt-0.5">{preview}</p>
					)}
				</div>
				{note.tags && note.tags.length > 0 && (
					<div className="flex gap-1">
						{note.tags.slice(0, 3).map((tag) => (
							<span
								key={tag}
								className="text-xs bg-bg1 text-fg4 px-2 py-0.5 rounded"
							>
								#{tag}
							</span>
						))}
						{note.tags.length > 3 && (
							<span className="text-xs text-fg4">+{note.tags.length - 3}</span>
						)}
					</div>
				)}
			</button>
		);
	}

	return (
		<button
			onClick={onClick}
			className="text-left p-4 bg-bg0-hard border border-bg2 rounded-lg hover:border-green/30 hover:shadow-lg transition-all group flex flex-col h-full"
		>
			<div className="flex items-start justify-between gap-3 mb-3">
				<div className={`p-2 rounded-lg ${config.bgColor}`}>
					<Icon className={`w-5 h-5 ${config.color}`} weight="fill" />
				</div>
				{note.tags && note.tags.length > 0 && (
					<span className="text-xs bg-bg1 text-fg4 px-2 py-1 rounded-full">
						#{note.tags[0]}
						{note.tags.length > 1 && ` +${note.tags.length - 1}`}
					</span>
				)}
			</div>

			<h3 className="font-medium text-fg1 group-hover:text-green-bright transition-colors mb-2 line-clamp-2">
				{note.title || note.slug}
			</h3>

			{preview && (
				<p className="text-sm text-fg4 line-clamp-3 mb-3 flex-1">{preview}</p>
			)}

			<div className="flex items-center justify-between text-xs text-fg5 mt-auto pt-3 border-t border-bg1">
				<span className="flex items-center gap-1">
					<Clock className="w-3 h-3" />
					{formatDate((note as VaultNote & { updated?: string }).updated)}
				</span>
				<span className={`font-medium ${config.color}`}>{note.type}</span>
			</div>
		</button>
	);
}
