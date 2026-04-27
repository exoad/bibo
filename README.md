# kibi

A self-hosted coding agent optimized for small local models. Runs entirely on consumer-grade hardware — no cloud inference needed.

Built on [pi](https://github.com/badlogic/pi-mono) and [little-coder](https://github.com/itayinbarr/little-coder), with small-model-specific extensions and prompt tuning.

Optimized for dual-GPU setups (e.g. NVIDIA V100 32GB + RTX 3080 20GB), leveraging expert/attention splitting for efficient MoE inference.

## Quick Start

```bash
git clone <your-repo-url>
cd kibi
npm install
```

### Serve a model

**llama.cpp** (recommended):
```bash
# Build llama.cpp, download a GGUF, then serve:
build/bin/llama-server -m ~/models/qwen.gguf --host 127.0.0.1 --port 8888 --jinja
```

**Ollama** (simpler):
```bash
ollama pull qwen3.5
```

**Cloud** — set any provider's API key and use `--model provider/name`.

### Run

```bash
export LLAMACPP_API_KEY=noop   # or OLLAMA_API_KEY=noop

# Interactive TUI
./node_modules/.bin/pi --model llamacpp/qwen3.5

# Single prompt
./node_modules/.bin/pi -p "read README.md and summarize" --model llamacpp/qwen3.5
```

## Structure

| Path | Purpose |
|------|---------|
| `.pi/extensions/` | 20 TypeScript extensions (auto-discovered) |
| `skills/` | Markdown cheat sheets injected on demand |
| `AGENTS.md` | Project system prompt |
| `SYSTEM.md` | Extended system prompt |
| `SELF.md` | Internal architecture reference |
| `.pi/settings.json` | Per-model profiles, compaction, retry settings |

## Customization

- **Extensions** — each under `.pi/extensions/<name>/`. Disable by removing the directory or editing `.pi/settings.json`. Add your own as a TypeScript module.
- **Skills** — auto-discovered from `.pi/skills/` and `skills/`. Disable with `--no-skills`.
- **Settings** — see [pi settings docs](https://pi.dev/docs/settings).

## Attribution

Fork of [little-coder](https://github.com/itayinbarr/little-coder) → built on [pi](https://github.com/badlogic/pi-mono).
- **pi** — Apache 2.0 / MIT
- **little-coder** — Apache 2.0
