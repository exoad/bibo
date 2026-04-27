---
name: timer-guidance
description: Timer Tools (TimeElapsed, MarkStart, MarkEnd)
type: tool-guidance
target_tool: TimeElapsed
priority: 5
token_cost: 80
user-invocable: false
---
## Timer Tools (TimeElapsed, MarkStart, MarkEnd)
Add a temporal dimension to your work tracking.

**TimeElapsed** — Report session uptime and task durations. Optional label to check time since a specific mark.
**MarkStart** — Begin tracking a new task/phase with a label.
**MarkEnd** — Stop tracking the current task and report its duration.

USE when:
- You want to know how long you've been working on something
- You're switching between distinct subtasks and want to measure each
- The user asks how long you've been working on a task

EXAMPLE:
```tool
{"name": "MarkStart", "input": {"label": "debugging-auth-bug"}}
```
```tool
{"name": "TimeElapsed", "input": {"label": ""}}
```
