---
title: "feat: Make all interactive triggers reversible"
type: feat
status: completed
date: 2026-03-10
---

# feat: Make all interactive triggers reversible

## Overview

Every interactive trigger in the Project 2 visual essay is currently one-way — reveal toggles set a boolean to `true` with no way to undo, and widget action buttons (animate, reveal) have no companion reset. This plan adds reversibility to all 34 triggers across 8 section files.

## Problem Statement

Students exploring the visual essay cannot re-experience a reveal or reset a widget animation without refreshing the page. This hurts re-readability and makes the essay feel like a consumable rather than an explorable artifact. Every widget already exposes a `reset()` method — the infrastructure exists but is never wired to UI.

## Proposed Solution

Two mechanical changes applied uniformly:

1. **Reveal toggles (25 instances):** Change `onclick={() => revealX = true}` to `onclick={() => revealX = !revealX}`, update button text to reflect state, add `aria-expanded`.
2. **Widget action buttons (9 instances):** Add a companion reset button next to each forward-action button, calling the widget's existing `reset()` method.

No new widget APIs needed. ExecutionTracer (6 instances) is already bidirectional — no changes required.

## Technical Approach

### Category 1: Reveal Toggles

**Current pattern (all 25 identical):**
```svelte
let revealFoo = $state(false);
<!-- ... -->
<button class="action" onclick={() => revealFoo = true}>Contextual label</button>
<div class="reveal" data-open={revealFoo}>
  <div class="reveal-inner">...</div>
</div>
```

**New pattern:**
```svelte
let revealFoo = $state(false);
<!-- ... -->
<button class="action" onclick={() => revealFoo = !revealFoo} aria-expanded={revealFoo}>
  {revealFoo ? 'Hide' : 'Contextual label'}
</button>
<div class="reveal" data-open={revealFoo}>
  <div class="reveal-inner">...</div>
</div>
```

**Button text strategy:** Generic "Hide" when open, original contextual text when closed. Simplest to implement (no custom inverse labels), and the pedagogical value is in the original prompt text, not the collapse label.

**Files and instance counts:**

| File | Reveal variables |
|---|---|
| `Prologue.svelte` | `revealFormat` |
| `Act0Scaffold.svelte` | `revealOpen1`, `revealOpen2` |
| `Act1Nor.svelte` | `revealSurprise`, `revealWireUp`, `revealReflection` |
| `Act2Nand.svelte` | `revealPattern`, `revealComplete`, `revealMars`, `revealComparison` |
| `Act3Mult4.svelte` | `revealWhy`, `revealGeneralize`, `revealCode`, `revealReflection` |
| `Act4Swap.svelte` | `revealSelfInverse`, `revealChallenge`, `revealEdgeCase`, `revealMapping`, `revealConvention`, `revealHonesty`, `revealBookend` |
| `InterlSyscall.svelte` | `revealExit` |
| `Act6Verification.svelte` | `revealExit`, `revealPrintInt`, `revealReflection` |

### Category 2: Widget Reset Buttons

**Current pattern:**
```svelte
<button class="action" onclick={() => bitOp?.animate()}>animate the operation</button>
```

**New pattern:**
```svelte
<button class="action" onclick={() => bitOp?.animate()}>animate the operation</button>
<button class="action" onclick={() => bitOp?.reset()} aria-label="Reset bitwise operation">reset</button>
```

Reset buttons use the same `button.action` styling (inline text link style), keeping visual consistency. They appear inline immediately after the forward button, lowercase "reset" to match the prose tone.

**Instances:**

| Section | Widget ref | Forward call | Reset call |
|---|---|---|---|
| `Act1Nor.svelte` | `truthTable` | `reveal()` | `reset()` |
| `Act1Nor.svelte` | `bitOp` | `animate()` | `reset()` |
| `Act2Nand.svelte` | `truthTable` | `reveal()` | `reset()` |
| `Act3Mult4.svelte` | `shiftDemo` | `animate()` | `reset()` |
| `Act3Mult4.svelte` | `shiftMult4` | `animate()` | `reset()` |
| `Act3Mult4.svelte` | `codeEditor` | `revealAll()` | `reset()` |
| `Act4Swap.svelte` | `truthTable` | `reveal()` | `reset()` |
| `Act4Swap.svelte` | `bitOp` | `animate()` | `reset()` |
| `Act4Swap.svelte` | `codeEditor` | `revealAll()` | `reset()` |

**Reset semantics:** Use existing `reset()` methods as-is (full reset including localStorage for TruthTable and MipsEditor). Students can re-reveal with one click, and the "re-experience" loop is: reset → click forward again.

### Category 3: Accessibility Improvements

**3a. `aria-expanded` on all reveal toggle buttons** — communicates open/closed state to screen readers.

**3b. Specific `aria-label` on reset buttons** — e.g., "Reset NOR truth table", "Reset bitwise operation", "Reset shift visualizer", "Reset code editor". Prevents ambiguous "reset" labels when navigating by button list.

**3c. Reduced-motion rule for `.reveal` transitions** — add to `global.css`:
```css
@media (prefers-reduced-motion: reduce) {
  .reveal {
    transition: none;
  }
}
```

### Not In Scope

- **Section-level "Reset all" button** — deferred to future iteration. Individual controls are sufficient.
- **Conditional visibility of reset buttons** — would require adding `isDirty` properties to widgets. Always-visible reset buttons are simpler and widgets already handle idempotent `reset()` calls gracefully.
- **Nested widgets inside reveals** — confirmed: no reveal containers currently contain widget instances. No state-cascade logic needed.

## Acceptance Criteria

- [x] All 25 reveal toggles are reversible (click to show, click again to hide)
- [x] Button text shows "Hide" when content is visible, original label when hidden
- [x] All 9 widget forward-action buttons have a companion "reset" button
- [x] Reset buttons call the widget's existing `reset()` method
- [x] All reveal toggle buttons have `aria-expanded` attribute reflecting state
- [x] All reset buttons have descriptive `aria-label` values
- [x] `.reveal` transitions respect `prefers-reduced-motion: reduce`
- [x] Mid-animation reset works correctly (BitOperator, ShiftVisualizer)
- [x] TruthTable/MipsEditor reset clears localStorage (existing `reset()` behavior)
- [x] Rapid toggle of reveal containers causes no visual glitches
- [x] ExecutionTracer instances remain unchanged (already bidirectional)

## Implementation Phases

### Phase 1: Reveal toggles (25 instances, 8 files)
Mechanical find-and-replace across all section files:
1. Change `= true` to `= !revealX`
2. Add `aria-expanded={revealX}` to each button
3. Wrap button text in ternary: `{revealX ? 'Hide' : 'original text'}`

### Phase 2: Widget reset buttons (9 instances, 4 files)
Add companion reset buttons in Act1Nor, Act2Nand, Act3Mult4, Act4Swap.

### Phase 3: Accessibility polish
1. Add reduced-motion CSS rule to `global.css`
2. Verify `aria-label` values on all reset buttons

## Test Plan

- [ ] BitOperator: animate → reset mid-animation → animate again (verify clean restart)
- [ ] ShiftVisualizer: same mid-animation reset sequence
- [ ] TruthTable: reveal column → reset → refresh page (verify localStorage cleared)
- [ ] MipsEditor: reveal all → reset → refresh page (verify localStorage cleared)
- [ ] Rapid toggle: click reveal open/close 5+ times quickly (no visual glitch)
- [ ] Reduced motion: enable `prefers-reduced-motion`, verify instant transitions
- [ ] Screen reader: navigate by buttons, verify `aria-expanded` and `aria-label` are coherent

## Files to Modify

**Section files (reveal toggles + widget resets):**
- `site/src/components/sections/project2/Prologue.svelte`
- `site/src/components/sections/project2/Act0Scaffold.svelte`
- `site/src/components/sections/project2/Act1Nor.svelte`
- `site/src/components/sections/project2/Act2Nand.svelte`
- `site/src/components/sections/project2/Act3Mult4.svelte`
- `site/src/components/sections/project2/Act4Swap.svelte`
- `site/src/components/sections/project2/InterlSyscall.svelte`
- `site/src/components/sections/project2/Act6Verification.svelte`

**Styles:**
- `site/src/styles/global.css` — add reduced-motion rule for `.reveal`

**No widget file changes needed** — all `reset()` methods already exist.

## Sources

- All widget `reset()` methods confirmed via codebase audit
- Svelte 5 runes gotcha documented in `docs/solutions/build-errors/svelte5-runes-in-plain-ts-files.md` — relevant if any new reactive state is added (not expected for this feature)
