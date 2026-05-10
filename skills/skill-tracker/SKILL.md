---
name: skill-tracker
description: "Track skill usage with correctness scoring, generate reports, and identify unused or misused skills for pruning."
kind: sop
---

# Skill Tracker

## Overview

Track which skills are being used, how often, and whether they're being used correctly. Generate reports to identify:

- Most/least used skills
- Skills with high improper usage rates
- Unused skills that could be pruned
- Usage trends over time

**Synced Report Location:** `~/.pi/skill-tracker/REPORT.md` (auto-generated)

## Parameters

- **action** (required): One of:
  - `log` - Log a skill usage event
  - `report` - Generate usage report
  - `mark` - Mark a skill usage as proper/improper
  - `stats` - Quick statistics summary
  - `review` - Review recent usages for correctness
- **skill_name** (optional for report/stats, required for log/mark): Name of the skill
- **correctness** (optional for log, required for mark): `proper`, `improper`, or `unknown`
- **notes** (optional): Context or notes about the usage
- **days** (optional, default: 30): Number of days to include in report
- **output** (optional): Output format - `table`, `json`, or `markdown`

## Steps

### 1. Log Skill Usage

**When to use:** After any skill is triggered, log its usage.

**Python CLI:**

```bash
python3 skills/skill-tracker/tracker.py log --skill <name> --correctness <proper|improper|unknown> --notes "<context>" --context "<what user asked>"
```

**Examples:**

```bash
# Log proper usage
python3 skills/skill-tracker/tracker.py log --skill pdd --correctness proper --notes "Perfect fit for feature planning" --context "User wanted to design a new feature"

# Log with unknown correctness (will prompt for review later)
python3 skills/skill-tracker/tracker.py log --skill code-assist --correctness unknown --context "User asked for help with code"

# Log improper usage with explanation
python3 skills/skill-tracker/tracker.py log --skill pdd --correctness improper --notes "User just wanted a quick fix, not full design" --context "Quick bug fix"
```

**Auto-logging:** The system should automatically log when skills are triggered via `/skill run` or skill shortcuts.

### 2. Generate Usage Report

**Python CLI:**

```bash
python3 skills/skill-tracker/tracker.py report [--days 30] [--format table|json|markdown]
```

**Examples:**

```bash
# Default table report
python3 skills/skill-tracker/tracker.py report

# Markdown report for sharing
python3 skills/skill-tracker/tracker.py report --format markdown

# JSON for programmatic use
python3 skills/skill-tracker/tracker.py report --format json

# Last 7 days only
python3 skills/skill-tracker/tracker.py report --days 7
```

**Report includes:**

- Total skill invocations
- Most used skills (with counts)
- Skills with improper usage flagged
- Unused skills (available but never used)
- Proper usage rate by skill

**Synced Report:** To update the synced report file:

```bash
python3 skills/skill-tracker/tracker.py report --format markdown > ~/.pi/skill-tracker/REPORT.md
```

### 3. Mark Correctness

**When to use:** Retroactively mark whether a skill was used properly.

**Python CLI:**

```bash
python3 skills/skill-tracker/tracker.py mark --entry-id <id> --correctness <proper|improper> [--notes "<reason>"]
```

**Example:**

```bash
python3 skills/skill-tracker/tracker.py mark --entry-id 890b955f --correctness improper --notes "User seemed confused about what this skill does"
```

### 4. Quick Stats

**Python CLI:**

```bash
python3 skills/skill-tracker/tracker.py stats [--days 30]
```

**Shows:**

- Total skills available
- Total usages logged
- Proper/improper/unknown breakdown
- Most used skill
- Unused skills count
- Skills needing review (unknown correctness)

### 5. Review Mode

**Python CLI:**

```bash
python3 skills/skill-tracker/tracker.py review
```

**Interactive review of recent usages with unknown correctness.** Lists entries that need to be marked as proper or improper.

## Data Storage

- **Usage Data:** `~/.pi/skill-tracker/usage.jsonl` (JSON Lines, append-only)
- **Config:** `~/.pi/skill-tracker/config.json`
- **Synced Report:** `~/.pi/skill-tracker/REPORT.md` (regenerate with report --format markdown)

**Entry Fields:**

- `id`: Short UUID for the entry
- `skill_name`: Name of skill used
- `timestamp`: ISO8601 timestamp
- `trigger_source`: How triggered (`/skill`, `auto`, `shortcut`)
- `context`: Brief description of user request
- `correctness`: `proper`, `improper`, or `unknown`
- `notes`: Optional notes on usage quality
- `session_id`: Session identifier for grouping

## Report Formats

### Table (default)

```
Skill                  | Uses | Proper | Improper | Rate
-----------------------|------|--------|----------|------
code-assist            |   45 |     42 |        3 | 93%
pdd                    |   12 |     10 |        2 | 83%
skill-tracker          |    3 |      2 |        1 | 67%
```

### JSON

Full structured data for programmatic use.

### Markdown

Formatted for documentation or sharing.

## Correctness Guidelines

**Mark as PROPER when:**

- User's request clearly matched the skill's purpose
- Skill output was relevant and helpful
- User seemed to understand what the skill does

**Mark as IMPROPER when:**

- User seemed confused about the skill's purpose
- Skill output didn't match what user actually needed
- Wrong skill was chosen for the task
- User had to try multiple skills to get result

**Mark as UNKNOWN when:**

- Not enough context to judge
- Usage was ambiguous
- Haven't reviewed yet

## Examples

### Log a skill usage

```bash
python3 skills/skill-tracker/tracker.py log --skill pdd --correctness proper --notes "User wanted to plan a feature, PDD was perfect fit" --context "Feature design session"
```

### Generate monthly report

```bash
python3 skills/skill-tracker/tracker.py report --days 30 --format markdown > ~/.pi/skill-tracker/REPORT.md
```

### Mark previous usage as improper

```bash
# First find the entry ID from review or data file
python3 skills/skill-tracker/tracker.py review

# Then mark it
python3 skills/skill-tracker/tracker.py mark --entry-id abc123 --correctness improper --notes "User just wanted a simple edit"
```

### Get quick stats

```bash
python3 skills/skill-tracker/tracker.py stats
```

### View synced report

```bash
cat ~/.pi/skill-tracker/REPORT.md
```

## Troubleshooting

**No data showing:**

- Check `~/.pi/skill-tracker/usage.jsonl` exists
- Ensure skills are being logged after use
- Run `python3 skills/skill-tracker/tracker.py stats` to verify

**Report seems incomplete:**

- Adjust `--days` parameter to look further back
- Check if old data was archived

**Want to reset data:**

- Archive: `mv ~/.pi/skill-tracker/usage.jsonl ~/.pi/skill-tracker/usage-$(date +%Y%m%d).jsonl`
- Start fresh: `> ~/.pi/skill-tracker/usage.jsonl`

**Python not found:**

- Use `python3` explicitly (macOS/Linux)
- Or run with full path: `/usr/bin/python3 skills/skill-tracker/tracker.py`

## Files

- **Skill doc:** `~/bibo/skills/skill-tracker/SKILL.md`
- **Tracker script:** `~/bibo/skills/skill-tracker/tracker.py`
- **Data file:** `~/.pi/skill-tracker/usage.jsonl`
- **Config:** `~/.pi/skill-tracker/config.json`
- **Synced report:** `~/.pi/skill-tracker/REPORT.md`
