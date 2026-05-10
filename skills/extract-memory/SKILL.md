---
name: extract-memory
description: Extract durable learnings and preferences from the current conversation for memory capture. Use this after a conversation to capture what should be remembered.
kind: sop
---

# Extract Memory

## Overview

Extract durable learnings and user preferences from a conversation that will remain useful across future sessions. This is the **extraction phase** of memory management - run this after conversations to capture what matters.

**When to use:**
- After a substantial conversation with decisions, corrections, or preferences
- When you want to capture what was learned from this specific session
- Before running `cleanup-memory` (which organizes existing memories)

**Difference from cleanup-memory:**
- `extract-memory` = "What should I remember from *this* conversation?" (captures new)
- `cleanup-memory` = "Clean up my existing memories" (organizes old)

## Parameters

- **conversation** (required): The serialized conversation text to extract from
- **existing_memories** (optional): Already-stored memories to avoid duplicating

## Steps

### 1. Classify Conversation Content

Scan the conversation and classify each substantive exchange:

**Extractable:**
- Final decisions (user confirmed or explicitly chose something)
- Corrections (user said "no, do X instead" or "that's wrong")
- Stated preferences ("I prefer X", "always do Y", "don't use Z")
- Discovered facts about environment, tools, or APIs that were verified
- Patterns that were tested and confirmed working
- Bug fixes with root causes identified

**Not extractable:**
- Intermediate discussion before a decision was reached
- Options considered but rejected
- Transient states ("GitHub is down right now")
- Obvious facts any model would know
- One-off task details ("fix the bug on line 42")
- Anything the user explored but didn't commit to
- Version numbers, heartbeat reports, benchmark scores
- Task completion status, UI/feature implementation details

### 2. Check Against Existing Memories

Compare candidates against existing memories to avoid duplicates.

### 3. Draft Extractions

Write concise, actionable memory entries (under 200 characters).

**Good:** "Use printf '%s' instead of echo for piping to jq — echo adds trailing newline"
**Bad:** "User prefers better approaches"

### 4. Categorize

Assign type and category:
- **Learning types:** Corrections, discovered patterns, environment facts, bug root causes
- **Preference categories:** Communication, Code, Tools, Workflow, General

## Output Format

```json
{
  "learnings": [
    {"text": "concise, actionable learning statement"}
  ],
  "preferences": [
    {"category": "Communication|Code|Tools|Workflow|General", "text": "concise preference statement"}
  ]
}
```

## Examples

**Good extraction (decision):**
```json
{"learnings": [{"text": "Rho tmux config at ~/.rho/tmux.conf is now the active ~/.tmux.conf"}]}
```

**Good extraction (preference):**
```json
{"preferences": [{"category": "Communication", "text": "X post voice: understated, self-aware, dry"}]}
```

**Correct output (nothing to extract):**
```json
{"learnings": [], "preferences": []}
```

## Next Steps

After extracting memories, consider running `cleanup-memory` periodically to organize and prune your brain storage.

## See Also

- [[cleanup-memory]] - Organize existing memories
