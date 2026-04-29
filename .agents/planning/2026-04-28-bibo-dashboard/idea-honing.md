# Idea Honing — Requirements Clarification

## Connections

- [[rough-idea.md]]

---

## Clarification Questions

<!-- Questions will be appended here during the clarification process -->

---

## Research Summary (Completed)

Research has been conducted on all 5 topics:

1. **Session file format** — Pi sessions are JSONL v3 with structured events (session header, model_change, thinking_level_change, message). Messages contain role, content (text, thinking, toolCall), usage data, timestamps. Sessions stored in `~/.pi/agent/sessions/<project>/YYYY-MM-DDTHH-MM-SS-SSSZ_<uuid>.jsonl`.

2. **Brain memory format** — `~/.rho/brain/brain.jsonl` stores entries as JSONL with types: learning, behavior, preference, identity, user, context, task, reminder. Each has id, text, created timestamp. Update via brain tool API.

3. **Vault note format** — Markdown files with YAML frontmatter (name, slug, type, source). Types: concept, reference, pattern, project, log, moc. Stored in `~/.rho/vault/` with subdirectories. Accessed via vault tool.

4. **Existing dashboard patterns** — ccboard (Rust, multi-agent), CodeDash (zero-dep Node.js, single HTML page). Common patterns: REST API, polling-based updates, client-side search, inlined CSS/JS, no build step.

5. **Technical architecture** — Recommended: zero-dependency Node.js server + single HTML page with inlined CSS/JS. Polling every 5-10s for real-time status. Dashboard is a skill that launches a local HTTP server.

**Key decisions from research:**
- Zero npm dependencies (like CodeDash)
- Single HTML page, no build step
- REST API for data access
- Polling-based real-time updates
- Self-contained skill that runs bibo's own data
- Direct file reads for sessions/brain/vault
- pi tool calls for quests/skills/config
