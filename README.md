# kibi

My personal coding agent — a self-hosted build on [pi](https://github.com/badlogic/pi-mono) and [little-coder](https://github.com/itayinbarr/little-coder), tuned for small local models.

Runs entirely on my hardware — no cloud inference needed.

## My Setup

- **GPU:** NVIDIA V100 (SXM2) 32GB + RTX 3080 (20GB MOD) — expert/attention splitting for MoE inference
- **CPU:** AMD Ryzen 5 7500X3D
- **RAM:** 16GB DDR5
- **Inference:** custom-compiled llama.cpp (not prebuilt — hand-tuned for better performance)

## Quick Start

```bash
git clone <your-repo-url>
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
