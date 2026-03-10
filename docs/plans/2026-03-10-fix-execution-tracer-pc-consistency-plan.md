---
title: "fix: Add $pc to all ExecutionTracer instances"
type: fix
status: completed
date: 2026-03-10
---

# fix: Add $pc to all ExecutionTracer instances

The `$pc` register is missing from two of the six ExecutionTracer instances. Since `$pc` is introduced in the Prologue and is central to understanding execution flow, it should appear in every trace.

## Current State

| Section | instanceId | Has $pc? | Has $ra? |
|---|---|---|---|
| Act0Scaffold | `tracer-call-return` | **NO** | Yes |
| Act1Nor | `tracer-nor` | Yes | Yes |
| Act2Nand | `tracer-nand` | Yes | Yes |
| Act3Mult4 | `tracer-mult4` | Yes | Yes |
| Act4Swap | `tracer-swap` | Yes | Yes |
| InterlSyscall | `tracer-hello-syscall` | **NO** | **NO** |

## Changes Required

### 1. Act0Scaffold.svelte — `tracer-call-return`

This is the **first trace** students encounter and the one that introduces the call/return dance. It should model `$pc` to show HOW `jal` and `jr` change the program counter.

**registers prop** (line 115): Add `'$pc'`
```
registers={['$a0', '$a1', '$v0', '$ra', '$pc']}
```

**Step data** (lines 27–30): Add `$pc` to each step's `registers` object, add `'$pc'` to `changed` arrays where it advances.

Reference addresses array (already exists):
```
['0x00400000', '0x00400004', '0x00400008', '0x0040000C', '0x00400010', '0x00400014', '0x00400018', '0x0040001C']
  main:        li $a0       li $a1       jal NOR       move $t0      NOR:         nor $v0       jr $ra
```

The $pc values for each step (following the pattern from Act1Nor's trace where $pc = address of the next instruction after the current one executes):

| Step | instruction | line | $pc value | $pc changed? | Rationale |
|---|---|---|---|---|---|
| 0 | Before jal NOR | 0 | `'0x0040000C'` | no (initial) | Args loaded, PC points at jal (about to execute) |
| 1 | jal NOR | 3 | `'0x00400018'` | **yes** | jal jumps $pc to NOR's body instruction |
| 2 | nor $v0, $a0, $a1 | 6 | `'0x0040001C'` | **yes** | PC advances to jr $ra |
| 3 | jr $ra | 7 | `'0x00400010'` | **yes** | jr copies $ra into $pc — jumps back |

Annotations should mention $pc movement (matching the style of Act1Nor):
- Step 1: already says "jal saves the next instruction's address in $ra, then jumps to NOR" — update to also note $pc: "jal saves 0x00400010 in $ra and sets $pc to NOR (0x00400018)"
- Step 3: already says "jr copies $ra into $pc" — good, just needs the concrete address

### 2. InterlSyscall.svelte — `tracer-hello-syscall`

This is a linear program (no calls/returns), so `$ra` isn't relevant, but `$pc` still matters — it shows students that execution advances sequentially, instruction by instruction.

**registers prop** (line 101): Add `'$pc'`
```
registers={['$v0', '$a0', '$pc']}
```

**Step data** (lines 24–29): Add `$pc` to each step's `registers` object.

Reference: the code has `.data`, `msg: .asciiz`, `.text`, then 5 instructions starting at `main:`. The `.data`/`.text` directives don't consume instruction addresses. The 5 real instructions under `main:` start at the standard MIPS text address `0x00400000`:

```
index 0: .data              → (directive, no address)
index 1: msg: .asciiz       → (data segment)
index 2: .text              → (directive, no address)
index 3: main:              → 0x00400000 (label)
index 4: li  $v0, 4         → 0x00400000
index 5: la  $a0, msg       → 0x00400004
index 6: syscall            → 0x00400008
index 7: li  $v0, 10        → 0x0040000C
index 8: syscall            → 0x00400010
```

Note: No `addresses` prop currently exists on this tracer. One should be added for $pc to make sense visually.

| Step | instruction | line | $pc value | $pc changed? |
|---|---|---|---|---|
| 0 | Initial state | 3 | `'0x00400000'` | no (initial) |
| 1 | li $v0, 4 | 4 | `'0x00400004'` | yes |
| 2 | la $a0, msg | 5 | `'0x00400008'` | yes |
| 3 | syscall | 6 | `'0x0040000C'` | yes |
| 4 | li $v0, 10 | 7 | `'0x00400010'` | yes |
| 5 | syscall (exit) | 8 | `'—'` | yes |

The last step is program termination — $pc could be shown as `'—'` or `'(terminated)'` to indicate the program ended.

## Acceptance Criteria

- [x] Act0Scaffold `tracer-call-return` shows `$pc` in register display with correct values at each step
- [x] Act0Scaffold annotations reference `$pc` movement for `jal` and `jr $ra` steps
- [x] InterlSyscall `tracer-hello-syscall` shows `$pc` advancing sequentially
- [x] InterlSyscall has an `addresses` prop for the code panel
- [x] All six ExecutionTracer instances now include `$pc`
- [x] Build passes cleanly

## Files to Modify

- `site/src/components/sections/project2/Act0Scaffold.svelte` — add $pc to registers prop + all 4 step objects
- `site/src/components/sections/project2/InterlSyscall.svelte` — add $pc to registers prop + all 6 step objects, add addresses prop

## Sources

- Act1Nor.svelte lines 47–55 — reference trace with $pc already implemented correctly
- Act0Scaffold.svelte line 118 — addresses array already exists
