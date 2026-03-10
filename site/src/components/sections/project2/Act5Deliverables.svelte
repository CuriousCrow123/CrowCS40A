<script lang="ts">
  import Figure from '../../essay/Figure.svelte';
  import MipsEditor from '../../widgets/MipsEditor.svelte';
  import type { Line } from '../../../lib/types';

  let hydrated = $state(false);
  $effect(() => { hydrated = true; });

  let beforeEditor = $state<ReturnType<typeof MipsEditor>>();
  let afterEditor = $state<ReturnType<typeof MipsEditor>>();

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
</script>

<section>
  <div class="prose">
    <h2 id="act-5-deliverables">Act 5: File Deliverables</h2>

    <p>
      The assignment requires submitting an updated <code>utils.asm</code> file.
      Students often lose points on the preamble update — let's get it right.
    </p>

    <h3>Preamble Update</h3>

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

    <h3>Submission Checklist</h3>

    <ul>
      <li>Updated Author line with your name</li>
      <li>Updated Subprograms Index with all four new entries</li>
      <li>Four new subprogram blocks appended to the end of the file</li>
      <li>Each subprogram has standardized header comments matching existing format</li>
      <li>Each subprogram starts with <code>.text</code> directive</li>
      <li>Each subprogram ends with <code>jr $ra</code></li>
    </ul>
  </div>
</section>
