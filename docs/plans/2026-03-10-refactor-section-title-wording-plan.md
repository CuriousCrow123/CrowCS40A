---
title: "refactor: Improve section heading wording for clarity and consistency"
type: refactor
status: completed
date: 2026-03-10
---

# refactor: Improve section heading wording for clarity and consistency

Review all h2 and h3 headings across the Project 2 visual essay for consistent voice, clarity, and pedagogical effectiveness. Rename "Act" to "Section" for a more academic tone. Keep "Prologue" and "Interlude" as special names.

## Principles for Good Section Titles

1. **Scannable in the TOC** — students should know what a section covers without clicking
2. **Consistent voice** — pick a style and stick to it (the essay uses a mix of imperative, noun-phrase, and question styles)
3. **No generic names** — "Reflection" and "Execution Trace" appear multiple times; they're meaningful in context but blur together in the TOC
4. **Brief** — TOC sidebar has limited width; aim for ≤5 words

## Current Headings & Proposed Changes

### h2 (Top-Level) — "Act" → "Section"

| Current | Proposed | Rationale |
|---|---|---|
| Prologue: How the Machine Sees Your Code | **Keep** | Special name — sets the tone |
| Act 0: The Subprogram Scaffold | Section 0: The Subprogram Scaffold | Act → Section |
| Act 1: NOR — Fully Worked Example | Section 1: NOR — Fully Worked Example | Act → Section |
| Interlude: How `syscall` Works | **Keep** | Special name |
| Act 2: NAND — Completion Problem | Section 2: NAND — Completion Problem | Act → Section |
| Act 3: Mult4 — Guided Problem | Section 3: Mult4 — Guided Problem | Act → Section |
| Act 4: Swap — Independent Problem | Section 4: Swap — Independent Problem | Act → Section |
| Act 5: File Deliverables | Section 5: File Deliverables | Act → Section |
| Act 6: Verification | Section 6: Testing Your Code | Act → Section + clarify purpose |

Also update the `id` attributes: `act-0-scaffold` → `section-0-scaffold`, etc.

### h3 (Subsections) — Wording Improvements

#### Prologue — **All Keep**

No changes: Registers Are Named Boxes, Addresses Are Just Numbers, Real vs. Pseudo-Instructions, Instruction Format: rd, rs, rt

#### Section 0 — **Keep**

The Call/Return Dance — vivid, memorable

#### Section 1 (NOR)

| Current | Proposed | id change |
|---|---|---|
| Warm-up: NOR Truth Table | NOR Truth Table | `nor-truth-table` (no change) |
| Bitwise Application | NOR, Bit by Bit | `nor-bit-by-bit` |
| Complete NOR Subprogram | The Full Subprogram | `nor-full-subprogram` |

Keep: One Instruction Does It All, Wire It Up, Black-Box View, Execution Trace, Reflection

#### Section 2 (NAND)

| Current | Proposed | id change |
|---|---|---|
| Pattern Recognition | From NOR to NAND | `nand-from-nor` |
| Complete the Subprogram | Fill In Step 2 | `nand-fill-step-2` |
| Cross-Subprogram Comparison | NOR vs. NAND | `nand-vs-nor` |

Keep: NAND Truth Table, Black-Box View, Execution Trace

#### Section 3 (Mult4)

| Current | Proposed | id change |
|---|---|---|
| The Constraint | The Constraint: No Multiply | `mult4-no-multiply` |
| The Decimal Analogy | Shifting = Multiplying | `mult4-shifting-multiplying` |
| Generalize | From ×2 to ×4 | `mult4-from-2-to-4` |
| Predict Before Coding | Predict the Result | `mult4-predict-result` |

Keep: Write the Body, Black-Box View, Execution Trace, Reflection

#### Interlude — **All Keep**

No changes: The Syscall Protocol, The Five Services You Need, Hello World Trace, How utils.asm Uses Syscall

#### Section 4 (Swap)

| Current | Proposed | id change |
|---|---|---|
| Recall: XOR Truth Table | XOR Truth Table | `xor-truth-table` (no change) |
| Discover the Self-Inverse Property | The Self-Inverse Property | `swap-self-inverse` (no change) |
| The Challenge | The Challenge: No Temp Register | `swap-no-temp` |
| The Swap Algorithm Trace | Execution Trace | `swap-execution-trace` (no change) |
| Edge Case: What if $a0 = $a1? | Edge Case: Equal Inputs | `swap-equal-inputs` |
| Moving to Return Registers | Output via $v0 and $v1 | `swap-output-registers` |
| Why Modifying $a0 and $a1 is OK | Side Effects Are OK | `swap-side-effects` |
| Write the Complete Subprogram | Write the Body | `swap-write-body` |
| Honesty About XOR Swap | Was XOR Swap Necessary? | `swap-was-it-necessary` |

Keep: Black-Box View, Narrative Bookend

#### Section 5 — **All Keep**

No changes: Preamble Update, Submission Checklist, Complete Answer Key

#### Section 6 (Verification → Testing Your Code)

| Current | Proposed | id change |
|---|---|---|
| Peek Inside the Utility Subprograms | Inside the Utilities | `inside-utilities` |

Keep: Expected Output, Final Reflection

## Implementation Notes

- When renaming h3s, also update the `id` attribute to match
- When renaming h2s (Act → Section), update `id` attributes AND any prose references to "Act N" in surrounding text
- The page composition file that imports sections may use "Act" in filenames — filenames do NOT need to change (too disruptive, no user-facing impact)
- Build must pass cleanly after changes

## Acceptance Criteria

- [x] All "Act" h2 headings renamed to "Section"
- [x] All `id` attributes on renamed h2s updated (e.g., `act-1-nor` → `section-1-nor`)
- [x] All proposed h3 heading renames applied with updated ids
- [x] Prose references to "Act N" in section body text updated to "Section N"
- [x] Build passes cleanly

## Files to Modify

- `site/src/components/sections/project2/Act0Scaffold.svelte` — h2 rename + prose refs
- `site/src/components/sections/project2/Act1Nor.svelte` — h2 rename + 3 h3 renames
- `site/src/components/sections/project2/Act2Nand.svelte` — h2 rename + 3 h3 renames
- `site/src/components/sections/project2/Act3Mult4.svelte` — h2 rename + 4 h3 renames
- `site/src/components/sections/project2/Act4Swap.svelte` — h2 rename + 7 h3 renames
- `site/src/components/sections/project2/Act5Deliverables.svelte` — h2 rename
- `site/src/components/sections/project2/Act6Verification.svelte` — h2 rename + 1 h3 rename
- `site/src/components/sections/project2/InterlSyscall.svelte` — (no changes, just verify)
- `site/src/components/sections/project2/Prologue.svelte` — (no changes, just verify)
