---
title: "Execution Tracer Widget & Pedagogical Overhaul"
type: feat
status: active
date: 2026-03-10
deepened: 2026-03-10
origin: docs/brainstorms/2026-03-09-conceptual-tree-brainstorm.md
---

# Execution Tracer Widget & Pedagogical Overhaul

## Enhancement Summary

**Deepened on:** 2026-03-10
**Research agents used:** best-practices-researcher, framework-docs-researcher, architecture-strategist, pattern-recognition-specialist, performance-oracle, julik-frontend-races-reviewer, code-simplicity-reviewer, spec-flow-analyzer

### Key Improvements from Research
1. **Type system refinement** — `DisplayRegister` union type for `$pc` support; optional `addresses` prop for hex annotation; extend existing `Step` type instead of creating near-duplicate `TracerStep`
2. **Performance hardening** — Memoize tokenizer, use compositor-friendly animations (opacity not background), 32ms flash for rapid stepping
3. **Timing safety** — Single component with single `currentStep` (no sub-component desync), no async in step transitions, `$derived` for code highlight (not timer-based)
4. **Responsive strategy** — 52rem breakpoint (calculated from token values), sticky register panel, scroll-into-view on step when stacked
5. **20 pedagogical flow gaps identified and resolved** — pseudo-instruction $PC handling, duplicate step controls, mobile stacking, concept forward-references

### Critical Design Decisions (from review agents)
- **Embed register rendering, don't compose RegisterFile** — avoids two-step-state ownership, eliminates instruction bar duplication, reduces component boundaries for performance
- **Extend `Step` type with optional `line` field** — avoids near-duplicate `TracerStep` type; RegisterFile ignores `line`, ExecutionTracer uses it
- **No act renumbering** — insert new sections with their own names (Prologue, Interlude) rather than renumbering all existing acts
- **Pseudo-instructions treated as single steps** — `li` shows as one step with $PC advancing by 4, with footnote noting assembler expansion exists
- **Syscall cards use existing reveal-button pattern** — not click-to-expand (maintains interaction consistency)

---

## Overview

Major overhaul of the Project 2 visual essay addressing critical pedagogical gaps: build a new **ExecutionTracer** compound widget (code panel + register table side-by-side with synchronized stepping), add deep-dive content for previously implicit concepts (jal/jr mechanics, $PC, syscall, instruction format fields, hex addresses, real vs. pseudo instructions), and restructure all execution traces to use the new tracer.

The guiding principle: **every instruction is new to the student**. Nothing is assumed. Every concept gets a visual or interactive demonstration before it appears in code.

## Problem Statement

The current implementation has several pedagogical blind spots identified through content review:

1. **"The Call/Return Dance" is isolated** — `jal` and `jr` appear without explaining what they do mechanically. The student sees `$ra = 0x00400028` but has no idea what that hex number means, why it's that value, or how `$PC` is involved.

2. **Execution traces lack code context** — The RegisterFile widget shows register state changes but there's no code panel showing *which instruction* is executing. Students must mentally map annotations to code, increasing cognitive load.

3. **Instruction field names unexplained** — Terms like `rd`, `rs`, `rt` appear (e.g., "nor Rd, Rs, $zero") but are never defined. Students don't know what these placeholders mean.

4. **"Real vs. pseudo" assumes prior knowledge** — Phrases like "nor is a Real Instruction" presuppose the student understands the real/pseudo distinction. Since students learn assembly *through* MIPS, this distinction doesn't exist for them yet.

5. **Syscall is a black box** — The test harness (Act 6) and existing utils.asm subprograms heavily use syscall, but the mechanism is never explained. Students need to understand the service-number pattern, register conventions, and what happens when `syscall` executes.

6. **Hex addresses are opaque** — Values like `0x00400028` appear in register traces without explanation of what they represent or how to parse them.

## Proposed Solution

### 1. New Widget: ExecutionTracer

A compound widget combining a **code panel** (left) with a **register table** (right), synchronized by step index. This replaces the standalone RegisterFile usage in all execution traces.

**Layout:**
```
┌─────────────────────┬───────────────────────┐
│  Code Panel         │  Register Table       │
│                     │                       │
│  .text              │  ┌──────┬──────┐      │
│  NOR:               │  │ $a0  │ $a1  │      │
│  # header...        │  │0xF0..│0x0F..│      │
│ ►nor $v0,$a0,$a1  │  │      │      │      │
│  jr  $ra            │  ├──────┼──────┤      │
│                     │  │ $v0  │ $ra  │      │
│                     │  │0x000.│0x004.│      │
│                     │  └──────┴──────┘      │
├─────────────────────┴───────────────────────┤
│  Annotation: NOR reads $a0,$a1 → writes $v0 │
│          ◄  Step 2 of 4  ►                  │
└─────────────────────────────────────────────┘
```

**Key design decisions:**
- Code panel uses MipsEditor's syntax highlighting (reuse `mips-tokenizer.ts`)
- Current instruction highlighted with accent-colored left bar + subtle background
- Previous instructions dimmed (opacity 0.5), upcoming instructions at normal opacity
- Register table embeds RegisterFile's visual design directly (NOT a nested component — see Architecture Insights below)
- Responsive: stacks vertically below 52rem (832px), with scroll-into-view on step change
- Step controls are embedded in the widget only — sections do NOT duplicate prose step buttons (eliminates dual-control confusion)
- The code shown is the **complete subprogram** — no hidden lines, no blanks. This is for *tracing*, not *discovery*

**Type design (extends existing `Step` type):**
```typescript
// Add to existing Step type in types.ts
export type Step = {
  instruction: string;
  registers: RegisterState;
  changed?: DisplayRegister[];  // was MipsRegister[]
  reading?: DisplayRegister[];  // was MipsRegister[]
  annotation?: string;
  line?: number;                // NEW: 0-indexed line to highlight in code panel
};

// New union type for registers that includes $pc
export type DisplayRegister = MipsRegister | '$pc';
```

**Props:**
```typescript
// Inline $props() following existing widget convention (not a named interface)
let { instanceId, code, registers, steps, title, addresses }: {
  instanceId: string;
  code: string[];               // complete MIPS code lines
  registers: DisplayRegister[]; // which registers to display (can include '$pc')
  steps: Step[];                // step definitions (uses line field for code highlight)
  title?: string;               // optional code panel title
  addresses?: string[];         // optional hex addresses parallel to code lines
} = $props();
```

**API:**
```typescript
export function step(): void;
export function stepBack(): void;
export function goToStep(n: number): void;
export function reset(): void;
```

#### Architecture Insights (from review agents)

**Why embed register rendering, not compose RegisterFile:**
- RegisterFile owns its own `currentStep` and `flashGeneration` — passing external step control would require new props and create two sources of truth
- RegisterFile renders its own instruction bar, step controls, and annotation — all of which ExecutionTracer replaces with its own versions. Suppressing RegisterFile's chrome would turn it into a configurable framework (fragile-base-class anti-pattern)
- Single component boundary means one reactive update per step, not two (performance benefit)

**Why extend `Step` instead of creating `TracerStep`:**
- The existing `Step` type and the proposed `TracerStep` are identical except `line: number` replaces `instruction: string`. Adding an optional `line?: number` field to `Step` avoids a near-duplicate type
- RegisterFile ignores `line` (it doesn't know about code editors). ExecutionTracer reads `line` for code highlighting
- `instruction` remains useful in both widgets — the ExecutionTracer can still show it in annotations

**Why `DisplayRegister` instead of polluting `MipsRegister`:**
- `$pc` is not a general-purpose register and doesn't belong in `MipsRegister` (used by RegisterFile and Step definitions)
- `DisplayRegister = MipsRegister | '$pc'` keeps the domain model honest while allowing the tracer to show $PC

#### Performance Insights

**Memoize the tokenizer:**
```typescript
// In mips-tokenizer.ts — add module-level cache
const cache = new Map<string, MipsToken[]>();
export function tokenizeMipsLine(code: string): MipsToken[] {
  const cached = cache.get(code);
  if (cached) return cached;
  const tokens = tokenizeImpl(code);
  cache.set(code, tokens);
  return tokens;
}
```
Common lines like `jr $ra`, `.text` appear in 7+ tracers — cache hit rate will be high.

**Use compositor-friendly flash animation:**
```css
/* Prefer opacity on pseudo-element over animating background with color-mix */
.register-card.changed::after {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--color-accent);
  opacity: 0;
  animation: flash 32ms ease-out forwards;
  pointer-events: none;
}

@keyframes flash {
  0% { opacity: 0.3; }
  100% { opacity: 0; }
}
```
- 32ms flash (two frames) instead of 300ms — prevents stale highlights during rapid stepping
- `opacity` is compositor-only, doesn't trigger paint

**Use `instanceId` for param persistence** (not a static WIDGET_ID). Multiple ExecutionTracers on the page should NOT share param storage — follow BitOperator's pattern.

#### Timing Safety Insights

1. **Single component, single `currentStep`** — no sub-component desync risk
2. **No async in step transitions** — CSS transitions for visual polish, synchronous state for data. Never `await` or `setTimeout` in a step handler
3. **Use `$derived` for code panel line highlight** — NOT `highlightLine()` with a timer. The highlight is persistent (shows current line), not auto-clearing
4. **Derive visited-line set internally** — maintain `Set<number>` built from `steps[0..currentStep].map(s => s.line)` for dimming already-executed lines. Handles non-linear execution (jal/jr jumps) correctly. `stepBack()` rebuilds from history
5. **Dev-mode line-index validation** — assert `step.line` is within `[0, code.length)` to catch data errors early:
```typescript
if (import.meta.env.DEV) {
  $effect(() => {
    for (const s of steps) {
      if (s.line !== undefined && (s.line < 0 || s.line >= code.length)) {
        console.warn(`ExecutionTracer "${instanceId}": step line ${s.line} out of bounds (code has ${code.length} lines)`);
      }
    }
  });
}
```

#### Keyboard Navigation

Add keyboard event handling at the widget level:
```typescript
function handleKeyboard(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowRight': case 'n': e.preventDefault(); step(); break;
    case 'ArrowLeft': case 'p': e.preventDefault(); stepBack(); break;
    case 'Home': e.preventDefault(); reset(); break;
    case 'End': e.preventDefault(); goToStep(totalSteps - 1); break;
  }
}
```
Container uses `role="application"` with `aria-roledescription="code execution visualizer"` and `tabindex="0"`.

#### Responsive Strategy

```css
.execution-tracer {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1.5rem;
}

@media (min-width: 52rem) {
  .execution-tracer {
    grid-template-columns: 1.2fr 0.8fr;
    align-items: start;
  }

  .register-panel {
    position: sticky;
    top: 1.5rem;
    max-height: calc(100vh - 3rem);
    overflow-y: auto;
  }
}
```

**52rem breakpoint rationale:** Code panel needs ~28rem minimum (60-char MIPS lines at 0.875rem). Register table needs ~20rem for 3-4 cards. 28 + 20 + 1.5 gap ≈ 50rem. 52rem gives slight breathing room. Matches `--prose-width: 42rem` and `--figure-width: 64rem` from tokens.

**When stacked (below 52rem):** On step change, auto-scroll the changed register card into view so the student sees both the code highlight and register change, even though they're vertically separated.

#### A11y Requirements

- `aria-live="polite"` (not "assertive") on step counter and change announcements
- Screen reader must announce BOTH which code line is executing AND which registers changed:
  ```
  "Executing line 3: nor $v0, $a0, $a1. Reading $a0 (0xF0F0F0F0), $a1 (0x0F0F0F0F). $v0 changed to 0x00000000."
  ```
- CSS `@media (prefers-reduced-motion: reduce)` for flash animations
- No JS-driven sequential animations in the tracer, so `createReducedMotion()` is not needed

#### CSS Custom Property Prefix

Use `--tracer-*` for all scoped custom properties (following `--regfile-*`, `--editor-*`, `--bitop-*` convention).

### 2. New Section: Prologue — "How the Machine Sees Your Code"

A new section inserted **before Act 0** that covers foundational concepts the rest of the essay depends on. Brief — about 5 minutes of reading — but essential.

**Scope constraint:** The Prologue uses only static/lightweight HTML — NO full widgets, NO heavy JavaScript. It hydrates first (top of page), so it must be fast. Section-specific styled markup only.

**Content beats:**

#### 2a. Registers Are Named Boxes
- Visual: **Static** register card grid showing only the ~10 registers used in this essay ($a0-$a3, $v0-$v1, $ra, $zero, $t0, $pc), grouped by convention. Other registers listed in a muted "...and 22 more" footnote
- Explain: "Think of registers as named boxes inside the CPU. Each holds one 32-bit number."
- **Simplification (from review):** Show only the registers students will actually use. Showing all 32 risks cognitive overload at the very start of the essay before students have context for why any matter
- CSS-only tooltips on each card showing purpose (keyboard-accessible via `tabindex="0"` + `:focus`)

#### 2b. Addresses Are Just Numbers
- Visual: A styled HTML table showing 4-5 instruction addresses (0x00400000, 0x00400004, ...) with a CSS-highlighted $PC row
- Explain: "Every instruction lives at an address. The CPU reads the address in $PC, executes that instruction, then adds 4 to $PC (because each instruction is 4 bytes)."
- **No interactive animation** — just a static table with a callout. The interactive $PC demo comes in Act 0's ExecutionTracer (the Prologue deliberately sets up the "always +4" rule that Act 0 then "breaks" with jal)
- Brief hex explainer: "0x00400008 means the third instruction — addresses count up by 4"

#### 2c. Real Instructions vs. Pseudo-Instructions (footnote-weight)
- A single `.callout` box, 3 sentences max: "MIPS has ~60 real hardware instructions. The assembler provides convenience shortcuts called *pseudo-instructions* that expand into one or more real instructions. Example: `move $t0, $t1` expands to `addu $t0, $zero, $t1`. We'll note which are which as we go — it's a 'fun fact,' not something you need to memorize."

#### 2d. Instruction Format (rd, rs, rt)
- **Static** visual: A styled `<div>` showing an R-format instruction template with labeled fields
- Explain: "Most MIPS instructions follow this pattern: `operation destination, source1, source2` — written as `op rd, rs, rt` in documentation. *rd* = register destination, *rs* = register source, *rt* = register target."
- **No drag-and-drop** (from simplicity review) — a static labeled diagram with a worked example: `nor $v0, $a0, $a1` → rd=$v0, rs=$a0, rt=$a1. Brief inline text is sufficient for first introduction; subsequent Acts reinforce with inline parentheticals

**Pedagogical note (from flow analysis):** The Prologue deliberately sets up the "$PC always advances by 4" mental model. Act 0 then *breaks* this with `jal` (productive confusion). This transition should be acknowledged in Act 0's prose: "In the Prologue, you saw $PC advance by 4 each time. `jal` is the first instruction that breaks this rule..."

### 3. New Section: "Interlude: Inside syscall"

Inserted **between Act 0 and Act 1** as an interlude (NOT renumbered as an Act — avoids renumbering churn). Syscall is used in the test harness and in every existing utils.asm subprogram.

**Content beats:**

#### 3a. What syscall Does Mechanically
- Prose: "syscall is not an instruction you write yourself — it's a handoff to the operating system. You say *what you want* by putting a service number in `$v0`, and any inputs in `$a0`–`$a1`. Then `syscall` does the work."
- Visual: A simple 3-step diagram (styled HTML, not a widget): "1. Load service # → $v0. 2. Load data → $a0. 3. syscall. → OS does the work."

#### 3b. The Service Number Pattern
- 5 service cards using the **existing reveal-button pattern** (not click-to-expand, for interaction consistency):
  - Service 1: Print integer ($v0=1, $a0=value)
  - Service 4: Print string ($v0=4, $a0=address)
  - Service 5: Read integer ($v0=5, returns in $v0)
  - Service 8: Read string ($v0=8, $a0=buffer, $a1=length)
  - Service 10: Exit ($v0=10)
- Each card: a `.callout` box showing service #, what to load where, what happens
- All visible by default (no reveal needed) — these are reference material

#### 3c. Syscall Execution Trace
- Use **ExecutionTracer** to step through a minimal "Hello World" program:
  ```mips
  .data
  msg: .asciiz "Hello!"
  .text
  main:
      li  $v0, 4       # Service 4: print string
      la  $a0, msg     # Address of our string
      syscall           # OS prints "Hello!"
      li  $v0, 10      # Service 10: exit
      syscall           # OS terminates program
  ```
- Registers shown: `$v0`, `$a0`
- **Pseudo-instruction handling:** `li` and `la` are treated as single steps. $PC is NOT shown in this trace to avoid contradicting the "+4" rule established in the Prologue (the pseudo-instructions may expand to 2 real instructions). A footnote notes: "In MARS, `li` and `la` may expand to multiple instructions. Don't worry about this for now."
- This is the student's first complete program trace

#### 3d. How the Existing Subprograms Use syscall
- Brief callout: "The `PrintInt`, `PrintString`, `Exit` subprograms in utils.asm are wrappers around syscall. When you call `jal PrintInt`, it sets up $v0 and $a0 internally and calls syscall for you."

### 4. Expanded Act 0: The Call/Return Dance

The current Act 0 content is kept but the Call/Return section is significantly expanded with an ExecutionTracer:

#### 4a. What `jal` Actually Does
- Bridging prose: "In the Prologue, you saw $PC advance by 4 each time. `jal` is the first instruction that **breaks** this rule — it sends $PC somewhere else entirely."
- Prose: "jal does TWO things in one instruction: (1) saves the address of the *next* instruction into $ra, and (2) jumps to the label's address."
- Use ExecutionTracer with a minimal caller + callee:
  ```mips
  .text
  main:
      li    $a0, 10
      li    $a1, 20
      jal   NOR
      move  $t0, $v0
      jal   Exit
  NOR:
      nor   $v0, $a0, $a1
      jr    $ra
  ```
- Show `$pc` and `$ra` in the register table — the student sees $pc jump to the NOR label, then jump back
- **Address annotations** via the `addresses` prop:
  ```typescript
  addresses: ['0x00400000', '0x00400004', '0x00400008', '0x0040000C', '0x00400010', '0x00400014', '0x00400018']
  ```
- Annotation on jal step: "0x0040000C = the instruction right after `jal NOR` — that's where we return to"
- Annotation on jr step: "jr copies $ra (0x0040000C) into $pc — execution resumes right after the jal"

#### 4b. What `jr $ra` Actually Does
- Prose: "jr means 'jump to the address in register.' `jr $ra` copies $ra into $pc, so the CPU's next instruction is whatever $ra points to — the instruction right after the `jal`."

### 5. All Execution Traces Use ExecutionTracer

Replace every standalone RegisterFile trace with the new ExecutionTracer:

| Section | Current Widget | New Widget | Code Shown |
|---------|---------------|------------|------------|
| Syscall (new) | — | ExecutionTracer | Hello World (5 lines) |
| Act 0 Call/Return | RegisterFile | ExecutionTracer | Caller + NOR (7 lines with addresses) |
| Act 1 NOR | RegisterFile | ExecutionTracer | Complete NOR subprogram |
| Act 2 NAND | RegisterFile | ExecutionTracer | Complete NAND subprogram |
| Act 3 Mult4 | RegisterFile | ExecutionTracer | Complete Mult4 subprogram |
| Act 4 Swap | RegisterFile | ExecutionTracer | Complete Swap subprogram |

**Migration approach (from architecture review):**
- **Phase 5a:** Migrate Act 1 (NOR) first as a canary. This is the simplest trace (3 steps, no jumps). Validate API ergonomics.
- **Phase 5b:** Migrate remaining Acts (0, 2, 3, 4).

**Step data migration:** Each section's `Step[]` keeps `instruction` field (for readability) and adds `line` field pointing to the corresponding code line:
```typescript
// Before (current)
{ instruction: 'nor $v0, $a0, $a1', registers: {...}, ... }

// After (with line field added)
{ instruction: 'nor $v0, $a0, $a1', line: 8, registers: {...}, ... }
```
The `instruction` field is NOT removed — it remains for self-documenting step data and for the sr-only announcement text.

**RegisterFile remains in codebase:** The standalone widget stays for the sandbox page and any future simple register demos. It is NOT deprecated — it serves a different purpose (register-only view without code context).

**Step controls consolidation:** Remove prose-level step buttons ("Next step", "Previous step", "Reset") from sections. ExecutionTracer's embedded controls are the single interaction point. This eliminates the dual-control confusion where students see two sets of controls.

### 6. Prose Adjustments Across All Acts

#### "nor is a Real Instruction" → Footnote treatment
- Current: A major reveal section titled "The Surprise: nor is a Real Instruction"
- New: The insight section keeps its content but the framing changes: "Surprise: MIPS has a hardware `nor` instruction — you don't need to build it from pieces." A subtle footnote adds: "This is one of MIPS's ~60 real instructions. `not`, by contrast, is a pseudo-instruction that the assembler expands to `nor Rd, Rs, $zero`. (See the Prologue if you need a refresher on real vs. pseudo.)"
- Same approach for NAND's "not is a pseudo-instruction" and Swap's "move is a pseudo-instruction"

#### Instruction explanations get the rd/rs/rt treatment
- When introducing `nor $v0, $a0, $a1`: "This follows the `op rd, rs, rt` pattern from the Prologue: the destination (`$v0`) comes first, then the two sources (`$a0`, `$a1`)."
- When introducing `sll $v0, $a0, 2`: "This follows `op rd, rs, shamt` — destination, source, shift amount. The 2 means 'shift left by 2 positions.'"
- Brief, inline — not a separate section each time

#### Complete subprogram bodies in all code panels
- The test harness (Act 6) calls `jal NOR`, `jal PrintInt`, etc. — but PrintInt's body is never shown
- Add a brief "peek inside PrintInt" expandable (`.reveal` pattern) showing it's just a syscall wrapper — **static code only, no tracer** (keeping scope bounded)
- Similarly for Exit (syscall 10) — one-line body

## Technical Approach

### Phase 1: Type System & Tokenizer

**Modified files:**
- `site/src/lib/types.ts` — Add `DisplayRegister` union, add optional `line` field to `Step`
- `site/src/lib/mips-tokenizer.ts` — Add module-level memoization cache

**Type changes:**
```typescript
// New union type
export type DisplayRegister = MipsRegister | '$pc';

// Extended Step type
export type Step = {
  instruction: string;
  registers: Partial<Record<DisplayRegister, string>>;  // was Record<MipsRegister, string>
  changed?: DisplayRegister[];
  reading?: DisplayRegister[];
  annotation?: string;
  line?: number;  // NEW: highlight this line in paired code editor
};

// RegisterState also extended
export type RegisterState = Partial<Record<DisplayRegister, string>>;
```

### Phase 2: ExecutionTracer Widget

**New files:**
- `site/src/components/widgets/ExecutionTracer.svelte` — the compound widget
- `site/src/pages/sandbox/execution-tracer.astro` — sandbox page

**Implementation details:**
- Reuse `mips-tokenizer.ts` (with new memoization) for code syntax highlighting
- Embed RegisterFile's register card rendering directly (copy CSS, adapt markup — NOT a nested component)
- Code panel: each line is a `<div>` with monospace font; current line has left border + subtle background; executed lines dimmed
- Layout: CSS Grid, 52rem breakpoint, sticky register panel
- Use `instanceId` for `loadParams`/`saveParams` (follow BitOperator pattern, NOT RegisterFile's static WIDGET_ID)
- CSS custom property prefix: `--tracer-*`
- Flash animation: 32ms with opacity pseudo-element (compositor-friendly)
- Keyboard navigation: Arrow keys, Home/End on focused container
- paramDefs: `fontSize` (0.875rem), `labelSize` (0.75rem), `cellPadding` (0.75rem), `gap` (0.5rem), `borderRadius` (6px), `codeFontSize` (0.85rem), `codeLineHeight` (1.6)
- Include `<WidgetDebugPanel>` unconditionally (self-gates behind dev mode)
- Hydration guard: `let hydrated = $state(false); $effect(() => { hydrated = true; });`

**Internal state management:**
```typescript
let currentStep = $state(0);
let flashGeneration = $state(0);

// Derive executed line set from step history (handles non-linear jal/jr jumps)
let executedLines = $derived.by(() => {
  const lines = new Set<number>();
  for (let i = 0; i < currentStep; i++) {
    const line = steps[i].line;
    if (line !== undefined) lines.add(line);
  }
  return lines;
});

let currentLine = $derived(steps[currentStep]?.line);
```

### Phase 3: Prologue Section

**New files:**
- `site/src/components/sections/project2/Prologue.svelte`

**Implementation details:**
- **Lightweight — no widgets, no heavy JS.** Only static HTML + CSS + the `hydrated` gate for reveal buttons
- Register grid: ~10 register cards (only the ones used in this essay), grouped, CSS-only tooltips
- Address table: styled HTML table, 4-5 rows
- Instruction format: styled `<div>` diagram with worked example
- Real vs. pseudo: one `.callout` box

### Phase 4: Syscall Interlude Section

**New files:**
- `site/src/components/sections/project2/InterlSyscall.svelte`

**Implementation details:**
- Syscall cards: 5 static `.callout` boxes (visible by default, no reveal)
- Hello World trace: one ExecutionTracer instance with 5 steps
- "How utils.asm uses syscall": one `.callout` prose paragraph
- "Peek inside PrintInt": one `.reveal` expandable with static code
- Uses hydrated gate and ExecutionTracer `bind:this` ref

### Phase 5a: Act 1 NOR Migration (Canary)

**Modified files:**
- `site/src/components/sections/project2/Act1Nor.svelte`

**Changes:**
- Replace RegisterFile import with ExecutionTracer
- Add `line` field to existing `norSteps` data
- Add `code` array with complete NOR subprogram lines
- Remove prose-level step buttons (tracer has its own)
- Adjust "real instruction" framing to footnote treatment
- Add inline rd/rs/rt parenthetical on `nor $v0, $a0, $a1`
- **Validate:** Does the API feel right? Are the step data shapes ergonomic? Any issues with the side-by-side layout?

### Phase 5b: Remaining Acts Migration

**Modified files:**
- `site/src/components/sections/project2/Act0Scaffold.svelte` — Full jal/jr expansion with $PC, addresses
- `site/src/components/sections/project2/Act2Nand.svelte` — Tracer + pseudo-instruction note
- `site/src/components/sections/project2/Act3Mult4.svelte` — Tracer + rd/rs/shamt note
- `site/src/components/sections/project2/Act4Swap.svelte` — Tracer + "move is pseudo" note
- `site/src/components/sections/project2/Act6Verification.svelte` — "Peek inside" expandables for PrintInt, Exit (static code only)

### Phase 6: Page Assembly

**Modified files:**
- `site/src/pages/project2.astro` — Add Prologue and InterlSyscall, keep existing act component names
- `site/src/pages/sandbox/index.astro` — Add execution-tracer link

**Section order (NO renumbering of acts):**
1. **Prologue** — Registers, addresses, instruction format, real vs. pseudo (id: `prologue`)
2. **Act 0** — Subprogram scaffold + expanded call/return (id: `act-0-scaffold`)
3. **Interlude: Syscall** — Inside syscall deep dive (id: `interlude-syscall`)
4. **Act 1** — NOR fully worked example (id: `act-1-nor`)
5. **Act 2** — NAND completion problem (id: `act-2-nand`)
6. **Act 3** — Mult4 guided problem (id: `act-3-mult4`)
7. **Act 4** — Swap independent problem (id: `act-4-swap`)
8. **Act 5** — File deliverables (id: `act-5-deliverables`)
9. **Act 6** — Verification epilogue (id: `act-6-verification`)

**Component files keep their current names.** No renaming. The page file controls ordering and the `id` attributes on `<h2>` tags remain unchanged for existing acts.

## Acceptance Criteria

### Functional Requirements
- [ ] **ExecutionTracer widget** renders code panel (left) and register table (right) side-by-side, synchronized by step
- [ ] Current instruction in code panel highlighted with accent left-bar and subtle background
- [ ] Executed lines dimmed (opacity 0.5), handling non-linear execution order
- [ ] ExecutionTracer responsive: stacks vertically below 52rem, with scroll-into-view on step
- [ ] ExecutionTracer has imperative API: step(), stepBack(), goToStep(n), reset()
- [ ] ExecutionTracer keyboard nav: Arrow keys, Home/End when focused
- [ ] ExecutionTracer sandbox page at `/sandbox/execution-tracer`
- [ ] Optional `addresses` prop renders hex address gutter in code panel
- [ ] **Prologue section** (lightweight, no widgets): register cards (~10 used in essay), address table, instruction format diagram, real-vs-pseudo callout
- [ ] **Syscall interlude**: 5 service cards, Hello World trace (ExecutionTracer), "peek inside" callout
- [ ] **Act 0** expanded with jal/jr $PC trace using ExecutionTracer with addresses
- [ ] All 5 existing execution traces (Act 0-4) migrated from RegisterFile to ExecutionTracer
- [ ] "nor is a Real Instruction" reframed as subtle insight with footnote
- [ ] Every instruction introduction includes brief rd/rs/rt or rd/rs/shamt inline note
- [ ] Prose step buttons removed from all sections (tracer has embedded controls)
- [ ] Act 6 has "peek inside PrintInt/Exit" expandable reveals (static code only)

### Non-Functional Requirements
- [ ] ExecutionTracer follows all widget conventions: paramDefs, scoped `--tracer-*` CSS custom properties, WidgetDebugPanel, no global spatial tokens
- [ ] `Step.changed` and `Step.reading` use `DisplayRegister` (supports `$pc`)
- [ ] `mips-tokenizer.ts` memoizes results via module-level cache
- [ ] Flash animation uses compositor-friendly opacity (32ms duration)
- [ ] `instanceId` used for param storage (not static WIDGET_ID)
- [ ] All new `.svelte.ts` files (if any) use correct extension for runes
- [ ] Reduced motion respected via `@media (prefers-reduced-motion: reduce)`
- [ ] All interactive elements have proper a11y (aria-live polite, aria-labels, keyboard accessible, 44px touch targets)
- [ ] Dark theme consistent with existing color tokens
- [ ] Hydration guard (`let hydrated = $state(false)`) in all new sections
- [ ] `$props()` uses inline type annotation (not named interface)

### Quality Gates
- [ ] `npm run build` succeeds without warnings
- [ ] All existing widgets still work (no regressions from `DisplayRegister` type change)
- [ ] New sections render correctly at 320px, 52rem, and 1200px widths
- [ ] Tab through every interactive element — logical focus order, visible focus indicators
- [ ] Hold Enter on step button — rapid stepping shows clean state transitions (no stale 300ms glows)
- [ ] All `step.line` values validated in dev mode (console warning if out of bounds)

## File Summary

### New Files (4)
| File | Purpose |
|------|---------|
| `site/src/components/widgets/ExecutionTracer.svelte` | Compound code + register trace widget |
| `site/src/pages/sandbox/execution-tracer.astro` | Sandbox page for isolated development |
| `site/src/components/sections/project2/Prologue.svelte` | Foundational concepts section (lightweight) |
| `site/src/components/sections/project2/InterlSyscall.svelte` | Syscall interlude section |

### Modified Files (10)
| File | Changes |
|------|---------|
| `site/src/lib/types.ts` | Add `DisplayRegister` union, add `line?` to `Step`, update `RegisterState` |
| `site/src/lib/mips-tokenizer.ts` | Add memoization cache |
| `site/src/components/sections/project2/Act0Scaffold.svelte` | Expand jal/jr with $PC, use ExecutionTracer, remove prose step buttons |
| `site/src/components/sections/project2/Act1Nor.svelte` | Use ExecutionTracer, adjust prose, remove prose step buttons |
| `site/src/components/sections/project2/Act2Nand.svelte` | Use ExecutionTracer, adjust prose, remove prose step buttons |
| `site/src/components/sections/project2/Act3Mult4.svelte` | Use ExecutionTracer, adjust prose, remove prose step buttons |
| `site/src/components/sections/project2/Act4Swap.svelte` | Use ExecutionTracer, adjust prose, remove prose step buttons |
| `site/src/components/sections/project2/Act6Verification.svelte` | Add "peek inside" expandables |
| `site/src/pages/project2.astro` | Add Prologue + InterlSyscall sections |
| `site/src/pages/sandbox/index.astro` | Add execution-tracer link |

## Sources

### Origin
- **Brainstorm document:** [docs/brainstorms/2026-03-09-conceptual-tree-brainstorm.md](docs/brainstorms/2026-03-09-conceptual-tree-brainstorm.md) — 212 atomic concepts across 8 layers, concept dependency tree. Key concepts carried forward: registers (4.14-4.24), $PC (4.7), instruction formats (6.1-6.2, 6.7-6.17), syscall (5.20-5.25), subprograms (7.43-7.54)
- **Pedagogical narrative plan:** [docs/plans/2026-03-09-feat-project2-pedagogical-narrative-plan.md](docs/plans/2026-03-09-feat-project2-pedagogical-narrative-plan.md) — narrative structure, concept activation sequences, faded worked examples (still valid, this plan extends rather than replaces)
- **Register-centric redesign:** [docs/plans/2026-03-10-fix-register-centric-redesign-plan.md](docs/plans/2026-03-10-fix-register-centric-redesign-plan.md) — RegisterFile read/write highlighting (completed, visual design preserved in ExecutionTracer)

### Institutional Learnings
- **Svelte 5 runes in .ts files** ([docs/solutions/svelte5-runes-in-plain-ts-files.md](docs/solutions/svelte5-runes-in-plain-ts-files.md)): Any utility using $state/$effect MUST use `.svelte.ts` extension

### Internal References
- Existing RegisterFile widget: [RegisterFile.svelte](site/src/components/widgets/RegisterFile.svelte) — visual design to preserve/extend
- MIPS tokenizer: [mips-tokenizer.ts](site/src/lib/mips-tokenizer.ts) — reuse with memoization
- Widget param system: [params.ts](site/src/lib/params.ts) — follow Param interface pattern
- Type definitions: [types.ts](site/src/lib/types.ts) — extend Step, add DisplayRegister
- BitOperator: [BitOperator.svelte](site/src/components/widgets/BitOperator.svelte) — instanceId-based param storage pattern to follow

### Research References
- Svelte 5 component composition: `$state` objects passed through `setContext` remain reactive
- Svelte 5 `export function`: imperative API pattern confirmed in official docs
- CSS Grid responsive layout: `grid-template-columns: 1.2fr 0.8fr` with sticky register panel
- WAI-ARIA: `role="application"` + `aria-roledescription` for custom interactive widgets
- CSS-only tooltips: `role="tooltip"` + `aria-describedby` for hex address explanations
- Compositor-friendly animation: `opacity` on pseudo-element avoids paint, outperforms `background` with `color-mix()`
