---
name: bash-guidance
type: tool-guidance
target_tool: Bash
priority: 10
token_cost: 120
user-invocable: false
---
## Bash Tool
Execute a shell command and return stdout+stderr.

REQUIRED: command (shell command string)
OPTIONAL: timeout (seconds, default 30 - use 120-300 for installs/builds)

RULES:
- Stateless: each call starts fresh (cd does not persist)
- Use absolute paths or chain with && (e.g. "cd /path && make")
- Use timeout=120 for: pip install, npm install, builds, downloads
- Returns combined stdout and stderr

## Claude Code Inspired Guidelines

### Prefer Dedicated Tools Over Bash
- Use **Grep** for content search instead of `grep`/`rg` in bash
- Use **Glob** for file search instead of `find`/`ls` in bash
- Use **Read** for file reading instead of `cat`/`head`/`tail` in bash
- Use **Edit** for file editing instead of `sed`/`awk` in bash
- Use **Write** for file writing instead of `echo`/`cat` in bash

### Git Safety
- NEVER update the git config
- NEVER run destructive git commands (push --force, reset --hard, checkout ., restore ., clean -f, branch -D) unless explicitly requested
- NEVER skip hooks (--no-verify, --no-gpg-sign, etc) unless explicitly requested
- NEVER force push to main/master — warn the user if they request it
- CRITICAL: Always create NEW commits rather than amending, unless explicitly requested
- When staging files, prefer adding specific files by name rather than "git add -A" or "git add ."
- NEVER commit changes unless the user explicitly asks you to
- Use HEREDOC for commit messages to ensure good formatting

### Executing Actions with Care
- Consider reversibility and blast radius before acting
- Ask for confirmation before risky actions: destructive operations, hard-to-reverse operations, actions visible to others
- Don't use destructive actions as shortcuts — fix root causes
- Investigate unexpected state before deleting or overwriting

EXAMPLE:
```tool
{"name": "Bash", "input": {"command": "ls -la /path/to/project/"}}
```

EXAMPLE with timeout:
```tool
{"name": "Bash", "input": {"command": "pip install requests", "timeout": 120}}
```
