# kibi

My personal coding agent tuned for local models that runs on consumer grade hardware.

## My Server

Very frankenstein

- **GPU 1:** NVIDIA V100 SXM2 (w/ PCIe Adaptor) 32GB for attention layers (bought off eBay)
- **GPU 2:** RTX 3080 (20GB MOD) for MoE expert layers (bought off eBay)
- **CPU:** AMD Ryzen 5 7500X3D
- **RAM:** 16GB DDR5 (The X3D suffices for RAM shortage and single channel implications D:)

> Also compile llama.cpp yourself for better custom tailoring!

## Quick Start

```bash
git clone https://github.com/exoad/kibi.git
cd kibi
npm install
```

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
