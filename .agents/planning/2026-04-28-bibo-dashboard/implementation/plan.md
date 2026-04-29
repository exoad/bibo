# Bibo Dashboard — Implementation Plan

## Connections

- [[../rough-idea.md]]
- [[../idea-honing.md]]
- [[../design/detailed-design.md]]
- [[../research/session-format.md]]
- [[../research/brain-format.md]]
- [[../research/vault-format.md]]
- [[../research/dashboard-patterns.md]]
- [[../research/technical-architecture.md]]

---

## Implementation Checklist

- [ ] Step 1: Project scaffolding and CLI entry point
- [ ] Step 2: HTTP server foundation
- [ ] Step 3: Session data layer
- [ ] Step 4: Brain data layer
- [ ] Step 5: Vault data layer
- [ ] Step 6: Quests and status endpoints
- [ ] Step 7: HTML generator and frontend shell
- [ ] Step 8: Frontend sidebar and navigation
- [ ] Step 9: Session list and detail views
- [ ] Step 10: Brain explorer view
- [ ] Step 11: Vault viewer with wikilinks
- [ ] Step 12: Quest manager and skills views
- [ ] Step 13: Search functionality
- [ ] Step 14: Real-time polling and status updates
- [ ] Step 15: Config view and export endpoint
- [ ] Step 16: Polish, error handling, and launch script

---

## Step 1: Project Scaffolding and CLI Entry Point

**Objective:** Create the project structure and CLI that can launch and stop the dashboard.

**Files to create:**
```
bibo-dashboard/
  bin/
    cli.js          # CLI entry point
  src/
    server.js       # HTTP server
    data.js         # Data layer
    html.js         # HTML generator
  src/frontend/
    index.html      # HTML template
    styles.css      # Styles
    app.js          # Frontend logic
  package.json      # Minimal package info
```

**Implementation guidance:**
- `bin/cli.js` accepts commands: `launch`, `stop`, `status`
- `launch` starts the server on port 3000 and opens browser
- `stop` kills any running dashboard process (PID file at `~/.pi/dashboard.pid`)
- Use `process.pid` and write to PID file for process management
- Use `open` module or `child_process.exec('open http://localhost:3000')` for browser launch

**Test requirements:**
- `node bin/cli.js launch` starts server and prints port
- `node bin/cli.js status` shows if dashboard is running
- `node bin/cli.js stop` stops running dashboard
- Server responds to `curl http://localhost:3000/health` with `{"status":"ok"}`

**Demo:** Running `node bin/cli.js launch` starts the server and shows health check response.

---

## Step 2: HTTP Server Foundation

**Objective:** Create a working HTTP server with basic routing.

**Files to modify:**
- `src/server.js` — HTTP server with route handling

**Implementation guidance:**
- Use `http.createServer()` from Node.js stdlib
- Parse URL and method from `req.url`
- Handle `GET /` → serve HTML
- Handle `GET /api/*` → route to API handlers
- Handle `GET /health` → return `{"status":"ok"}`
- Return proper `Content-Type` headers (`text/html`, `application/json`)
- Handle 404 for unknown routes

**Test requirements:**
- `GET /health` returns `{"status":"ok"}` with `application/json`
- `GET /` returns `text/html` (even if empty for now)
- Unknown routes return 404
- Server starts on port 3000 and listens on 127.0.0.1

**Demo:** `curl http://localhost:3000/health` returns `{"status":"ok"}`

---

## Step 3: Session Data Layer

**Objective:** Read and parse pi session files from `~/.pi/agent/sessions/`.

**Files to create/modify:**
- `src/data.js` — Session reading functions

**Implementation guidance:**
- Scan `~/.pi/agent/sessions/<project>/` directories for `.jsonl` files
- Parse each line as JSON, extract session header (first line)
- Count messages, extract first user message as preview
- Format timestamps to human-readable
- Return sorted list (newest first) by timestamp

**Data model:**
```javascript
{
    id: string,
    timestamp: string,  // ISO8601
    cwd: string,
    messageCount: number,
    preview: string,    // First user message (truncated to 100 chars)
    lastMessageAt: string
}
```

**API endpoint:** `GET /api/sessions` returns `{sessions: [...], count: number}`

**Test requirements:**
- `loadSessions()` returns array of session objects
- Each session has id, timestamp, cwd, messageCount, preview
- Sessions are sorted by timestamp descending
- Empty directory returns `[]`
- Corrupted JSONL lines are skipped gracefully

**Demo:** `curl http://localhost:3000/api/sessions` returns session list

---

## Step 4: Session Detail View

**Objective:** Read full session with all messages, tool calls, and usage data.

**Files to modify:**
- `src/data.js` — Add `loadSessionDetail(id)` function

**Implementation guidance:**
- Find session file by ID (match UUID in filename)
- Parse all lines, extract messages grouped by role
- Extract tool calls from assistant messages
- Extract usage data from assistant messages
- Build conversation thread using parentId links
- Return formatted session detail object

**Data model:**
```javascript
{
    header: { version, id, timestamp, cwd, provider, modelId },
    messages: [{
        id, role, content, timestamp, toolCalls, usage
    }],
    totalTokens: number,
    duration: string
}
```

**API endpoint:** `GET /api/sessions/:id` returns session detail

**Test requirements:**
- `loadSessionDetail(id)` returns full session with messages
- Messages include role, content, toolCalls, usage
- Tool calls include name, arguments, result
- Usage data includes input, output, cache tokens
- Unknown ID returns 404

**Demo:** `curl http://localhost:3000/api/sessions/<id>` returns full session

---

## Step 5: Brain Data Layer

**Objective:** Read and parse brain.jsonl entries.

**Files to modify:**
- `src/data.js` — Add `loadBrain()` function

**Implementation guidance:**
- Read `~/.rho/brain/brain.jsonl`
- Parse each line as JSON
- Group entries by type (learning, behavior, preference, etc.)
- Return object with arrays for each type

**API endpoint:** `GET /api/brain` returns `{learning: [], behavior: [], preference: [], ...}`

**Test requirements:**
- `loadBrain()` returns object with typed arrays
- Each entry has id, type, text, created
- Empty file returns empty arrays
- Corrupted lines are skipped

**Demo:** `curl http://localhost:3000/api/brain` returns grouped brain entries

---

## Step 6: Vault Data Layer

**Objective:** Read and parse vault notes from `~/.rho/vault/`.

**Files to modify:**
- `src/data.js` — Add `loadVault()` and `loadVaultNote(slug)` functions

**Implementation guidance:**
- Scan `~/.rho/vault/` for `.md` files (excluding `_inbox.md`, `_index.md`)
- Parse YAML frontmatter (lines before first `---`)
- Extract markdown content (after second `---`)
- Extract wikilinks from content using regex `\[\[(.+?)\]\]`
- Return list of notes with frontmatter + content

**API endpoints:**
- `GET /api/vault` returns `{notes: [{slug, name, type, created, updated, content: truncated}]}`
- `GET /api/vault/:slug` returns `{note: {frontmatter, content, wikilinks}}`

**Test requirements:**
- `loadVault()` returns array of vault notes
- Each note has slug, name, type, content
- `loadVaultNote(slug)` returns full note with content
- Unknown slug returns 404
- Wikilinks are extracted correctly

**Demo:** `curl http://localhost:3000/api/vault` returns vault notes list

---

## Step 7: Quests and Status Endpoints

**Objective:** Add quests and system status endpoints.

**Files to modify:**
- `src/server.js` — Add quest and status routes
- `src/data.js` — Add `loadQuests()` and `loadStatus()` functions

**Implementation guidance:**
- Quests: Read from pi quest system (via tool call or file)
- Status: Read from pi-coding-agent state (model, thinking level, provider)
- Return formatted JSON

**API endpoints:**
- `GET /api/quests` returns `{quests: [{id, description, status, ...}]}`
- `GET /api/status` returns `{model, provider, thinkingLevel, active, uptime, version}`

**Test requirements:**
- `loadQuests()` returns quest list
- `loadStatus()` returns current system state
- Endpoints return valid JSON

**Demo:** `curl http://localhost:3000/api/status` returns current model and state

---

## Step 8: HTML Generator and Frontend Shell

**Objective:** Create the HTML page with inlined CSS and JS.

**Files to create/modify:**
- `src/html.js` — HTML template with `{{STYLES}}` and `{{SCRIPT}}` placeholders
- `src/frontend/index.html` — HTML template
- `src/frontend/styles.css` — All CSS (dark theme)
- `src/frontend/app.js` — All frontend logic

**Implementation guidance:**
- `html.js` reads template, injects CSS and JS using `split/join` (avoids `$` issues)
- Template has `{{STYLES}}` and `{{SCRIPT}}` placeholders
- CSS includes: dark theme, responsive layout, typography, components
- JS includes: state management, API calls, rendering, event handlers

**Template structure:**
```html
<!DOCTYPE html>
<html>
<head>
    <title>Bibo Dashboard</title>
    <style>{{STYLES}}</style>
</head>
<body>
    <div id="app">
        <header>...</header>
        <div class="layout">
            <nav class="sidebar">...</nav>
            <main class="content">...</main>
        </div>
        <footer>...</footer>
    </div>
    <script>{{SCRIPT}}</script>
</body>
</html>
```

**Test requirements:**
- `html.js` assembles HTML with CSS and JS injected
- Result is valid HTML
- CSS is inlined in `<style>` tags
- JS is inlined in `<script>` tags

**Demo:** `GET /` returns complete HTML page

---

## Step 9: Frontend Sidebar and Navigation

**Objective:** Create sidebar navigation and main content area.

**Files to modify:**
- `src/frontend/app.js` — Sidebar rendering and navigation logic

**Implementation guidance:**
- Sidebar with links: Sessions, Brain, Vault, Quests, Skills, Config
- Clicking a link changes `state.currentView` and re-renders content
- Active link is highlighted
- Sidebar is always visible (not collapsible on desktop)

**Test requirements:**
- Sidebar renders with all navigation items
- Clicking a link changes content area
- Active state is visually indicated
- Navigation persists across page reloads (localStorage)

**Demo:** Clicking "Brain" in sidebar shows brain explorer view

---

## Step 10: Session List and Detail Views

**Objective:** Render session list and session detail view.

**Files to modify:**
- `src/frontend/app.js` — Session list and detail rendering

**Implementation guidance:**
- Session list: Show cards with title, timestamp, preview, message count
- Click a session → show detail view with messages
- Detail view: Show header, messages in timeline, tool calls expandable
- Use string concatenation for rendering (no virtual DOM)
- Truncate long previews to 100 chars

**Test requirements:**
- Session list renders all sessions
- Clicking a session shows detail view
- Messages render with proper formatting (user/assistant/tool)
- Tool calls are collapsible
- Timestamps are human-readable

**Demo:** View session list, click a session, see full conversation

---

## Step 11: Brain Explorer View

**Objective:** Render brain entries grouped by type.

**Files to modify:**
- `src/frontend/app.js` — Brain view rendering

**Implementation guidance:**
- Group entries by type (learning, behavior, preference, etc.)
- Show collapsible sections for each type
- Each entry shows: type, text, created date
- Click an entry to expand/collapse

**Test requirements:**
- Brain entries render grouped by type
- Each type section is collapsible
- Entry text is displayed correctly
- Empty types show "No entries"

**Demo:** View brain entries grouped by type

---

## Step 12: Vault Viewer with Wikilinks

**Objective:** Render vault notes with wikilink support.

**Files to modify:**
- `src/frontend/app.js` — Vault view rendering

**Implementation guidance:**
- Vault list: Show notes with name, type, created date
- Click a note → show full content
- Wikilinks `[[slug]]` rendered as clickable links
- Use `[[slug]]` format, resolve to `/vault/:slug`

**Test requirements:**
- Vault list renders all notes
- Clicking a note shows full content
- Wikilinks are rendered as `<a>` tags
- Note content is formatted as markdown

**Demo:** View vault notes, click one, see content with wikilinks

---

## Step 13: Quest Manager and Skills Views

**Objective:** Render quest list and skill launcher.

**Files to modify:**
- `src/frontend/app.js` — Quest and skills view rendering

**Implementation guidance:**
- Quests: Show list with status, description, completion button
- Skills: Show list with name, description, trigger button
- Buttons call API endpoints (`POST /api/quest/complete/:id`, `POST /api/skill/trigger/:name`)

**Test requirements:**
- Quests render with status and completion button
- Skills render with trigger button
- Buttons call correct API endpoints
- Responses update UI

**Demo:** View quests, click "complete" to mark done

---

## Step 14: Search Functionality

**Objective:** Add client-side fuzzy search across sessions and brain.

**Files to modify:**
- `src/frontend/app.js` — Search input and results rendering
- `src/server.js` — Search endpoint
- `src/data.js` — Search function

**Implementation guidance:**
- Search input in header
- Client-side fuzzy search on session titles/previews
- Server-side deep search on `GET /api/search?q=QUERY`
- Debounce server search (300ms)
- Show results with snippet highlighting

**Test requirements:**
- Search input filters session list client-side
- Server search returns matching sessions and brain entries
- Results show snippets with highlighted matches
- Empty query returns all results

**Demo:** Type in search box, see filtered results

---

## Step 15: Real-time Polling and Status Updates

**Objective:** Add auto-refresh for status and active data.

**Files to modify:**
- `src/frontend/app.js` — Polling logic

**Implementation guidance:**
- Poll `/api/status` every 5 seconds
- Poll `/api/quests` every 10 seconds
- Update UI when data changes
- Show "Last updated" timestamp in footer
- Allow user to adjust poll interval (localStorage)

**Test requirements:**
- Status updates every 5 seconds
- Quests update every 10 seconds
- UI reflects new data without page reload
- Poll interval is configurable

**Demo:** Watch status update in real-time as you work with bibo

---

## Step 16: Config View and Export Endpoint

**Objective:** Add config view and session export.

**Files to modify:**
- `src/frontend/app.js` — Config view rendering
- `src/server.js` — Export endpoint
- `src/data.js` — Export function

**Implementation guidance:**
- Config view: Display current pi config (model, thinking level, etc.)
- Export: Convert session to Markdown format
- Export endpoint: `GET /api/export/:id` returns Markdown file

**Test requirements:**
- Config view renders current settings
- Export endpoint returns valid Markdown
- Markdown includes messages, tool calls, usage

**Demo:** View config, export a session to Markdown

---

## Step 17: Polish and Launch Script

**Objective:** Final polish, error handling, and launch script.

**Files to modify:**
- `src/frontend/styles.css` — Polish styles
- `src/frontend/app.js` — Error handling, loading states
- `bin/cli.js` — Robust launch/stop logic

**Implementation guidance:**
- Add loading spinners for async operations
- Add error messages for failed API calls
- Add retry logic for network errors
- Polish CSS (spacing, colors, typography)
- Add favicon
- Ensure launch script works reliably

**Test requirements:**
- Loading states show during async operations
- Error messages display for failed requests
- CSS is polished and consistent
- Launch script works on first try

**Demo:** Dashboard loads smoothly, shows loading states, handles errors gracefully

---

## Implementation Order

```
Step 1 → Step 2 → Step 3 → Step 4 → Step 5 → Step 6
    ↓
Step 7 → Step 8 → Step 9 → Step 10 → Step 11 → Step 12
    ↓
Step 13 → Step 14 → Step 15 → Step 16 → Step 17
```

**Dependencies:**
- Steps 1-2: No dependencies (foundation)
- Steps 3-6: Depends on server foundation
- Steps 7-8: Depends on data layer
- Steps 9-12: Depends on frontend shell
- Steps 13-15: Depends on views
- Steps 16-17: Final polish

---

## Connections

- [[../rough-idea.md]]
- [[../idea-honing.md]]
- [[../design/detailed-design.md]]
- [[../research/session-format.md]]
- [[../research/brain-format.md]]
- [[../research/vault-format.md]]
- [[../research/dashboard-patterns.md]]
- [[../research/technical-architecture.md]]