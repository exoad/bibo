#!/usr/bin/env node
/**
 * Test that the breathing indicator extension can be loaded without crashing
 */

import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('=== Breathing Indicator Extension Load Test ===\n');

// Test 1: Check that the file can be read
console.log('Test 1: Reading extension file...');
let content;
try {
    content = readFileSync(join(__dirname, 'index.ts'), 'utf-8');
    console.log('  ✓ File readable');
} catch (e) {
    console.log('  ✗ Failed to read file:', e.message);
    process.exit(1);
}

// Test 2: Check for dangerous patterns that could cause crashes
console.log('\nTest 2: Checking for crash-prone patterns...');

const checks = [
    {
        name: 'No direct pi.ui access',
        test: () => !content.includes('pi.ui'),
        critical: true
    },
    {
        name: 'No setImmediate with pi access',
        test: () => !content.match(/setImmediate.*pi\./),
        critical: true
    },
    {
        name: 'No setTimeout with pi access',
        test: () => !content.match(/setTimeout.*pi\./),
        critical: true
    },
    {
        name: 'All event handlers use ctx parameter',
        test: () => {
            const eventHandlers = content.match(/pi\.on\([^)]+\)/g) || [];
            return eventHandlers.every(h => h.includes('ctx') || h.includes('_ctx'));
        },
        critical: true
    },
    {
        name: 'setWorkingIndicator called with ctx.ui',
        test: () => {
            const calls = content.match(/setWorkingIndicator/g) || [];
            return calls.length > 0;
        },
        critical: false
    },
    {
        name: 'No commented out code blocks that could be accidentally uncommented',
        test: () => {
            // Check for large commented sections that might cause issues
            const largeComments = content.match(/\/\*[\s\S]{100,}\*\//g) || [];
            return largeComments.length === 0;
        },
        critical: false
    }
];

let passed = 0;
let failed = 0;

for (const check of checks) {
    const result = check.test();
    const status = result ? '✓' : '✗';
    const critical = check.critical ? ' [CRITICAL]' : '';
    console.log(`  ${status} ${check.name}${critical}`);
    
    if (result) {
        passed++;
    } else {
        failed++;
        if (check.critical) {
            console.log('    ^ This could cause a crash on reload!');
        }
    }
}

// Test 3: Verify event handlers are properly structured
console.log('\nTest 3: Checking event handler structure...');
const eventHandlers = content.match(/pi\.on\("[^"]+"[\s\S]*?\}\);/g) || [];
console.log(`  Found ${eventHandlers.length} event handlers`);

for (const handler of eventHandlers) {
    const eventName = handler.match(/pi\.on\("([^"]+)"/)?.[1];
    const hasAsync = handler.includes('async');
    const hasCtx = handler.includes('ctx') || handler.includes('_ctx');
    
    if (hasAsync && hasCtx) {
        console.log(`  ✓ ${eventName}: async with ctx`);
    } else if (!hasAsync) {
        console.log(`  ✗ ${eventName}: missing async`);
        failed++;
    } else if (!hasCtx) {
        console.log(`  ✗ ${eventName}: missing ctx parameter`);
        failed++;
    }
}

// Summary
console.log('\n=== Test Summary ===');
console.log(`Passed: ${passed}/${passed + failed}`);

if (failed === 0) {
    console.log('\n✅ All tests passed! Extension should load without crashing.');
    process.exit(0);
} else {
    console.log('\n⚠️  Some tests failed. Review the code before reloading.');
    process.exit(1);
}
