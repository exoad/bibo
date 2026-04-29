# Technical Architecture Research

## Connections

- [[../idea-honing.md]]
- [[session-format.md]]
- [[brain-format.md]]
- [[vault-format.md]]
- [[dashboard-patterns.md]]

---

## Architecture Options

### Option A: Zero-Dependency Node.js (Recommended)

**Like CodeDash approach**

```
bibo-dashboard/
  bin/cli.js          # CLI entry: bibo-dashboard launch/show/stop
  src/
    server.js         # HTTP server + API routes
    data.js           # Data layer: sessions, brain, vault, quests
    html.js           # HTML assembly (inject CSS+JS)
    frontend/
      index.html      # HTML template with {{STYLES}}/{{SCRIPT}} placeholders
      styles.css      # All CSS (dark theme, responsive)
      app.js          # All frontend logic (plain JS)
```

**Pros**:
- No npm install needed — works anywhere Node.js is available
- Single process, minimal memory
- Easy to debug (curl the API)
- Bibo can read/write data directly (same filesystem access)

**Cons**:
- More manual work for features
- No framework helpers

### Option B: Lightweight Framework

**Express/Fastify + minimal frontend**

```
bibo-dashboard/
  package.json        # Express + 1-2 deps
  src/
    server.js         # Express app + routes
    routes/
      sessions.js
      brain.js
      vault.js
      quests.js
    frontend/
      index.html
      styles.css
      app.js
```

**Pros**:
- Cleaner routing, middleware
- Easier to extend

**Cons**:
- Requires `npm install` (or bundling dependencies)
- Slightly heavier

### Option C: Bun Runtime

**Use Bun instead of Node.js**

```
bibo-dashboard/
  src/
    server.ts         # TypeScript, Bun.serve()
    data.ts
    frontend/
      index.html
      styles.css
      app.ts          # TypeScript frontend
```

**Pros**:
- TypeScript out of the box
- Built-in WebSocket support
- Faster startup

**Cons**:
- Requires Bun installed
- Less universal than Node.js

## Recommended Approach

**Option A** — zero-dependency Node.js, following the CodeDash pattern.

### Server Architecture

```
HTTP Server (port 3000)
  ├── GET  /                      # Dashboard HTML
  ├── GET  /api/sessions          # List sessions
  ├── GET  /api/session/:id       # Full session data
  ├── GET  /api/brain             # Brain entries (grouped by type)
  ├── GET  /api/vault             # Vault notes
  ├── GET  /api/quests            # Active quests
  ├── GET  /api/status            # Bibo's current state (model, thinking level, etc.)
  ├── GET  /api/skills            # Loaded skills
  ├── POST /api/quest/complete    # Mark quest done
  ├── POST /api/skill/trigger     # Trigger a skill
  ├── GET  /api/config            # Current config
  └── GET  /api/health            # Health check
```

### Data Sources

| Data | Source | Read Method |
|------|--------|-------------|
| Sessions | `~/.pi/agent/sessions/` | Parse JSONL files |
| Brain | `~/.rho/brain/brain.jsonl` | Parse JSONL |
| Vault | `~/.rho/vault/` | Read markdown files |
| Quests | Quest system | Via pi tool calls |
| Status | pi-coding-agent | Via pi tool calls |
| Skills | `~/.pi/npm/node_modules/@rhobot-dev/rho/skills/` | Read SKILL.md files |

### Frontend Architecture

**Single page, three-panel layout:**

```
┌─────────────────────────────────────────────────────┐
│ Header: Bibo Dashboard | Model: bibo-qwen3.6 | ⏱️  │
├──────────┬──────────────────────────────────────────┤
│ Sidebar  │ Main Content Area                        │
│          │                                          │
│ • Sessions│  [Dynamic content based on selection]   │
│ • Brain   │                                          │
│ • Vault   │                                          │
│ • Quests  │                                          │
│ • Skills  │                                          │
│ • Config  │                                          │
└──────────┴──────────────────────────────────────────┘
```

**Tech**: Plain browser JS, `var` declarations, string concatenation for rendering, localStorage for preferences.

### Real-time Updates

- **Polling every 5-10 seconds** for status, active quests
- **Polling every 30 seconds** for sessions, brain entries
- **Manual refresh** buttons for heavy data (vault, full sessions)
- **WebSocket** not needed — polling is simpler and sufficient

### Self-Hosting

The dashboard is a **skill** that:
1. Launches the HTTP server on `localhost:3000`
2. Auto-opens the browser tab
3. Runs as a background process
4. Can be stopped with `bibo-dashboard stop`

### Bibo Integration

The dashboard communicates with bibo via:
1. **Direct file reads** — sessions, brain, vault (read-only)
2. **pi tool calls** — quests, skills, config (read+write)
3. **Local API** — server acts as a proxy to pi tool calls

This means the dashboard can trigger actions (complete quests, trigger skills) by calling the pi tool system through the server.
