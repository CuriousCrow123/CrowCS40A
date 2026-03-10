<script lang="ts">
  import Figure from '../../essay/Figure.svelte';
  import MipsEditor from '../../widgets/MipsEditor.svelte';
  import TruthTable from '../../widgets/TruthTable.svelte';
  import BitOperator from '../../widgets/BitOperator.svelte';
  import type { Line, Column } from '../../../lib/types';

  let truthTable: ReturnType<typeof TruthTable>;
  let bitOp: ReturnType<typeof BitOperator>;
  let codeEditor: ReturnType<typeof MipsEditor>;

  let revealSurprise = $state(false);
  let revealWireUp = $state(false);
  let revealReflection = $state(false);

  const norColumns: Column[] = [
    { header: 'A', values: [0, 0, 1, 1] },
    { header: 'B', values: [0, 1, 0, 1] },
    { header: 'A OR B', values: [0, 1, 1, 1] },
    { header: 'A NOR B', values: [1, 0, 0, 0] },
  ];

  const norLines: Line[] = [
    { kind: 'visible', code: '.text', comment: 'Defensive: ensure we are in the text segment' },
    { kind: 'visible', code: 'NOR:' },
    { kind: 'visible', code: '# Subprogram:   NOR' },
    { kind: 'visible', code: '# Author:       [student name]' },
    { kind: 'visible', code: '# Purpose:      Performs bitwise NOR on two values' },
    { kind: 'visible', code: '# Input:        $a0 = first value, $a1 = second value' },
    { kind: 'visible', code: '# Output:       $v0 = $a0 NOR $a1' },
    { kind: 'visible', code: '# Side effects: none' },
    { kind: 'visible', code: '    nor   $v0, $a0, $a1', comment: 'NOR is a real MIPS instruction — one line does it all' },
    { kind: 'visible', code: '    jr    $ra', comment: 'Return to caller' },
  ];
</script>

<section>
  <div class="prose">
    <h2 id="act-1-nor">Act 1: NOR — Fully Worked Example</h2>

    <p>
      Let's start with NOR. This is a <strong>fully worked example</strong> — you'll study
      the complete solution with annotations. Research shows that studying worked examples
      first produces faster learning than problem-solving first for novices.
    </p>

    <h3>Warm-up: NOR Truth Table</h3>

    <div class="question">
      <p>Fill in the truth table for NOR using just two bits. How does NOR relate to OR?</p>
    </div>

    <p>
      Think about it, then
      <button class="action" onclick={() => truthTable?.reveal()} disabled={!truthTable}>reveal the NOR column</button>.
    </p>
  </div>

  <Figure caption="NOR truth table — output is 1 only when BOTH inputs are 0">
    <TruthTable bind:this={truthTable} instanceId="tt-nor" columns={norColumns} revealColumns={[3]} />
  </Figure>

  <div class="prose">
    <div class="insight">
      <strong>Key insight:</strong> NOR = NOT(OR). The output is 1 only when <em>both</em> inputs are 0.
    </div>

    <h3>Bitwise Application</h3>

    <div class="question">
      <p>Apply NOR bitwise to these 4-bit values: 1010 NOR 1100. Work it bit by bit.</p>
    </div>

    <p>
      Try it mentally first, then
      <button class="action" onclick={() => bitOp?.animate()} disabled={!bitOp}>animate the operation</button>
      to check your work.
    </p>
  </div>

  <Figure caption="Bitwise NOR applied to 1010 and 1100 — MIPS does this for all 32 bits in parallel">
    <BitOperator bind:this={bitOp} instanceId="bitop-nor" valueA={0b1010} valueB={0b1100} operation="NOR" />
  </Figure>

  <div class="prose">
    <p>
      Bit 3: 1 NOR 1 = 0. Bit 2: 0 NOR 1 = 0. Bit 1: 1 NOR 0 = 0. Bit 0: 0 NOR 0 = 1. Result: <strong>0001</strong>.
    </p>
    <p>MIPS does exactly this — for all 32 bits in parallel, in a single clock cycle.</p>

    <h3>The Surprise: <code>nor</code> is a Real Instruction</h3>

    <div class="reveal" data-open={revealSurprise}>
      <div class="reveal-inner">
        <div class="insight">
          <strong>MIPS has a hardware <code>nor</code> instruction.</strong> In fact,
          <code>not</code> is a <em>pseudo-instruction</em> that the assembler implements
          <strong>as</strong> <code>nor Rd, Rs, $zero</code>. MIPS chose to include
          <code>nor</code> because NOR-with-zero gives you NOT for free, making a separate
          NOT instruction redundant.
        </div>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealSurprise = true}>Reveal the surprise</button> —
      this changes your approach from "build NOR from pieces" to something much simpler.
    </p>

    <h3>Wire It Up</h3>

    <div class="question">
      <p>The inputs are in <code>$a0</code> and <code>$a1</code>. The output goes in <code>$v0</code>. What's the instruction?</p>
    </div>

    <div class="reveal" data-open={revealWireUp}>
      <div class="reveal-inner">
        <p><code>nor $v0, $a0, $a1</code> — that's it. One instruction.</p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealWireUp = true}>Reveal the instruction</button>
    </p>

    <h3>Complete NOR Subprogram</h3>

    <p>
      Here's the complete NOR subprogram, fully annotated. This is a <strong>worked example</strong> —
      study it carefully before moving on.
    </p>
  </div>

  <Figure caption="Complete NOR subprogram — the logic is ONE line; the rest is structure and documentation">
    <MipsEditor bind:this={codeEditor} instanceId="mips-nor" lines={norLines} title="NOR Subprogram" />
  </Figure>

  <div class="prose">
    <h3>Reflection</h3>

    <div class="question">
      <p>How many lines were scaffold/boilerplate vs. actual logic?</p>
    </div>

    <div class="reveal" data-open={revealReflection}>
      <div class="reveal-inner">
        <div class="insight">
          <strong>The logic was ONE line.</strong> Most assembly programming is structure and documentation.
          This ratio is typical — and it's why the scaffold template matters so much.
        </div>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealReflection = true}>Reveal insight</button>
    </p>
  </div>
</section>
