# kibi

Jack's personal coding agent — a self-hosted build on [little-coder](https://github.com/itayinbarr/little-coder), which is itself built on [pi](https://github.com/badlogic/pi-mono).

Optimized for small local language models. Runs entirely on a consumer laptop with no cloud inference.

---

## What is kibi?

kibi is a terminal-based coding agent that uses small local models (like Qwen3.6-35B-A3B or Qwen3.5-9B) to help with software engineering tasks — reading code, writing files, running commands, debugging, and more.

It's built on [pi-coding-agent](https://github.com/badlogic/pi-mono), which provides the agent loop, TUI, session management, and extension model. On top of that, kibi adds a set of small-model-specific adaptations (extensions, skills, prompt templates) that make a 9–10B model significantly more capable than it would be out of the box.

The approach is inspired by [little-coder](https://github.com/itayinbarr/little-coder) by Itay Inbar, which demonstrated that a 9.7B Qwen model can match or beat frontier models on coding benchmarks when the scaffolding is properly tuned to the model's strengths.

## How it relates to pi

[pi](https://pi.dev) is the minimal substrate — agent loop, multi-provider API, TUI, session tree, compaction, extension model. Four built-in tools (`read`, `write`, `edit`, `bash`) and a ~1000-token system prompt.

little-coder is **pi + 16 extensions + 30 skill markdown files + a Python benchmark harness**. kibi is a fork of little-coder with additional extensions and custom tuning.

Everything kibi-specific lives under `.pi/extensions/`, `skills/`, and the project files (`AGENTS.md`, `SYSTEM.md`, `SELF.md`). You can mix kibi with pi packages from anyone else, add your own extensions, or disable ours per-project via `.pi/settings.json`.

## Architecture

```
kibi/
├── .pi/
│   ├── settings.json               # per-model profiles + compaction + retry settings
│   └── extensions/                 # 20 TypeScript extensions, auto-discovered by pi
│       ├── llama-cpp-provider/     # registers llamacpp/* and ollama/* as OpenAI-compat providers
│       ├── write-guard/            # Write refuses on existing files — the whitepaper invariant
│       ├── extra-tools/            # glob, webfetch, websearch (pi ships grep/find)
│       ├── skill-inject/           # per-turn tool-skill selection (error > recency > intent)
│       ├── knowledge-inject/       # algorithm cheat-sheet scoring (word=1.0, bigram=2.0)
│       ├── output-parser/          # repair malformed ```tool, <tool_call>, bare JSON
│       ├── quality-monitor/        # empty / hallucinated / loop detection + correction
│       ├── thinking-budget/        # cap thinking tokens per turn, retry with thinking off
│       ├── permission-gate/        # bash whitelist (ls, cat, git log/status/diff, etc.)
│       ├── checkpoint/             # snapshot files before Write/Edit
│       ├── tool-gating/            # enforces _allowed_tools at exec + schema levels
│       ├── turn-cap/               # max_turns abort (unbounded by default)
│       ├── benchmark-profiles/     # reads settings.json → systemPromptOptions
│       ├── shell-session/          # ShellSession — tmux-proxy + subprocess backends
│       ├── browser/                # Playwright BrowserNavigate/Click/Type/Scroll/Extract
│       ├── browser-extract-retention/ # preserves browser extract across compaction
│       ├── evidence/               # EvidenceAdd/Get/List — per-session store, 1 KB cap
│       ├── evidence-compact/       # preserves evidence across pi's auto-compaction
│       ├── breathing-border/       # animated TUI border (visual flair)
│       ├── timer/                  # session timer extension
│       └── hello/                  # greeting extension
├── skills/                         # markdown files the extensions inject on demand
│   ├── tools/*.md                  # tool-usage cards
│   ├── knowledge/*.md              # algorithm cheat sheets
│   └── protocols/*.md              # research/cite/decomposition workflows
├── AGENTS.md                       # project system prompt (pi discovers it automatically)
├── SYSTEM.md                       # extended system prompt (replaces default)
├── SELF.md                         # living document of kibi's internals
├── models.json                     # documented provider registration
├── Memory/                         # pre-built technical summaries for projects
└── package.json                    # dependencies: pi-coding-agent, TypeBox, Playwright
```

**Key invariant.** pi is a minimal base by design. Every kibi mechanism ships as a pi extension that hooks pi's lifecycle events (`before_agent_start`, `context`, `before_provider_request`, `tool_call`, `tool_result`, `turn_end`, `session_compact`). Extensions are independent and can be enabled/disabled per deployment via `.pi/settings.json`. If you don't want one, delete its directory or disable it in settings; if you want to add another, drop it next to the existing ones.

## Setup

### What you'll need

- **Node.js 20+** — for pi's runtime. `node --version`.
- **Either a local model** (llama.cpp or Ollama on your machine) **or an API key** for any pi-supported cloud provider (Anthropic, OpenAI, Google, Groq, Cerebras, Mistral, xAI, …).

### Step 1 — Clone and install

```bash
git clone <your-repo-url>
cd kibi
npm install
```

`npm install` pulls pi (`@mariozechner/pi-coding-agent`) and the small TypeBox schema helper.

### Step 2 — Serve a model (or add a key)

**Option A — llama.cpp** (fastest for local; supports Qwen3.6-35B-A3B MoE):

```bash
# One-time: build llama.cpp with CUDA
# (see https://github.com/ggml-org/llama.cpp for build instructions)
git clone https://github.com/ggml-org/llama.cpp && cd llama.cpp
cmake -B build -DGGML_CUDA=ON -DCMAKE_CUDA_ARCHITECTURES=120 -DLLAMA_CURL=ON
cmake --build build --config Release -j

# Fetch a GGUF
pip install -U "huggingface_hub[cli]"
hf download unsloth/Qwen3.6-35B-A3B-GGUF Qwen3.6-35B-A3B-UD-Q4_K_M.gguf --local-dir ~/models

# Serve it (MoE trick: experts in RAM, attention on GPU → 22 GB model on 8 GB VRAM)
build/bin/llama-server -m ~/models/Qwen3.6-35B-A3B-UD-Q4_K_M.gguf \
   --host 127.0.0.1 --port 8888 --jinja \
   -c 16384 -ngl 99 --n-cpu-moe 999 --flash-attn on
```

**Option B — Ollama** (simpler, but slower on MoE):

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen3.5        # 9.7B
# or: ollama pull qwen3.6-35b-a3b
```

**Option C — a cloud provider.** Set the provider's key (`ANTHROPIC_API_KEY`, `OPENAI_API_KEY`, etc.) and pi will discover it. All small-model-specific extensions auto-disable for large/cloud models so they don't interfere.

### Step 3 — Run

```bash
# Interactive TUI
./node_modules/.bin/pi --model llamacpp/qwen3.6-35b-a3b

# Single prompt, exit
./node_modules/.bin/pi -p "read README.md and summarize" --model llamacpp/qwen3.6-35b-a3b

# Any pi-supported cloud model works too
./node_modules/.bin/pi --model anthropic/claude-opus-4-5
```

For local providers pi still wants **some** value in the API-key env — anything is fine since llama.cpp/Ollama ignore it:

```bash
export LLAMACPP_API_KEY=noop
export OLLAMA_API_KEY=noop
```

`LLAMACPP_BASE_URL` and `OLLAMA_BASE_URL` override the defaults (`http://127.0.0.1:8888/v1`, `http://127.0.0.1:11434/v1`).

## Customization

### Extensions

kibi ships with 20 extensions under `.pi/extensions/`. Each one is independent:

| Extension | Purpose |
|-----------|---------|
| `llama-cpp-provider` | Registers `llamacpp/*` and `ollama/*` as OpenAI-compatible providers |
| `write-guard` | Write refuses on existing files (prevents accidental overwrites) |
| `skill-inject` | Per-turn tool-skill selection (error recovery > recency > intent matching) |
| `knowledge-inject` | Algorithm cheat-sheet scoring (keyword + bigram matching) |
| `output-parser` | Repairs malformed tool calls, XML tags, bare JSON |
| `quality-monitor` | Detects empty / hallucinated / loop responses + correction follow-ups |
| `thinking-budget` | Caps thinking tokens per turn, retries with thinking off if over budget |
| `permission-gate` | Whitelists bash commands (ls, cat, git log/status/diff, etc.) |
| `checkpoint` | Snapshots files before Write/Edit operations |
| `tool-gating` | Enforces `_allowed_tools` at exec + schema levels |
| `turn-cap` | Max turns abort for unbounded sessions |
| `benchmark-profiles` | Reads settings.json → systemPromptOptions + sets temperature |
| `shell-session` | ShellSession with tmux-proxy + subprocess backends |
| `browser` | Playwright-based browser tools (Navigate, Click, Type, Scroll, Extract) |
| `browser-extract-retention` | Preserves browser extract content across compaction |
| `evidence` | EvidenceAdd/Get/List — per-session store with 1 KB snippet cap |
| `evidence-compact` | Preserves evidence entries across pi's auto-compaction |
| `breathing-border` | Animated TUI border for visual flair |
| `timer` | Session timer extension |

To disable an extension, remove its directory or disable it in `.pi/settings.json`. To add one, drop a new TypeScript module next to the existing ones.

### Skills

kibi includes skill markdown files that extensions inject on demand:

- **Tool-usage cards** — context about how to use each tool (parallel calls, error recovery, etc.)
- **Algorithm cheat sheets** — targeted reference for common patterns (verification, security, planning)
- **Protocol docs** — research/cite/decomposition workflows

Skills are auto-discovered from `.pi/skills/` and `skills/`. They can be disabled with `--no-skills`.

### Context Files

kibi uses three system prompt files:

- **`AGENTS.md`** — project instructions, conventions, communication style, self-reference protocol
- **`SYSTEM.md`** — extended system prompt (replaces pi's default ~1000-token prompt)
- **`SELF.md`** — living document of kibi's internals (extensions, skills, settings, architecture)

All three are loaded automatically by pi at startup.

## Settings

Per-project settings live in `.pi/settings.json`. Key options:

```json
{
  "compaction": { "enabled": true },
  "retry": { "enabled": true, "maxRetries": 2 },
  "kibi": {
    "default_model_profile": {
      "context_limit": 131072,
      "max_tokens": 4096,
      "thinking_budget": 2048,
      "skill_token_budget": 300,
      "knowledge_token_budget": 200,
      "system_prompt_budget": 0,
      "max_retries": 1,
      "temperature": 0.3
    }
  }
}
```

See [pi settings docs](https://pi.dev/docs/settings) for all options.

## Troubleshooting

**`pi: command not found`** — use `./node_modules/.bin/pi` from the repo root or `npx pi`.

**`ECONNREFUSED 127.0.0.1:8888`** — llama.cpp isn't running. Start `llama-server` first, or switch `--model` to an Ollama/cloud ID.

**No API key env var warning** — pi expects *some* key even for local providers. Export `LLAMACPP_API_KEY=noop` (or `OLLAMA_API_KEY=noop`) before launching.

**Extension load failures on startup** — run `./node_modules/.bin/pi --list-models` with `--verbose`. Common cause: deleted `node_modules` (re-run `npm install`).

## Attribution

kibi is a fork of [little-coder](https://github.com/itayinbarr/little-coder) by Itay Inbar, which is itself built on [pi](https://github.com/badlogic/pi-mono) by Mario Zechner.

- **pi** — Apache 2.0 / MIT. Agent loop, provider abstraction, TUI, extension model.
- **little-coder** — Apache 2.0. Small-model adaptations, benchmark harness, skill/knowledge injection.

All kibi-specific mechanisms — Write-vs-Edit invariant, skill/knowledge injection, thinking-budget cap, output-parser, quality-monitor, per-model profiles, ShellSession, Browser, Evidence tool families, evidence-aware compaction — are derived from little-coder with additional extensions and custom tuning.
