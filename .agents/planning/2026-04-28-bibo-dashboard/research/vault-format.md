# Vault Note Format Research

## Connections

- [[../idea-honing.md]]
- [[session-format.md]]
- [[brain-format.md]]

---

## Vault Structure

### File Location

```
~/.rho/vault/
  _inbox.md
  _index.md
  concepts/
  log/
  patterns/
  projects/
  references/
```

### Note Format

Each note is a markdown file with:

```markdown
---
name: <display name>
slug: <kebab-case-filename>
type: concept | reference | pattern | project | log | moc
source: <optional>
created: <optional>
updated: <optional>
---

## Title

Content...

## Connections

- [[wikilink-to-other-note]]
```

### Note Types

| Type | Purpose |
|------|---------|
| `concept` | Ideas, explanations |
| `reference` | How-to, documentation |
| `pattern` | Reusable solutions |
| `project` | Project descriptions |
| `log` | Chronological entries |
| `moc` | Map of content (index notes) |

### Current Notes (as of 2026-04-28)

1. **_inbox** (unknown) — Inbox items
2. **_index** (moc) — Vault index
3. **drosk** (project) — Drosk desktop app memory
4. **memory-format** (reference) — Memory format spec

### Dashboard Implications

- **Read**: Parse frontmatter + markdown content
- **Search**: FTS5 full-text search (via vault tool), grep fallback
- **Display**: Show note content with wikilink rendering
- **Edit**: Use vault tool (write/read/search), not direct file editing
- **Wikilinks**: `[[slug]]` format — resolve to note slugs

### Vault Tool API

The vault tool supports: `capture`, `read`, `write`, `status`, `list`, `search`

The dashboard should call the vault tool via a local API endpoint rather than direct file access.
