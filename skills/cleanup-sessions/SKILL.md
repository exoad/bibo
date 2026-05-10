---
name: cleanup-sessions
description: Remove old pi session files to reclaim disk space
kind: sop
---

# Cleanup Sessions

## Overview

Delete old session JSONL files from `~/.pi/agent/sessions/` to reclaim disk space. Supports two cutoff modes: relative (N days ago) or absolute (specific date/time). Reports what will be removed before deleting, and summarizes results.

## Parameters

- **max_age_days** (optional, default: `7`): Delete sessions older than this many days. Ignored if `cutoff_date` is set.
- **cutoff_date** (optional): Absolute cutoff — delete sessions **before** this date. Accepts formats: `YYYY-MM-DD` or `YYYY-MM-DDTHH:MM:SSZ`. If set, `max_age_days` is ignored.
- **dry_run** (optional, default: `false`): If true, only report what would be deleted without removing files.
- **project_filter** (optional): Only clean sessions for a specific project directory (e.g., `--Users-jmeng-kibi--`). If omitted, all project directories are scanned.

## Steps

### 1. Locate sessions directory

Run:

```bash
du -sh ~/.pi/agent/sessions/
```

If the directory does not exist or is empty, report "No sessions found" and stop.

### 2. Determine cutoff and identify files to delete

**If `cutoff_date` is set (absolute mode):**
Create a reference file with the cutoff timestamp, then find sessions older than it:

```bash
touch -t "$(date -j -f '%Y-%m-%dT%H:%M:%SZ' '{cutoff_date}' '+%Y%m%d%H%M.%S' 2>/dev/null || date -j -f '%Y-%m-%d' '{cutoff_date}' '+%Y%m%d0000.00')" /tmp/_session_cutoff
find ~/.pi/agent/sessions/ -name "*.jsonl" ! -newer /tmp/_session_cutoff | wc -l
find ~/.pi/agent/sessions/ -name "*.jsonl" ! -newer /tmp/_session_cutoff -exec du -ch {} + | tail -1
rm -f /tmp/_session_cutoff
```

**If `max_age_days` is set (relative mode, default 7):**

```bash
find ~/.pi/agent/sessions/ -name "*.jsonl" -mtime +{max_age_days} | wc -l
find ~/.pi/agent/sessions/ -name "*.jsonl" -mtime +{max_age_days} -exec du -ch {} + | tail -1
```

If `project_filter` is set, scope the find to that subdirectory (e.g., `~/.pi/agent/sessions/{project_filter}/`).

Note: If the `find` command is wrapped by rtk (which does not support compound predicates like `! -newer`), use a shell script or `xargs` pipeline instead.

### 3. Report findings

Show:

- Number of files that match the age threshold
- Total size that would be freed
- Breakdown by project directory (`du -sh ~/.pi/agent/sessions/*/`)

### 4. Confirm or skip

If **dry_run** is true, stop after step 3 and report "Dry run complete — no files deleted."

Otherwise, proceed to deletion.

### 5. Delete old sessions

**If `cutoff_date` is set (absolute mode):**

```bash
touch -t "$(date -j -f '%Y-%m-%dT%H:%M:%SZ' '{cutoff_date}' '+%Y%m%d%H%M.%S' 2>/dev/null || date -j -f '%Y-%m-%d' '{cutoff_date}' '+%Y%m%d0000.00')" /tmp/_session_cutoff
find ~/.pi/agent/sessions/ -name "*.jsonl" ! -newer /tmp/_session_cutoff -print0 | xargs -0 rm -v
rm -f /tmp/_session_cutoff
```

**If `max_age_days` is set (relative mode):**

```bash
find ~/.pi/agent/sessions/ -name "*.jsonl" -mtime +{max_age_days} -print0 | xargs -0 rm -v
```

Note: If the `find` command is wrapped by rtk (which does not support compound predicates), pipe through `xargs -0 rm` as shown above.

### 6. Verify and report results

Run:

```bash
du -sh ~/.pi/agent/sessions/
du -sh ~/.pi/agent/sessions/*/
```

Report:

- Before size → After size → Freed
- Which project directories were emptied
- How many files were removed

## Troubleshooting

- **"find: -delete not supported"**: The rtk wrapper blocks compound predicates. Use `find ... -print0 | xargs -0 rm` instead.
- **Permission denied**: Sessions are owned by the current user — this should not occur. If it does, check file ownership with `ls -la`.
- **No files found**: All sessions are within the age threshold. Consider increasing `max_age_days` or running with `dry_run: false` to confirm.

## Examples

Clean sessions older than 7 days (default):

```
/skill run cleanup-sessions
```

Clean sessions older than 3 days:

```
/skill run cleanup-sessions max_age_days=3
```

Clean sessions before a specific date:

```
/skill run cleanup-sessions cutoff_date=2026-05-01
```

Clean sessions before a specific date and time:

```
/skill run cleanup-sessions cutoff_date=2026-05-07T00:00:00Z
```

Preview what would be deleted (no actual removal):

```
/skill run cleanup-sessions dry_run=true
```

Only clean kibi project sessions:

```
/skill run cleanup-sessions project_filter=--Users-jmeng-kibi--
```
