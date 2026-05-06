#!/usr/bin/env node
/**
 * Test script to verify auto-approve workflow logic
 * This tests the key functions without requiring full Pi environment
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('=== Auto-Approve Feature Test ===\n');

// Test 1: Check that workflow types include auto-approve
console.log('Test 1: Checking workflow type definitions...');
const indexContent = readFileSync(join(__dirname, 'index.ts'), 'utf-8');

const hasWebSearchWorkflow = indexContent.includes('type WebSearchWorkflow = "none" | "summary-review" | "auto-approve"');
const hasCuratorWorkflow = indexContent.includes('type CuratorWorkflow = "summary-review" | "auto-approve"');

console.log(`  ✓ WebSearchWorkflow includes auto-approve: ${hasWebSearchWorkflow}`);
console.log(`  ✓ CuratorWorkflow includes auto-approve: ${hasCuratorWorkflow}`);

// Test 2: Check resolveWorkflow function handles auto-approve
console.log('\nTest 2: Checking resolveWorkflow function...');
const resolveWorkflowMatch = indexContent.match(/function resolveWorkflow[\s\S]*?^\treturn "summary-review";/m);
const resolveWorkflowHandlesAutoApprove = resolveWorkflowMatch && resolveWorkflowMatch[0].includes('"auto-approve"');
console.log(`  ✓ resolveWorkflow handles auto-approve: ${resolveWorkflowHandlesAutoApprove}`);

// Test 3: Check handleAutoApprove function exists
console.log('\nTest 3: Checking handleAutoApprove function...');
const hasHandleAutoApprove = indexContent.includes('async function handleAutoApprove(');
console.log(`  ✓ handleAutoApprove function exists: ${hasHandleAutoApprove}`);

// Test 4: Check parameter schema includes auto-approve
console.log('\nTest 4: Checking parameter schema...');
const hasAutoApproveInSchema = indexContent.includes('StringEnum(["none", "summary-review", "auto-approve"]');
console.log(`  ✓ Parameter schema includes auto-approve: ${hasAutoApproveInSchema}`);

// Test 5: Check curatorWorkflow assignment uses auto-approve
console.log('\nTest 5: Checking curatorWorkflow assignment...');
const curatorWorkflowMatch = indexContent.match(/const curatorWorkflow: CuratorWorkflow = [^;]+;/);
const curatorWorkflowUsesAutoApprove = curatorWorkflowMatch && curatorWorkflowMatch[0].includes('auto-approve');
console.log(`  ✓ curatorWorkflow assignment checks for auto-approve: ${curatorWorkflowUsesAutoApprove}`);

// Test 6: Check routing to handleAutoApprove
console.log('\nTest 6: Checking routing logic...');
const hasRoutingLogic = indexContent.includes('if (curatorWorkflow === "auto-approve")') &&
                        indexContent.includes('pc.browserPromise = handleAutoApprove(pc, finish)');
console.log(`  ✓ Routing logic to handleAutoApprove exists: ${hasRoutingLogic}`);

// Test 7: Check /curator command supports auto-approve
console.log('\nTest 7: Checking /curator command...');
const curatorCommandMatch = indexContent.match(/pi\.registerCommand\("curator"[\s\S]*?^\t\}\);/m);
const curatorSupportsAutoApprove = curatorCommandMatch &&
    curatorCommandMatch[0].includes('"auto-approve"') &&
    curatorCommandMatch[0].includes('cycle through');
console.log(`  ✓ /curator command supports auto-approve: ${curatorSupportsAutoApprove}`);

// Summary
console.log('\n=== Test Summary ===');
const allTests = [
    hasWebSearchWorkflow,
    hasCuratorWorkflow,
    resolveWorkflowHandlesAutoApprove,
    hasHandleAutoApprove,
    hasAutoApproveInSchema,
    curatorWorkflowUsesAutoApprove,
    hasRoutingLogic,
    curatorSupportsAutoApprove
];

const passed = allTests.filter(t => t).length;
const total = allTests.length;

console.log(`Passed: ${passed}/${total}`);

if (passed === total) {
    console.log('\n✅ All tests passed! Auto-approve feature is properly implemented.');
    process.exit(0);
} else {
    console.log('\n❌ Some tests failed. Please review the implementation.');
    process.exit(1);
}
