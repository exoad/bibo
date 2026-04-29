#!/usr/bin/env bash
# Bibo - Cross-platform launcher for pi-coding-agent with dashboard
# Usage: bibo [prompt]
# Works on macOS, Linux, and Windows (via Git Bash/WSL)

set -e

# Resolve the directory where this script lives
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Launch the Node.js bibo launcher
exec node "$SCRIPT_DIR/bibo" "$@"
