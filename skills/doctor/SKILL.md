---
name: doctor
description: Run comprehensive diagnostics on bibo setup and display system health. Use when the user asks about bibo health, diagnostics, setup issues, or troubleshooting.
kind: sop
---

# bibo Doctor

Run comprehensive diagnostics on bibo setup. Checks system health, configuration, and dependencies.

## When to Use

- User asks about bibo setup or configuration issues
- User reports something isn't working
- User wants to check system health
- Troubleshooting extension or tool problems

## Instructions

1. Call the `doctor` tool to run all diagnostics.
2. Display the results verbatim — the tool returns a formatted markdown report.
3. If the doctor tool is not available, report that the doctor extension needs to be installed.

## Diagnostic Checks

The doctor tool checks:
- **Node.js Version** — Node version compatibility
- **Bibo Structure** — Required files and directories
- **Provider Config** — provider.json validity
- **Provider Connectivity** — Endpoint reachability
- **Settings** — settings.json and model profiles
- **Extensions** — Installed extension count
- **NPM Packages** — Core dependencies
- **Cost Tracker** — Accumulated session cost
- **Brain/Vault** — Memory storage status
- **Checkpoints** — Backup session count
- **Git** — Repository status
- **Skills** — Available skill counts
- **Environment** — Active env overrides
