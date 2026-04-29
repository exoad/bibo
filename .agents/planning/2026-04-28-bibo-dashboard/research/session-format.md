# Session File Format Research

## Connections

- [[../idea-honing.md]]

---

## Pi Coding Agent Session Format (v3)

### File Structure

Sessions are stored as JSONL files (one JSON object per line) at:
```
~/.pi/agent/sessions/<project-path>/YYYY-MM-DDTHH-MM-SS-SSSZ_<uuid>.jsonl
```

**First line** — session header:
```json
{"type":"session","version":3,"id":"uuid","timestamp":"ISO8601","cwd":"/path"}
```

### Event Types

The session file contains these event types:

| Type | Description |
|------|-------------|
| `session` | Header/metadata (first line) |
| `model_change` | Model/provider change during session |
| `thinking_level_change` | Thinking level adjustment |
| `message` | User/assistant/tool messages (main content) |

### Message Structure

```json
{
  "type": "message",
  "id": "msg_uuid",
  "parentId": "parent_msg_uuid",
  "timestamp": "ISO8601",
  "message": {
    "role": "user" | "assistant" | "toolResult",
    "content": [
      {"type": "text", "text": "..."},
      {"type": "thinking", "thinking": "...", "thinkingSignature": "reasoning_content"},
      {"type": "toolCall", "name": "ShellSession", "arguments": {...}},
      {"type": "toolCall", "name": "ShellSession", "arguments": {...}}
    ],
    "api": "openai-completions",
    "provider": "jackbox",
    "model": "bibo-qwen3.6",
    "usage": {"input": 6582, "output": 195, "cacheRead": 8192, ...},
    "stopReason": "toolUse",
    "timestamp": 1777416603221
  }
}
```

### Key Fields for Dashboard

- **User messages**: `role === "user"`, `content[].text` — the prompts
- **Assistant messages**: `role === "assistant"`, `content[].text` + `content[].thinking` — responses and reasoning
- **Tool calls**: `content[].toolCall` with `name` and `arguments` — what the agent did
- **Tool results**: `role === "toolResult"` — output from tools
- **Usage data**: `message.usage` — token counts for cost tracking
- **Timestamps**: Both ISO (`message.timestamp`) and epoch (`timestamp` field)
- **Parent IDs**: `parentId` links messages in conversation threads

### JSON Event Stream Mode

Pi also supports `--mode json` for live streaming:
```bash
pi --mode json "Your prompt"
```

Live events include: `agent_start`, `agent_end`, `turn_start`, `turn_end`, `message_start`, `message_update`, `message_end`, `tool_execution_start`, `tool_execution_end`, `compaction_start`, `compaction_end`, `queue_update`, `auto_retry_start`, `auto_retry_end`.

### Session Metadata

- `version`: Always `3`
- `cwd`: Working directory at session start
- `provider`: AI provider (e.g., "jackbox", "anthropic")
- `modelId`: Model used (e.g., "bibo-qwen3.6")
- `thinkingLevel`: "off" | "low" | "medium" | "high"

### File Naming Convention

```
<ISO_TIMESTAMP>_<UUID>.jsonl
```
Example: `2026-04-28T22-49-38-991Z_019dd648-a7af-763f-a000-6076ec6e95e8.jsonl`

### Directory Structure

```
~/.pi/agent/sessions/
  --Users-jmeng--/
  --Users-jmeng-Code-app-src--/
  --Users-jmeng-kibi--/
  --Users-jmeng-kibi-.pi--/
```

Directory names encode the project path with `/` replaced by `--`.
