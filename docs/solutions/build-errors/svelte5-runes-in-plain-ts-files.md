---
title: "Svelte 5 runes silently fail in plain .ts files"
category: build-errors
tags: [svelte5, runes, astro, hydration, bind-this]
module: widgets
symptom: "Widget buttons permanently disabled; bind:this refs stay undefined; no visible error"
root_cause: "Utility file using $state/$effect had .ts extension instead of .svelte.ts — runes not compiled"
date: 2026-03-10
---

# Svelte 5 Runes Silently Fail in Plain .ts Files

## Symptom

Interactive buttons in Astro+Svelte sections stayed permanently disabled after hydration. Specifically:
- BitOperator's "animate the operation" button — broken
- ShiftVisualizer's "animate the shift" button — broken
- RegisterFile's step/back/reset buttons — worked fine
- TruthTable's "reveal" button — worked fine

The broken widgets shared one thing: they imported `createReducedMotion()` from `lib/motion.ts`.

## Investigation

1. Checked all `bind:this` refs — all correctly used `$state<>()` pattern
2. Checked all `disabled={!ref}` guards — all present
3. Checked widget `export function` declarations — all correct
4. Inspected compiled JS output via dev server — **found the bug**

```javascript
// Compiled output of motion.ts (plain .ts file)
// $state and $effect are NOT compiled — left as raw function calls
let reduced = $state(mql.matches);  // ReferenceError: $state is not defined
$effect(() => { ... });              // ReferenceError: $effect is not defined
```

vs. the correct output after renaming to `.svelte.ts`:

```javascript
// Compiled output of motion.svelte.ts
// Runes properly compiled by Svelte compiler
let reduced = $.tag($.state($.proxy(mql.matches)), 'reduced');
$.user_effect(() => { ... });
```

## Root Cause

Svelte 5 runes (`$state`, `$effect`, `$derived`, `$props`) are **compiler keywords**, not runtime functions. The Svelte compiler transforms them into internal reactive primitives. But the compiler only processes:
- `.svelte` files (components)
- `.svelte.ts` / `.svelte.js` files (utility modules)

A plain `.ts` file passes through Vite/TypeScript unchanged. The `$state()` and `$effect()` calls remain as literal function calls, which throw `ReferenceError` at runtime because no such global functions exist.

The error was **silent** because:
1. During SSR, the `createReducedMotion()` function returns early (`typeof window === 'undefined'`), so SSR succeeds
2. During hydration, the error occurs inside Astro's island hydration wrapper, which catches and logs the error to the console but doesn't show anything visible to the user
3. The component simply fails to hydrate — all `bind:this` refs stay `undefined`, all `disabled={!ref}` guards stay true

## Fix

Rename the file and update imports:

```bash
mv site/src/lib/motion.ts site/src/lib/motion.svelte.ts
```

```diff
- import { createReducedMotion } from '../../lib/motion';
+ import { createReducedMotion } from '../../lib/motion.svelte';
```

## Prevention

- **Rule**: Any `.ts` utility file that uses `$state`, `$effect`, `$derived`, or `$props` must use the `.svelte.ts` extension
- This is now documented in CLAUDE.md under "Svelte 5 runes in utility files"
- The Svelte compiler emits a warning for `.svelte` files but NOT for `.ts` files that misuse runes (since it never sees them)

## Debugging Tip

If `bind:this` refs are `undefined` after hydration and buttons stay disabled, check:
1. Browser console for hydration errors (Astro catches them silently)
2. Compiled JS output via dev server (`curl http://localhost:PORT/src/lib/suspect-file.ts`) — if you see raw `$state()` calls, the file needs `.svelte.ts` extension
