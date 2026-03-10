---
title: "Fix broken interactions & register-centric pedagogical redesign"
type: feat
status: active
date: 2026-03-10
origin: docs/plans/2026-03-09-feat-project2-pedagogical-narrative-plan.md
---

# Fix Broken Interactions & Register-Centric Pedagogical Redesign

## Overview

Two problems: (1) action buttons don't work until Svelte hydration completes — users click "Reveal answer" and nothing happens; (2) the RegisterFile widget is only used in Act 4 but should be the **central pedagogical tool** across all acts, showing how each instruction transforms register state step by step.

## Problem 1: Broken Button Interactions

### Root Cause

Astro's `client:visible` hydration means Svelte components are SSR'd without JavaScript. Buttons appear clickable but onclick handlers don't exist until hydration completes. Two categories:

- **Widget-ref buttons** (e.g., `truthTable?.reveal()`) — already have `disabled={!ref}` guard, so they render as disabled in SSR. ✓ Correct behavior.
- **Reveal-toggle buttons** (e.g., `() => revealOpen = true`) — render as enabled in SSR but do **nothing** when clicked. ✗ Broken UX.

### Fix

Add a `hydrated` flag to each section component:

```typescript
let hydrated = $state(false);
$effect(() => { hydrated = true; });
```

Apply `disabled={!hydrated}` to ALL action buttons that depend on JavaScript state. This makes buttons visually disabled until hydration completes, matching the widget-ref button behavior.

**Files to modify:** Act0Scaffold, Act1Nor, Act2Nand, Act3Mult4, Act4Swap, Act5Deliverables, Act6Verification (all 7 sections).

### Acceptance Criteria

- [ ] All action buttons in all 7 sections render as `disabled` during SSR
- [ ] All buttons become enabled after Svelte hydration
- [ ] Reveal buttons work correctly after hydration

---

## Problem 2: Register Table as Central Pedagogical Focus

### Current State

RegisterFile is used only in Act 4 (Swap) with 6 steps. Acts 0-3 have no register visualization — students can't see how instructions change register state.

### Vision

Every act should have a **register execution trace** as its centerpiece. The register table shows:
1. **What registers are involved** (which ones matter for this instruction)
2. **What's being READ** (source operands — highlighted in a "read" color)
3. **What's being WRITTEN** (destination register — highlighted in a "write" color)
4. **The before/after values** (what changed and to what)

This creates a consistent visual language: "look at the register table to understand what any instruction does."

### Enhanced RegisterFile Widget

#### New Step Type

```typescript
interface Step {
  instruction: string;        // MIPS instruction text
  registers: RegisterState;   // register values AFTER this step
  reading?: MipsRegister[];   // registers being READ (source operands)
  changed?: MipsRegister[];   // registers being WRITTEN (destination)
  annotation?: string;        // explanation text
}
```

- `reading` — highlighted with a distinct "source" style (e.g., subtle blue border/glow)
- `changed` — highlighted with the existing "write" flash animation (accent color)
- Both can be active simultaneously, showing data flow: "read from here → write to there"

#### Visual Design for Attention Direction

1. **Reading registers**: Blue/cyan left-border + slightly brightened background. Label shows "(source)" below register name.
2. **Writing registers**: Accent flash animation (existing) + bold value + "(dest)" label.
3. **Unchanged registers**: Default muted style — fades into background so student focuses on what matters.
4. **Instruction bar**: Current instruction highlighted with register names color-coded to match their read/write highlighting.

#### Sub-step Support (Optional Enhancement)

For complex instructions, steps can be broken into sub-steps. For example, `nor $v0, $a0, $a1`:
- Sub-step 1: Highlight $a0 and $a1 as "reading" — annotation: "ALU reads source registers"
- Sub-step 2: Highlight $v0 as "writing" with new value — annotation: "Result written to $v0"

This is achieved by having multiple Step entries per instruction, with the same instruction text but different reading/changed arrays. The annotation guides attention.

### Register Traces Per Act

#### Act 0: Scaffold — The Call/Return Mechanism

Show how `jal` and `jr $ra` work with registers:

```typescript
const scaffoldSteps: Step[] = [
  { instruction: 'Before jal NOR', registers: { '$a0': '?', '$a1': '?', '$v0': '?', '$ra': '?' }, annotation: 'Registers before calling a subprogram' },
  { instruction: 'jal NOR', registers: { '$a0': '?', '$a1': '?', '$v0': '?', '$ra': '0x0040002C' }, changed: ['$ra'], annotation: 'jal saves return address in $ra automatically' },
  { instruction: '(inside NOR...)', registers: { '$a0': '?', '$a1': '?', '$v0': 'result', '$ra': '0x0040002C' }, changed: ['$v0'], annotation: 'Subprogram writes result to $v0' },
  { instruction: 'jr $ra', registers: { '$a0': '?', '$a1': '?', '$v0': 'result', '$ra': '0x0040002C' }, reading: ['$ra'], annotation: 'jr reads $ra to know where to return' },
];
```

Registers shown: `$a0, $a1, $v0, $ra`

#### Act 1: NOR — Single Instruction Trace

```typescript
const norSteps: Step[] = [
  { instruction: 'Initial', registers: { '$a0': '0xF0F0F0F0', '$a1': '0x0F0F0F0F', '$v0': '?' }, annotation: 'Caller loaded arguments into $a0 and $a1' },
  { instruction: 'nor $v0, $a0, $a1', registers: { '$a0': '0xF0F0F0F0', '$a1': '0x0F0F0F0F', '$v0': '0x00000000' }, reading: ['$a0', '$a1'], changed: ['$v0'], annotation: 'Read $a0 and $a1 → NOR → write to $v0' },
  { instruction: 'jr $ra', registers: { '$a0': '0xF0F0F0F0', '$a1': '0x0F0F0F0F', '$v0': '0x00000000' }, reading: ['$ra'], annotation: 'Return to caller with result in $v0' },
];
```

Registers shown: `$a0, $a1, $v0`

This is the simplest possible trace — ONE instruction that reads two registers and writes one. The register table makes the data flow crystal clear.

#### Act 2: NAND — Two Instruction Trace (Composition)

```typescript
const nandSteps: Step[] = [
  { instruction: 'Initial', registers: { '$a0': '0xFF00FF00', '$a1': '0xFFFF0000', '$v0': '?' }, annotation: 'Arguments loaded by caller' },
  { instruction: 'and $v0, $a0, $a1', registers: { '$a0': '0xFF00FF00', '$a1': '0xFFFF0000', '$v0': '0xFF000000' }, reading: ['$a0', '$a1'], changed: ['$v0'], annotation: 'Step 1: AND the inputs → intermediate result in $v0' },
  { instruction: 'not $v0, $v0', registers: { '$a0': '0xFF00FF00', '$a1': '0xFFFF0000', '$v0': '0x00FFFFFF' }, reading: ['$v0'], changed: ['$v0'], annotation: 'Step 2: NOT the intermediate → $v0 is both source AND destination' },
  { instruction: 'jr $ra', registers: { '$a0': '0xFF00FF00', '$a1': '0xFFFF0000', '$v0': '0x00FFFFFF' }, annotation: 'Return with NAND result' },
];
```

Key pedagogical moment: Step 2 has `$v0` in BOTH `reading` and `changed` — the same register is source and destination. The widget should show both highlights simultaneously with a special visual treatment (e.g., "read → overwrite" annotation).

#### Act 3: Mult4 — Shift Trace

```typescript
const mult4Steps: Step[] = [
  { instruction: 'Initial', registers: { '$a0': '7', '$v0': '?' }, annotation: 'Caller loaded value to multiply' },
  { instruction: 'sll $v0, $a0, 2', registers: { '$a0': '7', '$v0': '28' }, reading: ['$a0'], changed: ['$v0'], annotation: 'Read $a0 (7) → shift left by 2 → write 28 to $v0' },
  { instruction: 'jr $ra', registers: { '$a0': '7', '$v0': '28' }, annotation: 'Return: 7 × 4 = 28 ✓' },
];
```

Simplest body trace — ONE instruction, same pattern as NOR but with shift instead of logic.

#### Act 4: Swap — Keep Existing but Enhanced

The existing 6-step swap trace is good. Enhance with `reading` arrays:

```typescript
// Step 1 enhancement:
{ instruction: 'xor $a0, $a0, $a1', ..., reading: ['$a0', '$a1'], changed: ['$a0'] }
// Step 2:
{ instruction: 'xor $a1, $a0, $a1', ..., reading: ['$a0', '$a1'], changed: ['$a1'] }
// etc.
```

### Implementation Phases

#### Phase 1: Fix Hydration (all 7 sections)
- [ ] Add `hydrated` state + `$effect` to each section
- [ ] Add `disabled={!hydrated}` to all reveal-toggle buttons
- [ ] Verify: buttons disabled in SSR, enabled after hydration

#### Phase 2: Enhance RegisterFile Widget
- [ ] Add `reading?: MipsRegister[]` to Step type in types.ts
- [ ] Add `.reading` CSS class with distinct visual treatment (blue border/glow)
- [ ] Support simultaneous read + write highlighting on same register
- [ ] Add color-coded register names in instruction bar (optional)
- [ ] Add `prefers-reduced-motion` override for new animations

#### Phase 3: Add Register Traces to Acts 0-3
- [ ] Act 0: Add scaffold call/return register trace (4 steps, 4 registers)
- [ ] Act 1: Add NOR execution trace (3 steps, 3 registers)
- [ ] Act 2: Add NAND execution trace (4 steps, 3 registers)
- [ ] Act 3: Add Mult4 execution trace (3 steps, 2 registers)

#### Phase 4: Enhance Act 4 Swap Trace
- [ ] Add `reading` arrays to existing swap steps
- [ ] Verify read+write highlighting works for XOR self-modification

#### Phase 5: Build Verification
- [ ] `npm run build` passes
- [ ] All 9 pages render correctly
- [ ] All buttons functional after hydration
- [ ] Register traces step correctly in all acts

## Technical Notes

- RegisterFile WIDGET_ID stays `'register-file'` (shared params across instances)
- Each instance gets unique `instanceId` for state persistence
- The `reading` highlight should use a different CSS animation than `changed` to create visual distinction
- For registers that are both reading AND changed (like `not $v0, $v0`), show a combined style: read-border + write-flash
- Keep existing widget API backward-compatible (reading is optional)

## Files Modified

### Widget
- `site/src/lib/types.ts` — Add `reading` field to Step interface
- `site/src/components/widgets/RegisterFile.svelte` — Add read highlighting CSS + derived state

### Sections (all 7)
- `site/src/components/sections/project2/Act0Scaffold.svelte` — hydration fix + register trace
- `site/src/components/sections/project2/Act1Nor.svelte` — hydration fix + register trace
- `site/src/components/sections/project2/Act2Nand.svelte` — hydration fix + register trace
- `site/src/components/sections/project2/Act3Mult4.svelte` — hydration fix + register trace
- `site/src/components/sections/project2/Act4Swap.svelte` — hydration fix + enhanced trace
- `site/src/components/sections/project2/Act5Deliverables.svelte` — hydration fix
- `site/src/components/sections/project2/Act6Verification.svelte` — hydration fix
