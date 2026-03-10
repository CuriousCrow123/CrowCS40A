---
title: "feat: Add SubprogramAnimator widget for black-box subprogram demonstrations"
type: feat
status: active
date: 2026-03-10
deepened: 2026-03-10
---

# Add SubprogramAnimator Widget

## Enhancement Summary

**Deepened on:** 2026-03-10
**Agents used:** architecture-strategist, code-simplicity-reviewer, performance-oracle, kieran-typescript-reviewer, julik-frontend-races-reviewer, pattern-recognition-specialist, Context7 (Svelte 5 docs)

### Key Improvements
1. **Simplified animation** from 4 phases to 2 phases with single `animSpeed` param (matching BitOperator)
2. **Dropped YAGNI** — removed `formula?` prop and `label?` field, tightened `operation` to union type
3. **Eliminated CSS connectors** — spatial layout with optional arrow characters replaces complex pseudo-elements
4. **Added missing patterns** — unmount cleanup effect, CSS reduced-motion block, saveParams effect, CSS prefix `--subprog-*`
5. **Performance fix** — cancel token as plain `let` (not `$state`) to avoid Svelte proxy overhead
6. **Race condition prevention** — generation-keyed `{#each}` for output cards to prevent CSS transition ghosts on reset→animate

---

## Overview

Add a new `SubprogramAnimator` widget that visually demonstrates each MIPS subprogram as a "black box" — inputs flow in via argument registers, the operation executes (animated), and outputs emerge via return registers. This is **separate** from the existing code-focused widgets (ExecutionTracer, BitOperator, ShiftVisualizer) and serves as supplementary conceptual material showing the *what* (function signature) rather than the *how* (instruction-level execution).

## Problem Statement / Motivation

Students currently see subprograms through code-level widgets (ExecutionTracer stepping through instructions, BitOperator showing bit manipulation). What's missing is a high-level "function as a black box" view that reinforces:

- **Calling convention**: arguments go in `$a0`-`$a1`, results come out in `$v0`-`$v1`
- **Subprogram abstraction**: you don't need to know the internals to use it
- **Input/output mapping**: concrete values showing what goes in and what comes out

This mental model is critical before students dive into implementation details.

## Proposed Solution

Create a single reusable `SubprogramAnimator.svelte` widget that accepts variable-arity inputs/outputs and animates the data flow. Place one instance in each Act section (1-4) **before** the existing ExecutionTracer, giving students the conceptual overview first.

### Visual Design

```
┌─────────┐                    ┌──────────┐
│  $a0    │                    │   $v0    │
│ 0xF0F0  │   ──▶  [ NOR ]  ──▶  │ 0x0000   │
└─────────┘                    └──────────┘
┌─────────┐
│  $a1    │
│ 0x0F0F  │
└─────────┘
```

- **Left side**: Input register cards with register name + value
- **Center**: Operation box with subprogram name
- **Right side**: Output register cards with register name + value
- **Flow indicators**: Static arrow characters (`▶`) between groups — no CSS pseudo-element connectors
- **Animation**: Inputs highlight → pause → operation box glows + outputs appear
- **Responsive**: Left-to-right on desktop (≥52rem), top-to-bottom on mobile

### Four Instances

| Act | Subprogram | Inputs | Outputs | Operation |
|-----|-----------|--------|---------|-----------|
| Act 1 | NOR | `$a0=0xF0F0`, `$a1=0x0F0F` | `$v0=0x0000` | `NOR` |
| Act 2 | NAND | `$a0=0xF0F0`, `$a1=0x0F0F` | `$v0=0xFFFF` | `NAND` |
| Act 3 | Mult4 | `$a0=7` | `$v0=28` | `SLL` |
| Act 4 | Swap | `$a0=42`, `$a1=99` | `$v0=99`, `$v1=42` | `XOR Swap` |

Values match what each Act's ExecutionTracer already uses for consistency.

## Technical Considerations

### Architecture

- **One widget, four instances** — the `inputs` and `outputs` arrays handle arity differences via flexbox layout
- Each instance gets a unique `instanceId` (e.g., `subprog-nor`, `subprog-nand`, `subprog-mult4`, `subprog-swap`) to prevent localStorage param collision
- Follows all existing widget patterns: `paramDefs`, `loadParams`/`saveParams`, `WidgetDebugPanel`, `createReducedMotion()`, animation cancel tokens, `aria-live` announcements
- Uses scoped CSS custom properties with `--subprog-*` prefix (no global spatial tokens per CLAUDE.md separation rule)
- Props interface uses existing `DisplayRegister` type from `types.ts`
- Root element: `position: relative` (required for `.sr-only` positioning)
- Root CSS class: `.subprogram-animator`

### New Types (in `types.ts`)

```typescript
// Subprogram operation labels — constrained to known operations
export type SubprogramOp = 'NOR' | 'NAND' | 'SLL' | 'XOR Swap';

// A register bound to a display value (for the SubprogramAnimator black-box view)
export type RegisterBinding = {
  register: DisplayRegister;
  value: string;
};
```

> **Design decisions:**
> - Named `RegisterBinding` (not `RegisterIO`) — communicates "display binding" without implying I/O behavior
> - `value` is `string` not `number` — this is a display widget, values are pre-formatted (`"0xF0F0"`, `"42"`)
> - No `label?` field — input/output role is determined by which array the binding is in (YAGNI)
> - `operation` is a union type `SubprogramOp` not bare `string` — prevents typos, enables autocomplete
> - No separate `InputRegister`/`OutputRegister` subtypes — `DisplayRegister` already constrains to valid names, and pedagogical examples may use registers beyond `$a0-$a3`

### Widget API

```typescript
// Props
let {
  instanceId,
  inputs,
  outputs,
  operation,
}: {
  instanceId: string;
  inputs: RegisterBinding[];
  outputs: RegisterBinding[];
  operation: SubprogramOp;
} = $props();

// Exported methods (matches BitOperator API)
export function animate(): void;   // full animation sequence
export function showResult(): void; // instant reveal (reduced motion)
export function reset(): void;      // back to idle
```

> **No `formula?` prop** — the plan originally included `formula?: string` for sub-labels like "NOT(A OR B)", but this contradicts the black-box metaphor (the whole point is students don't need internals). The surrounding prose already explains the formula.

### paramDefs (concrete)

```typescript
const paramDefs: Param[] = [
  { name: 'cardSize',   value: 5,   unit: 'rem', category: 'style',    min: 3,   max: 8,    step: 0.5,  description: 'Register card width' },
  { name: 'fontSize',   value: 0.9, unit: 'rem', category: 'style',    min: 0.7, max: 1.3,  step: 0.05, description: 'Register value font size' },
  { name: 'gap',        value: 1,   unit: 'rem', category: 'style',    min: 0.5, max: 2,    step: 0.25, description: 'Gap between input/op/output groups' },
  { name: 'animSpeed',  value: 500, unit: 'ms',  category: 'behavior', min: 200, max: 1200, step: 50,   description: 'Delay between animation phases' },
];
```

> Single `animSpeed` param (not per-phase) — matches BitOperator's pattern. Nobody tunes Phase 1 vs Phase 2 independently.

### Animation Sequence (simplified: 2 phases)

1. **Idle**: Input cards visible with register names + values. Output cards hidden. Operation box muted.
2. **Phase 1** (immediate): Input cards highlight (accent border pulse via class toggle)
3. **Phase 2** (after `animSpeed` ms): Operation box glows (accent border + `transform: scale(1.03)`) + output cards fade in with values
4. **Done**: All elements visible, operation box retains subtle accent border

```typescript
// Cancel token as plain let (NOT $state — avoids unnecessary Svelte proxy overhead)
let animCancel: { canceled: boolean } | null = null;
let animGeneration = $state(0); // for keyed {#each} to prevent CSS transition ghosts

export function animate() {
  if (reducedMotion.current) { showResult(); return; }
  if (animCancel) animCancel.canceled = true;
  const token = { canceled: false };
  animCancel = token;

  animGeneration++;       // force fresh DOM nodes for output cards
  phase = 'highlighting'; // Phase 1: inputs highlight
  announcement = `Animating ${operation}: ${inputs.map(i => i.register + ' = ' + i.value).join(', ')}`;

  setTimeout(() => {
    if (token.canceled) return;
    phase = 'revealing';  // Phase 2: operation glows + outputs appear
    announcement = `Result: ${outputs.map(o => o.register + ' = ' + o.value).join(', ')}`;
  }, params.animSpeed);
}
```

> **Why generation-keyed output cards:** If user calls `reset()` then `animate()` rapidly, CSS transitions on output cards can be mid-fade when re-triggered. Using `{#each outputs as out (animGeneration + '-' + out.register)}` forces Svelte to create fresh DOM nodes, eliminating mid-transition ghosts.

> **Scale factor ≤1.05 on operation box** — larger values cause visible text blurriness from GPU texture rasterization. Use `1.03` for subtle emphasis.

### Reduced Motion (dual-layer)

**JS layer** (skips animation entirely):
```typescript
const reducedMotion = createReducedMotion();
// In animate(): if (reducedMotion.current) { showResult(); return; }
```

**CSS layer** (disables transitions on state changes):
```css
@media (prefers-reduced-motion: reduce) {
  .register-card, .op-box, .arrow {
    transition: none !important;
  }
}
```

> Both layers are required — matching BitOperator (line 291), ShiftVisualizer (line 380), ExecutionTracer (line 485).

### Required Effects

```typescript
// 1. Persist params on change (CRITICAL — commit 3ecf53d fixed this exact oversight)
$effect(() => {
  saveParams(instanceId, params, paramDefs);
});

// 2. Cleanup animation on unmount (prevents zombie timeouts)
$effect(() => {
  return () => { if (animCancel) animCancel.canceled = true; };
});
```

### SSR / Hydration

- SSR renders idle state (inputs visible, outputs hidden)
- Prose `button.action` elements use `disabled={!animator}` pattern (null-safe before hydration)
- Use existing `animator?.animate()` optional chaining pattern — do NOT introduce a separate `hydrated` flag (no precedent in codebase)

### Responsive Layout

- **Desktop (≥52rem)**: Horizontal flow — inputs left, arrow, operation center, arrow, outputs right (`flex-direction: row`)
- **Mobile (<52rem)**: Vertical flow — inputs top, arrow, operation middle, arrow, outputs bottom (`flex-direction: column`)
- Matches ExecutionTracer's responsive breakpoint at `52rem`

### Scoped Styles Structure

```css
.subprogram-animator {
  position: relative; /* for .sr-only */
  display: flex;
  align-items: center;
  gap: var(--subprog-gap);
  /* ... */
}

/* .sr-only MUST be defined in scoped styles (not global) — matches all widgets */
.sr-only { /* standard sr-only block */ }

@media (max-width: 52rem) {
  .subprogram-animator { flex-direction: column; }
}

@media (prefers-reduced-motion: reduce) {
  .register-card, .op-box { transition: none; }
}
```

## Acceptance Criteria

- [x] `SubprogramAnimator.svelte` widget created with all required patterns:
  - [x] `paramDefs` array (4 params: cardSize, fontSize, gap, animSpeed)
  - [x] `$state(loadParams(...))` + `$effect(() => saveParams(...))`
  - [x] `WidgetDebugPanel` included unconditionally
  - [x] `createReducedMotion()` JS guard + CSS `@media (prefers-reduced-motion: reduce)`
  - [x] Unmount cleanup `$effect` for cancel token
  - [x] Scoped CSS with `--subprog-*` prefix
  - [x] `.sr-only` aria-live region in scoped styles
  - [x] `position: relative` on root
- [x] `RegisterBinding` and `SubprogramOp` types added to `types.ts`
- [x] Sandbox page at `/sandbox/subprogram-animator.astro` with all four configurations
- [x] Widget integrated into Act1Nor, Act2Nand, Act3Mult4, Act4Swap sections
- [x] Each section has a prose `button.action` triggering `animator?.animate()`
- [x] Unique `instanceId` per Act (`subprog-nor`, `subprog-nand`, `subprog-mult4`, `subprog-swap`)
- [x] Animation plays correctly for all four arities (2→1, 2→1, 1→1, 2→2)
- [x] Generation-keyed `{#each}` on output cards to prevent CSS transition races
- [x] Responsive: horizontal on desktop, vertical on mobile at 52rem breakpoint
- [x] Screen reader announcements via `aria-live="polite"`
- [x] Values match each Act's existing ExecutionTracer data

## Implementation Plan

### Phase 1: Widget Core (`SubprogramAnimator.svelte`)

**Files:**
- `site/src/lib/types.ts` — add `RegisterBinding` and `SubprogramOp` types
- `site/src/components/widgets/SubprogramAnimator.svelte` — new widget

Tasks:
1. Add `RegisterBinding` and `SubprogramOp` types to `types.ts`
2. Create widget with `paramDefs` (4 params: cardSize, fontSize, gap, animSpeed)
3. Add `$state(loadParams(...))` and `$effect(() => saveParams(...))`
4. Build layout: input cards group → arrow → operation box → arrow → output cards group
5. Implement `animate()` with 2-phase setTimeout + plain `let` cancel token
6. Implement `showResult()` and `reset()` with `animGeneration++` for fresh DOM
7. Add `createReducedMotion()` JS guard
8. Add `aria-live="polite"` announcements in `.sr-only` region
9. Add `WidgetDebugPanel` with `bind:values` and `widgetId={instanceId}`
10. Add unmount cleanup `$effect` for cancel token
11. Add responsive CSS: `flex-direction: row` → `column` at `52rem`
12. Add `@media (prefers-reduced-motion: reduce)` CSS block

### Phase 2: Sandbox Page

**Files:**
- `site/src/pages/sandbox/subprogram-animator.astro` — new sandbox page

Tasks:
1. Create sandbox page showing all four configurations (NOR, NAND, SLL, XOR Swap)
2. Add control buttons to test animate/reset/showResult for each instance

### Phase 3: Section Integration

**Files:**
- `site/src/components/sections/project2/Act1Nor.svelte`
- `site/src/components/sections/project2/Act2Nand.svelte`
- `site/src/components/sections/project2/Act3Mult4.svelte`
- `site/src/components/sections/project2/Act4Swap.svelte`

Tasks:
1. Import SubprogramAnimator in each Act section
2. Add widget instance with correct inputs/outputs/operation props and unique `instanceId`
3. Place **before** the ExecutionTracer (after concept intro prose)
4. Add prose `button.action` with `disabled={!animator}` to trigger `animator?.animate()`
5. Wrap in `<Figure>` component with caption (e.g., "NOR as a black box: inputs → operation → output")

## Success Metrics

- Students can see the "what" (black box view) before the "how" (code trace) for each subprogram
- All four subprograms correctly show register-accurate inputs and outputs
- Animation is smooth, accessible, and responsive

## Dependencies & Risks

- **Low risk**: Pattern is well-established (BitOperator is the closest analog)
- **Eliminated risk**: CSS connectors replaced with static arrow characters — no responsive pseudo-element complexity
- **Section file growth**: Each Act section adds ~15 lines of imports + widget markup — acceptable

## Sources & References

- Closest pattern: `site/src/components/widgets/BitOperator.svelte` (animation cancel tokens, reduced motion, paramDefs)
- Register display: `site/src/components/widgets/ExecutionTracer.svelte` (register card styling, responsive breakpoint)
- Type system: `site/src/lib/types.ts` (DisplayRegister, RegisterState)
- Motion utility: `site/src/lib/motion.svelte.ts` (reduced motion detection)
- Widget params: `site/src/lib/params.ts` (loadParams/saveParams/Param interface)
- Known pitfall: `docs/solutions/build-errors/svelte5-runes-in-plain-ts-files.md` — utility files with runes must use `.svelte.ts` extension
- Prior fix: commit `3ecf53d` — saveParams effects were missing, now a required checklist item
