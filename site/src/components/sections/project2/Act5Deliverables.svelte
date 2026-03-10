<script lang="ts">
  import Figure from '../../essay/Figure.svelte';
  import MipsEditor from '../../widgets/MipsEditor.svelte';
  import type { Line } from '../../../lib/types';

  let beforeEditor = $state<ReturnType<typeof MipsEditor>>();
  let afterEditor = $state<ReturnType<typeof MipsEditor>>();
  let answerEditor = $state<ReturnType<typeof MipsEditor>>();

  let hydrated = $state(false);
  $effect(() => { hydrated = true; });
  let revealAnswer = $state(false);

  const beforeLines: Line[] = [
    { kind: 'visible', code: '# File:\tutils.asm' },
    { kind: 'visible', code: '# Purpose:\tTo define utilities which will be used in MIPS programs.' },
    { kind: 'visible', code: '# Author:\tCharles Kann' },
    { kind: 'visible', code: '#' },
    { kind: 'visible', code: '# Subprograms Index:' },
    { kind: 'visible', code: '#   Exit \t\tCall syscall with a server 10 to exit the program' },
    { kind: 'visible', code: '#   PrintNewLine\tPrint a new line character (\\n) to the console' },
    { kind: 'visible', code: '#   PrintInt\tPrint a string with an integer to the console' },
    { kind: 'visible', code: '#   PrintString\tPrint a string to the console' },
    { kind: 'visible', code: '#   PromptInt\tPrompt for an int & return it to the calling program.' },
  ];

  const afterLines: Line[] = [
    { kind: 'visible', code: '# File:\tutils.asm' },
    { kind: 'visible', code: '# Purpose:\tTo define utilities which will be used in MIPS programs.' },
    { kind: 'visible', code: '# Author:\tCharles Kann, [Your Name]' },
    { kind: 'visible', code: '#' },
    { kind: 'visible', code: '# Subprograms Index:' },
    { kind: 'visible', code: '#   Exit \t\tCall syscall with a server 10 to exit the program' },
    { kind: 'visible', code: '#   PrintNewLine\tPrint a new line character (\\n) to the console' },
    { kind: 'visible', code: '#   PrintInt\tPrint a string with an integer to the console' },
    { kind: 'visible', code: '#   PrintString\tPrint a string to the console' },
    { kind: 'visible', code: '#   PromptInt\tPrompt for an int & return it to the calling program.' },
    { kind: 'visible', code: '#   NOR\t\tBitwise NOR of two values', emphasized: true },
    { kind: 'visible', code: '#   NAND\t\tBitwise NAND of two values', emphasized: true },
    { kind: 'visible', code: '#   Mult4\t\tMultiplies input by 4 using shift', emphasized: true },
    { kind: 'visible', code: '#   Swap\t\tSwaps two values using XOR, returns swapped', emphasized: true },
  ];

  const answerLines: Line[] = [
    // ── Preamble ──
    { kind: 'visible', code: '# File:\tutils.asm' },
    { kind: 'visible', code: '# Purpose:\tTo define utilities which will be used in MIPS programs.' },
    { kind: 'visible', code: '# Author:\tCharles Kann, [Your Name]' },
    { kind: 'visible', code: '#' },
    { kind: 'visible', code: '# Subprograms Index:' },
    { kind: 'visible', code: '#   Exit \t\tCall syscall with a server 10 to exit the program' },
    { kind: 'visible', code: '#   PrintNewLine\tPrint a new line character (\\n) to the console' },
    { kind: 'visible', code: '#   PrintInt\tPrint a string with an integer to the console' },
    { kind: 'visible', code: '#   PrintString\tPrint a string to the console' },
    { kind: 'visible', code: '#   PromptInt\tPrompt for an int & return it to the calling program.' },
    { kind: 'visible', code: '#   NOR\t\tBitwise NOR of two values' },
    { kind: 'visible', code: '#   NAND\t\tBitwise NAND of two values' },
    { kind: 'visible', code: '#   Mult4\t\tMultiply a value by 4 using shift' },
    { kind: 'visible', code: '#   Swap\t\tSwap two values using XOR and MOVE' },
    { kind: 'visible', code: '#' },
    { kind: 'visible', code: '# Modification History' },
    { kind: 'visible', code: '#     12/27/2014 - Initial release' },
    { kind: 'visible', code: '' },
    // ── Exit ──
    { kind: 'visible', code: '# Subprogram:\tExit' },
    { kind: 'visible', code: '# Author:  \t\tCharles Kann' },
    { kind: 'visible', code: '# Purpose:\t\tto use syscall service 10 to exit a program' },
    { kind: 'visible', code: '# Input/Output:\tNone' },
    { kind: 'visible', code: '# Side effects:\tThe program is exited' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.text' },
    { kind: 'visible', code: 'Exit:' },
    { kind: 'visible', code: '    li $v0, 10' },
    { kind: 'visible', code: '    syscall' },
    { kind: 'visible', code: '' },
    // ── PrintNewLine ──
    { kind: 'visible', code: '# Subprogram:\tPrintNewLine' },
    { kind: 'visible', code: '# Author:  \t\tCharles Kann' },
    { kind: 'visible', code: '# Purpose:\t\tto output a new line to the user console' },
    { kind: 'visible', code: '# Input/Output:\tNone' },
    { kind: 'visible', code: '# Side effects:\tA new line character is printed to the user\'s console' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.text' },
    { kind: 'visible', code: 'PrintNewLine:' },
    { kind: 'visible', code: '    li $v0, 4' },
    { kind: 'visible', code: '    la $a0, __PNL_newline' },
    { kind: 'visible', code: '    syscall' },
    { kind: 'visible', code: '    jr $ra' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.data' },
    { kind: 'visible', code: '   __PNL_newline:   .asciiz "\\n"' },
    { kind: 'visible', code: '' },
    // ── PrintInt ──
    { kind: 'visible', code: '# Subprogram: \tPrintInt' },
    { kind: 'visible', code: '# Author:\t\tCharles W. Kann' },
    { kind: 'visible', code: '# Purpose:\t\tTo print a string to the console' },
    { kind: 'visible', code: '# Input:\t\t$a0 - The address of the string to print.' },
    { kind: 'visible', code: '#\t\t\t$a1 - The value of the int to print' },
    { kind: 'visible', code: '# Output:\t\tNone' },
    { kind: 'visible', code: '# Side effects:\tThe String is printed followed by the integer value.' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.text' },
    { kind: 'visible', code: 'PrintInt:' },
    { kind: 'visible', code: '    # Print string.  The string address is already in $a0' },
    { kind: 'visible', code: '    li $v0, 4' },
    { kind: 'visible', code: '    syscall' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '    # Print integer.   The integer value is in $a1, and must' },
    { kind: 'visible', code: '    # be first moved to $a0.' },
    { kind: 'visible', code: '    move $a0, $a1' },
    { kind: 'visible', code: '    li $v0, 1' },
    { kind: 'visible', code: '    syscall' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '    #Return' },
    { kind: 'visible', code: '    jr $ra' },
    { kind: 'visible', code: '' },
    // ── PrintString ──
    { kind: 'visible', code: '# Subprogram: \tPrintString' },
    { kind: 'visible', code: '# Author:\t\tCharles W. Kann' },
    { kind: 'visible', code: '# Purpose:\t\tTo print a string to the console' },
    { kind: 'visible', code: '# Input:\t\t$a0 - The address of the string to print.' },
    { kind: 'visible', code: '# Output:\t\tNone' },
    { kind: 'visible', code: '# Side effects:\tThe String is printed to the console.' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.text' },
    { kind: 'visible', code: 'PrintString:' },
    { kind: 'visible', code: '    addi $v0, $zero, 4' },
    { kind: 'visible', code: '    syscall' },
    { kind: 'visible', code: '    jr $ra' },
    { kind: 'visible', code: '' },
    // ── PromptInt ──
    { kind: 'visible', code: '# Subprogram: \tPromptInt' },
    { kind: 'visible', code: '# Author:\t\tCharles W. Kann' },
    { kind: 'visible', code: '# Purpose:\t\tTo prompt the user for an integer input, and' },
    { kind: 'visible', code: '#               \tto return that input value to the caller.' },
    { kind: 'visible', code: '# Input:\t\t$a0 - The address of the string to print.' },
    { kind: 'visible', code: '# Output:\t\t$v0 - The value the user entered' },
    { kind: 'visible', code: '# Side effects:\tThe String is printed followed by the integer value.' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.text' },
    { kind: 'visible', code: 'PromptInt:' },
    { kind: 'visible', code: '    # Print the prompt, which is already in $a0' },
    { kind: 'visible', code: '    li $v0, 4' },
    { kind: 'visible', code: '    syscall' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '    # Read the integer.  Note: at the end of the syscall the value is' },
    { kind: 'visible', code: '    # already in $v0, so there is no need to move it anywhere.' },
    { kind: 'visible', code: '    li $v0, 5' },
    { kind: 'visible', code: '    syscall' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '    #Return' },
    { kind: 'visible', code: '    jr $ra' },
    { kind: 'visible', code: '' },
    // ── NOR (student-written) ──
    { kind: 'visible', code: '# Subprogram:\tNOR', emphasized: true },
    { kind: 'visible', code: '# Author:\t\t[Your Name]', emphasized: true },
    { kind: 'visible', code: '# Purpose:\t\tPerforms bitwise NOR on two values', emphasized: true },
    { kind: 'visible', code: '# Input:\t\t$a0 = first value, $a1 = second value', emphasized: true },
    { kind: 'visible', code: '# Output:\t\t$v0 = $a0 NOR $a1', emphasized: true },
    { kind: 'visible', code: '# Side effects:\tnone', emphasized: true },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.text', emphasized: true },
    { kind: 'visible', code: 'NOR:', emphasized: true },
    { kind: 'visible', code: '    nor   $v0, $a0, $a1    # NOR is a real MIPS instruction', emphasized: true },
    { kind: 'visible', code: '    jr    $ra', emphasized: true },
    { kind: 'visible', code: '' },
    // ── NAND (student-written) ──
    { kind: 'visible', code: '# Subprogram:\tNAND', emphasized: true },
    { kind: 'visible', code: '# Author:\t\t[Your Name]', emphasized: true },
    { kind: 'visible', code: '# Purpose:\t\tPerforms bitwise NAND on two values', emphasized: true },
    { kind: 'visible', code: '# Input:\t\t$a0 = first value, $a1 = second value', emphasized: true },
    { kind: 'visible', code: '# Output:\t\t$v0 = $a0 NAND $a1', emphasized: true },
    { kind: 'visible', code: '# Side effects:\tnone', emphasized: true },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.text', emphasized: true },
    { kind: 'visible', code: 'NAND:', emphasized: true },
    { kind: 'visible', code: '    and   $v0, $a0, $a1    # Step 1: AND the two inputs', emphasized: true },
    { kind: 'visible', code: '    not   $v0, $v0         # Step 2: NOT the result (NAND = NOT(AND))', emphasized: true },
    { kind: 'visible', code: '    jr    $ra', emphasized: true },
    { kind: 'visible', code: '' },
    // ── Mult4 (student-written) ──
    { kind: 'visible', code: '# Subprogram:\tMult4', emphasized: true },
    { kind: 'visible', code: '# Author:\t\t[Your Name]', emphasized: true },
    { kind: 'visible', code: '# Purpose:\t\tMultiplies input by 4 using only the shift operation', emphasized: true },
    { kind: 'visible', code: '# Input:\t\t$a0 = value to multiply', emphasized: true },
    { kind: 'visible', code: '# Output:\t\t$v0 = $a0 * 4', emphasized: true },
    { kind: 'visible', code: '# Side effects:\tnone', emphasized: true },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.text', emphasized: true },
    { kind: 'visible', code: 'Mult4:', emphasized: true },
    { kind: 'visible', code: '    sll   $v0, $a0, 2      # Shift left by 2 = multiply by 4', emphasized: true },
    { kind: 'visible', code: '    jr    $ra', emphasized: true },
    { kind: 'visible', code: '' },
    // ── Swap (student-written) ──
    { kind: 'visible', code: '# Subprogram:\tSwap', emphasized: true },
    { kind: 'visible', code: '# Author:\t\t[Your Name]', emphasized: true },
    { kind: 'visible', code: '# Purpose:\t\tSwaps two values using only XOR and MOVE operations', emphasized: true },
    { kind: 'visible', code: '# Input:\t\t$a0 = first value, $a1 = second value', emphasized: true },
    { kind: 'visible', code: '# Output:\t\t$v0 = original $a1, $v1 = original $a0', emphasized: true },
    { kind: 'visible', code: '# Side effects:\t$a0 and $a1 are modified', emphasized: true },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.text', emphasized: true },
    { kind: 'visible', code: 'Swap:', emphasized: true },
    { kind: 'visible', code: '    xor   $a0, $a0, $a1    # $a0 = A XOR B', emphasized: true },
    { kind: 'visible', code: '    xor   $a1, $a0, $a1    # $a1 = (A XOR B) XOR B = A', emphasized: true },
    { kind: 'visible', code: '    xor   $a0, $a0, $a1    # $a0 = (A XOR B) XOR A = B', emphasized: true },
    { kind: 'visible', code: '    move  $v0, $a0         # $v0 = B (original $a1)', emphasized: true },
    { kind: 'visible', code: '    move  $v1, $a1         # $v1 = A (original $a0)', emphasized: true },
    { kind: 'visible', code: '    jr    $ra', emphasized: true },
  ];
</script>

<section>
  <div class="prose">
    <h2 id="section-5-deliverables">Section 5: File Deliverables</h2>

    <p>
      The assignment requires submitting an updated <code>utils.asm</code> file.
      Students often lose points on the preamble update — let's get it right.
    </p>

    <h3 id="preamble-update">Preamble Update</h3>

    <p>
      You need to: <strong>add your name</strong> to the Author line and
      <strong>add four new entries</strong> to the Subprograms Index.
    </p>
  </div>

  <Figure caption="Original preamble (before your changes)">
    <MipsEditor bind:this={beforeEditor} instanceId="mips-preamble-before" lines={beforeLines} title="utils.asm — Before" />
  </Figure>

  <Figure caption="Updated preamble — your name added, four new subprograms indexed">
    <MipsEditor bind:this={afterEditor} instanceId="mips-preamble-after" lines={afterLines} title="utils.asm — After" />
  </Figure>

  <div class="prose">
    <div class="callout">
      <strong>Subprogram ordering:</strong> Append your four new subprograms after the existing
      ones, in the order: NOR, NAND, Mult4, Swap (matching the narrative order from this essay).
    </div>

    <h3 id="submission-checklist">Submission Checklist</h3>

    <ul>
      <li>Updated Author line with your name</li>
      <li>Updated Subprograms Index with all four new entries</li>
      <li>Four new subprogram blocks appended to the end of the file</li>
      <li>Each subprogram has standardized header comments matching existing format</li>
      <li>Each subprogram starts with <code>.text</code> directive</li>
      <li>Each subprogram ends with <code>jr $ra</code></li>
    </ul>

    <h3 id="complete-answer">Complete Answer Key</h3>

    <p>
      Worked through all four acts and want to check your work? Here's the complete
      <code>utils.asm</code> file with all four subprograms appended. Your new code
      is highlighted.
    </p>

    <p>
      <button class="action" onclick={() => revealAnswer = !revealAnswer} aria-expanded={revealAnswer} disabled={!hydrated}>{revealAnswer ? 'Hide answer key' : 'Reveal complete utils.asm'}</button>
    </p>
  </div>

  <div class="reveal" data-open={revealAnswer}>
    <div class="reveal-inner">
      <Figure caption="Complete utils.asm — your four subprograms highlighted">
        <MipsEditor bind:this={answerEditor} instanceId="mips-answer-key" lines={answerLines} title="utils.asm — Complete Answer Key" />
      </Figure>

      <div class="prose">
        <div class="callout">
          <strong>Remember:</strong> Replace <code>[Your Name]</code> with your actual name
          in the Author line and in each subprogram header before submitting.
        </div>
      </div>
    </div>
  </div>
</section>
