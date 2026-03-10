---
title: "Project 2: Visual Essay Implementation"
type: feat
status: completed
date: 2026-03-09
origin: docs/brainstorms/2026-03-09-conceptual-tree-brainstorm.md
deepened: 2026-03-09
---

# Project 2: Visual Essay Implementation

## Enhancement Summary

**Deepened on:** 2026-03-09
**Research agents used:** 8 (Svelte animation patterns, accessibility, architecture strategy, frontend races, code simplicity, TypeScript review, framework docs, performance)

### Key Improvements from Research

1. **CRITICAL: Hydration safety** — All action buttons calling `bind:this` refs must use `?.` + `disabled={!ref}` guard to prevent crashes before Astro hydration completes
2. **CRITICAL: Animation cancellation** — All `setTimeout`-based animations (BitOperator, ShiftVisualizer) must use cancellation tokens to prevent ghost state on `reset()`
3. **Type safety** — `Line` type refactored from optional booleans to discriminated union; register keys typed with `MipsRegister` union
4. **State separation** — Widget tuning params (`params.ts`) kept separate from student interaction state (new `state.ts`)
5. **CSS reveal fix** — Replaced `max-height: 2000px` hack with `grid-template-rows: 0fr/1fr` for smooth transitions
6. **Accessibility** — `hidden` attribute for unrevealed content, `aria-live="polite"` regions for announcements, 44x44px touch targets
7. **Reduced motion** — Shared `motion.ts` utility; swap `fly`/`slide` transitions for `fade` when `prefers-reduced-motion` is active
8. **Callout border-radius** — Fixed hardcoded `8px` to use `var(--radius-md)` per architecture rules

### New Files Discovered During Research

```
site/src/lib/motion.ts    # NEW — shared prefers-reduced-motion reactive utility
site/src/lib/state.ts     # NEW — student interaction state persistence (separate from params)
site/src/lib/types.ts     # NEW — shared types (MipsRegister, Line, Step, BitOperation)
```

---

## Overview

Implement the pedagogical narrative from `docs/plans/2026-03-09-feat-project2-pedagogical-narrative-plan.md` as an interactive visual essay using the CrowCode Astro 5 + Svelte 5 architecture. The essay teaches CS 40A students to implement four MIPS subprograms (NOR, NAND, Mult4, Swap) through faded worked examples with interactive widgets.

## Problem Statement / Motivation

The narrative plan exists as a detailed markdown document but has no interactive delivery vehicle. Students benefit from:
- **Active recall** via truth tables with hidden answers they reveal after thinking
- **Visual traces** of register states during XOR swap and bitwise operations
- **Incremental code building** where each line appears only after its concept is activated
- **Immediate feedback** through animated bit operations and shift visualizations

The existing CrowCode architecture (tokens, params, widgets, sections, Figure, action buttons) provides the exact infrastructure needed.

## Design Decisions

Resolved from SpecFlow analysis (see brainstorm origin):

| Decision | Choice | Rationale |
|----------|--------|-----------|
| MipsEditor mode | **Read-only with progressive reveal** | Students code in MARS; the essay is a learning companion, not an IDE |
| Page structure | **Continuous scroll with inline reveals** | Matches existing section-based architecture; simpler than gated wizard |
| TruthTable interaction | **Reveal mode** (click to show pre-filled answers) | Simpler implementation; pedagogically sufficient with prose-driven thinking prompts |
| NOR/NAND comparison | **Stacked code blocks with visual alignment** | No new layout component needed; works on mobile |
| Widget state persistence | **localStorage per widget instance** (separate from param tuning) | Students may work across sessions; reset button per section |
| Reveal gating | **No artificial delay** — prose encourages thinking first | Friction mechanisms add complexity without guaranteed benefit |
| Bit width display | **Fixed 4-bit** for all visualizers | Pedagogical clarity; 32-bit generalization handled in prose |
| RegisterFile stepping | **Bidirectional** (forward + back) | XOR swap intermediate states are confusing; re-examination is valuable |

## Technical Approach

### Architecture

```
site/src/
  lib/
    params.ts                    # EXISTING — widget tuning params (dev-facing)
    tokens.ts                    # EXISTING — spatial design tokens
    state.ts                     # NEW — student interaction state persistence
    motion.ts                    # NEW — shared prefers-reduced-motion utility
    types.ts                     # NEW — shared types (MipsRegister, Line, Step, etc.)
  components/
    widgets/
      MipsEditor.svelte          # NEW — code viewer with line-by-line reveal
      TruthTable.svelte          # NEW — interactive boolean truth table
      BitOperator.svelte         # NEW — bitwise operation visualizer
      RegisterFile.svelte        # NEW — register state step-through
      ShiftVisualizer.svelte     # NEW — bit shift animation
    sections/
      project2/
        Act0Scaffold.svelte      # NEW — subprogram scaffold recall
        Act1Nor.svelte           # NEW — NOR fully worked example
        Act2Nand.svelte          # NEW — NAND completion problem
        Act3Mult4.svelte         # NEW — Mult4 guided problem
        Act4Swap.svelte          # NEW — Swap independent problem
        Act5Deliverables.svelte  # NEW — file deliverables
        Act6Verification.svelte  # NEW — test harness + verification
  pages/
    project2.astro               # NEW — main essay page
    sandbox/
      mips-editor.astro          # NEW
      truth-table.astro          # NEW
      bit-operator.astro         # NEW
      register-file.astro        # NEW
      shift-visualizer.astro     # NEW
  styles/
    global.css                   # MODIFY — add .question, .reveal, .callout styles
```

**Total: 5 widgets + 7 sections + 6 pages + 3 lib files + 1 CSS update = 22 files**

### Mandatory Architecture Patterns (from research)

#### Pattern 1: Hydration-Safe Action Buttons

**CRITICAL.** All `<button class="action">` elements in sections that call `bind:this` references must guard against null refs before Astro hydration completes. SSR renders the button HTML before Svelte hydrates.

```svelte
<!-- REQUIRED pattern for ALL action buttons in sections -->
<button class="action" onclick={() => widget?.setCount(42)} disabled={!widget}>
  set to 42
</button>
```

- `?.` prevents `TypeError` if button is clicked before hydration
- `disabled={!widget}` prevents the "click but nothing happens" experience
- Once Svelte hydrates and `bind:this` assigns the reference, `disabled` is reactively removed

#### Pattern 2: Animation Cancellation Token

**CRITICAL.** All widgets using `setTimeout` chains (BitOperator, ShiftVisualizer) must cancel in-progress animations on `reset()` or re-`animate()`.

```typescript
let animCancel = $state<{ canceled: boolean } | null>(null);

export function animate() {
  if (animCancel) animCancel.canceled = true;
  const token = { canceled: false };
  animCancel = token;

  for (let i = 0; i < bitWidth; i++) {
    setTimeout(() => {
      if (token.canceled) return;
      resultBits[i] = computeBit(i);
    }, i * params.animSpeed);
  }
}

export function reset() {
  if (animCancel) animCancel.canceled = true;
  animCancel = null;
  // clear state...
}

// Cleanup on unmount
$effect(() => {
  return () => { if (animCancel) animCancel.canceled = true; };
});
```

#### Pattern 3: Widget Instance ID as Prop

Unlike Counter (which hardcodes `WIDGET_ID`), all new widgets accept `instanceId` as a prop. The instance ID is used directly (no widget-type prefix — IDs are already unique).

```typescript
let { instanceId, ...otherProps }: { instanceId: string; /* ... */ } = $props();
// Used in: loadParams(instanceId, paramDefs) and <WidgetDebugPanel widgetId={instanceId}>
```

#### Pattern 4: Separate State from Params

Student interaction state (reveals, steps) uses `state.ts`, NOT `params.ts`. This prevents WidgetDebugPanel "Reset all" from clearing student progress.

```typescript
// site/src/lib/state.ts
const STATE_PREFIX = 'widget-state-';

export function loadState<T>(instanceId: string, defaults: T): T {
  if (typeof localStorage === 'undefined') return defaults;
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_PREFIX + instanceId) ?? 'null');
    return saved ? { ...defaults, ...saved } : defaults;
  } catch { return defaults; }
}

export function saveState<T extends Record<string, unknown>>(instanceId: string, state: T): void {
  if (typeof localStorage === 'undefined') return;
  try { localStorage.setItem(STATE_PREFIX + instanceId, JSON.stringify(state)); }
  catch { /* quota exceeded — silently fail */ }
}

export function clearState(instanceId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STATE_PREFIX + instanceId);
}
```

### Implementation Phases

#### Phase 1: Foundation — CSS + Shared Utilities

##### 1A: CSS additions to `global.css`

```css
/* Question callouts — visually distinct from regular prose */
.question {
  border-left: 3px solid var(--color-accent);
  padding-left: 1em;
  margin-block: 1.5em;
  font-style: italic;
  color: var(--color-text);
}

/* Reveal containers — smooth height transition using grid trick */
.reveal {
  display: grid;
  grid-template-rows: 0fr;
  transition: grid-template-rows var(--transition-normal);
}
.reveal[data-open="true"] {
  grid-template-rows: 1fr;
}
.reveal > .reveal-inner {
  overflow: hidden;
}

/* Callout boxes for important notes, MARS notes, edge cases */
.callout {
  background: var(--color-bg-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-md);
  padding: 1em 1.25em;
  margin-block: 1.5em;
  font-size: 0.9em;
}
.callout strong:first-child {
  color: var(--color-accent);
}

/* Insight highlight — for key "aha" moments */
.insight {
  background: color-mix(in srgb, var(--color-highlight) 10%, transparent);
  border-left: 3px solid var(--color-highlight);
  padding: 0.75em 1em;
  margin-block: 1.5em;
}

/* Screen-reader-only utility */
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
}
```

##### 1B: Shared types — `site/src/lib/types.ts`

```typescript
// MIPS register names — typed for autocomplete and typo prevention
export type MipsRegister =
  | '$zero' | '$at'
  | '$v0' | '$v1'
  | '$a0' | '$a1' | '$a2' | '$a3'
  | '$t0' | '$t1' | '$t2' | '$t3' | '$t4' | '$t5' | '$t6' | '$t7'
  | '$s0' | '$s1' | '$s2' | '$s3' | '$s4' | '$s5' | '$s6' | '$s7'
  | '$t8' | '$t9'
  | '$gp' | '$sp' | '$fp' | '$ra';

// MipsEditor line — discriminated union prevents impossible states
export type Line =
  | { kind: 'visible'; code: string; comment?: string; emphasized?: boolean }
  | { kind: 'hidden';  code: string; comment?: string }
  | { kind: 'blank';   hint?: string };

// TruthTable — strict binary values for truth table cells
export type TruthValue = 0 | 1;
export type Column = { header: string; values: TruthValue[] };

// BitOperator operations — split unary/binary for arity safety
export type BinaryBitOp = 'NOR' | 'NAND' | 'AND' | 'OR' | 'XOR';
export type UnaryBitOp = 'NOT';
export type BitOperation = BinaryBitOp | UnaryBitOp;

// RegisterFile step — typed register keys
export type RegisterState = Partial<Record<MipsRegister, string>>;
export type Step = {
  instruction: string;
  registers: RegisterState;
  changed?: MipsRegister[];
  annotation?: string;
};
```

##### 1C: Reduced motion utility — `site/src/lib/motion.ts`

```typescript
/**
 * Reactive prefers-reduced-motion detector.
 * Call during component initialization. Returns object with reactive `current` property.
 */
export function createReducedMotion() {
  if (typeof window === 'undefined') return { get current() { return false; } };

  const mql = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = $state(mql.matches);

  $effect(() => {
    const handler = (e: MediaQueryListEvent) => { reduced = e.matches; };
    mql.addEventListener('change', handler);
    return () => mql.removeEventListener('change', handler);
  });

  return { get current() { return reduced; } };
}
```

##### 1D: State persistence utility — `site/src/lib/state.ts`

(See Pattern 4 above for implementation.)

#### Phase 2: Core Widgets

Build widgets in dependency order. Each widget follows the Counter.svelte pattern with the new mandatory patterns (instanceId prop, animation cancellation, state.ts for interaction state).

##### 2A: MipsEditor.svelte

The backbone widget — used in every act.

**paramDefs:**
```typescript
const paramDefs: Param[] = [
  { name: 'fontSize',    value: 0.875, unit: 'rem', category: 'style', min: 0.625, max: 1.5,  step: 0.0625, description: 'Code font size' },
  { name: 'lineHeight',  value: 1.6,   unit: '',    category: 'style', min: 1.2,   max: 2.4,  step: 0.1,    description: 'Line height multiplier' },
  { name: 'padding',     value: 1.25,  unit: 'rem', category: 'style', min: 0.5,   max: 3,    step: 0.25,   description: 'Container padding' },
  { name: 'borderRadius',value: 8,     unit: 'px',  category: 'style', min: 0,     max: 16,   step: 1,      description: 'Corner rounding' },
  { name: 'gutterWidth', value: 2.5,   unit: 'rem', category: 'style', min: 1.5,   max: 4,    step: 0.25,   description: 'Line number gutter width' },
];
```

**Props (via $props) — using discriminated Line union:**
```typescript
import type { Line } from '../../lib/types';

let { instanceId, lines, title }: {
  instanceId: string;
  lines: Line[];
  title?: string;
} = $props();
```

**State (separate from params):**
```typescript
import { loadState, saveState } from '../../lib/state';

// Interaction state — persisted for student progress
let revealedLines = $state(new Set<number>(
  loadState<number[]>(instanceId + '-revealed', [])
));
let highlightedLine = $state<number | null>(null);

// Persist reveals on change
$effect(() => {
  saveState(instanceId + '-revealed', [...revealedLines]);
});
```

**Exported API:**
```typescript
export function revealLine(n: number)    // Reveal a specific hidden line
export function revealAll()              // Reveal all hidden lines
export function highlightLine(n: number) // Flash-highlight a specific line
export function reset()                  // Re-hide all lines, clear highlights, clear saved state
```

**Rendering:**
- Dark background (`--color-bg-raised`), monospace font (`--font-mono`)
- Line numbers in gutter (muted color)
- Syntax highlighting via CSS classes: `.kw` (keywords/mnemonics), `.reg` (registers), `.num` (immediates), `.dir` (directives), `.lbl` (labels), `.cmt` (comments)
- Hidden lines: use `hidden` attribute (removes from accessibility tree). Show a blurred placeholder maintaining layout.
- Blank lines show hint text in accent color
- Revealed lines animate in with `in:fade` (respects reduced motion via `motion.ts`)
- Optional title bar above code block
- `aria-live="polite"` region announces newly revealed lines for screen readers

**Accessibility (from research):**
```html
<figure role="figure" aria-labelledby="{instanceId}-label">
  <figcaption id="{instanceId}-label" class="sr-only">{title}, {totalLines} lines</figcaption>
  <pre><code><!-- lines here --></code></pre>
</figure>
<div aria-live="polite" class="sr-only" id="{instanceId}-announce"></div>
```

**Files:** `site/src/components/widgets/MipsEditor.svelte`, `site/src/pages/sandbox/mips-editor.astro`

##### 2B: TruthTable.svelte

**paramDefs:**
```typescript
const paramDefs: Param[] = [
  { name: 'cellSize',     value: 2.5, unit: 'rem', category: 'style', min: 1.5, max: 4,  step: 0.25, description: 'Cell width/height' },
  { name: 'fontSize',     value: 0.9, unit: 'rem', category: 'style', min: 0.7, max: 1.4, step: 0.05, description: 'Table font size' },
  { name: 'headerSize',   value: 0.75,unit: 'rem', category: 'style', min: 0.6, max: 1.2, step: 0.05, description: 'Header font size' },
  { name: 'borderRadius', value: 6,   unit: 'px',  category: 'style', min: 0,   max: 12,  step: 1,    description: 'Table corner rounding' },
  { name: 'gap',          value: 0,   unit: 'px',  category: 'style', min: 0,   max: 4,   step: 1,    description: 'Cell gap (border-spacing)' },
];
```

**Props — using strict TruthValue type:**
```typescript
import type { Column } from '../../lib/types';

let { instanceId, columns, revealColumns }: {
  instanceId: string;
  columns: Column[];
  revealColumns?: number[];    // Indices of columns that start hidden
} = $props();
```

**Validation (from TypeScript review):**
```typescript
// Runtime check: all columns must have same number of values
if (columns.length > 0) {
  const expected = columns[0].values.length;
  const bad = columns.find(c => c.values.length !== expected);
  if (bad) throw new Error(`Column "${bad.header}" has ${bad.values.length} rows, expected ${expected}`);
}
```

**Exported API:**
```typescript
export function reveal()                // Reveal all hidden columns
export function revealColumn(n: number) // Reveal a specific column
export function highlightRow(n: number) // Highlight a specific row
export function reset()
```

**Rendering:**
- HTML `<table>` with `<th>`, `<td>`, `<caption>` (semantic, accessible)
- Hidden cells use `hidden` attribute, show "?" placeholder
- On reveal: use `aria-expanded` on trigger button, `aria-live="polite"` announces result
- Minimum cell size 44x44px for touch targets (WCAG 2.5.5 AAA)
- Highlighted rows get accent border-left via CSS transition on `background-color`

**Files:** `site/src/components/widgets/TruthTable.svelte`, `site/src/pages/sandbox/truth-table.astro`

##### 2C: BitOperator.svelte

**paramDefs:**
```typescript
const paramDefs: Param[] = [
  { name: 'bitSize',      value: 2.5, unit: 'rem', category: 'style', min: 1.5, max: 3.5, step: 0.25, description: 'Individual bit cell size (min 44px for touch)' },
  { name: 'fontSize',     value: 1,    unit: 'rem', category: 'style', min: 0.7, max: 1.5, step: 0.05, description: 'Bit value font size' },
  { name: 'gap',          value: 0.5,  unit: 'rem', category: 'style', min: 0,   max: 1.5, step: 0.125,description: 'Gap between rows' },
  { name: 'animSpeed',    value: 400,  unit: 'ms',  category: 'behavior', min: 100, max: 1000, step: 50, description: 'Per-bit animation delay' },
  { name: 'borderRadius', value: 4,    unit: 'px',  category: 'style', min: 0,   max: 12,  step: 1,    description: 'Bit cell rounding' },
];
```

**Props — using typed BitOperation:**
```typescript
import type { BinaryBitOp } from '../../lib/types';

let { instanceId, valueA, valueB, operation, bitWidth = 4 }: {
  instanceId: string;
  valueA: number;
  valueB: number;
  operation: BinaryBitOp;  // NOT is unary — use a different widget or guard
  bitWidth?: number;
} = $props();
```

**Exported API (with cancellation token pattern — MANDATORY):**
```typescript
export function animate()    // Animate bit-by-bit operation (MSB to LSB)
export function showResult() // Show result immediately (no animation)
export function reset()      // Cancel animation + clear result
export function setValues(a: number, b: number)
```

**Animation pattern:**
- Check `prefers-reduced-motion` once before starting chain — if reduced, call `showResult()` instead
- Use cancellation token pattern (see Pattern 2)
- `$effect` cleanup cancels on unmount
- Use `in:fade` for each revealed bit (safe for vestibular issues); swap to instant reveal on reduced motion
- Color: 0-bits get `var(--color-text-muted)`, 1-bits get `var(--color-accent)`
- Use `transform: scale()` + `opacity` for bit cell animation (GPU-composited, no layout thrashing)

**Accessibility:**
- `aria-live="polite"` region announces per-bit results: "Bit 3: 1 NOR 1 equals 0"
- Focus stays on "Animate" button so user can press Enter to restart

**Files:** `site/src/components/widgets/BitOperator.svelte`, `site/src/pages/sandbox/bit-operator.astro`

##### 2D: RegisterFile.svelte

**paramDefs:**
```typescript
const paramDefs: Param[] = [
  { name: 'fontSize',     value: 0.875, unit: 'rem', category: 'style', min: 0.7, max: 1.3, step: 0.05, description: 'Register value font size' },
  { name: 'labelSize',    value: 0.75,  unit: 'rem', category: 'style', min: 0.6, max: 1,   step: 0.05, description: 'Register name font size' },
  { name: 'cellPadding',  value: 0.75,  unit: 'rem', category: 'style', min: 0.25,max: 1.5, step: 0.125,description: 'Cell padding' },
  { name: 'gap',          value: 0.5,   unit: 'rem', category: 'style', min: 0,   max: 1.5, step: 0.125,description: 'Gap between register cells' },
  { name: 'borderRadius', value: 6,     unit: 'px',  category: 'style', min: 0,   max: 12,  step: 1,    description: 'Cell corner rounding' },
];
```

**Props — using typed MipsRegister and Step:**
```typescript
import type { MipsRegister, Step } from '../../lib/types';

let { instanceId, registers, steps }: {
  instanceId: string;
  registers: MipsRegister[];
  steps: Step[];              // First step should be { instruction: 'Initial', registers: {...} }
} = $props();
```

**State:**
```typescript
let currentStep = $state(0);  // 0 = initial state (first step), not -1
```

**Design note (from architecture review):** Include an explicit initial state as `steps[0]` with `instruction: 'Initial'` rather than using `currentStep = -1` as a special case. This eliminates conditional rendering logic.

**Exported API:**
```typescript
export function step()             // Advance to next step
export function stepBack()         // Go to previous step
export function goToStep(n: number)
export function reset()            // Back to step 0 (initial state)
```

**Rendering:**
- Horizontal row of register "cards" (name on top, value below)
- Current instruction shown above register cards
- Step indicator: "Step 2 of 5" with prev/next buttons (min 44x44px)
- Changed registers use CSS `animation: flash 300ms` (not `transition`) to prevent overlap on rapid stepping
- Annotation text shown below register cards when present
- Register values can be symbolic (A, B, A XOR B) or numeric

**Accessibility:**
- `role="region"` with `aria-labelledby` pointing to heading
- Step indicator uses `aria-live="polite"` + `aria-atomic="true"`
- Changed registers announced via live region: "Register $a0 changed to A XOR B"
- Focus stays on Next/Previous button between steps

**Files:** `site/src/components/widgets/RegisterFile.svelte`, `site/src/pages/sandbox/register-file.astro`

##### 2E: ShiftVisualizer.svelte

**paramDefs:**
```typescript
const paramDefs: Param[] = [
  { name: 'bitSize',      value: 2.5,  unit: 'rem', category: 'style', min: 1.5, max: 4,   step: 0.25, description: 'Bit cell size' },
  { name: 'fontSize',     value: 1,    unit: 'rem', category: 'style', min: 0.7, max: 1.5, step: 0.05, description: 'Bit value font size' },
  { name: 'gap',          value: 0.75, unit: 'rem', category: 'style', min: 0,   max: 2,   step: 0.125,description: 'Gap between before/after rows' },
  { name: 'animSpeed',    value: 300,  unit: 'ms',  category: 'behavior', min: 100, max: 800, step: 50, description: 'Shift animation duration' },
  { name: 'borderRadius', value: 4,    unit: 'px',  category: 'style', min: 0,   max: 12,  step: 1,    description: 'Bit cell rounding' },
];
```

**Props:**
```typescript
let { instanceId, value, shiftAmount, direction = 'left', bitWidth = 4 }: {
  instanceId: string;
  value: number;
  shiftAmount: number;
  direction?: 'left' | 'right';
  bitWidth?: number;
} = $props();
```

**Exported API (with cancellation token — MANDATORY):**
```typescript
export function animate()     // Animate the shift (uses cancellation token)
export function showResult()  // Show result immediately
export function reset()       // Cancel animation + hide result
export function setValue(n: number)
```

**Animation:**
- Custom Svelte transition: `css: (t) => transform: translateX(${...})` for bit sliding
- On `prefers-reduced-motion`: instant display with static highlight on new zero-filled positions
- Use cancellation token pattern (same as BitOperator)

**Rendering:**
- "Before" row: original bits with decimal equivalent
- Arrow indicators showing shift direction and amount
- "After" row: shifted bits with new zeros highlighted in accent color
- Bits that "fall off" the edge shown fading out (overflow visualization)
- Decimal equivalents: "5 (0101) << 2 = 20 (10100)" shown as labels

**Files:** `site/src/components/widgets/ShiftVisualizer.svelte`, `site/src/pages/sandbox/shift-visualizer.astro`

#### Phase 3: Sections (Narrative Acts)

Each section follows the InteractiveDemo.svelte pattern: `<section>` with `.prose` divs, `<Figure>`-wrapped widgets, and `<button class="action">` for interaction.

**MANDATORY for all sections:** Use hydration-safe action buttons (Pattern 1).

##### 3A: Act0Scaffold.svelte

**Prose content:** Adapts Act 0 from the narrative plan.
- Three recall questions about subprogram structure (with reveal answers using `.reveal` + `.reveal-inner`)
- "What happens if you forget `jr $ra`?" callout
- MipsEditor showing the scaffold template (all lines `kind: 'visible'`, no hidden content)
- Note about `.text` directive and comment format

**Widgets used:** MipsEditor (1 instance, fully visible template)

##### 3B: Act1Nor.svelte

**Prose content:** Adapts Act 1 — the fully worked NOR example.
1. NOR truth table warm-up with TruthTable widget (output column hidden → reveal)
2. "Apply NOR bitwise" with BitOperator widget (0b1010 NOR 0b1100, animated)
3. "The surprise: `nor` is a real instruction" insight callout
4. "Wire it up" question → reveal the instruction
5. Complete NOR subprogram in MipsEditor (fully annotated, all visible)
6. Post-subprogram reflection question

**Widgets used:** TruthTable, BitOperator, MipsEditor

##### 3C: Act2Nand.svelte

**Prose content:** Adapts Act 2 — NAND completion problem.
1. Pattern recognition prompt (expect "use a `nand` instruction" — but there isn't one)
2. NAND truth table with TruthTable widget
3. Completion problem: MipsEditor with `and` line visible (`kind: 'visible'`), Step 2 as blank slot (`kind: 'blank'`)
4. "What single instruction completes NAND?" → reveal `not $v0, $v0`
5. MARS note callout about pseudo-instruction expansion
6. **Cross-subprogram comparison:** NOR and NAND code shown stacked with visual alignment (two MipsEditor instances)
7. Structural comparison question + reveal

**Widgets used:** TruthTable, MipsEditor (2 instances — completion + comparison view)

##### 3D: Act3Mult4.svelte

**Prose content:** Adapts Act 3 — Mult4 guided problem.
1. Constraint statement and "Why multiply without multiply?" question
2. Decimal analogy (42 → 420)
3. "Shift 0101 left by 1" with ShiftVisualizer widget
4. "4 = 2^? → shift by 2" generalization question
5. Predict before coding: ShiftVisualizer with value=3, shift=2
6. Guided MipsEditor (header visible, body `kind: 'hidden'`, student derives `sll $v0, $a0, 2`)
7. Edge case note callout about overflow
8. "How would you multiply by 8?" reflection

**Widgets used:** ShiftVisualizer (2 instances: ×2 demo and ×4 prediction), MipsEditor

##### 3E: Act4Swap.svelte

**Prose content:** Adapts Act 4 — Swap independent problem (most complex).
1. XOR truth table recall with TruthTable
2. Self-inverse property discovery with BitOperator (0b0110 XOR 0b1100 = 0b1010)
3. "Swap without a temporary register" challenge question
4. XOR swap algorithm trace with RegisterFile (6 steps: initial + 3 XOR + 2 MOVE)
5. Edge case: $a0 = $a1 trace (separate question with reveal)
6. Register mapping confusion warning (assignment lines 12 vs. 13)
7. "Why modifying $a0/$a1 is OK" callout about calling convention
8. "Honesty about XOR swap" — could skip XOR and just use MOVEs (`.insight` callout)
9. Complete Swap reference in MipsEditor (`kind: 'hidden'` lines, revealed after student attempts)
10. Narrative bookend reflection

**Widgets used:** TruthTable, BitOperator, RegisterFile, MipsEditor

**Performance note (from architecture review):** Act 4 is the heaviest section with 4 widget instances. If scroll jank occurs during testing when this section enters viewport, split into `Act4SwapXor.svelte` + `Act4SwapTrace.svelte` with separate `client:visible` boundaries.

##### 3F: Act5Deliverables.svelte

**Prose content:** Adapts Act 5 — file deliverables.
1. Preamble update: two MipsEditor instances showing before/after
2. Subprogram ordering note
3. Checklist of what to submit

**Widgets used:** MipsEditor (2 instances — before/after preamble)

##### 3G: Act6Verification.svelte

**Prose content:** Adapts Act 6 — verification epilogue.
1. Complete test harness in MipsEditor
2. Expected output description
3. "Step through in MARS and check register values" guidance
4. Final reflection question about which subprogram taught them the most

**Widgets used:** MipsEditor (1 instance — test harness code)

#### Phase 4: Page Assembly

##### project2.astro

```astro
---
import EssayLayout from '../layouts/EssayLayout.astro';
import Act0Scaffold from '../components/sections/project2/Act0Scaffold.svelte';
import Act1Nor from '../components/sections/project2/Act1Nor.svelte';
import Act2Nand from '../components/sections/project2/Act2Nand.svelte';
import Act3Mult4 from '../components/sections/project2/Act3Mult4.svelte';
import Act4Swap from '../components/sections/project2/Act4Swap.svelte';
import Act5Deliverables from '../components/sections/project2/Act5Deliverables.svelte';
import Act6Verification from '../components/sections/project2/Act6Verification.svelte';
---

<EssayLayout title="Project 2: MIPS Subprograms" description="A concept-first walkthrough of NOR, NAND, Mult4, and Swap">
  <Act0Scaffold client:visible />
  <Act1Nor client:visible />
  <Act2Nand client:visible />
  <Act3Mult4 client:visible />
  <Act4Swap client:visible />
  <Act5Deliverables client:visible />
  <Act6Verification client:visible />
</EssayLayout>
```

##### Sandbox pages

Each follows the `sandbox/counter.astro` pattern: BaseLayout + single widget instance with `client:load` + update sandbox index.

#### Phase 5: Integration + Polish

- Update `site/src/pages/sandbox/index.astro` with links to all 5 new sandbox pages
- Test all reveal interactions across all 7 sections
- Verify TOC auto-generates from all section `<h2 id="...">` elements
- Test `prefers-reduced-motion`: verify animations swap to fade/instant, not just disabled
- Verify localStorage persistence: refresh page → reveals stay revealed; param reset does NOT clear reveals
- Test mobile responsiveness: 44px+ touch targets, horizontal scroll on code blocks, stacked truth tables
- Verify hydration safety: all action buttons disabled until widget refs resolve
- Verify animation cancellation: click reset mid-animation on BitOperator/ShiftVisualizer

## Widget Instance ID Scheme

Multiple instances of the same widget type need unique IDs for localStorage. IDs are passed as the `instanceId` prop (no widget-type prefix needed — IDs are already unique).

| Widget | Section | Instance ID |
|--------|---------|-------------|
| MipsEditor | Act 0 | `mips-scaffold` |
| TruthTable | Act 1 | `tt-nor` |
| BitOperator | Act 1 | `bitop-nor` |
| MipsEditor | Act 1 | `mips-nor` |
| TruthTable | Act 2 | `tt-nand` |
| MipsEditor | Act 2 | `mips-nand-completion` |
| MipsEditor | Act 2 | `mips-nand-compare` |
| ShiftVisualizer | Act 3 (×2) | `shift-demo` |
| ShiftVisualizer | Act 3 (×4) | `shift-mult4` |
| MipsEditor | Act 3 | `mips-mult4` |
| TruthTable | Act 4 | `tt-xor` |
| BitOperator | Act 4 | `bitop-xor` |
| RegisterFile | Act 4 | `regfile-swap` |
| MipsEditor | Act 4 | `mips-swap` |
| MipsEditor | Act 5 (before) | `mips-preamble-before` |
| MipsEditor | Act 5 (after) | `mips-preamble-after` |
| MipsEditor | Act 6 | `mips-test-harness` |

**localStorage keys:**
- Param tuning: `widget-params-{instanceId}` (developer-facing, cleared by WidgetDebugPanel reset)
- Interaction state: `widget-state-{instanceId}` (student-facing, cleared by per-section reset)

## MIPS Syntax Highlighting

Simple CSS-class-based highlighting (no external library needed):

```typescript
// site/src/lib/mips-tokenizer.ts
type TokenType = 'kw' | 'reg' | 'num' | 'dir' | 'lbl' | 'cmt' | 'text';
type MipsToken = { type: TokenType; text: string };

export function tokenizeMipsLine(code: string): MipsToken[] {
  // Order matters — comments consume the rest of the line
  // 1. Comments: /#.*$/
  // 2. Directives: /\.[a-z]+/
  // 3. Labels: /^\w+:/
  // 4. Registers: /\$[a-z0-9]+/
  // 5. Numbers: /\b\d+\b|0x[0-9a-f]+/i
  // 6. Keywords: /\b(nor|and|or|xor|not|sll|srl|sra|move|jr|jal|li|la|lw|sw|add|addi|addu|addiu|sub|subu|mul|div|syscall|beq|bne)\b/
  // 7. Everything else: plain text
}
```

Colors (in MipsEditor's `<style>`):
- `.kw` → `var(--color-accent)` (blue)
- `.reg` → `var(--color-highlight)` (orange)
- `.num` → `var(--color-success)` (green)
- `.dir` → `var(--color-text-muted)` (gray)
- `.lbl` → `var(--color-text)` (white, bold)
- `.cmt` → `var(--color-text-muted)` (gray, italic)

**Performance note (from review):** Tokenizer runs once on mount per MipsEditor instance. 9 instances × ~20 lines × ~10 regex matches = ~1,800 operations — well under 1ms total. No memoization needed. Ensure tokenization is mount-only, not re-triggered on state changes.

## Acceptance Criteria

### Functional Requirements

- [x] All 5 widgets render correctly in their sandbox pages
- [x] All 7 sections render in project2.astro with correct prose and widget composition
- [x] TruthTable: hidden columns reveal on action button click in prose
- [x] BitOperator: bit-by-bit animation plays on action button click
- [x] ShiftVisualizer: shift animation plays on action button click
- [x] RegisterFile: step forward/back through XOR swap trace
- [x] MipsEditor: hidden lines reveal incrementally via action buttons
- [x] MipsEditor: blank slots show hint text until revealed
- [x] MipsEditor: MIPS syntax highlighting (keywords, registers, numbers, comments, directives, labels)
- [x] Cross-subprogram comparison (NOR vs NAND) renders as stacked code blocks
- [x] TOC auto-generates from all section h2 elements
- [x] All action buttons in prose trigger correct widget methods

### Non-Functional Requirements

- [x] All widgets follow paramDefs pattern with WidgetDebugPanel
- [x] No widget references global spatial tokens
- [x] All animations respect `prefers-reduced-motion` (swap to fade/instant, not just disabled)
- [x] Widget interaction state persists in localStorage (separate from param tuning state)
- [x] Mobile responsive: code blocks scroll horizontally, truth tables fit in viewport
- [x] All interactive elements keyboard-accessible with visible focus indicators
- [x] All action buttons use hydration-safe pattern (`?.` + `disabled={!ref}`)
- [x] All animations use cancellation token pattern (no ghost state on reset)
- [x] Touch targets minimum 44x44px (WCAG 2.5.5 AAA)
- [x] `aria-live="polite"` regions announce state changes for screen readers
- [x] Unrevealed content uses `hidden` attribute (not `aria-hidden`)

### Content Requirements (from narrative plan)

- [x] Every line of assembly preceded by concept activation question
- [x] Faded scaffolding: NOR=full, NAND=completion, Mult4=guided, Swap=independent
- [x] Scaffold template taught once (Act 0) and referenced in subsequent acts
- [x] NOR→NAND structural comparison explicitly prompted
- [x] Swap register mapping confusion warned about (lines 12 vs. 13)
- [x] Edge cases addressed: $a0=$a1 for XOR swap, overflow for Mult4
- [x] File preamble update shown with before/after
- [x] Verification epilogue provides test harness

## Sources & References

### Origin

- **Brainstorm document:** [docs/brainstorms/2026-03-09-conceptual-tree-brainstorm.md](docs/brainstorms/2026-03-09-conceptual-tree-brainstorm.md) — 212 atomic concepts across 8 layers
- **Narrative plan:** [docs/plans/2026-03-09-feat-project2-pedagogical-narrative-plan.md](docs/plans/2026-03-09-feat-project2-pedagogical-narrative-plan.md) — detailed concept activation sequences for all 7 acts

### Internal References

- Widget pattern: `site/src/components/widgets/Counter.svelte`
- Section pattern: `site/src/components/sections/example/InteractiveDemo.svelte`
- Param system: `site/src/lib/params.ts`
- Token system: `site/src/lib/tokens.ts`
- Architecture rules: `CLAUDE.md`

### External References

- Assignment: `project2_assignment.txt`
- MARS reference: `docs/mars-mips-reference.md`
- Existing utils.asm: `utils.asm` (Charles Kann's utility subprograms)

### Research References (from deepening)

- [Svelte 5 Transition Docs](https://svelte.dev/docs/svelte/transition)
- [Svelte 5 $effect Docs](https://svelte.dev/docs/svelte/$effect)
- [Accessible Svelte Transitions — Geoff Rich](https://geoffrich.net/posts/accessible-svelte-transitions/)
- [W3C ARIA Grid Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/grid/)
- [W3C ARIA Disclosure Pattern](https://www.w3.org/WAI/ARIA/apg/patterns/disclosure/)
- [MDN ARIA Live Regions](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Guides/Live_regions)
- [Pope Tech — Accessible Animation (2025)](https://blog.pope.tech/2025/12/08/design-accessible-animation-and-movement/)
- [WCAG 2.5.5 Target Size](https://www.w3.org/WAI/WCAG21/Understanding/target-size.html)
- [Astro Client Directives](https://docs.astro.build/en/guides/framework-components/#hydrating-interactive-components)
