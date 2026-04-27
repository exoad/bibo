# Memory Format Spec

## Structure

```
# M: <project-name>
R: <repo-path>
U: <date>

## R — Repo
`<dir>` → `<role>`

## T — Tech
`<layer>`: `<tech>`

## A — Architecture
`<component>`: `<role>`
→ `<data-flow>`

## K — Key Files
`<path>` → `<purpose>`

## P — Protocols
`<name>`: `<details>`

## C — Components (opt)
`<type>`: `<list>`

## E — Engine (opt)
`<name>`: `<details>`

## D — Design
- `<principle>`

## W — Workflow
`<cmd>` → `<purpose>`
```

## Section Rules

| Section | Required | Content |
|---------|----------|---------|
| `M` | Yes | Project name, repo path, last-updated date |
| `R` | Yes | Directory → role mapping |
| `T` | Yes | Layer → technology mapping |
| `A` | When multi-component | Component roles + data flow |
| `K` | Yes | Critical file paths + purpose |
| `P` | When API/IPC exists | Wire formats, RPC, protocols |
| `C` | When plugin system | Condition/action/component lists |
| `E` | When execution engine | Compilation, execution model |
| `D` | Yes | Design principles, constraints |
| `W` | Yes | Build/test/run commands |

## Notation Conventions

- `→` = maps to / responsible for
- `:` = is / uses
- `-` = list item
- `//` = inline comment
- `// id:` = file header marker
- `func()` = Go function
- `type X struct` = Go struct
- `// opt` = optional section
- `// req` = required section

## Token Budget

Target: ≤ 4KB per project memory. Prioritize:
1. Key files (K) — entry points, critical files
2. Protocols (P) — APIs, wire formats, RPC
3. Architecture (A) — component interaction
4. Repo (R) — directory structure
5. Engine (E) — execution model
6. Components (C) — plugin lists
7. Tech (T) — stack overview
8. Workflow (W) — build/test/run
9. Design (D) — principles, constraints
