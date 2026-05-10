#!/bin/bash
# Skill Tracker Library
# Helper functions for logging and querying skill usage

TRACKER_DIR="${HOME}/bibo/.pi/skill-tracker"
DATA_FILE="${TRACKER_DIR}/usage.jsonl"
CONFIG_FILE="${TRACKER_DIR}/config.json"

# Ensure data file exists
ensure_data_file() {
    mkdir -p "$TRACKER_DIR"
    if [[ ! -f "$DATA_FILE" ]]; then
        touch "$DATA_FILE"
    fi
}

# Generate a short UUID
short_uuid() {
    uuidgen 2>/dev/null | cut -c1-8 || date +%s%N | md5 | cut -c1-8
}

# Log a skill usage
# Usage: log_skill_usage <skill_name> [correctness] [notes] [trigger_source]
log_skill_usage() {
    local skill_name="$1"
    local correctness="${2:-unknown}"
    local notes="${3:-}"
    local trigger_source="${4:-/skill}"
    local session_id="${PI_SESSION_ID:-$(date +%s)}"
    
    ensure_data_file
    
    local id=$(short_uuid)
    local timestamp=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
    
    # Escape notes for JSON
    notes=$(echo "$notes" | sed 's/"/\\"/g' | tr '\n' ' ')
    
    local entry="{\"id\":\"$id\",\"skill_name\":\"$skill_name\",\"timestamp\":\"$timestamp\",\"trigger_source\":\"$trigger_source\",\"correctness\":\"$correctness\",\"notes\":\"$notes\",\"session_id\":\"$session_id\"}"
    
    echo "$entry" >> "$DATA_FILE"
    echo "Logged: $skill_name ($correctness)"
}

# Get usage stats for a skill
get_skill_stats() {
    local skill_name="$1"
    
    if [[ ! -f "$DATA_FILE" ]]; then
        echo "0 0 0"
        return
    fi
    
    local total=$(grep "\"skill_name\":\"$skill_name\"" "$DATA_FILE" 2>/dev/null | wc -l)
    local proper=$(grep "\"skill_name\":\"$skill_name\"" "$DATA_FILE" 2>/dev/null | grep "\"correctness\":\"proper\"" | wc -l)
    local improper=$(grep "\"skill_name\":\"$skill_name\"" "$DATA_FILE" 2>/dev/null | grep "\"correctness\":\"improper\"" | wc -l)
    
    echo "$total $proper $improper"
}

# List all unique skills that have been used
get_used_skills() {
    if [[ ! -f "$DATA_FILE" ]]; then
        return
    fi
    
    grep -o '"skill_name":"[^"]*"' "$DATA_FILE" 2>/dev/null | sed 's/"skill_name":"//;s/"$//' | sort -u
}

# Get recent entries needing review (unknown correctness)
get_needing_review() {
    local limit="${1:-10}"
    
    if [[ ! -f "$DATA_FILE" ]]; then
        return
    fi
    
    grep '"correctness":"unknown"' "$DATA_FILE" 2>/dev/null | tail -n "$limit"
}

# Calculate proper usage rate
get_proper_rate() {
    local skill_name="$1"
    read total proper improper <<< "$(get_skill_stats "$skill_name")"
    
    if [[ $total -eq 0 ]]; then
        echo "N/A"
        return
    fi
    
    local rate=$(( proper * 100 / total ))
    echo "${rate}%"
}

# Export functions if sourced
if [[ "${BASH_SOURCE[0]}" != "${0}" ]]; then
    export -f log_skill_usage get_skill_stats get_used_skills get_needing_review get_proper_rate ensure_data_file
fi
