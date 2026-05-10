---
name: cleanup-memory
description: Consolidate and clean up existing brain memory. Run this periodically (like a sleep cycle) to dedupe, decay, merge, and relocate memories to vault.
kind: sop
---

# Cleanup Memory

## Overview

Run a "brain sleep cycle" on your existing memories:
1. Consolidate existing memory (dedupe, decay, merge, vault relocation)
2. Mine user sessions since the last consolidation checkpoint
3. Persist a new checkpoint only after a successful run

**When to use:**
- Periodically (e.g., daily or weekly) to keep memory clean
- When brain feels noisy or cluttered
- After extracting many new memories with `extract-memory`

**Difference from extract-memory:**
- `extract-memory` = "What should I remember from *this* conversation?" (captures new)
- `cleanup-memory` = "Clean up my existing memories" (organizes old)

## Parameters

- **brain_path** (default: `~/.rho/brain/brain.jsonl`)
- **mine_sessions** (default: `true`)
- **since** (default: `last_consolidation`) — `last_consolidation | <ISO timestamp> | <duration>`
- **days_fallback** (default: `1`)
- **session_dir** (default: `~/.pi/agent/sessions/`)
- **max_new_entries** (default: `10`)
- **confidence_threshold** (default: `high`)
- **checkpoint_key** (default: `memory_consolidate.last_consolidated_at`)

## Steps

### 1) Inventory

List memory by type and count totals:
- learnings, preferences, behaviors, identity, user, context, tasks, reminders
- total active entries

### 2) Resolve Mining Window

Determine the lower bound timestamp for session mining.

### 3) Session Mining (optional)

Extract durable learnings/preferences from user messages in matched sessions.

**Confidence policy:**
- **High**: explicit user statements/corrections/preferences → auto-add
- **Medium**: strong multi-session inference → add only if threshold is `medium`
- **Low**: ambiguous/one-off/hypothetical → skip

### 4) Decay Stale Learnings

Run `brain action=decay` to age out old entries.

### 5) Consolidate Existing Entries

Identify duplicates/superseded/stale entries and merge candidates.

**Importance levels:**
- 🔴 **High** — durable, high-leverage, keep in brain
- 🟡 **Medium** — useful but optional; review for merge
- 🟢 **Low** — stale/noisy/duplicative; prune or relocate

**Apply the 30-day test:** "Would this change a decision I make 30 days from now?"

**Auto-remove categories:**
- Version numbers or update confirmations
- Heartbeat or check-in status reports
- Benchmark scores or run results
- Bug sweep summaries without root cause
- UI/feature implementation details
- Task completion status
- Project-specific transient state

### 6) Vault Relocation

Move reference-heavy entries to vault (useful knowledge that doesn't need injection every turn):
- Long feature histories / changelog-style learnings
- Architecture rationale
- Multi-step runbooks / troubleshooting notes
- Linked research/reference material

### 7) Persist Checkpoint

Set/update checkpoint timestamp after successful completion.

### 8) Report

Report counts before/after, mining window, added/skipped entries, decayed/removed/merged/relocated counts, vault notes created.

## Usage

Run periodically (suggested: daily or weekly):
```
/skill run cleanup-memory
```

With custom parameters:
```
/skill run cleanup-memory since=7d max_new_entries=5
```

## See Also

- [[extract-memory]] - Capture new learnings from current conversation
- [[vault-clean]] - Clean up orphaned vault notes
