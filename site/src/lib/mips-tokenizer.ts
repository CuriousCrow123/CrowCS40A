/**
 * Simple MIPS syntax tokenizer for MipsEditor highlighting.
 * CSS-class-based — no external library needed.
 */

export type TokenType = 'kw' | 'reg' | 'num' | 'dir' | 'lbl' | 'cmt' | 'text';
export type MipsToken = { type: TokenType; text: string };

const KEYWORDS = new Set([
  'nor', 'and', 'or', 'xor', 'not', 'sll', 'srl', 'sra',
  'move', 'jr', 'jal', 'li', 'la', 'lw', 'sw', 'lh', 'sh', 'lb', 'sb',
  'add', 'addi', 'addu', 'addiu', 'sub', 'subu', 'mul', 'mult', 'div',
  'syscall', 'beq', 'bne', 'blt', 'ble', 'bgt', 'bge',
  'slt', 'slti', 'sltu', 'mfhi', 'mflo', 'lui', 'ori', 'andi', 'xori',
  'j', 'neg', 'rem', 'lbu', 'lhu',
]);

export function tokenizeMipsLine(code: string): MipsToken[] {
  const tokens: MipsToken[] = [];
  let remaining = code;

  while (remaining.length > 0) {
    // Comments: # to end of line
    const commentMatch = remaining.match(/^#.*/);
    if (commentMatch) {
      tokens.push({ type: 'cmt', text: commentMatch[0] });
      break;
    }

    // Directives: .word, .text, .data, .asciiz, etc.
    const dirMatch = remaining.match(/^\.[a-z]+/);
    if (dirMatch) {
      tokens.push({ type: 'dir', text: dirMatch[0] });
      remaining = remaining.slice(dirMatch[0].length);
      continue;
    }

    // Labels: word followed by colon (at start or after whitespace)
    const lblMatch = remaining.match(/^(\w+):/);
    if (lblMatch) {
      tokens.push({ type: 'lbl', text: lblMatch[0] });
      remaining = remaining.slice(lblMatch[0].length);
      continue;
    }

    // Registers: $zero, $a0, $t0, $ra, etc.
    const regMatch = remaining.match(/^\$[a-z][a-z0-9]*/);
    if (regMatch) {
      tokens.push({ type: 'reg', text: regMatch[0] });
      remaining = remaining.slice(regMatch[0].length);
      continue;
    }

    // Numbers: decimal, hex, negative
    const numMatch = remaining.match(/^-?(?:0x[0-9a-fA-F]+|\d+)\b/);
    if (numMatch) {
      tokens.push({ type: 'num', text: numMatch[0] });
      remaining = remaining.slice(numMatch[0].length);
      continue;
    }

    // Keywords: instruction mnemonics
    const kwMatch = remaining.match(/^[a-z]\w*/);
    if (kwMatch) {
      const word = kwMatch[0];
      tokens.push({ type: KEYWORDS.has(word) ? 'kw' : 'text', text: word });
      remaining = remaining.slice(word.length);
      continue;
    }

    // Whitespace and other characters
    const otherMatch = remaining.match(/^[^a-z$.#\d\-]+/i);
    if (otherMatch) {
      tokens.push({ type: 'text', text: otherMatch[0] });
      remaining = remaining.slice(otherMatch[0].length);
      continue;
    }

    // Single character fallback
    tokens.push({ type: 'text', text: remaining[0] });
    remaining = remaining.slice(1);
  }

  return tokens;
}
