---
name: debug-assist
description: Systematic debugging workflow for diagnosing and fixing issues. Follows a structured approach to isolate problems, form hypotheses, and verify fixes.
kind: sop
---

# Debug Assist

## Overview

A systematic debugging workflow for diagnosing issues and verifying fixes. Unlike `code-assist` which builds new features, this skill focuses on understanding and fixing existing broken behavior.

**When to use:**
- Something is broken and you need to understand why
- Tests are failing and root cause is unclear
- Production issue needs diagnosis
- Bug reports need investigation

**Difference from code-assist:**
- `code-assist` = "Build something new" (explore → plan → implement)
- `debug-assist` = "Fix something broken" (observe → hypothesize → test → fix)

## Parameters

- **issue_description** (required): What's broken? Error messages, unexpected behavior, symptoms
- **context** (optional): Codebase path, relevant files, recent changes
- **reproduction_steps** (optional): Known steps to reproduce the issue
- **logs_output** (optional): Relevant log output or error traces
- **mode** (optional, default: "interactive"): "interactive" (confirm each step) or "auto" (autonomous)

## Steps

### 1. Observe and Document

**Capture the symptoms:**
- What exactly is happening vs. what should happen?
- Error messages (full stack traces)
- When did it start? (recent changes, deployments)
- Who/what is affected?

**Constraints:**
- You MUST NOT jump to conclusions about the cause
- You MUST document the observed behavior before investigating
- You SHOULD capture screenshots/output for reference

### 2. Isolate the Problem

**Narrow down where the issue occurs:**
- Identify the minimal reproduction case
- Determine which component/layer is involved
- Check if it's environmental (works on my machine?)
- Binary search: comment out half the code, does it still break?

**Constraints:**
- You MUST test hypotheses one at a time
- You MUST keep a log of what you tried and the result
- You SHOULD use version control to checkpoint before experiments

### 3. Form Hypotheses

**Generate possible explanations:**
- What could cause this symptom?
- Rank by likelihood (Occam's razor: simplest first)
- Consider recent changes as prime suspects

**Common hypothesis categories:**
- Logic error (wrong condition, off-by-one)
- State issue (race condition, uninitialized variable)
- Data issue (corrupted input, schema mismatch)
- Environment issue (dependency version, config)
- Integration issue (API changed, contract broken)

### 4. Test Hypotheses

**Verify or falsify each hypothesis:**
- Design an experiment to test the hypothesis
- Make a minimal change to confirm/deny
- Use logging/debugging to inspect state
- Check assumptions (is this actually true?)

**Constraints:**
- You MUST change only one thing at a time
- You MUST predict the expected outcome before testing
- You MUST document results even if hypothesis is wrong
- You SHOULD use temporary debug logging liberally

### 5. Identify Root Cause

**Confirm the actual cause:**
- Which hypothesis was correct?
- Why did this happen? (not just what)
- What assumption was violated?

**Constraints:**
- You MUST verify the root cause produces the symptom
- You MUST understand why the fix will work
- You SHOULD check if this same issue exists elsewhere

### 6. Implement Fix

**Fix the root cause (not just the symptom):**
- Minimal change that fixes the issue
- Preserve existing behavior for non-broken cases
- Add regression test if possible

**Constraints:**
- You MUST NOT over-fix (address just this issue)
- You MUST verify the fix doesn't break other things
- You SHOULD clean up any debug logging added

### 7. Verify Fix

**Confirm the issue is resolved:**
- Reproduce the original scenario - does it work now?
- Run existing tests - all pass?
- Check edge cases - still handled?

**Constraints:**
- You MUST verify the specific reported issue is fixed
- You MUST run relevant test suites
- You SHOULD add a test that would have caught this bug

### 8. Document

**Record what was learned:**
- Root cause summary
- Fix applied
- Prevention (how to avoid similar issues)

**Output:**
- Debug log: what was tried, what worked
- Root cause analysis
- Fix description
- Recommendations for prevention

## Output Format

**debug-report.md:**
```markdown
# Debug Report: [Issue Title]

## Symptoms
- What was observed
- Expected vs actual behavior

## Investigation Log
| Step | Hypothesis | Test | Result |
|------|------------|------|--------|
| 1 | ... | ... | Confirmed/Refuted |

## Root Cause
[Explanation of the actual cause]

## Fix Applied
[What was changed]

## Verification
- [x] Original issue resolved
- [x] Tests pass
- [x] Edge cases handled

## Prevention
[How to avoid similar issues]
```

## Examples

### Debugging a failing test
```
/skill run debug-assist issue_description="Test 'should calculate total' fails with undefined error" context="~/project/src/cart.js" reproduction_steps="1. npm test 2. See failure in cart.test.js line 42"
```

### Debugging production issue
```
/skill run debug-assist issue_description="Users reporting 500 errors on checkout page since yesterday's deploy" logs_output="[paste relevant logs]"
```

## See Also

- [[code-assist]] - For building new features (not debugging)
- [[extract-memory]] - Capture learnings from debugging sessions
