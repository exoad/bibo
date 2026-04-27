# Drosk — Project Memory

**Repo:** `/Users/jmeng/Code/app-src`
**Last updated:** 2026-04-27

---

## What It Is

Drosk is a **desktop-first, local-first file automation product**. Users define "flows" — rules that watch directories for file changes and execute actions (move, notify, etc.). The system has a **Go backend** (Sentinel) that owns all business logic and a **Flutter frontend** that provides the UI.

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────┐
│                    Flutter App                       │
│  (Client/) — UI shell, router, features, design      │
│  system (Kira), IPC client                           │
├─────────────────────────────────────────────────────┤
│              IPC Layer (protobuf over sockets)        │
│  Unix socket (Linux/macOS) / TCP (Windows)            │
│  Auth handshake + length-prefixed frames              │
├─────────────────────────────────────────────────────┤
│                   Sentinel (Go)                      │
│  ┌──────────┐  ┌───────────┐  ┌───────────────────┐ │
│  │ Engine   │  │ Odin      │  │ IPC Server        │ │
│  │ Flow     │  │ Watcher   │  │ 23 RPC methods    │ │
│  │ execution│  │ cross-plat│  │ Tray / Startup    │ │
│  │ DSL parse│  │ kqueue/FSE│  │ KV store          │ │
│  │ marshal  │  │ inotify   │  │ AI (Ryx)          │ │
│  └──────────┘  │ fanotify  │  └───────────────────┘ │
│                └───────────┘                          │
│  ┌──────────────────────────────────────────────────┐│
│  │ Components Kit — pluggable conditions & actions  ││
│  │ Registry → loader → engine registries            ││
│  └──────────────────────────────────────────────────┘│
│  ┌──────────────────────────────────────────────────┐│
│  │ Dsl/ — ANTLR grammar → Go parser                 ││
│  │ .dff files — Drosk Flow Format (DSL)             ││
│  └──────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────┘
```

---

## Key Directories

| Directory | Role |
|-----------|------|
| `Client/` | Flutter project root — `lib/`, `test/`, `macos/`, `windows/`, `linux/` |
| `Client/lib/` | Flutter app code — features, app shell, IPC client, state |
| `Sentinel/` | Go backend — engine, watchers, IPC server, component registry |
| `Sentinel/proto/` | Protobuf contracts — `components.proto` (shared frontend/backend) |
| `Dsl/` | ANTLR grammar (`FlowDSL.g4`) + generated Go parser |
| `UserLauncher/` | Production launcher/updater for end users |
| `Expolauncher/` + `expo.py` | Dev-time orchestration (starts Flutter + Sentinel) |
| `ReleaseGenerator/` | Release dashboard — builds, signs, publishes to Cloudflare R2 |
| `Docs/` | Technical documentation |

---

## Technology Stack

| Layer | Technology |
|-------|-----------|
| UI | Flutter (Dart) — macOS, Windows, Linux |
| Backend | Go 1.21+ |
| IPC | Protocol Buffers over raw sockets (Unix domain / TCP) |
| DSL | ANTLR 4 → Go parser |
| File watching | Odin watcher — kqueue (macOS), FSEvents (macOS, optional), inotify (Linux), fanotify (Linux), ReadDirectoryChangesW (Windows) |
| Logging | Uber zap (telemetry package) |
| DI (Flutter) | Injectable + codegen |
| Immutability (Flutter) | Freezed |
| Release | Cloudflare R2 |

---

## IPC Protocol

### Transport
- **Linux/macOS:** Unix domain socket (`$XDG_RUNTIME_DIR/drosk_sentinel.sock` or `/tmp/`)
- **Windows:** TCP `127.0.0.1` with dynamic port

### Connection Info
File: `drosk_sentinel_conn.json` — contains `socket_path`, `port`, `auth_token`, `pid`

### Wire Format
- **Request:** `[4B length][2B method_id][4B request_id][protobuf payload]`
- **Response:** `[4B length][4B request_id][1B status (0=ok, 1=error)][protobuf payload]`
- **Push (tray events):** `request_id = 0xFFFFFFFF`

### Auth
Client sends `AuthHandshake { token: "Bearer <auth_token>" }` as first frame. Server validates against per-session token.

### RPC Methods (23 total)

| ID | Method | Purpose |
|----|--------|---------|
| 1 | Auth | Connection handshake |
| 2 | GetServerInfo | Health/version |
| 3 | GetComponents | Export component registry |
| 4 | SaveFlow | Create/update flow |
| 5 | DeleteFlow | Remove flow |
| 6 | GetFlow | Fetch single flow |
| 7 | ListFlows | List all flows |
| 8 | ListFolders | List watched folders |
| 9 | AddFolder | Add watched folder |
| 10 | RemoveFolder | Remove watched folder |
| 11 | CheckFolder | Validate folder safety |
| 12 | GetKeyValue | Read config KV |
| 13 | SetKeyValue | Write config KV |
| 14 | DeleteKeyValue | Delete config KV |
| 15 | GenerateFlowFromPrompt | AI-assisted flow creation |
| 16 | ValidateFlow | Preflight validation |
| 18 | PushNotification | Desktop notification |
| 19 | OpenExternalUri | Open URL in browser |
| 20 | LaunchAtStartup | Get/set startup toggle |
| 21 | GetAppPaths | Get system paths |
| 22 | SubscribeTrayEvents | Subscribe to tray events |
| 23 | Shutdown | Graceful shutdown |

---

## Flow Engine (Sentinel)

### Flow Model
```go
type Flow struct {
    Name        string
    WatchedPath string
    Trigger     *ConditionTree   // AST of conditions (and/or/not)
    Actions     []Action         // List of actions to execute
    Color       uint32
    IconName    FlowIconName
    CreatedAt   int64
}
```

### Flow ID
Deterministic hash: `sha256(name + "|" + normalizedPath + "|" + triggerString)[:16]` → `"flw_" + hex`

### Path Matching
Exact-match-only: event parent directory must equal watched directory. No recursive matching.

### Condition Compilation
Condition trees are **compiled into flattened instruction programs** at registration time:
1. Bottom-up cost calculation (condition `BaseImpCost` accumulates)
2. Children sorted by cost (cheapest first for short-circuit)
3. Postorder traversal → instruction sequence
4. Stack-based execution with pooled evaluation stack

### Action Execution
Sequential, left-to-right. Each action returns `bool` (success/failure). `ContinuesOnFailure` controls whether to keep going.

---

## Odin Watcher (File System Events)

### Platform Backends
| Platform | Default | Alternative |
|----------|---------|-------------|
| macOS | kqueue | FSEvents (cgo, higher memory) |
| Linux | inotify + epoll | fanotify (not currently used) |
| Windows | ReadDirectoryChangesW + IOCP | — |

### Key Features
- **Debouncing:** Events on same path within cooldown (default 100ms) are merged
- **Event batching:** Optional coalescing within duration (default 500ms)
- **Depth control:** `WatchTopLevel` (single dir) vs `WatchNested` (recursive)
- **Regex filtering:** Include/exclude patterns
- **Stats tracking:** Events processed, dropped, filtered, lost, processing rate
- **Buffer overflow handling:** Events → main channel → dropped channel → lost

### Darwin kqueue
- Low memory profile
- Uses `O_EVTONLY` flag
- Per-file descriptor watches

### Darwin FSEvents
- CGo with CoreServices
- Higher memory but native macOS API
- Recursive by default, filtering in Go

### Linux inotify
- Uses epoll to multiplex inotify + eventfd
- Path trie for efficient child watch management
- Auto-discovers subdirectories for nested watches

### Linux fanotify
- `FAN_REPORT_DFID_NAME` for path resolution
- `OpenByHandleAt` for opaque handle → path conversion
- Currently not used (inotify is default)

### Windows
- `ReadDirectoryChangesW` with IOCP
- Asynchronous, overlapped I/O
- Path map keyed by IOCP completion key

---

## Component System (Pluggable Conditions & Actions)

### Architecture
Each component is a **self-registering module** via `init()`:
```go
func init() {
    kit.RegisterCondition(kit.ConditionModule{
        Definition: kit.ConditionDefinition{
            ID: "net.drosk.conditions.MyCondition",
            // ...
            Factory: func(params map[string]any) (kit.ConditionTransformer, error) {
                return func(ctx kit.ConditionContext) bool { ... }, nil
            },
        },
    })
}
```

### Component Kit Types
- `ConditionTransformer func(ctx ConditionContext) bool`
- `ActionTransformer func(ctx *ActionContext) bool`
- `Parameter` — name, type, description, required, default, choices, validator
- `ParameterType` — string, int, bool, path_folder, path_file, select, datetime

### Three Control Planes for Disabling
1. **Compile-time:** Go build tags
2. **Runtime:** `Supported func() (bool, string)` callback
3. **Environment:** `SENTINEL_DISABLED_COMPONENTS` env var (comma-separated IDs)

### Built-in Conditions
- `Always` / `Never`
- `ExtensionIs` — file extension match
- `FileNameIs` — exact filename match
- `FileNameMatchesRegex` — regex filename match
- `FileSizeIs` — file size comparison
- `MimeTypeIs` — MIME type match
- `FileEventIs` — event type filter
- `FileMtimeComparing` — modification time comparison
- `ParentNameIs` — parent directory name
- `PathIsDirectory` — path is directory
- `TimeInRange` — time window filter
- `Dotfile` — dotfile detection

### Built-in Actions
- `ConsoleLog` — log to console
- `DesktopNotify` — desktop notification
- `CopyToDirectory` — copy file
- `OpenWithSystemDefault` — open file
- `ShowInFileManager` — reveal in Finder/Explorer
- `Noop` — no-op action

---

## DSL (Drosk Flow Format)

### Grammar (`FlowDSL.g4`)
```
flow '{' metadata* whenClause? thenClause? '}'
when '{' condition '}'
then '{' action* '}'
condition : call | and '{' condition* '}' | or '{' condition* '}' | not '{' condition '}'
```

### Storage
Flows persisted as `.dff` files in `$XDG_STATE_HOME/drosk/policies/` (or macOS equivalent).
Files have `// id:` and `// enabled:` headers, then DSL content.

### Serialization
- Internal: DSL → AST → protobuf (for IPC)
- Wire: protobuf `FlowData` with `ConditionNodeProto` + `ActionRefProto`
- No DSL on the wire — structured data only

---

## Flutter Client Structure

### Feature Modules
- `features/flows/` — flow board, editor, providers, icon resolvers
- `features/folders/` — watched folder management
- `features/settings/` — settings pages, actions, categories
- `features/onboarding/` — first-run experience
- `features/info/` — about/help
- `features/experimental/` — debug actions, flow editor experiments

### Core Modules
- `core/ipc/` — `SentinelIpcService`, protobuf stubs
- `core/models/` — Flow, ConditionNode, DSL codec
- `core/services/` — logger, crash reporter, Sentry, single instance, startup, runtime
- `core/di/` — Injectable DI setup
- `core/state_scope.dart` — app state scope wrapper

### App Shell
- `app/` — router, title bar, two-panel layout, toast overlay, macOS window chrome
- `kira/` — design system widgets

### Key Services
- **SingleInstanceService:** Ensures only one app instance runs
- **StartupService:** Launch-at-startup management
- **CrashReporter:** Crash reporting
- **SentryInit:** Sentry error tracking (production only)
- **RuntimeService:** Runtime environment detection

---

## UserLauncher (Production Updater)

- Downloads ZIP updates from remote URL
- Verifies SHA256 checksum
- Extracts to shared directory
- Atomic apply (prevents partial installations)
- Progress tracking, error recovery with backups
- Zip-slip attack prevention

---

## Release Pipeline

1. `ReleaseGenerator/` dashboard (`bun run start` → `http://127.0.0.1:47123`)
2. Detects host build capabilities
3. Builds Flutter + Sentinel + UserLauncher
4. Optionally signs artifacts
5. Publishes v2 release manifest + artifacts to Cloudflare R2

---

## Development Workflow

```bash
# Install deps
cd Client && flutter pub get
cd Sentinel && go mod tidy
cd Dsl && go mod tidy
cd UserLauncher && go mod tidy
cd Expolauncher/runtime && go mod tidy
cd ReleaseGenerator && bun install

# Run dev
python expo.py

# Regenerate protobuf
./Sentinel/regen_proto.sh    # Go stubs
./regen_proto_dart.sh        # Dart stubs

# Regenerate DSL parser
./Dsl/regen.sh

# Tests
cd Client && flutter test
cd Sentinel && go test ./...
cd Dsl && go test ./...
```

---

## Key Files Reference

| File | Purpose |
|------|---------|
| `Sentinel/main.go` | Entry point, startup sequence |
| `Sentinel/ipc.go` | IPC server, wire protocol, dispatch |
| `Sentinel/flow_storage.go` | .dff file persistence |
| `Sentinel/engine/flow_engine.go` | Flow registration, path indexing, ID generation |
| `Sentinel/engine/conditions.go` | Condition tree, builder, compiled program execution |
| `Sentinel/engine/odin.go` | Odin watcher wrapper |
| `Sentinel/odin/watcher.go` | Core watcher, debouncing, batching |
| `Sentinel/proto/components.proto` | All protobuf message definitions |
| `Dsl/FlowDSL.g4` | ANTLR grammar |
| `Client/lib/main.dart` | Flutter entry point, DI, Sentry |
| `Client/lib/core/ipc/sentinel_ipc_service.dart` | IPC client, auth, request/response |
| `Docs/sentinel_frontend_backend_api.md` | Frontend integration guide |
| `Docs/sentinel_modular_components.md` | Component authoring guide |

---

## Design Principles

1. **Local-first:** All data stored locally, no cloud sync
2. **Deterministic:** Flow IDs are hash-based, behavior is predictable
3. **Modular:** Components self-register, pluggable conditions/actions
4. **Cross-platform:** Odin watcher abstracts platform differences
5. **Structured IPC:** Protobuf over raw sockets, no HTTP, typed params
6. **DSL internal:** DSL is parsed internally; IPC uses structured protobuf
7. **Minimal risk:** Additive changes preferred, no broad refactors without cause
