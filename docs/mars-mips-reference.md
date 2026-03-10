# MARS MIPS Simulator — Reference Guide

## Official Sources

- **Official website**: https://dpetersanderson.github.io/
- **Download (JAR)**: https://dpetersanderson.github.io/download.html
- **GitHub repo**: https://github.com/dpetersanderson/MARS
- **Built-in help docs**: https://dpetersanderson.github.io/Help/MarsHelpIntro.html
- **Syscall reference**: https://dpetersanderson.github.io/Help/SyscallHelp.html
- **Missouri State page**: https://computerscience.missouristate.edu/mars-mips-simulator.htm

**Pro tip**: Inside MARS, press **F1** to access the built-in reference with searchable tabs for instructions, pseudo-instructions, directives, and syscalls.

MARS 4.5 supports **155 basic instructions**, ~**370 pseudo-instructions**, and **39 syscalls**.

---

## Register Conventions

| Register | # | Purpose | Callee-saved? |
|----------|---|---------|---------------|
| `$zero` | 0 | Hardwired to 0 | N/A |
| `$at` | 1 | Assembler temporary (reserved) | No |
| `$v0-$v1` | 2-3 | Return values / syscall code | No |
| `$a0-$a3` | 4-7 | Function arguments (first 4) | No |
| `$t0-$t7` | 8-15 | Temporaries (caller-saved) | No |
| `$s0-$s7` | 16-23 | Saved registers (callee-saved) | **Yes** |
| `$t8-$t9` | 24-25 | More temporaries | No |
| `$k0-$k1` | 26-27 | Reserved for OS kernel | No |
| `$gp` | 28 | Global pointer | **Yes** |
| `$sp` | 29 | Stack pointer | **Yes** |
| `$fp` | 30 | Frame pointer | **Yes** |
| `$ra` | 31 | Return address (set by `jal`) | **Yes** |

---

## Syscalls

Load service number into `$v0`, arguments into `$a0-$a3` (or `$f12` for floats), then execute `syscall`.

### Core Syscalls

| Service | $v0 | Arguments | Result |
|---------|-----|-----------|--------|
| Print integer | 1 | `$a0` = integer | |
| Print float | 2 | `$f12` = float | |
| Print double | 3 | `$f12` = double | |
| Print string | 4 | `$a0` = string address | |
| Read integer | 5 | — | `$v0` = integer |
| Read float | 6 | — | `$f0` = float |
| Read double | 7 | — | `$f0` = double |
| Read string | 8 | `$a0` = buffer, `$a1` = max length | String in buffer |
| Sbrk (alloc heap) | 9 | `$a0` = bytes | `$v0` = address |
| Exit | 10 | — | Terminates |
| Print char | 11 | `$a0` = char | |
| Read char | 12 | — | `$v0` = char |
| Open file | 13 | `$a0` = filename, `$a1` = flags, `$a2` = mode | `$v0` = fd |
| Read file | 14 | `$a0` = fd, `$a1` = buffer, `$a2` = max bytes | `$v0` = bytes read |
| Write file | 15 | `$a0` = fd, `$a1` = buffer, `$a2` = num bytes | `$v0` = bytes written |
| Close file | 16 | `$a0` = fd | |
| Exit2 (with code) | 17 | `$a0` = exit code | Terminates |

### MARS-Exclusive Syscalls

| Service | $v0 | Purpose |
|---------|-----|---------|
| System time | 30 | Milliseconds since epoch → `$a0` (low), `$a1` (high) |
| MIDI out | 31 | Play tone (pitch, duration, instrument, volume in `$a0-$a3`) |
| Sleep | 32 | Sleep `$a0` milliseconds |
| MIDI out (sync) | 33 | Synchronous MIDI |
| Print hex | 34 | Print `$a0` in hex |
| Print binary | 35 | Print `$a0` in binary |
| Print unsigned | 36 | Print `$a0` as unsigned |
| Random seed | 40 | Set RNG seed: id=`$a0`, seed=`$a1` |
| Random int | 41 | Random int → `$v0` (RNG id=`$a0`) |
| Random int range | 42 | Random int in [0, `$a1`) → `$a0` |
| Random float | 43 | Random float [0.0, 1.0) → `$f0` |
| Random double | 44 | Random double [0.0, 1.0) → `$f0` |

---

## Assembler Directives

| Directive | Purpose | Example |
|-----------|---------|---------|
| `.data` | Begin data segment | `.data` |
| `.text` | Begin code segment | `.text` |
| `.globl label` | Declare global label | `.globl main` |
| `.word` | Store 32-bit word(s) | `myVar: .word 42` |
| `.half` | Store 16-bit halfword(s) | `myHalf: .half 0x1234` |
| `.byte` | Store byte(s) | `chars: .byte 'A', 'B'` |
| `.float` | Store 32-bit float | `pi: .float 3.14` |
| `.double` | Store 64-bit double | `e: .double 2.718` |
| `.ascii` | String (no null terminator) | `.ascii "hello"` |
| `.asciiz` | Null-terminated string | `msg: .asciiz "Hello\n"` |
| `.space n` | Allocate n bytes | `buffer: .space 100` |
| `.align n` | Align to 2^n boundary | `.align 2` |

---

## Common Instructions

### Arithmetic

| Instruction | Example | Meaning |
|-------------|---------|---------|
| `add` | `add $t0, $t1, $t2` | `$t0 = $t1 + $t2` (overflow trap) |
| `addu` | `addu $t0, $t1, $t2` | `$t0 = $t1 + $t2` (no trap) |
| `addi` | `addi $t0, $t1, 100` | `$t0 = $t1 + 100` |
| `addiu` | `addiu $t0, $t1, 100` | `$t0 = $t1 + 100` (no trap) |
| `sub` | `sub $t0, $t1, $t2` | `$t0 = $t1 - $t2` |
| `subu` | `subu $t0, $t1, $t2` | `$t0 = $t1 - $t2` (no trap) |
| `mul` | `mul $t0, $t1, $t2` | `$t0 = $t1 * $t2` (low 32 bits) |
| `mult` | `mult $t1, $t2` | `HI:LO = $t1 * $t2` |
| `div` | `div $t1, $t2` | `LO = $t1 / $t2`, `HI = $t1 % $t2` |
| `mfhi` | `mfhi $t0` | `$t0 = HI` |
| `mflo` | `mflo $t0` | `$t0 = LO` |

### Logical

| Instruction | Example | Meaning |
|-------------|---------|---------|
| `and` | `and $t0, $t1, $t2` | `$t0 = $t1 & $t2` |
| `andi` | `andi $t0, $t1, 0xFF` | `$t0 = $t1 & 0xFF` |
| `or` | `or $t0, $t1, $t2` | `$t0 = $t1 \| $t2` |
| `ori` | `ori $t0, $t1, 0xFF` | `$t0 = $t1 \| 0xFF` |
| `xor` | `xor $t0, $t1, $t2` | `$t0 = $t1 ^ $t2` |
| `nor` | `nor $t0, $t1, $t2` | `$t0 = ~($t1 \| $t2)` |
| `sll` | `sll $t0, $t1, 4` | `$t0 = $t1 << 4` |
| `srl` | `srl $t0, $t1, 4` | `$t0 = $t1 >> 4` (logical) |
| `sra` | `sra $t0, $t1, 4` | `$t0 = $t1 >> 4` (arithmetic) |

### Comparison

| Instruction | Example | Meaning |
|-------------|---------|---------|
| `slt` | `slt $t0, $t1, $t2` | `$t0 = ($t1 < $t2) ? 1 : 0` (signed) |
| `sltu` | `sltu $t0, $t1, $t2` | unsigned comparison |
| `slti` | `slti $t0, $t1, 100` | immediate comparison |

### Load / Store

| Instruction | Example | Meaning |
|-------------|---------|---------|
| `lw` | `lw $t0, 0($sp)` | Load word |
| `lh` / `lhu` | `lh $t0, 0($a0)` | Load halfword (signed/unsigned) |
| `lb` / `lbu` | `lb $t0, 0($a0)` | Load byte (signed/unsigned) |
| `sw` | `sw $t0, 0($sp)` | Store word |
| `sh` | `sh $t0, 0($a0)` | Store halfword |
| `sb` | `sb $t0, 0($a0)` | Store byte |
| `lui` | `lui $t0, 0x1234` | Load upper 16 bits |

### Branch and Jump

| Instruction | Example | Meaning |
|-------------|---------|---------|
| `beq` | `beq $t0, $t1, label` | Branch if equal |
| `bne` | `bne $t0, $t1, label` | Branch if not equal |
| `j` | `j label` | Unconditional jump |
| `jal` | `jal function` | Jump and link (saves `$ra`) |
| `jr` | `jr $ra` | Jump register (return) |

---

## Common Pseudo-Instructions

| Pseudo | Example | Expands To |
|--------|---------|------------|
| `li` | `li $t0, 0x12345678` | `lui` + `ori` |
| `la` | `la $a0, myString` | `lui` + `ori` |
| `move` | `move $t0, $t1` | `addu $t0, $zero, $t1` |
| `blt` | `blt $t0, $t1, label` | `slt` + `bne` |
| `ble` | `ble $t0, $t1, label` | `slt` + `beq` |
| `bgt` | `bgt $t0, $t1, label` | `slt` + `bne` (swapped) |
| `bge` | `bge $t0, $t1, label` | `slt` + `beq` (swapped) |
| `not` | `not $t0, $t1` | `nor $t0, $t1, $zero` |
| `neg` | `neg $t0, $t1` | `sub $t0, $zero, $t1` |
| `rem` | `rem $t0, $t1, $t2` | `div` + `mfhi` |

**Tip**: In MARS, the "Basic" column in the Text Segment shows how pseudo-instructions expand.

---

## Program Template

```mips
        .data
msg:    .asciiz "Enter a number: "
result: .asciiz "Result: "
nl:     .asciiz "\n"

        .text
        .globl main
main:
        # Print prompt
        li   $v0, 4
        la   $a0, msg
        syscall

        # Read integer
        li   $v0, 5
        syscall
        move $t0, $v0

        # ... do work with $t0 ...

        # Print result
        li   $v0, 4
        la   $a0, result
        syscall
        li   $v0, 1
        move $a0, $t0
        syscall

        # Newline + exit
        li   $v0, 4
        la   $a0, nl
        syscall
        li   $v0, 10
        syscall
```

---

## Function Call Convention (Stack Frame)

```mips
myFunc:
        # Prologue — save $ra and any $s registers used
        addi $sp, $sp, -8      # allocate stack frame
        sw   $ra, 4($sp)       # save return address
        sw   $s0, 0($sp)       # save $s0 if used

        # ... function body ...

        # Epilogue — restore and return
        lw   $s0, 0($sp)
        lw   $ra, 4($sp)
        addi $sp, $sp, 8       # deallocate frame
        jr   $ra               # return
```

---

## Additional References

- [USC MARS Tutorial (PDF)](https://bytes.usc.edu/files/ee109/documents/MARS_Tutorial.pdf)
- [MIPS Reference Card (PDF)](https://cburch.com/cs/330/reading/mips-ref.pdf)
- [Berkeley MIPS Reference](https://inst.eecs.berkeley.edu/~cs61c/resources/MIPS_help.html)
- [Tufts MIPS Info Sheet (PDF)](https://www.cs.tufts.edu/comp/140/lectures/Day_3/mips_summary.pdf)
- [Wikibooks — MIPS Pseudo-Instructions](https://en.wikibooks.org/wiki/MIPS_Assembly/Pseudoinstructions)
- [RipTutorial — MARS](https://riptutorial.com/mips/example/29993/mars-mips-simulator)
- [Stephen Marz — MIPS Assembly](https://marz.utk.edu/my-courses/cosc130/lectures/mips-assembly/)
