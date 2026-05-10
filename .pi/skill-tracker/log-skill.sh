#!/bin/bash
# Quick skill logging wrapper for use within pi sessions
# Usage: source ~/.pi/skill-tracker/log-skill.sh && log_skill <name> [correctness] [notes]

TRACKER_PY="${HOME}/bibo/skills/skill-tracker/tracker.py"

log_skill() {
    local skill="$1"
    local correctness="${2:-unknown}"
    local notes="${3:-}"
    local context="${4:-}"
    
    if [[ -z "$skill" ]]; then
        echo "Usage: log_skill <skill_name> [correctness] [notes] [context]" >&2
        return 1
    fi
    
    python3 "$TRACKER_PY" log --skill "$skill" --correctness "$correctness" --notes "$notes" --context "$context"
}

# Quick aliases for common correctness values
log_skill_proper() {
    log_skill "$1" "proper" "${2:-}" "${3:-}"
}

log_skill_improper() {
    log_skill "$1" "improper" "${2:-}" "${3:-}"
}

log_skill_unknown() {
    log_skill "$1" "unknown" "${2:-}" "${3:-}"
}

# Export functions if sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    export -f log_skill log_skill_proper log_skill_improper log_skill_unknown
fi
