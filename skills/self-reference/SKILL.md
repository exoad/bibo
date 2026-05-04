---
name: self-reference
description: Interface with yourself — tells you everything about your own architecture, extensions, skills, settings, and how to modify yourself
kind: sop
---

# Self-Reference

## Overview

This skill is a **self-knowledge interface** for bibo. When invoked, it tells you everything you need to know about yourself without having to parse AGENTS.md or SELF.md manually.

**Purpose**: Instead of reading through AGENTS.md to discover how to modify your extensions, skills, settings, or dashboard, this skill provides direct answers about your own architecture.

**When to use**:
- You need to modify an extension, skill, setting, or dashboard
- You need to understand your own architecture before making changes
- You need to know how to add a new tool, command, extension, or skill
- You want a quick reference for your own structure without reading full docs

## Parameters

- **query** (optional): Specific question about yourself. If omitted, provide a full self-knowledge index.
  - Examples: "How do I add a new extension?", "What are all my extensions?", "How does the dashboard work?", "What are my current model profiles?"
- **depth** (optional, default: `overview`): Level of detail for the response.
  - `overview`: High-level summary of the requested topic
  - `detailed`: Full details with file paths, code snippets, and examples
  - `complete`: Everything — full architecture, all extensions, all skills, all settings

## Steps

### 1. Parse the query

Determine what the user is asking about:
- **Extensions**: How to add/modify, list of all extensions, specific extension details
- **Skills**: How to add/modify, list of all skills, specific skill details
- **Settings**: Model profiles, compaction, retry, environment variables
- **Dashboard**: Architecture, API endpoints, frontend structure
- **Testing**: How to run tests, test coverage
- **System prompt**: How the system prompt is assembled, skill injection, knowledge injection
- **Quality mechanisms**: Quality monitor, output parser, browser extract retention, evidence preservation
- **General**: Full self-knowledge index

### 2. Retrieve self-knowledge

You already have this information in your context. Use the following structure:

#### Project Metadata
- Name: `bibo`, Version: `0.1.24`
- Description: A pi-based coding agent optimized for small local language models
- Dependency: `@mariozechner/pi-coding-agent` ^0.68.1
- Provider: `jackbox` (llama.cpp at `http://127.0.0.1:6969/v1`)
- Model: `bibo-qwen3.6` (128K context, 4096 max tokens, reasoning enabled)

#### Directory Structure
```
bibo/
├── AGENTS.md           # Project instructions (loaded as context)
├── SYSTEM.md           # System prompt override
├── SELF.md             # Internal architecture reference (read before modifying yourself)
├── package.json        # Dependencies + scripts
├── provider.json       # Provider config (local, not tracked)
├── provider.json.example
├── models.json         # Model definitions
├── tsconfig.json       # TypeScript config
├── vitest.config.ts    # Test config
├── .pi/
│   ├── settings.json   # Model profiles, compaction, retry
│   └── extensions/     # 21 TypeScript extension modules
│       ├── shared-state.ts  # Cross-extension state
│       ├── benchmark-profiles/
│       ├── tool-gating/
│       ├── permission-gate/
│       ├── checkpoint/
│       ├── skill-inject/
│       ├── knowledge-inject/
│       ├── quality-monitor/
│       ├── output-parser/
│       ├── thinking-budget/
│       ├── evidence/
│       ├── evidence-compact/
│       ├── browser-extract-retention/
│       ├── browser/
│       ├── hello/
│       ├── timer/
│       ├── shell-session/
│       ├── write-guard/
│       ├── context-mode/     # Multi-agent adapter (largest)
│       ├── llama-cpp-provider/
│       ├── extra-tools/
│       ├── breathing-border/
│       └── turn-cap/
├── skills/
│   ├── tools/          # 15 tool guidance files
│   ├── knowledge/      # 13 algorithm cheat sheets
│   └── protocols/      # 3 workflow protocols
├── dashboard/
│   ├── src/            # Node.js server + REST API
│   └── src-frontend/   # React 18 + Vite + TypeScript
├── bin/                # CLI scripts
├── sessions/           # Session data
└── node_modules/       # Dependencies
```

#### Extension Stack (21 extensions, in load order)

| # | Extension | Purpose | Key Events |
|---|-----------|---------|------------|
| 1 | **hello** | Startup notification | `session_start` |
| 2 | **timer** | Session/task duration tracking | `session_start`, `session_shutdown` |
| 3 | **benchmark-profiles** | Resolves model profiles, sets temperature=0.3 | `before_agent_start`, `before_provider_request` |
| 4 | **tool-gating** | Blocks tools not in whitelist | `before_agent_start`, `tool_call` |
| 5 | **permission-gate** | Whitelists safe bash commands | `tool_call` |
| 6 | **checkpoint** | Backs up files before Write/Edit | `session_start`, `tool_call` |
| 7 | **skill-inject** | Appends tool skill guidance (300-token budget) | Per-turn injection |
| 8 | **knowledge-inject** | Appends algorithm cheat sheets (200-token budget) | Per-turn injection |
| 9 | **quality-monitor** | Detects 4 failure modes at `turn_end` | `turn_end` |
| 10 | **output-parser** | Detects text-embedded tool calls | Per-turn |
| 11 | **thinking-budget** | Aborts when thinking tokens exceed budget | Per-turn |
| 12 | **evidence** | Per-session in-memory evidence store | Throughout session |
| 13 | **evidence-compact** | Preserves evidence after compaction | `compaction` |
| 14 | **browser-extract-retention** | Prunes old BrowserExtract results (keeps 2 newest) | Per-turn |
| 15 | **browser** | Per-session Playwright browser instance | `session_start`, `session_shutdown` |
| 16 | **shell-session** | Safe shell session management | Throughout session |
| 17 | **write-guard** | Write protection | `tool_call` |
| 18 | **context-mode** | Multi-agent adapter (Claude Code, Cursor, Codex, etc.) | Throughout session |
| 19 | **llama-cpp-provider** | LLM provider configuration | `session_start` |
| 20 | **extra-tools** | Additional tool registrations | `session_start` |
| 21 | **breathing-border** | UI visual effect | `session_start` |
| 22 | **turn-cap** | Hard turn limit per agent run | Per-turn |

#### Skills System

**Tool Skills** (`skills/tools/`) — 15 files
Each has YAML frontmatter with `name`, `type: tool-guidance`, `target_tool`, `priority`, `token_cost`.

| File | Tool | Priority |
|------|------|----------|
| `read.md` | Read | 10 |
| `write.md` | Write | 10 |
| `edit.md` | Edit | 10 |
| `bash.md` | Bash | 10 |
| `glob.md` | Glob | 10 |
| `grep.md` | Grep | 10 |
| `webfetch.md` | WebFetch | 10 |
| `websearch.md` | WebSearch | 10 |
| `browser_click.md` | BrowserClick | 10 |
| `browser_extract.md` | BrowserExtract | 10 |
| `browser_navigate.md` | BrowserNavigate | 10 |
| `browser_type.md` | BrowserType | 10 |
| `agent.md` | Agent | 10 |
| `anti_loop.md` | Anti-loop detection | — |
| `timer.md` | Timer tools | — |

**Knowledge Entries** (`skills/knowledge/`) — 13 files
Algorithm cheat sheets with `topic`, `keywords: [...]`, `token_cost`.

| File | Topic | Keywords |
|------|-------|----------|
| `bfs_state_space.md` | BFS State Space | bucket, pouring, state space, minimum moves |
| `binary_search.md` | Binary Search | sorted, search, lower bound |
| `dfs_vs_bfs.md` | DFS vs BFS | traversal, path, cycle, shortest |
| `dynamic_programming.md` | Dynamic Programming | memoization, subproblem, optimal |
| `hash_vs_tree.md` | Hash vs Tree | lookup, collision, ordering |
| `io_wrapper.md` | I/O Wrapper | fast I/O, parsing, output |
| `recursion_backtracking.md` | Recursion/Backtracking | constraint, generate, prune |
| `rule_string_transform.md` | Rule String Transform | parse, apply, transform |
| `sorting_choice.md` | Sorting Choice | compare, stable, in-place |
| `tree_rerooting.md` | Tree Rerooting | DP on tree, reroot |
| `tree_zipper.md` | Tree Zipper | edit, navigate, focus |
| `two_pointers.md` | Two Pointers | sorted, pair, window |
| `workspace_docs.md` | Workspace Docs | AGENTS.md, README, discovery |

**Protocol Skills** (`skills/protocols/`) — 3 files
Workflow protocols for structured task execution.

| File | Purpose |
|------|---------|
| `task_decomposition.md` | GIVEN/UNKNOWN/PLAN format for multi-step tasks |
| `research_protocol.md` | Evidence-first research with BrowserNavigate→BrowserExtract→EvidenceAdd |
| `cite_before_answer.md` | Cite evidence before answering |

#### Dashboard Architecture

**Backend**: Node.js HTTP server (`dashboard/src/server.js`) — REST API
**Data layer**: `dashboard/src/data.js` — reads from `~/.pi/agent/sessions/`, `~/.rho/brain/brain.jsonl`, `~/.rho/vault/`
**Frontend**: React 18 + Vite + TypeScript + Tailwind CSS + React Router + TanStack Query

**API Endpoints**:
- `GET /api/sessions` — List all sessions
- `GET /api/sessions/:id` — Session detail
- `GET /api/sessions/:id/export` — Export as JSON
- `GET /api/brain` — Load brain memories
- `GET /api/vault` — List vault notes
- `GET /api/vault/:slug` — Get vault note content
- `GET /api/quests` — List quests
- `POST /api/quests/:id/complete` — Mark quest complete
- `GET /api/status` — Agent status
- `GET /api/skills` — List skills
- `POST /api/skills/:name/trigger` — Trigger a skill
- `GET /api/search` — Search across sessions, brain, vault
- `GET /api/config` — Dashboard configuration
- `GET /api/health` — Health check
- `GET /api/version` — Dashboard version

#### Configuration

| Setting | Value |
|---------|-------|
| **Context limit** | 131,072 tokens |
| **Max tokens** | 4,096 |
| **Thinking budget** | 2,048 (default) / 8,192 (qwen3.6) |
| **Skill token budget** | 300 |
| **Knowledge token budget** | 200 |
| **Temperature** | 0.3 (default) / 0.6 (qwen3.6) |
| **Compaction** | Enabled |
| **Retry** | Enabled, max 2 retries |

#### System Prompt Assembly Pipeline

```
1. Base: SYSTEM.md (project) or default pi prompt
2. Context: AGENTS.md + parent AGENTS.md files
3. Extensions inject (in order):
   ├── benchmark-profiles → systemPromptOptions.littleCoder
   ├── tool-gating → allowedTools
   ├── skill-inject → ## Tool Usage Guidance (300-token budget)
   ├── knowledge-inject → ## Algorithm Reference (200-token budget)
4. Temperature → 0.3 via before_provider_request hook
```

#### Quality & Safety Mechanisms

| Mechanism | Purpose |
|-----------|---------|
| **quality-monitor** | Detects 4 failure modes at `turn_end`: empty_response, unknown_tool, repeated_tool_call, malformed_args |
| **output-parser** | Detects text-embedded tool calls and nudges model to use native tool calling |
| **browser-extract-retention** | Prunes old BrowserExtract results (keeps 2 newest) |
| **evidence-compact** | Preserves evidence after compaction via bridge message |
| **thinking-budget** | Aborts turn when thinking tokens exceed budget |
| **permission-gate** | Whitelists safe bash commands, blocks others in "auto" mode |

#### Testing

```bash
npm test          # Run all vitest tests
npm run typecheck  # TypeScript type checking
```

**Test coverage**:
- Frontmatter parsing (4 tests)
- Intent prediction (5 tests)
- Knowledge scoring (5 tests)
- Quality assessment (9 tests)
- Output parsing (8 tests)
- Browser extract retention (8+ tests)
- Shell session helpers (4 tests)
- Benchmark profiles (5 tests)
- Evidence store (3 tests)
- Evidence compact bridge (4 tests)

### 3. Answer the query

Provide a direct, structured answer based on the query:

- If the query is about **adding a new extension**: Explain the steps (create `.pi/extensions/<name>/index.ts`, export default function, subscribe to events, optionally register tools)
- If the query is about **adding a new tool skill**: Explain the steps (create `skills/tools/<name>.md` with YAML frontmatter)
- If the query is about **adding a knowledge entry**: Explain the steps (create `skills/knowledge/<name>.md` with YAML frontmatter)
- If the query is about **adding a new bash command**: Explain the steps (edit `.pi/extensions/permission-gate/index.ts`, add prefix to SAFE_PREFIXES array)
- If the query is about **modifying model profiles**: Explain the steps (edit `.pi/settings.json` → `bibo.model_profiles`)
- If the query is about **changing system prompt**: Explain the steps (edit `SYSTEM.md` or `<home>/.pi/agent/SYSTEM.md`)
- If the query is about **the dashboard**: Explain the architecture, how to run it, how to modify the frontend
- If the query is about **quality mechanisms**: Explain how each mechanism works and where it's implemented
- If the query is about **testing**: Explain how to run tests and what's covered

### 4. Provide file paths and code snippets

Always include:
- The exact file path to modify
- A code snippet showing the change
- Any prerequisites or dependencies

### 5. Suggest next steps

If the query reveals a gap or suggests a modification, suggest:
- What to test after making the change
- What documentation to update
- What other components might be affected

## Examples

### Example 1: Full self-knowledge index

**User**: "Tell me everything about yourself"

**Response**:
```
Here's a complete self-knowledge index for bibo:

## Project
- Name: bibo v0.1.24
- Description: A pi-based coding agent optimized for small local language models
- Dependency: @mariozechner/pi-coding-agent ^0.68.1
- Provider: jackbox (llama.cpp at http://127.0.0.1:6969/v1)
- Model: bibo-qwen3.6 (128K context, 4096 max tokens, reasoning enabled)

## Extensions (21 total)
1. hello — Startup notification
2. timer — Session/task duration tracking
3. benchmark-profiles — Resolves model profiles, sets temperature=0.3
4. tool-gating — Blocks tools not in whitelist
5. permission-gate — Whitelists safe bash commands
6. checkpoint — Backs up files before Write/Edit
7. skill-inject — Appends tool skill guidance (300-token budget)
8. knowledge-inject — Appends algorithm cheat sheets (200-token budget)
9. quality-monitor — Detects 4 failure modes at turn_end
10. output-parser — Detects text-embedded tool calls
11. thinking-budget — Aborts when thinking tokens exceed budget
12. evidence — Per-session in-memory evidence store
13. evidence-compact — Preserves evidence after compaction
14. browser-extract-retention — Prunes old BrowserExtract results
15. browser — Per-session Playwright browser instance
16. shell-session — Safe shell session management
17. write-guard — Write protection
18. context-mode — Multi-agent adapter (Claude Code, Cursor, Codex, etc.)
19. llama-cpp-provider — LLM provider configuration
20. extra-tools — Additional tool registrations
21. breathing — UI visual effect
22. turn-cap — Hard turn limit per agent run

## Skills
- **Tools** (15 files): read, write, edit, bash, glob, grep, webfetch, websearch, browser_click, browser_extract, browser_navigate, browser_type, agent, anti_loop, timer
- **Knowledge** (13 files): BFS, binary search, DFS vs BFS, DP, hash vs tree, I/O wrapper, recursion/backtracking, rule string transform, sorting, tree rerooting, tree zipper, two pointers, workspace docs
- **Protocols** (3 files): task decomposition, research protocol, cite before answer

## Dashboard
- Backend: Node.js HTTP server (`dashboard/src/server.js`)
- Frontend: React 18 + Vite + TypeScript
- API: 16 endpoints (sessions, brain, vault, quests, skills, search, config, health, version)

## Configuration
- Context limit: 131,072 tokens
- Max tokens: 4,096
- Thinking budget: 2,048 (default) / 8,192 (qwen3.6)
- Temperature: 0.3 (default) / 0.6 (qwen3.6)
- Compaction: Enabled
- Retry: Enabled, max 2 retries

## Testing
- `npm test` — Run all vitest tests
- `npm run typecheck` — TypeScript type checking
- Coverage: 57+ tests across 10 modules

## Key Principles
1. **Home directory principle**: All self-referential work must happen from the project root
2. **Shell session safety**: Never run background processes without user confirmation
3. **Write refuses on existing files**: Use Edit with exact text matching
4. **Evidence is per-session**: Cleared on session_shutdown, preserved across compaction
5. **BrowserExtract retention**: Only 2 newest results kept raw
6. **Thinking budget aborts mid-stream**: Model gets a correction follow-up
7. **Context-mode extension**: Supports 10+ AI agent adapters (Claude Code, Cursor, Codex, etc.)

## How to Modify Yourself

### Adding a new extension
1. Create `.pi/extensions/<name>/index.ts`
2. Export default `(pi: ExtensionAPI) => void`
3. Subscribe to events via `pi.on()`
4. Optionally register tools via `pi.registerTool()`

### Adding a new tool skill
1. Create `skills/tools/<name>.md` with YAML frontmatter
2. Include `target_tool: <ToolName>` and `token_cost: <N>`
3. Write guidance body

### Adding a knowledge entry
1. Create `skills/knowledge/<name>.md` with YAML frontmatter
2. Include `topic`, `keywords: [...]`, `token_cost`
3. Write cheat sheet body

### Adding a new bash command
1. Edit `.pi/extensions/permission-gate/index.ts`
2. Add the command prefix to the `SAFE_PREFIXES` array
3. The match is a simple `startsWith` check

### Modifying model profiles
1. Edit `.pi/settings.json` → `bibo.model_profiles`
2. Or set `LITTLE_CODER_BENCHMARK` for benchmark-specific overrides

### Changing system prompt
1. Edit `SYSTEM.md` (project-level) or `<home>/.pi/agent/SYSTEM.md` (global)

### Running the dashboard
```bash
cd dashboard
node src/server.js
# Opens at http://127.0.0.1:3000
```

### Building the dashboard frontend
```bash
cd dashboard/src-frontend
npm run build
```

This is your complete self-knowledge. Use it to modify yourself without reading AGENTS.md or SELF.md.
```

### Example 2: How to add a new extension

**User**: "How do I add a new extension?"

**Response**:
```
To add a new extension to bibo:

1. Create `.pi/extensions/<name>/index.ts`
2. Export a default function that takes `pi: ExtensionAPI`
3. Subscribe to events via `pi.on()`
4. Optionally register tools via `pi.registerTool()`

Example:
```typescript
// .pi/extensions/my-extension/index.ts
export default function myExtension(pi: ExtensionAPI) {
  pi.on('session_start', () => {
    console.log('My extension started');
  });
  
  pi.on('tool_call', (event) => {
    // Handle tool calls
  });
}
```

Your extension will be auto-discovered and loaded in order.
```

### Example 3: How to add a new bash command

**User**: "How do I add a new bash command to the whitelist?"

**Response**:
```
To add a new bash command to the whitelist:

1. Edit `.pi/extensions/permission-gate/index.ts`
2. Add the command prefix to the `SAFE_PREFIXES` array
3. The match is a simple `startsWith` check

Example - to add `tree`:
```typescript
const SAFE_PREFIXES = [
  // ... existing prefixes ...
  'tree',
  'tree -L',
  'tree --dirs'
]
```

Commands starting with any entry in SAFE_PREFIXES will be allowed to run in "auto" mode.
```

### Example 4: Dashboard architecture

**User**: "How does the dashboard work?"

**Response**:
```
The dashboard consists of:

**Backend** (`dashboard/src/server.js`):
- Node.js HTTP server on port 3000
- Serves REST API endpoints
- Serves static files (frontend)

**Data layer** (`dashboard/src/data.js`):
- Reads from ~/.pi/agent/sessions/
- Reads from ~/.rho/brain/brain.jsonl
- Reads from ~/.rho/vault/
- Provides: loadSessions, loadSessionDetail, exportSession, loadBrain, loadVault, loadVaultNote, loadQuests, completeQuest, loadStatus, loadSkills, search

**Frontend** (`dashboard/src-frontend/`):
- React 18 + Vite + TypeScript
- Tailwind CSS + React Router + TanStack Query
- Views: Sessions, Brain, Vault, Quests, Skills, Config
- Build: `cd dashboard/src-frontend && npm run build`
- Dev: `cd dashboard/src-frontend && npm run dev`

**API Endpoints**:
- GET /api/sessions — List all sessions
- GET /api/sessions/:id — Session detail
- GET /api/sessions/:id/export — Export as JSON
- GET /api/brain — Load brain memories
- GET /api/vault — List vault notes
- GET /api/vault/:slug — Get vault note content
- GET /api/quests — List quests
- POST /api/quests/:id/complete — Mark quest complete
- GET /api/status — Agent status
- GET /api/skills — List skills
- POST /api/skills/:name/trigger — Trigger a skill
- GET /api/search — Search across sessions, brain, vault
- GET /api/config — Dashboard configuration
- GET /api/health — Health check
- GET /api/version — Dashboard version

**Running**:
```bash
cd dashboard
node src/server.js
# Opens at http://127.0.0.1:3000
```

**Known issues**:
- Server crashes when dist/ doesn't exist — always build frontend first
- Port conflicts — kill existing process if EADDRINUSE
- Never run `node src/server.js &` in shell session — use ShellSession tool instead
```

## Troubleshooting

### "I don't know how to modify myself"
This skill is your self-knowledge interface. Ask it anything about your architecture, extensions, skills, settings, or dashboard.

### "I need to read SELF.md to understand how to modify myself"
You shouldn't need to. This skill provides all the information you need. If you still need more detail, read SELF.md — it's the living document of your internal architecture.

### "I need to read AGENTS.md to understand how to modify myself"
You shouldn't need to. This skill provides all the information you need. AGENTS.md is for project-specific instructions; SELF.md is for your internal architecture.

### "I need to add a new tool but don't know where to put it"
Create `skills/tools/<name>.md` with YAML frontmatter. The tool-gating extension will handle the rest.

### "I need to add a new bash command but it's being blocked"
Edit `.pi/extensions/permission-gate/index.ts` and add the command prefix to the `SAFE_PREFIXES` array.

### "I need to modify model profiles but don't know where they are"
Edit `.pi/settings.json` → `bibo.model_profiles`. Or set `LITTLE_CODER_BENCHMARK` for benchmark-specific overrides.

### "I need to change the system prompt but don't know where"
Edit `SYSTEM.md` (project-level) or `<home>/.pi/agent/SYSTEM.md` (global).

### "The dashboard isn't starting"
1. Check if the frontend is built: `ls dashboard/src-frontend/dist/index.html`
2. If not, build it: `cd dashboard/src-frontend && npm run build`
3. Then start the server: `cd dashboard && node src/server.js`

### "The dashboard is showing old data"
The dashboard reads from `~/.pi/agent/sessions/`, `~/.rho/brain/brain.jsonl`, and `~/.rho/vault/`. These are updated by the pi system in real-time. If data is stale, check that the pi system is running.

### "I need to understand how a specific extension works"
Read the extension's `index.ts` file in `.pi/extensions/<name>/`. Each extension is a single TypeScript module.

### "I need to understand how skill injection works"
Skill injection uses a 3-priority selection algorithm with a 300-token budget:
1. **Error recovery**: Last failed tool (from `tool_result` event)
2. **Recency**: Last 2 tool calls (from `recentToolCalls` list, capped at 8)
3. **Intent prediction**: Keyword matching against `INTENT_MAP`

### "I need to understand how knowledge injection works"
Knowledge injection uses scoring: word=1.0, bigram/phrase=2.0. Threshold=2.0. Budget=200 tokens.

### "I need to add a new knowledge entry"
Create `skills/knowledge/<name>.md` with YAML frontmatter. Include `topic`, `keywords: [...]`, `token_cost`, and write a cheat sheet body.

### "I need to add a new protocol"
Create `skills/protocols/<name>.md` with YAML frontmatter. Include `name`, `description`, and workflow steps.

## Summary

This skill is your self-knowledge interface. It tells you everything about yourself without having to parse AGENTS.md or SELF.md manually.

**Key takeaways**:
- You have 21 extensions that modify your behavior
- You have 31 skill files (15 tools, 13 knowledge, 3 protocols)
- You have a React dashboard with 16 API endpoints
- You have comprehensive quality and safety mechanisms
- You can modify yourself by editing files in your project directory
- Always read SELF.md for detailed internal architecture
- Always read AGENTS.md for project-specific instructions 