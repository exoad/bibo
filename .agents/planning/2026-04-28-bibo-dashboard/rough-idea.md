# Bibo Dashboard — Rough Idea

## Concept

Build a **web UI dashboard** for the bibo coding agent that:

- Launches as a **localhost web server** (e.g., `http://localhost:3000`)
- Shows **current sessions** — active conversations, session history, session details
- Displays **information about bibo** — model info, brain memory, vault notes, quests, skills, system status
- Provides a **management interface** — can control bibo behavior (add/remove quests, view/edit brain entries, trigger skills, etc.)
- Hosted locally, accessible via browser

## Key Requirements

- Self-contained: a single skill/package that installs and runs bibo-dashboard
- Localhost-only, no external dependencies or network calls
- Real-time or near-real-time updates (sessions changing, tasks completing)
- Clean, readable UI — functional over pretty, but not ugly
- Works alongside the existing pi-coding-agent infrastructure

## Initial Thoughts

- Backend: Node.js HTTP server (or Express/Fastify) — lightweight, no extra installs
- Frontend: Vanilla HTML/CSS/JS or lightweight framework — no build step needed
- Data sources: Read from brain.jsonl, vault, session files, pi config
- Auto-open browser tab when launched
