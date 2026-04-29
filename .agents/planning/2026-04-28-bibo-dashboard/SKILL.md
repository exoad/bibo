---
name: bibo-dashboard
description: Launch the Bibo Dashboard web UI for monitoring and managing the bibo coding agent. Provides real-time views of sessions, brain memory, vault notes, quests, skills, and system status.
kind: skill
version: 1.0.0
---

# Bibo Dashboard Skill

Launches the Bibo Dashboard web UI at `http://localhost:3000`.

## Usage

When the user wants to:
- View the dashboard
- Monitor bibo's current state
- Browse sessions, brain, vault, quests
- Manage quests or trigger skills

Run:

```bash
cd /Users/jmeng/kibi/.agents/planning/2026-04-28-bibo-dashboard
node src/server.js
```

The server will:
1. Start on `http://127.0.0.1:3000`
2. Auto-open the browser tab
3. Stay alive as long as the pi instance is running
4. Gracefully shut down on SIGINT/SIGTERM

## Features

- **Session Browser** — View all pi coding agent sessions with full message/thread view
- **Brain Explorer** — Browse brain memory entries grouped by type
- **Vault Viewer** — Read vault notes with wikilink support
- **Quest Manager** — View active quests, mark them complete
- **Skill Launcher** — List skills, trigger them
- **System Status** — Real-time view of model, thinking level, active tasks
- **Search** — Client-side fuzzy search across sessions and brain entries
- **Config View** — Display current pi config

## Architecture

- Zero npm dependencies (Node.js stdlib only)
- Single HTML page with inlined CSS/JS
- REST API with 15 endpoints
- Polling-based real-time updates (5-10s intervals)
- Direct file reads from pi data sources
- Dark theme, responsive layout

## Files

```
bibo-dashboard/
├── package.json
├── bin/
│   └── cli.js
├── src/
│   ├── server.js         # HTTP server with API routes
│   ├── data.js           # Data layer (sessions, brain, vault, etc.)
│   └── frontend/
│       ├── index.html    # HTML page
│       ├── styles.css    # Dark theme CSS
│       └── app.js        # Frontend logic
└── SKILL.md
```
