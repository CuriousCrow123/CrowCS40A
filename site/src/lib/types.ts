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

// Display register — extends MipsRegister with special registers for tracer
export type DisplayRegister = MipsRegister | '$pc';

// SubprogramAnimator — black-box view of a subprogram's register I/O
export type SubprogramOp = 'NOR' | 'NAND' | 'SLL' | 'XOR Swap';
export type RegisterBinding = {
  register: DisplayRegister;
  value: string;
};

// RegisterFile step — typed register keys
export type RegisterState = Partial<Record<DisplayRegister, string>>;
export type Step = {
  instruction: string;
  registers: RegisterState;
  changed?: DisplayRegister[];
  reading?: DisplayRegister[];
  annotation?: string;
  /** 0-indexed line to highlight in a paired code panel (used by ExecutionTracer) */
  line?: number;
};
