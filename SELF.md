# SELF.md — bibo Internal Architecture Reference

**This file is the living document of how bibo works internally.**
It is NOT included in the system prompt by default — I must read it when asked to modify or understand my own scaffolding.

---

## 1. What is bibo?

bibo is a **pi-based coding agent** optimized for small local language models (e.g., Qwen3.6-35B-A3B running via llama.cpp). It is a TypeScript project that extends `@mariozechner/pi-coding-agent` (v0.68.1) with a suite of extensions, skills, and configuration.

- **Package**: `bibo` v0.1.24
- **Dependency**: `@mariozechner/pi-coding-agent` ^0.68.1
- **Runtime**: Node.js, TypeScript (compiled via jiti at runtime)
- **Provider**: `jackbox` (llama.cpp on `http://127.0.0.1:6969/v1`)
- **Model**: `bibo-qwen3.6` (128K context, 4096 max tokens, reasoning enabled)

---

## 2. Home Directory Principle

**~/bibo is home.** If you are ever operating outside this directory and need to reference, read, or modify your own scaffolding (extensions, skills, settings, SYSTEM.md, SELF.md, AGENTS.md, or any internal config), **cd back to ~/bibo first.** All your instructions, extensions, skills, and self-knowledge live here — don't try to reason about them from memory or from a different working directory.

This applies to:
- Editing SELF.md, SYSTEM.md, AGENTS.md, or any .pi/ files
- Adding/removing/modifying extensions, skills, or protocols
- Reading or modifying model profiles, settings, or environment configs
- Any self-referential work (understanding, modifying, or extending your own behavior)

The scaffolding is the source of truth. The directory is where it lives. Go home before you edit.

---

## 3. Directory Structure

```
/Users/jmeng/bibo/
├── AGENTS.md              # Project instructions (loaded as context file)
├── SYSTEM.md              # System prompt override (replaces default)
├── provider.json            # Provider config (local, not tracked by VCS)
├── provider.json.example  # Provider config template (copy to provider.json to activate)
├── package.json           # Dependencies: pi-coding-agent, playwright, vitest
├── SELF.md                # ← You are reading this file
├── skills/
│   ├── tools/             # Tool guidance (14 files: Read, Write, Edit, Bash, etc.)
│   ├── knowledge/         # Algorithm cheat sheets (13 files: BFS, DFS, DP, etc.)
│   └── protocols/         # Workflow protocols (3 files: task-decomp, research, cite)
├── .pi/
│   ├── settings.json      # Model profiles, compaction, retry settings
│   ├── extensions/        # 15 TypeScript extensions (see §4)
│   └── ...
├── claude-code-system-prompts/  # Reference: System prompt patterns (NOT loaded at runtime)
└── node_modules/          # pi-coding-agent, playwright, vitest, etc.
```

---

## 4. Extension Stack (in load order)

Extensions live in `.pi/extensions/` and are auto-discovered. Each is a TypeScript module exporting a default function `(pi: ExtensionAPI) => void`.

| Extension | Purpose | Key Events |
|-----------|---------|------------|
| **hello** | Startup notification | `session_start` |
| **timer** | Tracks session/task duration; provides TimeElapsed, MarkStart, MarkEnd tools | `session_start`, `session_shutdown` |
| **benchmark-profiles** | Resolves model profiles from `.pi/settings.json`, sets temperature=0.3 | `before_agent_start`, `before_provider_request` |
| **tool-gating** | Blocks tools not in `LITTLE_CODER_ALLOWED_TOOLS` | `before_agent_start`, `tool_call` |
| **permission-gate** | Whitelists safe bash commands; blocks others in "auto" mode | `tool_call` |
| **checkpoint** | Backs up files before Write/Edit (saves to `~/.bibo/checkpoints/<session>`) | `session_start`, `tool_call` |
| **skill-inject** | Selects tool skill cards from `skills/tools/*.md` based on intent/error/recency (300-token budget) | `tool_result`, `before_agent_start` |
| **knowledge-inject** | Scores knowledge entries from `skills/knowledge/*.md` + `skills/protocols/*.md` against user prompt (200-token budget, threshold=2.0) | `before_agent_start` |
| **thinking-budget** | Caps thinking tokens; aborts + retries with thinking=off when exceeded | `before_agent_start`, `turn_start`, `message_update`, `turn_end` |
| **turn-cap** | Hard limit on turns per agent run (from `LITTLE_CODER_MAX_TURNS`) | `before_agent_start`, `turn_start` |
| **quality-monitor** | Detects empty responses, hallucinated tools, repeated calls; queues correction follow-ups | `tool_execution_start`, `session_start`, `turn_end` |
| **output-parser** | Detects text-embedded tool calls (fenced blocks, <tool_call> tags); nudges model to native tool calling | `turn_end` |
| **evidence** | Registers EvidenceAdd/EvidenceGet/EvidenceList tools; per-session in-memory store | `session_shutdown` |
| **evidence-compact** | Sends bridge message after compaction reminding model of preserved evidence | `session_compact` |
| **browser-extract-retention** | Prunes old BrowserExtract results (keeps 2 newest), replaces with URL+evidence summary | `context` |
| **shell-session** | Registers ShellSession/ShellSessionCwd/ShellSessionReset tools (subprocess or tmux-proxy) | (tool registration only) |
| **extra-tools** | Registers glob, webfetch, websearch tools | (tool registration only) |
| **llama-cpp-provider** | Registers `jackbox` and `ollama` providers dynamically | (provider registration only) |
| **benchmark-profiles** | (also listed above — resolves model profiles) | |

### Extension Load Order

Extensions are loaded in filesystem order (alphabetical by directory name). The critical ordering is:
1. `benchmark-profiles` must run `before_agent_start` first to set `systemPromptOptions.littleCoder`
2. `tool-gating` reads `allowedTools` from `systemPromptOptions`
3. `skill-inject` reads `allowedTools` and `requiredTools` from `systemPromptOptions`
4. `knowledge-inject` reads `knowledgeTokenBudget` and `isSubtask` from `systemPromptOptions`
5. `thinking-budget` reads `thinkingBudget` from `systemPromptOptions`
6. `turn-cap` reads `maxTurns` from `systemPromptOptions`

---

## 5. Settings & Model Profiles

### `.pi/settings.json`

```json
{
  "compaction": { "enabled": true },
  "retry": { "enabled": true, "maxRetries": 2 },
  "bibo": {
    "default_model_profile": {
      "context_limit": 131072,
      "max_tokens": 4096,
      "thinking_budget": 2048,
      "skill_token_budget": 300,
      "knowledge_token_budget": 200,
      "system_prompt_budget": 0,
      "max_retries": 1,
      "temperature": 0.3
    },
    "model_profiles": {
      "jackbox/bibo-qwen3.6": {
        "context_limit": 131072,
        "max_tokens": 4096,
        "thinking_budget": 2048,
        "skill_token_budget": 300,
        "knowledge_token_budget": 200,
        "temperature": 0.3
      }
    }
  }
}
```

### Benchmark Overrides (injected via `LITTLE_CODER_BENCHMARK` env var)

- `terminal_bench`: `thinking_budget=3000`, `temperature=0.2`, `max_turns=40`
- `gaia`: `thinking_budget=2000`, `temperature=0.4`, `max_turns=30`, `context_limit=65536`

### Environment Variables

| Variable | Purpose |
|----------|---------|
| `LITTLE_CODER_ALLOWED_TOOLS` | Comma-separated tool whitelist |
| `LITTLE_CODER_PERMISSION_MODE` | "auto" | "accept-all" | "manual" for bash gating |
| `LITTLE_CODER_MAX_TURNS` | Hard turn limit per agent run |
| `LITTLE_CODER_THINKING_BUDGET` | Thinking token budget override |
| `LITTLE_CODER_BENCHMARK` | "terminal_bench" or "gaia" — triggers profile overrides |
| `LITTLE_CODER_SESSION_ID` | Session identifier for multi-session isolation |
| `LITTLE_CODER_TB_MODE` | "1" = Terminal-Bench tmux-proxy mode |
| `LLAMACPP_BASE_URL` | llama.cpp endpoint (default: `http://127.0.0.1:6969/v1`) |
| `OLLAMA_BASE_URL` | Ollama endpoint (default: `http://127.0.0.1:11434/v1`) |
| `BROWSER_HEADFUL` | Enable headful browser mode |

---

## 6. Skills System

### Tool Skills (`skills/tools/*.md`)

14 files providing guidance for each tool. Each has YAML frontmatter:
```yaml
---
name: read-guidance
type: tool-guidance
target_tool: Read
priority: 10
token_cost: 100
user-invocable: false
---
```

**Core tools covered**: Read, Write, Edit, Bash, Glob, Grep, WebFetch, WebSearch, BrowserNavigate, BrowserClick, BrowserType, BrowserExtract, BrowserScroll, BrowserBack, BrowserHistory, EvidenceAdd, EvidenceGet, EvidenceList, ShellSession, Agent

### Knowledge Entries (`skills/knowledge/*.md`)

13 files with algorithm cheat sheets. Each has:
```yaml
---
name: bfs-state-space
topic: State-Space Search
type: domain-knowledge
keywords: [bucket, pouring, state space, minimum moves, shortest sequence]
token_cost: 120
---
```

**Topics**: BFS state space, binary search, DFS vs BFS, dynamic programming, hash vs tree, I/O wrapper, recursion/backtracking, rule string transform, sorting choice, tree rerooting, tree zipper, two pointers, workspace docs

### Protocol Skills (`skills/protocols/*.md`)

3 workflow protocols:
- **task-decomposition**: GIVEN/UNKNOWN/PLAN format for multi-step tasks
- **research-protocol**: Evidence-first research with BrowserNavigate→BrowserExtract→EvidenceAdd
- **cite_before_answer**: Cite evidence before answering

### Frontmatter Parser

`parseSkillFile(text)` splits on `---`, parses YAML-like frontmatter, extracts body. Supports: scalars, arrays `[a, b]`, booleans, integers.

---

## 7. System Prompt Assembly Pipeline

The system prompt is assembled per-turn by the extension stack:

1. **Base**: `SYSTEM.md` (project) or default pi prompt
2. **Context files**: `AGENTS.md` (and parent dir AGENTS.md files) concatenated
3. **Extensions inject** (in order):
   - `benchmark-profiles`: Sets `systemPromptOptions.littleCoder` with resolved profile
   - `tool-gating`: Publishes `allowedTools` to `systemPromptOptions`
   - `skill-inject`: Appends `## Tool Usage Guidance` block (300-token budget)
   - `knowledge-inject`: Appends `## Algorithm Reference` block (200-token budget)
4. **Temperature**: Set to 0.3 via `before_provider_request` hook

### Skill Selection Algorithm (skill-inject)

3-priority selection with 300-token budget:
1. **Error recovery**: Last failed tool (from `tool_result` event)
2. **Recency**: Last 2 tool calls (from `recentToolCalls` list, capped at 8)
3. **Intent prediction**: Keyword matching against `INTENT_MAP`

### Knowledge Selection Algorithm (knowledge-inject)

Scoring: word=1.0, bigram/phrase=2.0. Threshold=2.0. Budget=200 tokens.

---

## 8. Quality & Safety Mechanisms

### Quality Monitor (`quality-monitor`)

Detects 4 failure modes at `turn_end`:
1. **empty_response**: No text, no tool calls
2. **unknown_tool**: Tool name not in known set
3. **repeated_tool_call**: Exact same tool+input as previous turn
4. **malformed_args**: `_raw` sentinel in tool arguments

When detected, queues a correction follow-up (max 2 consecutive corrections).

### Output Parser (`output-parser`)

Detects text-embedded tool calls (fenced ```tool blocks, <tool_call> tags, bare JSON) and nudges model to use native tool calling.

### Browser Extract Retention (`browser-extract-retention`)

Prunes old BrowserExtract results (keeps 2 newest). Replaces pruned entries with URL + evidence summary. Prevents context contamination from raw page text.

### Evidence Preservation (`evidence-compact`)

After compaction, sends bridge message: `"[Preserved evidence from earlier in the conversation follows.] N evidence entr[ies remain] available via EvidenceList and EvidenceGet."`

---

## 9. Tool Execution Flow

### Bash Gating

`permission-gate` extension whitelists safe commands:
```
ls, cat, head, tail, wc, pwd, echo, printf, date, which, type, env, printenv, uname, whoami, id,
git log, git status, git diff, git show, git branch, git remote, git stash list, git tag,
find, grep, rg, ag, fd,
python, python3, node, ruby, perl,
pip show, pip list, npm list, cargo metadata,
df, du, free, top -bn, ps,
curl -I, curl --head
```

Non-whitelisted commands are blocked in "auto" mode.

### Thinking Budget

When thinking tokens exceed budget (default 2048):
1. Abort current turn via `ctx.abort()`
2. Set thinking level to "off"
3. Queue follow-up: `"[thinking budget exceeded] Please commit to an implementation now."`

---

## 10. Session & State Management

### Evidence Store

Per-session in-memory store (`stores` Map). Survives compaction via `evidence-compact` bridge.

### Checkpoint Store

Files backed up before Write/Edit to `~/.bibo/checkpoints/<session>`. First-write-wins per session.

### Browser Session

Per-session Playwright browser instance. Lazy launch on first `BrowserNavigate`. Cleaned up on `session_shutdown`.

---

## 11. Testing

Tests live alongside extensions:
```bash
npm test          # Run all vitest tests
npm run typecheck  # TypeScript type checking
```

Test coverage includes:
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

---

## 13. Permission Gate — How to Add/Modify Bash Commands

The permission gate lives at `.pi/extensions/permission-gate/index.ts`. It maintains a `SAFE_PREFIXES` array — commands starting with any entry in this array are allowed to run in "auto" mode.

### How to add a new tool

1. Create `.pi/extensions/<name>/index.ts`
2. Export default `(pi: ExtensionAPI) => void`
3. Register tools via `pi.registerTool()`
4. Optionally create a skill card in `skills/tools/<name>.md`

### Timer Extension (`.pi/extensions/timer/`)

Provides three tools for temporal tracking:
- **TimeElapsed** — Report session uptime and task durations. Optional label to check time since a specific mark.
- **MarkStart** — Begin tracking a new task/phase with a label.
- **MarkEnd** — Stop tracking the current task and report its duration.

State is per-session (in-memory). Resets on `session_shutdown`.

### How to add a new command

1. Edit `.pi/extensions/permission-gate/index.ts`
2. Add the command prefix to the `SAFE_PREFIXES` array
3. The match is a simple `startsWith` check on the command string

### Current SAFE_PREFIXES

```
date,
ls, cat, head, tail, wc, pwd, echo, printf,
cd, which, type, env, printenv, uname, whoami, id,
readlink, stat, file,
git log, git status, git diff, git show, git branch,
git remote, git stash list, git tag,
find, grep, rg, ag, fd,
python, python3, node, ruby, perl,
pip show, pip list, npm list, cargo metadata,
df, du, free, top -bn, ps,
curl, wget, wget --spider
```

### Permission modes

- **auto** (default): Only whitelisted commands pass
- **manual**: Whitelisted commands still require user confirmation
- **accept-all**: All commands pass (set via `LITTLE_CODER_PERMISSION_MODE=accept-all`)

---

## 15. How to Modify bibo

### Adding a Tool Skill
1. Create `skills/tools/<name>.md` with YAML frontmatter
2. Include `target_tool: <ToolName>` and `token_cost: <N>`
3. Write guidance body

### Adding a Knowledge Entry
1. Create `skills/knowledge/<name>.md` with YAML frontmatter
2. Include `topic`, `keywords: [...]`, `token_cost`
3. Write cheat sheet body

### Adding an Extension
1. Create `.pi/extensions/<name>/index.ts`
2. Export default `(pi: ExtensionAPI) => void`
3. Subscribe to events via `pi.on()`
4. Optionally register tools via `pi.registerTool()`

### Modifying Model Profiles
1. Edit `.pi/settings.json` → `bibo.model_profiles`
2. Or set `LITTLE_CODER_BENCHMARK` for benchmark-specific overrides

### Changing System Prompt
1. Edit `SYSTEM.md` (project-level) or `~/.pi/agent/SYSTEM.md` (global)

---

## 16. Common Pitfalls

- **Write refuses on existing files**: Use Edit with exact old_string/new_string
- **Bash timeout**: Default 30s; set to 120-300 for slow commands
- **Tool names are case-sensitive**: "Read" not "read"
- **Evidence entries are per-session**: Cleared on session_shutdown
- **BrowserExtract results are pruned**: Only 2 newest kept raw
- **Thinking budget aborts mid-stream**: Model gets a correction follow-up
- **Extensions are stateful**: In-memory state persists across turns within a session, but is reset on session switch
