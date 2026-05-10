---
name: code-assist-testing
description: Testing-focused coding workflow. Extends code-assist with enhanced test generation, coverage analysis, and test quality gates.
kind: sop
---

# Code Assist: Testing Focus

## Overview

A testing-focused extension of `code-assist` that prioritizes test quality, coverage, and test-driven development. Use this when tests are critical or when you need to improve an existing test suite.

**When to use:**
- Test coverage needs to meet a threshold (e.g., 80%+)
- Critical functionality needs comprehensive test cases
- Refactoring requires confidence from existing tests
- Adding tests to legacy code without tests
- Reviewing and improving test quality

**Difference from code-assist:**
- `code-assist` = General coding with TDD principles
- `code-assist-testing` = Testing-first with coverage gates, mutation testing, and test quality metrics

## Parameters

All `code-assist` parameters plus:
- **coverage_threshold** (optional, default: "80%"): Minimum code coverage required
- **test_types** (optional, default: "unit,integration"): Types to implement (unit, integration, e2e, property-based)
- **mutation_testing** (optional, default: false): Run mutation testing to verify test quality
- **enforce_tdd** (optional, default: true): Strict RED → GREEN → REFACTOR cycle

## Additional Steps (Beyond code-assist)

### T.1 Coverage Analysis

Before implementation, analyze current coverage:
- Run existing test suite with coverage
- Identify uncovered code paths
- Flag high-risk areas (complex logic, edge cases)

### T.2 Test Strategy

Define comprehensive test strategy:
- Unit tests for individual functions/classes
- Integration tests for component interactions
- Edge cases and boundary conditions
- Error paths and exception handling
- Property-based tests for invariants (if applicable)

### T.3 Test Quality Gates

After implementation, verify test quality:
- Coverage meets threshold
- All tests pass
- No flaky tests
- Mutation testing score (if enabled)
- Test execution time reasonable

### T.4 Test Documentation

Document test approach:
- What is covered and why
- Known gaps and rationale
- How to run tests
- CI/CD integration

## Output

- Test files with high coverage
- Coverage report
- Test strategy document
- Quality gate results

## See Also

- [[code-assist]] - General coding workflow
- [[debug-assist]] - When tests fail and you need to investigate
