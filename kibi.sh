#!/usr/bin/env bash
set -e

export LLAMACPP_API_KEY="${LLAMACPP_API_KEY:-noop}"

exec ./node_modules/.bin/pi "$@"
