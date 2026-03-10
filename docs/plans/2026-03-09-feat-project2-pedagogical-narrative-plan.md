---
title: "Project 2: Pedagogical Narrative for MIPS Subprograms"
type: feat
status: active
date: 2026-03-09
deepened: 2026-03-09
origin: docs/brainstorms/2026-03-09-conceptual-tree-brainstorm.md
---

# Project 2: Pedagogical Narrative — Building Every Line of Code

## Overview

Create a pedagogical narrative that walks a CS 40A student through implementing all four Project 2 subprograms (NOR, NAND, Mult4, Swap) line by line. Every line of assembly is motivated by activating prerequisite understanding before introducing new syntax.

The narrative is not a solution guide — it's a *concept activation sequence* that makes each line of code feel inevitable once the student's attention has been directed to the right prior knowledge.

**Implementation format:** To be determined — could be a visual essay section (Astro + Svelte), a standalone markdown walkthrough, or a new sandbox page. The content below is format-agnostic; decide the delivery vehicle before starting `/ce:work`.

## Problem Statement / Motivation

Students often write MIPS assembly by pattern-matching from examples without understanding *why* each line exists. This leads to:
- Cargo-culting (copying boilerplate without understanding it)
- Inability to debug (can't reason about what went wrong if you don't know what each line does)
- Fragile knowledge (can't adapt patterns to new problems)

The pedagogical narrative makes every line **accountable** — traceable to a specific concept the student has already learned.

## Pedagogical Design Principles

1. **Concept activation before code** — Never show a line of code until the concept it embodies has been named and recalled
2. **Faded worked examples** — Full example first (NOR), completion problem second (NAND), guided problem third (Mult4), independent problem last (Swap). Research: studying worked examples first produces faster learning than problem-solving first for novices (Sweller, CLT)
3. **Predict → Run → Explain** — Ask students to predict output before revealing it. Prediction questions are the highest-leverage technique for code walkthroughs
4. **Incremental revelation** — Build each subprogram instruction by instruction, not all at once
5. **Cross-subprogram comparison** — After NOR/NAND pair and after all four, prompt explicit structural comparison. Research shows this strengthens discrimination and transfer

## Concept Dependency Map for Project 2

*Reference index — maps narrative content back to the conceptual tree (see brainstorm). Not shown to students.*

```
Shared scaffold (activated once, reused four times):
  Subprogram concept, .text guard, header comments, labels,
  input params ($a0–$a3), return values ($v0–$v1),
  jr $ra, call/return contract, simple subprogram constraint

NOR:   Boolean operators → truth tables → bitwise operators → "nor is a real instruction"
NAND:  (same Boolean foundation) → and → not → "NAND = NOT(AND), 2 instructions"
Mult4: Left shift = ×2^n → multiply-by-constant via shifts → shamt → sll
Swap:  XOR self-inverse → XOR swap trick → move → clobbered registers are acceptable
```

---

## Narrative Structure

### Act 0: The Subprogram Scaffold (brief recall)

**Purpose:** Students already know subprogram structure from Ch. 5. This act is a quick recall, not re-derivation.

**Narrative beats:**

1. **Recall the contract**
   - *Question:* "What are the three things every MIPS subprogram needs? And what registers are used for inputs vs. outputs?"
   - *Expected:* A label, a body, `jr $ra`. Inputs in $a0–$a3, outputs in $v0–$v1.

2. **The one thing that goes wrong**
   - *Question:* "What happens if you forget `jr $ra`?"
   - *Reveal:* Execution falls through into whatever code follows in memory — undefined behavior. This is the #1 subprogram bug.

3. **The template** — Show the scaffold and keep it visible throughout:

```mips
.text
SubprogramName:
# Subprogram:   SubprogramName
# Author:       [student name]
# Purpose:      [what it does]
# Input:        $a0 = [description], $a1 = [description]
# Output:       $v0 = [description]
# Side effects: [description or "none"]

    # === BODY GOES HERE ===

    jr $ra
```

> **Note on comment format:** Match the existing utils.asm style exactly. Use `# Subprogram:`, `# Author:`, etc. — no dashed border lines.

> **Note on `.text`:** Every subprogram starts with `.text` as a defensive measure — if a previous subprogram's `.data` section was the last thing assembled, our code would land in the wrong segment.

**Scaffold checkpoint:** At the start of each subsequent Act, the student should fill in the scaffold template (name, inputs, outputs) before writing the body. This takes 30 seconds and reinforces the pattern through spaced repetition.

---

### Act 1: NOR — Fully Worked Example

*Scaffolding level: FULL — students study the complete worked example with annotations.*

**Why full example first:** Research on faded worked examples (Sweller/CLT) shows that novices learn more from studying complete worked examples than from attempting to solve problems. The first subprogram maximizes schema formation.

**Concept activation sequence:**

1. **Warm-up: NOR truth table** (use 4-bit values, not 32-bit)
   - *Question:* "Fill in the truth table for NOR using just two bits. How does NOR relate to OR?"

   | A | B | A OR B | A NOR B |
   |---|---|--------|---------|
   | 0 | 0 |   0    |    1    |
   | 0 | 1 |   1    |    0    |
   | 1 | 0 |   1    |    0    |
   | 1 | 1 |   1    |    0    |

   - *Key insight:* NOR = NOT(OR). Output is 1 only when BOTH inputs are 0.

2. **Bitwise application** (use small concrete values)
   - *Question:* "Apply NOR bitwise to these 4-bit values: 1010 NOR 1100. Work it bit by bit."
   - *Expected:* Bit 3: 1 NOR 1 = 0. Bit 2: 0 NOR 1 = 0. Bit 1: 1 NOR 0 = 0. Bit 0: 0 NOR 0 = 1. Result: 0001.
   - *Then generalize:* "MIPS does this for all 32 bits in parallel."

3. **The surprise: `nor` is a real instruction**
   - *Reveal:* MIPS has a hardware `nor` instruction. In fact, `not` is a pseudo-instruction implemented AS `nor Rd, Rs, $zero`. MIPS chose to include `nor` because NOR-with-zero gives you NOT for free, making a separate NOT instruction redundant.
   - *Attention shift:* From "I need to build NOR from pieces" to "I just need one instruction"

4. **Wire it up**
   - *Question:* "The inputs are in $a0 and $a1. The output goes in $v0. What's the instruction?"
   - **Line produced:** `nor $v0, $a0, $a1`

**Complete NOR subprogram (fully annotated):**

```mips
.text                         # Defensive: ensure we are in the text segment
NOR:
# Subprogram:   NOR
# Author:       [student name]
# Purpose:      Performs bitwise NOR on two values
# Input:        $a0 = first value, $a1 = second value
# Output:       $v0 = $a0 NOR $a1
# Side effects: none
    nor   $v0, $a0, $a1      # NOR is a real MIPS instruction — one line does it all
    jr    $ra                 # Return to caller
```

**Post-subprogram reflection:**
- *Question:* "How many lines were scaffold/boilerplate vs. actual logic?"
- *Expected insight:* The logic was ONE line. Most assembly programming is structure and documentation. This ratio is typical.

---

### Act 2: NAND — Completion Problem

*Scaffolding level: PARTIAL — students are given the scaffold + first instruction and must complete the rest.*

**Transition:** "NOR had a hardware instruction. Let's see if NAND does too."

**Concept activation sequence:**

1. **Pattern recognition prompt**
   - *Question:* "NAND is to AND what NOR is to OR. Based on how we wrote NOR, what's your first instinct for NAND?"
   - *Expected:* "Use a `nand` instruction" — but there ISN'T one.
   - *What happens if you try:* MARS will give an assembler error. There is no `nand` mnemonic.

2. **NAND truth table** (same 4-bit approach)
   - *Question:* "Fill in NAND. Express it as a composition of operations you already know."
   - *Expected:* NAND = NOT(AND). Two familiar operations composed.

3. **What you're given** (the completion problem):

```mips
.text
NAND:
# Subprogram:   NAND
# Author:       [student name]
# Purpose:      Performs bitwise NAND on two values
# Input:        $a0 = first value, $a1 = second value
# Output:       $v0 = $a0 NAND $a1
# Side effects: none
    and   $v0, $a0, $a1      # Step 1: AND the inputs
    # ??? Step 2: What goes here to complete NAND?
    jr    $ra
```

4. **Complete it**
   - *Question:* "You have the AND result in $v0. What single instruction turns AND into NAND?"
   - *Hint:* "Remember, `not` is a pseudo-instruction. What real instruction does it expand to?"
   - **Line the student derives:** `not $v0, $v0` (pseudo for `nor $v0, $v0, $zero`)

> **MARS note:** In the Basic column, MARS will show `nor $v0, $v0, $zero` instead of `not $v0, $v0`. This is the real instruction behind the pseudo-instruction. Don't be alarmed.

**Cross-subprogram comparison** (the key pedagogical move):
- *Question:* "Compare NOR and NAND side by side. What's structurally identical? What's different?"
- *Expected:* Same scaffold, same register contract. NOR is 1 instruction (hardware support); NAND is 2 (composition). The difference is purely about what the hardware provides, not about the logic.

---

### Act 3: Mult4 — Guided Problem

*Scaffolding level: MINIMAL — students are given only the comment header and must write the entire body.*

**Domain transition:** "The first two subprograms used bitwise logic operators. This one uses a different kind of bit manipulation — *shifting* — to achieve arithmetic."

**Concept activation sequence:**

1. **The constraint**
   - *Statement:* "Mult4 must multiply by 4 using ONLY the shift operation. No `mul`, no `add`."
   - *Question:* "Why would anyone multiply without using multiply?"
   - *Expected:* Shifts are faster in hardware (1 cycle vs. multiple cycles)

2. **The decimal analogy** (bridge from familiar to unfamiliar)
   - *Statement:* "When you multiply by 10 in decimal, you shift digits left one place and add a zero: 42 → 420. Binary works the same way."
   - *Question:* "If you shift the 4-bit binary number 0101 (decimal 5) left by 1 position, what do you get?"
   - *Expected:* 1010 (decimal 10). Shifting left by 1 = multiplying by 2.

3. **Generalize**
   - *Question:* "4 = 2^?. So to multiply by 4, how many positions do we shift?"
   - *Expected:* 4 = 2², so shift left by 2.
   - *Common mistake warning:* "Shifting by **4** would multiply by 2⁴ = **16**, not by 4. The shift amount is the *exponent*, not the multiplier."

4. **Predict before coding**
   - *Question:* "Before writing the instruction: if $a0 = 3 (binary: 0011), predict what `sll $v0, $a0, 2` produces."
   - *Expected:* 1100 = 12 = 3 × 4. Correct!
   - *Question:* "What about $a0 = -1 (0xFFFFFFFF)?"
   - *Expected:* 0xFFFFFFFC = -4. Correct! sll works for signed values too (as long as there's no overflow).

5. **What you're given** (guided problem — just the header):

```mips
.text
Mult4:
# Subprogram:   Mult4
# Author:       [student name]
# Purpose:      Multiplies input by 4 using only shift
# Input:        $a0 = value to multiply
# Output:       $v0 = $a0 * 4
# Side effects: none

    # Write your body here

    jr    $ra
```

6. **The student writes:** `sll $v0, $a0, 2`

> **Edge case note:** If $a0 is very large (> 2²⁹ - 1 or < -2²⁹), the upper bits are silently lost — same overflow issue from the integer overflow concept, but `sll` does NOT trap. It just discards the bits.

**Post-subprogram reflection:**
- *Question:* "How would you multiply by 8 using only shifts?"
- *Expected:* `sll $v0, $a0, 3` — because 8 = 2³. Same pattern, different exponent.

---

### Act 4: Swap — Independent Problem

*Scaffolding level: NONE — students write everything from scratch, then compare against the worked solution.*

**This is the most conceptually dense subprogram.** The XOR swap requires understanding a *property* of XOR (self-inverse), not just its truth table.

**Concept activation sequence:**

1. **Recall: XOR truth table** (use concrete 4-bit values)
   - *Question:* "Compute 1010 XOR 1100, bit by bit."
   - *Expected:* 0110. XOR = 1 when inputs differ.

2. **Discover the self-inverse property**
   - *Question:* "Now XOR that result (0110) with the second value (1100) again. What do you get?"
   - *Expected:* 0110 XOR 1100 = 1010 — the ORIGINAL first value!
   - *Key insight:* XOR-ing with the same value twice cancels out. `(A XOR B) XOR B = A`.
   - *Analogy:* Flipping a light switch twice returns it to its original state.

3. **Pose the problem BEFORE revealing the trick**
   - *Question:* "How would you swap the values in $a0 and $a1 if you had NO temporary register available? You can only use XOR."
   - *Let the student sit with this.* The impossibility feeling makes the reveal more impactful.

4. **The swap algorithm** — Students should attempt to derive this. If stuck, provide the trace:

   ```
   Start:   $a0 = A,           $a1 = B
   Step 1:  xor $a0, $a0, $a1  →  $a0 = A XOR B,     $a1 = B
   Step 2:  xor $a1, $a0, $a1  →  $a0 = A XOR B,     $a1 = A    (self-inverse!)
   Step 3:  xor $a0, $a0, $a1  →  $a0 = B,            $a1 = A    (self-inverse!)
   ```

5. **Edge case verification**
   - *Question:* "What happens when $a0 = $a1? Trace through with both equal to A."
   - *Expected:* Step 1: $a0 = A XOR A = 0. Step 2: $a1 = 0 XOR A = A. Step 3: $a0 = 0 XOR A = A. Result: both still A. Correct! (Swapping identical values is a no-op.)
   - *Why this matters:* The intermediate zero might alarm you, but it resolves correctly.

6. **Moving to return registers**

   **Assignment spec warning:** The assignment text contains confusing notation. Line 12 says "$a0 -> $v0 and $a1 -> $v1", which LOOKS like "put $a0's value in $v0." But line 13 clarifies: "the original $a0 register is returned in $v1 and the original $a1 is returned in $v0." Follow line 13 — the originals are SWAPPED in the return registers.

   - *Register state checkpoint:* After the three XORs: **$a0 = B** (original $a1), **$a1 = A** (original $a0).
   - *Question:* "The spec wants original $a1 in $v0 and original $a0 in $v1. Which register currently holds each?"
   - *Expected:* $a0 currently holds B (original $a1) → move to $v0. $a1 currently holds A (original $a0) → move to $v1.

   ```mips
   move $v0, $a0    # $v0 = B (original $a1)
   move $v1, $a1    # $v1 = A (original $a0)
   ```

   > **MARS note:** `move` is a pseudo-instruction that expands to `addu $dest, $zero, $src` in the Basic column. This is normal.

7. **Why modifying $a0 and $a1 is OK**
   - *Question:* "We changed $a0 and $a1. Won't the caller be upset?"
   - *Reveal:* No. The $a registers are caller-saved ("non-saved registers are clobbered"). The calling convention says the callee is free to modify them. That's why we document it as a side effect in the header comment.

8. **Honesty about XOR swap** (after implementation)
   - *Question:* "Could we skip the XOR and just do `move $v0, $a1` / `move $v1, $a0` to achieve the same result?"
   - *Reveal:* Yes! For THIS specific case (moving to different registers), you could. The XOR swap is meaningful when you must swap values IN PLACE with no third register available. On modern pipelined processors, the three dependent XOR instructions actually create pipeline stalls — a temp-register swap is faster. This is a learning exercise about XOR's algebraic properties, not a performance optimization.

**The student writes the complete Swap subprogram independently, then compares against the reference solution:**

```mips
.text
Swap:
# Subprogram:   Swap
# Author:       [student name]
# Purpose:      Swaps two values using XOR and MOVE
# Input:        $a0 = first value, $a1 = second value
# Output:       $v0 = original $a1, $v1 = original $a0
# Side effects: $a0 and $a1 are modified
    xor   $a0, $a0, $a1      # $a0 = A XOR B
    xor   $a1, $a0, $a1      # $a1 = (A XOR B) XOR B = A
    xor   $a0, $a0, $a1      # $a0 = (A XOR B) XOR A = B
    move  $v0, $a0            # $v0 = B (original $a1)
    move  $v1, $a1            # $v1 = A (original $a0)
    jr    $ra
```

**Narrative bookend reflection:**
- *Question:* "Which of the four subprograms taught you the most? Why?"
- *Transfer question:* "When would the XOR swap be genuinely necessary — can you imagine a scenario with only two available registers?"

---

### Act 5: File Deliverables — Updating utils.asm

**Purpose:** The assignment requires updating the file preamble and adding your name. Students often lose points here.

**Preamble update example:**

The existing utils.asm preamble looks approximately like this (verify against the actual downloaded file — the exact format may differ):

```mips
# File:         utils.asm
# Author:       Charles Kann
# Purpose:      Utility subprograms for MIPS programs
#
# Subprograms Index:
#   Exit         - Exits the program
#   PrintNewLine - Prints a newline character
#   PrintInt     - Prints a string label and integer value
#   PrintString  - Prints a string
#   PromptInt    - Prompts user for an integer, returns in $v0
```

**Updated preamble** (student adds their name and four new entries):

```mips
# File:         utils.asm
# Author:       Charles Kann, [Student Name]
# Purpose:      Utility subprograms for MIPS programs
#
# Subprograms Index:
#   Exit         - Exits the program
#   PrintNewLine - Prints a newline character
#   PrintInt     - Prints a string label and integer value
#   PrintString  - Prints a string
#   PromptInt    - Prompts user for an integer, returns in $v0
#   NOR          - Bitwise NOR of two values
#   NAND         - Bitwise NAND of two values
#   Mult4        - Multiplies input by 4 using shift
#   Swap         - Swaps two values using XOR, returns swapped
```

**Subprogram ordering within utils.asm:** Append the four new subprograms after the existing ones, in the order: NOR, NAND, Mult4, Swap (matching the narrative order).

---

### Act 6: Verification Epilogue

**Purpose:** Students need a way to confirm their code works. The assignment says "other subprograms in utils.asm can be used" for I/O.

**Minimal test harness** (a separate `main.asm` file):

```mips
# File:    main.asm
# Purpose: Test harness for Project 2 subprograms

.include "utils.asm"

.data
norLabel:   .asciiz "NOR result:  "
nandLabel:  .asciiz "NAND result: "
mult4Label: .asciiz "Mult4 result: "
swapLabel1: .asciiz "Swap $v0: "
swapLabel2: .asciiz "Swap $v1: "

.text
main:
    # Test NOR: 0xF0F0F0F0 NOR 0x0F0F0F0F = 0x00000000
    li    $a0, 0xF0F0F0F0
    li    $a1, 0x0F0F0F0F
    jal   NOR
    move  $a1, $v0
    la    $a0, norLabel
    jal   PrintInt
    jal   PrintNewLine

    # Test NAND: 0xFF00FF00 NAND 0xFFFF0000 = NOT(0xFF000000) = 0x00FFFFFF
    li    $a0, 0xFF00FF00
    li    $a1, 0xFFFF0000
    jal   NAND
    move  $a1, $v0
    la    $a0, nandLabel
    jal   PrintInt
    jal   PrintNewLine

    # Test Mult4: 7 * 4 = 28
    li    $a0, 7
    jal   Mult4
    move  $a1, $v0
    la    $a0, mult4Label
    jal   PrintInt
    jal   PrintNewLine

    # Test Swap: $a0=10, $a1=20 → $v0 should be 20, $v1 should be 10
    li    $a0, 10
    li    $a1, 20
    jal   Swap
    move  $a1, $v0
    la    $a0, swapLabel1
    jal   PrintInt
    jal   PrintNewLine
    move  $a1, $v1
    la    $a0, swapLabel2
    jal   PrintInt
    jal   PrintNewLine

    jal   Exit
```

> **Note:** This test harness calls subprograms from within main, which itself is called from nowhere — so $ra is never at risk of being overwritten. Students should step through in MARS and check register values at each `jr $ra`.

---

## Ordering Rationale

- **NOR first:** Simplest (1-instruction body), fully worked — maximizes schema formation
- **NAND second:** Identical structure but requires composition (2 instructions) — completion problem builds on NOR pattern. Adjacent placement enables the strongest pedagogical move: direct structural comparison
- **Mult4 third:** Domain shift from logic to arithmetic — provides variety after two structurally similar subprograms, preventing the "illusion of understanding" from repetition
- **Swap last:** Most conceptually complex (5-instruction body, non-obvious algorithm, two return registers) — independent problem that applies all learned patterns

---

## File Deliverables

The student produces a single updated `utils.asm` file containing:

1. Updated file preamble (author name added, index updated with 4 new subprograms)
2. Four new subprogram blocks appended to the end of the file
3. Standardized header comments matching existing utils.asm format

**Total new lines of assembly (excluding comments):**
- NOR: 2 lines (nor + jr)
- NAND: 3 lines (and + not + jr)
- Mult4: 2 lines (sll + jr)
- Swap: 6 lines (3 xor + 2 move + jr)
- **Total: 13 lines of actual MIPS code**

## Acceptance Criteria

- [ ] Every line of assembly is preceded by a question or concept activation that makes the student derive it
- [ ] Faded scaffolding is applied: NOR=full, NAND=completion, Mult4=guided, Swap=independent
- [ ] The scaffold template is taught once (Act 0) and reused with a brief checkpoint at each subsequent act
- [ ] NOR→NAND structural comparison is explicitly prompted
- [ ] Swap register mapping confusion is explicitly warned about (assignment lines 12 vs. 13)
- [ ] Edge cases are addressed: $a0=$a1 for XOR swap, overflow for Mult4
- [ ] File preamble update is shown concretely with before/after example
- [ ] Verification epilogue provides a test harness so students can confirm correctness
- [ ] The narrative reads linearly as a complete walkthrough (Acts 0→1→2→3→4→5→6)

## Sources

- **Origin brainstorm:** [docs/brainstorms/2026-03-09-conceptual-tree-brainstorm.md](docs/brainstorms/2026-03-09-conceptual-tree-brainstorm.md) — concept tree with 212 atomic concepts across 8 layers
- **Assignment:** [project2_assignment.txt](project2_assignment.txt) — original project requirements

### Research References
- Sweller, J. — Cognitive Load Theory: worked-example effect, faded examples, completion problems
- [Faded Worked Examples — CAFE Toolkit](https://cafe.cognitiveload.com.au/kb/fadedworkedexamples)
- [Fade-in vs Fade-out Scaffolding for Novice Programmers — PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC8782216/)
- [Activating Prior Knowledge — Virginia Tech CELT](https://teaching.vt.edu/teachingresources/adjustinginstruction/priorknowledge.html)
- [Socratic Method in Coding Education — AlgoCademy](https://algocademy.com/blog/the-socratic-method-in-coding-education-unlocking-deeper-understanding-through-questioning/)
- [XOR Swap Algorithm — Wikipedia](https://en.wikipedia.org/wiki/XOR_swap_algorithm)
- [Swap Two Variables Using XOR — BetterExplained](https://betterexplained.com/articles/swap-two-variables-using-xor/)
