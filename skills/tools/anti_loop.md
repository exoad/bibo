---
name: anti-loop
description: Anti-loop protocol — what to do when stuck in repeated tool calls
type: tool-guidance
target_tool: META
priority: 1
token_cost: 0
user-invocable: false
---
## Anti-Loop Protocol — READ THIS WHEN STUCK

If you received a correction about repeated tool calls, follow this exactly:

1. **Identify what you tried last.** (e.g., "I called Read on file X")
2. **Do NOT use that tool again.** Pick a completely different tool.
3. **Ask yourself: what information am I missing?** Then pick the tool that gets it.
   - Need to know what files exist? → Glob
   - Need to search file contents? → Grep
   - Need to execute something? → Bash
   - Need to change a file? → Edit (but read first for exact content)
   - Need to create a file? → Write
   - Don't need a tool? → Answer with text

**Rule of thumb:** If you used a tool 2+ times with no progress, switch tools or answer with text.
