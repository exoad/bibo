# Existing Dashboard Patterns Research

## Connections

- [[../idea-honing.md]]
- [[session-format.md]]
- [[brain-format.md]]
- [[vault-format.md]]

---

## Landscape of AI Agent Dashboards

### 1. ccboard (Florian Bruniaux)

**Stack**: Rust binary (single executable)
**Port**: 3333-3847 (configurable)
**Features**:
- TUI (9 tabs) + Web interface
- Real-time process tracking
- Budget alerts, 30-day forecast
- Multi-agent support (Claude Code, Codex, Cursor)
- MCP server management
- Hook system

**Architecture**: Single Rust binary, no npm, no dependencies
**Data**: Reads from `~/.claude/`, `~/.codex/`, `~/.cursor/`, SQLite DBs

### 2. CodeDash (vakovalskii)

**Stack**: Zero-dependency Node.js (~235 KB source)
**Port**: 3847
**Features**:
- 8 agent support (Claude, Codex, Cursor, OpenCode, Kiro, Copilot)
- Trigram fuzzy search (client-side)
- Cost analytics charts
- Session replay with timeline
- Tag system, star system
- Dark/light/monokai themes
- Terminal detection + launch/focus
- Session export to Markdown
- Git commit integration

**Architecture**: Single process, HTML with inlined CSS+JS (~130 KB page)
**Frontend**: Plain browser JS, no build step, no modules, `var` for compatibility
**State**: Global variables, localStorage for preferences
**Rendering**: String concatenation → innerHTML, no virtual DOM
**API**: REST endpoints for sessions, search, analytics, actions

**Key Design Decisions**:
- `split/join` instead of `String.replace` (avoids `$` in JS code)
- Cache HTML in memory, refresh on `NODE_ENV=development`
- Search index rebuilt on first call, cached 60 seconds
- Cost from model pricing object + usage data

### 3. Agent Cockpit (daronyondem)

**Stack**: Multi-agent orchestration platform
**Features**:
- Multi-agent, multi-host management
- Searchable conversation archives
- Drag-and-drop session management
- Real-time PTY terminal streaming
- OpenTelemetry token tracking

### 4. AgentPane (bgub)

**Stack**: Multi-agent dashboard
**Features**:
- Spawn, monitor, resume sessions
- Remote agent support
- Resource monitoring

## Key Patterns Observed

### Common Architecture

```
Browser → HTTP Server → Data Layer → File/DB Sources
```

### Data Flow

1. **Session Loading**: Scan directories, parse JSONL, index in memory
2. **Search**: Client-side fuzzy (fast) + server-side deep (cached)
3. **Cost**: Calculate from usage data + model pricing
4. **Active Detection**: Poll PID files + `ps aux` for running processes
5. **Real-time**: Polling (5-30s intervals) — not WebSocket (simpler)

### What Works Well

- **Zero dependencies** approach (CodeDash) — no `npm install`, works everywhere
- **Single HTML page** with inlined CSS/JS — no build step, no CDN needed
- **REST API** — simple, debuggable, works with curl
- **Client-side search** — instant, no server load
- **Group by project** — natural organization for sessions
- **Tag system** — lightweight categorization

### What to Avoid

- Over-engineering with frameworks (React/Vue) for a dashboard
- WebSocket for real-time — polling is simpler and sufficient
- External dependencies — defeats the purpose of a local tool
- Heavy build steps — single file or minimal files are better
- Complex auth — localhost is already secure

## Recommendations for Bibo Dashboard

1. **Backend**: Node.js HTTP server (like CodeDash), zero npm dependencies
2. **Frontend**: Single HTML with inlined CSS/JS, plain browser JS
3. **API**: REST endpoints, polling-based updates (5-10s intervals)
4. **Data**: Read from pi session files, brain.jsonl, vault, directly
5. **Self-hosted**: The dashboard serves itself — it's a skill that runs bibo's own data
6. **Bibo-specific**: Show bibo's current state — model, thinking level, active quests, brain entries, vault notes, skills loaded
7. **Control panel**: Trigger skills, manage quests, view/edit brain entries (via brain tool API)
