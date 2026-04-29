#!/usr/bin/env bash
# start_qwen_big.sh — Start llama.cpp server tuned for small models (Qwen 3.6B–7B)
# to avoid repeated tool-call loops and improve reasoning quality.
#
# Small models (≤7B) have limited context utilization and tend to get stuck
# repeating the same tool calls. This script applies multiple mitigations:
#   • Higher temperature + top_p for diversity
#   • Penalty for repeated tokens/commands
#   • Reduced context window to force focused reasoning
#   • Explicit Mirostat tuning for stable generation
#
# Usage:
#   ./start_qwen_big.sh [path_to_model.gguf] [port]
#
# Defaults:
#   model = Models/bibo-qwen3.6.Q4_K_M.gguf
#   port  = 6969

set -euo pipefail

MODEL="${1:-Models/bibo-qwen3.6.Q4_K_M.gguf}"
PORT="${2:-6969}"

# ── Path to llama.cpp server ───────────────────────────────────────────
# Adjust this path to match your build location.
LLAMA_SERVER="server"
if ! command -v "$LLAMA_SERVER" &>/dev/null; then
  LLAMA_SERVER="./llama-server"
fi
if ! command -v "$LLAMA_SERVER" &>/dev/null; then
  echo "ERROR: llama-server not found. Install or set LLAMA_SERVER env var." >&2
  exit 1
fi

echo "=== bibo Qwen Big Model Server ==="
echo "Model : $MODEL"
echo "Port  : $PORT"
echo ""

# ── Temperature & diversity ────────────────────────────────────────────
# Higher temperature prevents the model from getting stuck in deterministic
# loops. Small models benefit from more randomness.
TEMP=0.6          # bibo default is 0.3 — bump for more variety
TOP_P=0.95        # allow broader token distribution
MIN_P=0.05        # cut very low-probability tokens (faster, less noise)

# ── Repetition penalties ───────────────────────────────────────────────
# Penalize repeated sequences. This is the #1 fix for loop behavior.
REPETITION_PENALTY=1.15   # >1.0 penalizes repetition
REPETITION_PENALTY_FREQ=0.0
REPETITION_PENALTY_PRESENCE=0.0
REPETITION_PENALTY_SKIP_PATTERNS="tool_call"  # custom pattern hint

# ── Mirostat for stable generation ─────────────────────────────────────
# Mirostat2 keeps perplexity in check without manual temperature tuning.
# Uncomment if your llama.cpp build supports it.
# MIRASTAT=1
# MIRASTAT_TAU=1.5
# MIRASTAT_ALPHA=0.5

# ── Context & speed ────────────────────────────────────────────────────
# Smaller context forces the model to focus. 4K tokens is enough for
# most tool-call turns and prevents context dilution.
CONTEXT_SIZE=4096
NUM_BATCH=512
NUM_THREADS=$(nproc 2>/dev/null || echo 4)
NUM_GPU_LAYERS=0   # 0 = CPU, set >0 if you have CUDA/Metal

# ── KV cache precision ─────────────────────────────────────────────────
# f16 is fine for Qwen. q4_0 can cause reasoning degradation.
KV_CACHE_TYPE=f16

# ── Build the command ──────────────────────────────────────────────────
exec "$LLAMA_SERVER" \
  --model "$MODEL" \
  --host 0.0.0.0 \
  --port "$PORT" \
  --ctx-size "$CONTEXT_SIZE" \
  --batch-size "$NUM_BATCH" \
  -t "$NUM_THREADS" \
  -ngl "$NUM_GPU_LAYERS" \
  --temp "$TEMP" \
  --top-p "$TOP_P" \
  --min-p "$MIN_P" \
  --repeat-penalty "$REPETITION_PENALTY" \
  --rope-scaling factor=1.0 \
  --vocab-type default \
  --log-keep-alive-ms 30000 \
  --embedding \
  --mlock \
  "$@"
