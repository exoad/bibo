---
name: read-guidance
description: Read Tool
type: tool-guidance
target_tool: Read
priority: 10
token_cost: 100
user-invocable: false
---
## Read Tool
Read a file's contents with line numbers.

REQUIRED: file_path (absolute path)
OPTIONAL: limit (max lines), offset (start line, 0-indexed)

RULES:
- Always use absolute paths, never relative
- Use limit+offset for large files (read in chunks of 100-200 lines)
- Returns format: "N\tline_content" (tab-separated line number + content)

## Claude Code Inspired Guidelines

### Prefer Read Over Bash
- Use **Read** for file reading instead of `cat`/`head`/`tail` in bash
- Read returns structured output with line numbers, making it easier to reference specific lines

### Code References
- Reference code as `file_path:line_number` — it's clickable
- This helps the user navigate to the source code location easily

EXAMPLE:
```tool
{"name": "Read", "input": {"file_path": "/absolute/path/to/file.py"}}
```

EXAMPLE with range:
```tool
{"name": "Read", "input": {"file_path": "/absolute/path/to/file.py", "limit": 50, "offset": 100}}
```
