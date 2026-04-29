<div align="center">

<img src="./icon.png" width=82/>

# bibo

*A coding agent for local models on consumer hardware*

Fortified with industry-grade system prompts from Claude & OpenCode

</div>

<div align="center">

<img src="./sc.png" height=300/>

</div>

## My Server

- **GPU 1:** NVIDIA V100 SXM2 (w/ PCIe Adaptor) 32GB for attention layers
- **GPU 2:** NVIDIA RTX 3080 (20GB MOD) for MoE expert layers
- **CPU:** AMD Ryzen 5 7500X3D
- **RAM:** 16GB DDR5 (The X3D suffices for RAM shortage and single channel implications D:)

Currently running Qwen-3.6-35B-A3B Q5 with llama.cpp.

> Also compile llama.cpp yourself for better custom tailoring!

## Quick Start

```bash
git clone https://github.com/exoad/bibo.git
cd bibo
npm install
```

### Configure the Model

Bibo connects to a model via environment variables — **not** via `models.json`. The `llama-cpp-provider` extension reads these at startup:

| Variable | Purpose | Default |
|----------|---------|---------|
| `LLAMACPP_BASE_URL` | Model server endpoint | `http://127.0.0.1:6969/v1` |
| `LLAMACPP_API_KEY` | API key (if required) | `noop` |

**Local llama.cpp** (running on this machine):
```bash
export LLAMACPP_BASE_URL="http://127.0.0.1:6969/v1"
export LLAMACPP_API_KEY="noop"
```

**Remote server** (your own model host):
```bash
export LLAMACPP_BASE_URL="http://<your-server-ip>:6969/v1"
export LLAMACPP_API_KEY="noop"   # or your actual API key
```

> [!TIP]
> Add the exports to your `~/.zshrc` (or `~/.bashrc`) to persist across sessions.
> Alternatively, put them in `~/bibo/.env` and source it:
> ```bash
> if [ -f ~/bibo/.env ]; then set -a; source ~/bibo/.env; set +a; fi
> ```

### Run

```bash
./bin/bibo.sh
```

> [!NOTE]
> Environment variables must be set **before** launching. The launcher passes `process.env` directly to pi.

#### Dashboard

Bibo includes a web-based dashboard that shows sessions, brain memory, vault notes, and quests in real-time.

```bash
bibo                    # Start with dashboard
bibo "your prompt"      # Start with a specific prompt
```

The dashboard runs on `http://127.0.0.1:3000` and auto-starts when you run `bibo`.

#### Global Alias

To use `bibo` from anywhere, add this to your `~/.zshrc` (or equivalent shell config):

```bash
alias bibo='~/bibo/bin/bibo.sh'
```

On Windows, use:

```cmd
doskey bibo=C:\bibo\bin\bibo.cmd $*
```

## Setup

### Model Provider Configuration

The `llama-cpp-provider` extension (`.pi/extensions/llama-cpp-provider/index.ts`) registers the `jackbox` provider at startup using environment variables:

```typescript
const LLAMACPP_BASE_URL = process.env.LLAMACPP_BASE_URL || "http://127.0.0.1:6969/v1";
const LLAMACPP_API_KEY = process.env.LLAMACPP_API_KEY || "noop";
```

It also registers an `ollama` provider with the same pattern (`OLLAMA_BASE_URL`, `OLLAMA_API_KEY`).

### Environment Variables

Set these before running bibo:

- **`LLAMACPP_BASE_URL`** — llama.cpp OpenAI-compatible endpoint
- **`LLAMACPP_API_KEY`** — API key (leave as `noop` if no auth)
- **`OLLAMA_BASE_URL`** — Ollama endpoint (default: `http://127.0.0.1:11434/v1`)
- **`OLLAMA_API_KEY`** — Ollama API key (default: `noop`)

### Per-Project Config

You can keep env vars in `~/bibo/.env` and auto-source them. The launcher inherits all environment variables, so no extra config is needed.

### pi Settings

See `.pi/settings.json` for model profiles, compaction, and retry settings.

## Structure

| Path | Purpose |
|------|---------|
| `bin/` | Cross-platform bibo launcher (macOS/Linux/Windows) |
| `dashboard/` | Web dashboard for sessions, brain, vault, and quests |
| `.pi/extensions/` | 20 TypeScript extensions (auto-discovered) |
| `skills/` | Markdown cheat sheets injected on demand |
| `AGENTS.md` | Project system prompt |
| `SYSTEM.md` | Extended system prompt |
| `SELF.md` | Internal architecture reference |
| `.pi/settings.json` | Per-model profiles, compaction, retry settings |

## Custom Extensions & Skills

**Local extensions** (`.pi/extensions/`):
- `benchmark-profiles` - profiling benchmarks
- `breathing-border` - animated chatbox border
- `browser` - browser extraction
- `browser-extract-retention` - retention-aware extraction
- `checkpoint` - session checkpointing
- `context-mode` - context management (inlined from npm)
- `cost-tracker` - fake cost counter
- `evidence` - evidence collection
- `evidence-compact` - compact evidence bridge
- `extra-tools` - additional tool integrations
- `hello` - greeting widget
- `knowledge-inject` - knowledge injection
- `llama-cpp-provider` - llama.cpp model provider
- `output-parser` - structured output parsing
- `permission-gate` - tool permission gating
- `quality-monitor` - repeated tool call detection
- `shell-session` - persistent shell sessions
- `skill-inject` - skill injection
- `thinking-budget` - thinking token budget
- `timer` - session timer
- `tool-gating` - tool access control
- `turn-cap` - turn limiting
- `write-guard` - write operation protection

**NPM packages** (`.pi/settings.json`):
- `@feniix/pi-code-reasoning` - code reasoning
- `pi-gsd` - GSD workflow system
- `pi-web-access` - web search/fetch
- `pi-markdown-preview` - markdown preview
- `@rhobot-dev/rho` - rho agent framework
- `pi-token-burden` - token budgeting
- `@feniix/pi-statusline` - statusline widget
- `pi-review-loop` - automated code review
- `pi-quests` - quest/task management
- `pi-tool-display` - tool display
- `pi-mermaid` - mermaid diagrams
- `pi-rtk-optimizer` - RTK optimizer

## Customization

- **Extensions** - each under `.pi/extensions/<name>/`. Disable by removing the directory or editing `.pi/settings.json`. Add your own as a TypeScript module.
- **Skills** - auto-discovered from `.pi/skills/` and `skills/`. Disable with `--no-skills`.
- **Settings** - see [pi settings docs](https://pi.dev/docs/settings).

## Attribution

Fork of [little-coder](https://github.com/itayinbarr/little-coder) → built on [pi](https://github.com/badlogic/pi-mono).
- **pi** - Apache 2.0 / MIT
- **little-coder** - Apache 2.0
