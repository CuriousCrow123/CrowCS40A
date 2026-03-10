# CS 40A Conceptual Tree — MIPS Assembly Language (Chapters 1–5)

> Synthesized from textbook analysis. 212 atomic concepts organized into a dependency tree.
> Each concept builds on its prerequisites — master the foundations before moving up.

---

## How to Read This Document

- **Layers** go from most fundamental (Layer 0) to most applied (Layer 7)
- **Prerequisites** are listed in parentheses — you must understand those concepts first
- **Ch.** references indicate which chapter introduces the concept
- Concepts within the same layer are peers — they can be learned in any order

---

## Layer 0: Binary Foundations

*No prerequisites. The bedrock everything else is built on.*

| ID | Concept | Definition | Ch. |
|----|---------|-----------|-----|
| 0.1 | **Bit** | Smallest unit of data; a circuit holding 0 or 1 | 1 |
| 0.2 | **Binary naming conventions** | Same 0/1 state has context-dependent names: false/true, low/high, off/on | 1 |
| 0.3 | **Decimal positional notation** | Base-10 system where digit position = power of 10 | 1 |
| 0.4 | **Abstraction vs. hardware** | HLLs hide hardware; assembly exposes it directly | 1 |

---

## Layer 1: Number Systems & Data Sizes

*Prerequisites: Layer 0*

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 1.1 | **Binary (base-2) notation** | Numbers as sums of powers of 2 using only 0 and 1 | 0.3 | 1 |
| 1.2 | **Powers of 2** | 2^0=1, 2^1=2, ... 2^10=1024; memorize first 11 | 1.1 | 1 |
| 1.3 | **Binary magnitude names** | K=2^10, M=2^20, G=2^30, T=2^40 | 1.2 | 1 |
| 1.4 | **Nibble** | 4 bits | 0.1 | 1 |
| 1.5 | **Byte** | 8 bits | 1.4 | 1 |
| 1.6 | **Leading zero padding** | Adding 0s to the left doesn't change value; used for alignment | 1.1 | 1 |

---

## Layer 2: Number Conversions & Hexadecimal

*Prerequisites: Layer 1*

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 2.1 | **Binary-to-decimal conversion** | Sum the power-of-2 values of all 1-bit positions | 1.1, 1.2 | 1 |
| 2.2 | **Decimal-to-binary (subtraction)** | Subtract largest fitting power of 2 repeatedly | 1.2 | 1 |
| 2.3 | **Decimal-to-binary (division)** | Divide by 2 repeatedly; remainders form bits from LSB up | 1.1 | 1 |
| 2.4 | **Hexadecimal (base-16)** | Digits 0–9, A–F; each hex digit = one nibble; prefix 0x | 1.4 | 1 |
| 2.5 | **Binary-to-hex conversion** | Group bits into nibbles, convert each to hex digit | 2.4, 1.4 | 1 |
| 2.6 | **Hex-to-binary conversion** | Expand each hex digit to its 4-bit nibble | 2.4, 1.4 | 1 |

---

## Layer 3: Data Types & Representation

*Prerequisites: Layers 1–2*

### 3A: Character Encoding

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 3.1 | **ASCII encoding** | 127 characters mapped to 7-bit codes stored in 8 bits | 1.5, 2.4 | 1 |
| 3.2 | **ASCII digit pattern** | '0'–'9' share prefix 0x30; subtract '0' to get numeric value | 3.1 | 1 |
| 3.3 | **ASCII letter case bit** | Upper/lowercase differ only in bit 5 (0x20 bit) | 3.1 | 1 |
| 3.4 | **Context determines meaning** | Same binary pattern can be char, int, address, or float — context decides | 3.1 | 1 |
| 3.5 | **Null-terminated strings** | Strings end with 0x00 byte; n chars = n+1 bytes | 3.1 | 2 |
| 3.6 | **Escape characters** | `\n` = newline, `\t` = tab within string literals | 3.5 | 2 |

### 3B: Integer Representation

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 3.7 | **Integer vs. whole number** | Integers include negatives; whole numbers are >= 0 | 1.1 | 1 |
| 3.8 | **Sign-magnitude (not used)** | Sign bit + magnitude; rejected due to complex arithmetic | 3.7 | 1 |
| 3.9 | **1's complement (bitwise NOT)** | Flip every bit; intermediate step for 2's complement | 1.1 | 1 |
| 3.10 | **2's complement operation** | Negate by inverting all bits then adding 1; self-inverse | 3.9 | 1 |
| 3.11 | **2's complement representation** | Standard signed integer format; MSB=0 positive, MSB=1 negative | 3.10 | 1 |
| 3.12 | **Sign bit** | MSB of 2's complement number; 0=positive, 1=negative | 3.11 | 1 |
| 3.13 | **Sign extension** | Extend to wider width by replicating sign bit leftward | 3.12 | 1 |
| 3.14 | **Integer type sizes & ranges** | 8-bit: -128..127; 16-bit: -32768..32767; 32-bit: ~-2.1B..2.1B | 3.11, 1.2 | 1 |
| 3.15 | **Little-endian byte ordering** | LSB stored at lowest memory address | 1.5 | 2 |

---

## Layer 4: Hardware Architecture & Memory Model

*Prerequisites: Layers 1–3*

### 4A: CPU Components

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 4.1 | **Register memory** | Fast storage inside CPU; the register file | 0.1 | 2 |
| 4.2 | **Main memory** | Large address space outside CPU for code and data | 4.1 | 2 |
| 4.3 | **ALU** | CPU component performing all arithmetic and logic operations | 4.1 | 2 |
| 4.4 | **Control Unit** | Decodes instructions, controls CPU execution flow | 4.1, 4.3 | 2 |
| 4.5 | **System bus** | Data pathway between CPU and main memory | 4.1, 4.2 | 2 |
| 4.6 | **I/O Control Unit** | Handles communication with external devices via syscall | 4.5 | 2 |
| 4.7 | **Program Counter ($pc)** | Special register holding address of next instruction to execute | 4.1 | 5 |

### 4B: Memory Layout

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 4.8 | **32-bit flat memory model** | Single address space 0x00000000–0xFFFFFFFF (4 GB) | 4.2 | 2 |
| 4.9 | **Text segment** | Code region 0x00400000–0x10000000; each instruction = 1 word | 4.8 | 2 |
| 4.10 | **Static data segment** | Fixed-size data region 0x10010000–0x10040000 | 4.8 | 2 |
| 4.11 | **Heap segment** | Dynamic memory growing upward from 0x10040000 | 4.8 | 2 |
| 4.12 | **Stack segment** | Dynamic memory growing downward from 0x7FFFE00 | 4.8 | 2 |
| 4.13 | **Kernel/MMIO segments** | OS-reserved upper address ranges; not user-accessible | 4.8 | 2 |

### 4C: Register File

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 4.14 | **32 general-purpose registers** | $0–$31, each 32 bits; all computation uses these | 4.1 | 2 |
| 4.15 | **$zero ($0)** | Hardwired to 0; cannot be written | 4.14 | 2 |
| 4.16 | **$at ($1)** | Reserved for assembler; used in pseudo-instruction expansion | 4.14 | 2,3 |
| 4.17 | **$v0–$v1 ($2–$3)** | Return values from subprograms; $v0 = syscall service number | 4.14 | 2 |
| 4.18 | **$a0–$a3 ($4–$7)** | Argument registers for subprograms and syscall | 4.14 | 2 |
| 4.19 | **$t0–$t9 ($8–$15, $24–$25)** | Temporaries; caller-saved (may be clobbered by callee) | 4.14 | 2 |
| 4.20 | **$s0–$s7 ($16–$23)** | Saved registers; callee-saved (preserved across calls) | 4.14 | 2 |
| 4.21 | **$k0–$k1 ($26–$27)** | Kernel-reserved; not for user programs | 4.14 | 2 |
| 4.22 | **$gp, $sp, $fp, $ra ($28–$31)** | Global pointer, stack pointer, frame pointer, return address | 4.14, 4.11, 4.12 | 2 |
| 4.23 | **$hi and $lo** | Special registers for multiply/divide results (outside register file) | 4.3 | 2,3 |
| 4.24 | **Register numbering (5-bit encoding)** | Each register name maps to a 5-bit binary address for machine code | 4.14 | 4 |

---

## Layer 5: Assembly Language Fundamentals

*Prerequisites: Layer 4*

### 5A: Syntax & Structure

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 5.1 | **Assembly vs. compilation** | Each line = one instruction or directive; no compound statements | 4.9 | 2 |
| 5.2 | **Comments (#)** | `#` to end of line is ignored by assembler | 5.1 | 2 |
| 5.3 | **File preamble convention** | Comment block with filename, author, purpose | 5.2 | 2 |
| 5.4 | **Labels** | Text followed by `:` marking a memory address; not variables | 4.9, 4.10 | 2 |
| 5.5 | **The main: label** | Conventional entry point for program execution | 5.4 | 2 |
| 5.6 | **Operators vs. instructions** | Operator = mnemonic; instruction = operator + operands | 5.1 | 2 |
| 5.7 | **Immediate values** | Constants embedded directly in an instruction | 5.6 | 2 |

### 5B: Assembler Directives

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 5.8 | **Assembler directives (`.` prefix)** | Instructions to the assembler, not translated to machine code | 5.1 | 2 |
| 5.9 | **.text directive** | Following content goes in text segment | 5.8, 4.9 | 2 |
| 5.10 | **.data directive** | Following content goes in static data segment | 5.8, 4.10 | 2 |
| 5.11 | **.asciiz directive** | Allocate null-terminated string in data segment | 5.10, 3.5 | 2 |
| 5.12 | **.ascii directive** | Allocate string without null terminator | 5.10, 3.5 | 2 |
| 5.13 | **.space directive** | Allocate n uninitialized bytes | 5.10 | 2 |
| 5.14 | **.word directive** | Allocate and optionally initialize 4 bytes | 5.10 | 2 |
| 5.15 | **.include directive** | Textually insert another .asm file | 5.8 | 5 |

### 5C: Basic Instructions

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 5.16 | **li (load immediate)** | Load constant into register: `li $dest, value` | 5.7, 4.14 | 2 |
| 5.17 | **la (load address)** | Load label's address into register: `la $dest, label` | 5.4, 4.14 | 2 |
| 5.18 | **lw (load word)** | Load 4-byte value from memory into register | 5.4, 4.14, 4.10 | 2 |
| 5.19 | **move** | Copy value between registers: `move $dest, $src` | 4.14 | 2 |

### 5D: syscall I/O

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 5.20 | **syscall mechanism** | Transfer control to I/O unit; service number in $v0 | 4.6, 4.17 | 2 |
| 5.21 | **Service 1: print integer** | Print value in $a0 as decimal | 5.20, 4.18 | 2 |
| 5.22 | **Service 4: print string** | Print null-terminated string at address in $a0 | 5.20, 4.18, 3.5 | 2 |
| 5.23 | **Service 5: read integer** | Read integer from console into $v0 | 5.20, 4.17 | 2 |
| 5.24 | **Service 8: read string** | Read string into buffer ($a0=addr, $a1=max length) | 5.20, 5.13 | 2 |
| 5.25 | **Service 10: exit** | Terminate program | 5.20 | 2 |

### 5E: Data Semantics

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 5.26 | **Pass-by-value** | Copy of data sent; original unaffected (integers) | 5.20 | 2 |
| 5.27 | **Pass-by-reference** | Address sent; callee can modify original data (strings, arrays) | 5.26, 5.17 | 2 |
| 5.28 | **Value types vs. reference types** | Value types hold data directly; reference types hold addresses | 5.26, 5.27 | 2 |

---

## Layer 6: Instruction Formats & Machine Code

*Prerequisites: Layers 4–5*

### 6A: Instruction Architecture

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 6.1 | **3-address machine** | Most instructions specify 3 registers: Rd, Rs, Rt | 4.14, 4.3 | 3 |
| 6.2 | **Instruction format types** | R-format (register), I-format (immediate), J-format (jump) | 6.1 | 3,4 |
| 6.3 | **Machine code** | Binary encoding of an instruction that the CPU executes | 1.1, 5.6 | 4 |
| 6.4 | **Pseudo-instructions** | Assembler-only mnemonics translated to real instructions | 5.6, 4.16 | 3 |
| 6.5 | **16-bit immediate limit** | I-format immediate field is only 16 bits; larger values need lui+ori | 5.7, 6.2 | 3 |
| 6.6 | **Immediate vs. constant** | Immediate = in instruction (fast); constant = in memory (needs load) | 5.7, 4.10 | 3 |

### 6B: R-Format Layout (32 bits)

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 6.7 | **R-format instruction** | Both ALU inputs from registers; 6 fields: op/rs/rt/rd/shamt/funct | 6.2, 4.24 | 3,4 |
| 6.8 | **Op-code field (bits 31–26)** | 6 bits; all R-format = 000000 | 6.7 | 4 |
| 6.9 | **rs field (bits 25–21)** | 5 bits; source register 1 | 6.7, 4.24 | 4 |
| 6.10 | **rt field (bits 20–16)** | 5 bits; source register 2 (R-format) or destination (I-format) | 6.7, 4.24 | 4 |
| 6.11 | **rd field (bits 15–11)** | 5 bits; destination register (R-format only) | 6.7, 4.24 | 4 |
| 6.12 | **shamt field (bits 10–6)** | 5 bits; shift amount (00000 for non-shift ops) | 6.7 | 4 |
| 6.13 | **funct field (bits 5–0)** | 6 bits; specifies exact operation when op=000000 | 6.7, 6.8 | 4 |

### 6C: I-Format Layout (32 bits)

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 6.14 | **I-format instruction** | One ALU input is immediate; 4 fields: op/rs/rt/immediate | 6.2, 4.24 | 3,4 |
| 6.15 | **I-format op-code** | Each I-format instruction has a unique op-code (not 000000) | 6.14, 6.8 | 4 |
| 6.16 | **Immediate field (bits 15–0)** | 16-bit constant value embedded in instruction | 6.14, 6.5 | 4 |
| 6.17 | **rt as destination (I-format)** | In I-format, rt holds the destination register (not rd) | 6.14, 6.10 | 4 |

### 6D: Translation Procedure

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 6.18 | **Identify format from mnemonic** | Consult Green Sheet to determine R or I format | 6.7, 6.14 | 4 |
| 6.19 | **R-format field population** | Fill op=0, rs, rt, rd, shamt, funct from Green Sheet | 6.7–6.13, 4.24 | 4 |
| 6.20 | **Register order reversal** | Assembly: `add rd, rs, rt` but encoding order is op/rs/rt/rd/shamt/funct | 6.19 | 4 |
| 6.21 | **I-format field population** | Fill op, rs, rt (destination), immediate from Green Sheet | 6.14–6.17, 4.24 | 4 |
| 6.22 | **Binary-to-hex grouping** | Group 32-bit result into 8 nibbles, convert each to hex | 2.5, 6.3 | 4 |
| 6.23 | **MIPS Green Sheet** | Reference card listing every instruction's format, op-code, funct | 6.8, 6.13 | 4 |

---

## Layer 7: Operations & Programming

*Prerequisites: Layers 5–6*

### 7A: Arithmetic — Addition & Subtraction

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 7.1 | **Binary addition** | Carry rules: 0+0=0, 0+1=1, 1+1=10; carries propagate left | 1.1 | 1 |
| 7.2 | **Integer addition (2's comp)** | Same binary add procedure works for both positive and negative | 7.1, 3.11 | 1 |
| 7.3 | **Integer overflow** | Result exceeds range; carry-in to sign bit != carry-out | 7.2, 3.14 | 1 |
| 7.4 | **add** | R-format: `add Rd, Rs, Rt` — signed register addition | 6.7, 7.2 | 3 |
| 7.5 | **addi** | I-format: `addi Rt, Rs, Imm` — add signed immediate | 6.14, 7.2, 6.5 | 3 |
| 7.6 | **addu / addiu** | Unsigned variants of add/addi | 7.4, 7.5 | 3 |
| 7.7 | **sub / subu** | R-format subtraction (signed / unsigned) | 7.4 | 3 |
| 7.8 | **subi (pseudo)** | No real subi; assembler uses `addi $at, $zero, Imm` then `sub` | 7.7, 6.4, 4.16 | 3 |
| 7.9 | **Pseudo-add with 32-bit immediate** | Expands to `lui $at, upper` / `ori $at, $at, lower` / `add` | 7.5, 6.5, 4.16 | 3 |

### 7B: Arithmetic — Multiplication & Division

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 7.10 | **Multiplication result width** | N-bit * N-bit can need 2N bits; stored in hi:lo | 4.23 | 3 |
| 7.11 | **mult** | `mult Rs, Rt` — 64-bit result in [hi,lo] | 4.23, 7.10 | 3 |
| 7.12 | **mflo / mfhi** | Move result from lo/hi to a general register | 4.23, 7.11 | 3 |
| 7.13 | **Multiplication overflow** | Overflow if hi != sign-extension of lo's MSB | 7.11, 3.13 | 3 |
| 7.14 | **mul (pseudo)** | 3-operand multiply; `mul Rd, Rs, Rt` — lower 32 bits only | 7.11, 7.12, 6.4 | 3 |
| 7.15 | **mulo (pseudo)** | Like mul but traps on overflow | 7.14, 7.13 | 3 |
| 7.16 | **Integer division truncation** | Fractional part discarded; 17/5 = 3 remainder 2 | 3.7 | 3 |
| 7.17 | **div (real)** | `div Rs, Rt` — quotient in lo, remainder in hi | 4.23, 7.16 | 3 |
| 7.18 | **div (3-op pseudo)** | `div Rd, Rs, Rt` — with zero-divide check | 7.17, 6.4 | 3 |
| 7.19 | **rem (pseudo)** | `rem Rd, Rs, Rt` — remainder from hi | 7.17, 7.12 | 3 |
| 7.20 | **Order-of-operations** | Do multiply/add/sub before divide to preserve integer accuracy | 7.16, 7.14 | 3 |

### 7C: Bit Shifts

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 7.21 | **Left bit shift** | Shift bits left by n; fill with 0s; multiply by 2^n | 1.1, 3.11 | 1,3 |
| 7.22 | **Right bit shift (logical)** | Shift bits right; fill with 0s; for unsigned values | 7.21 | 1,3 |
| 7.23 | **Right bit shift (arithmetic)** | Shift right; fill with sign bit; preserves sign | 7.22, 3.12 | 3 |
| 7.24 | **Multiply by constant (shifts+adds)** | n*10 = (n<<3)+(n<<1); decompose constant into powers of 2 | 7.21, 7.2 | 1 |
| 7.25 | **Shift amount (shamt)** | 0–31 range; dedicated field, not an immediate value | 6.12 | 3 |
| 7.26 | **sll / sllv** | Shift left logical (constant / variable shift amount) | 7.21, 7.25 | 3 |
| 7.27 | **srl / srlv** | Shift right logical (constant / variable) | 7.22, 7.25 | 3 |
| 7.28 | **sra / srav** | Shift right arithmetic (constant / variable) | 7.23, 7.25 | 3 |
| 7.29 | **Circular shift / rotate** | Bits shifted out one end wrap to the other end | 7.21, 7.22 | 3 |
| 7.30 | **rol / ror (pseudo)** | Rotate left/right using sll + srl + or | 7.29, 7.26, 7.27, 6.4 | 3 |
| 7.31 | **rs=0 in shift instructions** | sll uses shamt, not rs; rs field set to 00000 | 6.9, 6.12, 7.26 | 4 |

### 7D: Logical (Bitwise) Operators

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 7.32 | **Boolean operators** | AND, OR, NOT, XOR, NAND, NOR — defined by truth tables | 0.1 | 1 |
| 7.33 | **Truth tables** | Exhaustive listing of all input combinations and outputs | 7.32 | 1 |
| 7.34 | **Logical (short-circuit) operators** | && and \|\| stop evaluating early; NOT used in MIPS | 7.32 | 1 |
| 7.35 | **Bitwise operators** | Apply Boolean op to each bit pair independently; no short-circuit | 7.32 | 1,3 |
| 7.36 | **and / andi** | Bitwise AND on registers or with immediate | 7.35, 6.7, 6.14 | 3 |
| 7.37 | **or / ori** | Bitwise OR on registers or with immediate | 7.35, 6.7, 6.14 | 3 |
| 7.38 | **xor / xori** | Bitwise exclusive-OR; self-inverse (apply twice = original) | 7.35, 6.7, 6.14 | 3 |
| 7.39 | **not (pseudo)** | Bitwise NOT via `nor Rs, Rt, $zero` | 7.35, 6.4 | 3 |
| 7.40 | **OR for case conversion** | OR with 0x20 = tolower; AND with ~0x20 = toupper | 7.37, 3.3 | 1,3 |
| 7.41 | **ori as fast li** | `ori Rd, $zero, Imm` avoids carry propagation delay | 7.37, 5.16 | 3 |
| 7.42 | **XOR swap** | Swap two registers without temp using 3 XOR operations | 7.38 | 3 |

### 7E: Subprograms

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 7.43 | **Subprogram concept** | Reusable named instruction group identified by a label | 5.4, 5.9 | 5 |
| 7.44 | **jal (jump and link)** | Sets $pc to label address; saves return address in $ra | 4.7, 4.22, 7.43 | 5 |
| 7.45 | **jr $ra (return)** | Copies $ra into $pc; resumes execution after the jal | 4.7, 4.22 | 5 |
| 7.46 | **Call/return contract** | Control transfers to subprogram, then returns to instruction after jal | 7.44, 7.45 | 5 |
| 7.47 | **Simple subprogram constraint** | Cannot call other subprograms (jal overwrites $ra) | 7.44, 4.22 | 5 |
| 7.48 | **Input params via $a0–$a3** | Caller loads arguments before jal; callee reads them | 4.18, 7.46 | 5 |
| 7.49 | **Return values via $v0–$v1** | Callee places result before jr $ra; caller reads after | 4.17, 7.46 | 5 |
| 7.50 | **Non-saved registers are clobbered** | $t, $a, $v registers may change across any subprogram call | 4.19, 7.46 | 5 |
| 7.51 | **Subprogram header comments** | Document name, author, purpose, inputs, outputs, side effects | 7.43 | 5 |
| 7.52 | **Private label naming** | Double-underscore prefix prevents name collisions: `__PNL_newline` | 5.4, 7.43 | 5 |
| 7.53 | **Always begin subprogram with .text** | Defensive: ensures code isn't placed in .data segment | 5.9, 7.43 | 5 |
| 7.54 | **Utility file (utils.asm)** | Reusable subprogram library included via .include | 5.15, 7.43 | 5 |

### 7F: Programming Methodology

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 7.55 | **Pseudocode** | Informal high-level description of program logic before assembly | — | 3 |
| 7.56 | **Pseudocode `register` modifier** | Suggests using $s0–$s7 for this variable | 7.55, 4.20 | 3 |
| 7.57 | **Pseudocode `volatile` modifier** | Variable must be stored in memory, not a register | 7.55, 4.10 | 3 |
| 7.58 | **Pseudocode-to-assembly translation** | Write pseudocode as comments, implement each line below | 7.55 | 3 |
| 7.59 | **Expression decomposition** | Break complex expressions into single-operation instructions | 7.14, 7.4, 7.5 | 3 |

### 7G: Worked Translation Examples

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 7.60 | **Translating add** | `add $t0,$t1,$t2` → op=0, rs=9, rt=10, rd=8, sh=0, fn=32 → 0x012A4020 | 6.19, 6.20 | 4 |
| 7.61 | **Translating sub** | `sub $s0,$s1,$s2` → 0x02328022 | 6.19 | 4 |
| 7.62 | **Translating addi** | `addi $s2,$t8,37` → 0x23120025 (rt = destination) | 6.21, 6.17 | 4 |
| 7.63 | **Translating sll** | `sll $t0,$t1,10` → rs=0, shamt=10 → uses shamt field | 6.19, 7.31 | 4 |

### 7H: Concrete Subprogram Examples

| ID | Concept | Definition | Prereqs | Ch. |
|----|---------|-----------|---------|-----|
| 7.64 | **Exit subprogram** | Wraps syscall 10 for clean program termination | 5.25, 7.43 | 5 |
| 7.65 | **PrintNewLine** | Prints `\n` using privately-owned string + syscall 4 | 5.22, 7.52 | 5 |
| 7.66 | **PrintString** | Prints string at address in $a0 via syscall 4 | 5.22, 7.48 | 5 |
| 7.67 | **PrintInt** | Prints label string ($a0) then integer ($a1) | 7.66, 7.48 | 5 |
| 7.68 | **PromptInt** | Prints prompt, reads integer, returns in $v0 | 7.66, 5.23, 7.49 | 5 |

---

## Layer T: Tooling (parallel track)

| ID | Concept | Definition | Ch. |
|----|---------|-----------|-----|
| T.1 | **MARS IDE** | Java-based MIPS assembler, simulator, and debugger | 2 |
| T.2 | **Edit/Execute workflow** | Write → Save → Assemble → Run (Execute tab shows machine code) | 2 |
| T.3 | **MARS Help / Green Sheet** | F1 for all operators, directives, syscall services | 2 |
| T.4 | **MARS as translation checker** | Compare hand-translated hex against Code column in Text Segment view | 4 |

---

## Visual Dependency Tree

```
Layer 0: Bit, Decimal notation, Abstraction
    |
Layer 1: Binary notation, Powers of 2, Nibble/Byte
    |
Layer 2: Base conversions, Hexadecimal
    |
Layer 3: ASCII encoding ──────── 2's complement integers
    |                                    |
Layer 4: CPU (ALU, CU, Bus) ── Memory model ── Register file ($0-$31, $hi/$lo, $pc)
    |                                    |
Layer 5: Assembly syntax ── Directives ── Basic instructions ── syscall ── Data semantics
    |                                    |
Layer 6: Instruction formats (R/I) ── Machine code fields ── Translation procedure
    |                                    |
Layer 7: Arithmetic ops ── Logical ops ── Shifts ── Subprograms ── Methodology
         (add,sub,mul,div)  (and,or,xor)  (sll,srl,sra)  (jal,jr)   (pseudocode)
```

---

## Statistics

| Chapter | Concepts | Primary Topics |
|---------|----------|----------------|
| Ch. 1 | 38 | Binary, hex, ASCII, 2's complement, arithmetic, Boolean logic |
| Ch. 2 | 55 | MIPS architecture, registers, memory, assembly syntax, syscall, I/O |
| Ch. 3 | 60 | Arithmetic/logical/shift operators, pseudo-instructions, methodology |
| Ch. 4 | 31 | R-format and I-format machine code translation |
| Ch. 5 | 28 | Simple subprograms, jal/jr, parameter passing, code organization |
| **Total** | **212** | |

*After deduplication and cross-referencing, the unified tree contains ~120 unique concept nodes across 8 layers (0–7 + Tooling).*
