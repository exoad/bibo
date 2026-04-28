---
name: write-guidance
description: Write Tool
type: tool-guidance
target_tool: Write
priority: 10
token_cost: 110
user-invocable: false
---
## Write Tool
Create a **new** file with the given content. Creates parent directories automatically.

REQUIRED: file_path (absolute), content (full file content)

**Write is for creating new files only.** If the file already exists, Write will be **refused** by the tool and return an error telling you to use Edit instead. Do not retry Write on the same path — it will be refused again.

EXAMPLE:
```tool
{"name": "Write", "input": {"file_path": "/tmp/example/new_module.py", "content": "def hello():\n    return 'hi'\n"}}
```
NOTE: Always use the EXACT file path given in the task, never a placeholder.
