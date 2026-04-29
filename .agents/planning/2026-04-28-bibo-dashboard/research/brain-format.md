# Brain Memory Format Research

## Connections

- [[../idea-honing.md]]
- [[session-format.md]]

---

## brain.jsonl Format

### File Location

```
~/.rho/brain/brain.jsonl
```

### Structure

One JSON object per line. Each entry has:

```json
{
  "type": "learning" | "behavior" | "preference" | "identity" | "user" | "context" | "task" | "reminder",
  "text": "...",
  "created": "ISO8601",
  "id": "hex_id",
  ...type-specific fields
}
```

### Entry Types

| Type | Description | Key Fields |
|------|-------------|------------|
| `learning` | Durable facts/learnings | `text`, `created`, `id` |
| `behavior` | Do/dont/value patterns | `text`, `category` (do/dont/value) |
| `preference` | User preferences | `text`, `category` |
| `identity` | Agent identity | `key`, `value` |
| `user` | User info | `key`, `value` |
| `context` | Project context | `text`, `category`, `path`, `project`, `content` |
| `task` | Tasks | `description`, `status`, `due` |
| `reminder` | Reminders | `text`, `cadence`, `enabled` |

### Current Entries (as of 2026-04-28)

1. **context** (`a6799ebe`): Drosk project memory pointer to vault
2. **learning** (`a4e304f5`): Last consolidation timestamp

### Dashboard Implications

- **Read**: Parse JSONL, group by type, display counts
- **Write**: Append new lines, never edit in-place (append-only)
- **Update**: Brain tool handles updates; dashboard should use brain tool API
- **Types to display**: All types, grouped for browsing
- **Editable fields**: `text` for most types; `category` for behaviors

### Update Mechanism

The brain tool (`brain action=add/update/remove/list`) is the canonical interface. The dashboard should call the brain tool via a local API endpoint rather than editing brain.jsonl directly.
