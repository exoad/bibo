---
name: docs-generate
description: Generate documentation from code or scratch - READMEs, API docs, changelogs, and user guides. Complements codebase-summary which analyzes existing code.
kind: sop
---

# Docs Generate

## Overview

Generate documentation from existing code or from scratch. Unlike `codebase-summary` which analyzes and describes code, this skill creates publishable documentation artifacts.

**When to use:**
- Creating a README for a new project
- Generating API documentation from code
- Writing user guides or tutorials
- Creating changelogs from git history
- Documenting features for users (not developers)

**Difference from codebase-summary:**
- `codebase-summary` = Analyze code and describe architecture (for AI/developers)
- `docs-generate` = Create user-facing documentation (README, API docs, guides)

## Parameters

- **doc_type** (required): Type of documentation to generate
  - `readme` - Project README.md
  - `api` - API documentation
  - `changelog` - CHANGELOG.md from git history
  - `guide` - User guide or tutorial
  - `contributing` - CONTRIBUTING.md
  - `license` - LICENSE file
  - `custom` - Custom documentation type
- **source** (optional): Source material (code path, git repo, or description)
- **audience** (optional, default: "users"): Target audience (users, developers, contributors, maintainers)
- **style** (optional, default: "standard"): Documentation style (minimal, standard, comprehensive)
- **output_path** (optional): Where to save the generated documentation

## Steps

### 1. Analyze Source Material

**Understand what to document:**
- Read existing code (if generating from code)
- Review git history (if generating changelog)
- Gather requirements (if creating from scratch)
- Identify key features and capabilities

### 2. Determine Documentation Structure

**Choose appropriate structure for doc_type:**

**README structure:**
- Title and description
- Installation
- Quick start
- Usage examples
- Features
- Contributing
- License

**API documentation structure:**
- Overview
- Authentication
- Endpoints (grouped by resource)
- Request/response examples
- Error handling
- Rate limits

**Changelog structure:**
- Follows Keep a Changelog format
- Version headers
- Categories: Added, Changed, Deprecated, Removed, Fixed, Security

**User guide structure:**
- Introduction
- Prerequisites
- Step-by-step instructions
- Examples
- Troubleshooting
- FAQ

### 3. Generate Content

**Write documentation following best practices:**
- Clear, concise language
- Code examples where relevant
- Screenshots/diagrams if helpful
- Links to related docs
- Consistent formatting

**Constraints:**
- You MUST write for the specified audience
- You MUST include practical examples
- You MUST not include information you cannot verify
- You SHOULD follow established conventions for the doc_type

### 4. Review and Refine

**Quality check:**
- Is it accurate?
- Is it complete?
- Is it clear to the target audience?
- Are examples correct and runnable?

### 5. Output

**Save documentation:**
- Write to specified output_path
- Or return for user review
- Suggest where to place in project structure

## Examples

### Generate README
```
/skill run docs-generate doc_type=readme source="~/my-project" audience=users
```

### Generate API docs
```
/skill run docs-generate doc_type=api source="~/api-project/src" style=comprehensive
```

### Generate changelog
```
/skill run docs-generate doc_type=changelog source="~/project" output_path="~/project/CHANGELOG.md"
```

### Generate user guide
```
/skill run docs-generate doc_type=guide source="Feature X allows users to..." audience=users
```

## Output Formats

**README.md:**
Standard GitHub README with badges, installation, usage.

**API.md:**
Structured API reference with endpoints, parameters, examples.

**CHANGELOG.md:**
Keep a Changelog format with semantic versioning.

**GUIDE.md:**
Tutorial-style documentation with step-by-step instructions.

## See Also

- [[codebase-summary]] - Analyze existing code structure
- [[release-changelog]] - Cut releases and manage changelogs
- [[create-sop]] - Create SOP-style documentation
