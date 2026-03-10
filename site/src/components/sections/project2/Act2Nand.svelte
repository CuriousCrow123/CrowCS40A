<script lang="ts">
  import Figure from '../../essay/Figure.svelte';
  import MipsEditor from '../../widgets/MipsEditor.svelte';
  import TruthTable from '../../widgets/TruthTable.svelte';
  import type { Line, Column } from '../../../lib/types';

  let truthTable: ReturnType<typeof TruthTable>;
  let completionEditor: ReturnType<typeof MipsEditor>;
  let norCompareEditor: ReturnType<typeof MipsEditor>;
  let nandCompareEditor: ReturnType<typeof MipsEditor>;

  let revealPattern = $state(false);
  let revealComplete = $state(false);
  let revealMars = $state(false);
  let revealComparison = $state(false);

  const nandColumns: Column[] = [
    { header: 'A', values: [0, 0, 1, 1] },
    { header: 'B', values: [0, 1, 0, 1] },
    { header: 'A AND B', values: [0, 0, 0, 1] },
    { header: 'A NAND B', values: [1, 1, 1, 0] },
  ];

  const completionLines: Line[] = [
    { kind: 'visible', code: '.text' },
    { kind: 'visible', code: 'NAND:' },
    { kind: 'visible', code: '# Subprogram:   NAND' },
    { kind: 'visible', code: '# Author:       [student name]' },
    { kind: 'visible', code: '# Purpose:      Performs bitwise NAND on two values' },
    { kind: 'visible', code: '# Input:        $a0 = first value, $a1 = second value' },
    { kind: 'visible', code: '# Output:       $v0 = $a0 NAND $a1' },
    { kind: 'visible', code: '# Side effects: none' },
    { kind: 'visible', code: '    and   $v0, $a0, $a1', comment: 'Step 1: AND the inputs' },
    { kind: 'blank', hint: 'Step 2: What goes here to complete NAND?' },
    { kind: 'visible', code: '    jr    $ra' },
  ];

  const norCompareLines: Line[] = [
    { kind: 'visible', code: 'NOR:' },
    { kind: 'visible', code: '    nor   $v0, $a0, $a1', comment: '1 instruction (hardware)' },
    { kind: 'visible', code: '    jr    $ra' },
  ];

  const nandCompareLines: Line[] = [
    { kind: 'visible', code: 'NAND:' },
    { kind: 'visible', code: '    and   $v0, $a0, $a1', comment: 'Step 1: AND' },
    { kind: 'visible', code: '    not   $v0, $v0', comment: 'Step 2: NOT (2 instructions)' },
    { kind: 'visible', code: '    jr    $ra' },
  ];
</script>

<section>
  <div class="prose">
    <h2 id="act-2-nand">Act 2: NAND — Completion Problem</h2>

    <p>
      NOR had a hardware instruction. Let's see if NAND does too.
      This time, you'll <strong>complete</strong> a partially-written subprogram.
    </p>

    <h3>Pattern Recognition</h3>

    <div class="question">
      <p>NAND is to AND what NOR is to OR. Based on how we wrote NOR, what's your first instinct for NAND?</p>
    </div>

    <div class="reveal" data-open={revealPattern}>
      <div class="reveal-inner">
        <p>
          Your instinct is probably "use a <code>nand</code> instruction" — but <strong>there isn't one</strong>.
          Try it in MARS: you'll get an assembler error. There is no <code>nand</code> mnemonic in MIPS.
        </p>
        <p>
          So we need to <em>compose</em> NAND from instructions we have: NAND = NOT(AND). Two familiar operations.
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealPattern = true}>Reveal what happens</button>
    </p>

    <h3>NAND Truth Table</h3>

    <div class="question">
      <p>Fill in NAND. Express it as a composition of operations you already know.</p>
    </div>

    <p>
      Think first, then
      <button class="action" onclick={() => truthTable?.reveal()} disabled={!truthTable}>reveal the NAND column</button>.
    </p>
  </div>

  <Figure caption="NAND truth table — NAND = NOT(AND), output is 0 only when BOTH inputs are 1">
    <TruthTable bind:this={truthTable} instanceId="tt-nand" columns={nandColumns} revealColumns={[3]} />
  </Figure>

  <div class="prose">
    <h3>Complete the Subprogram</h3>

    <p>
      You're given the scaffold and Step 1 (<code>and</code>). The blank slot is yours to fill.
    </p>

    <div class="question">
      <p>
        You have the AND result in <code>$v0</code>. What single instruction turns AND into NAND?
      </p>
      <p><em>Hint:</em> Remember, <code>not</code> is a pseudo-instruction. What real instruction does it expand to?</p>
    </div>
  </div>

  <Figure caption="NAND completion problem — fill in Step 2">
    <MipsEditor bind:this={completionEditor} instanceId="mips-nand-completion" lines={completionLines} title="NAND — Complete Step 2" />
  </Figure>

  <div class="prose">
    <div class="reveal" data-open={revealComplete}>
      <div class="reveal-inner">
        <p>
          <strong>The answer:</strong> <code>not $v0, $v0</code> — which is a pseudo-instruction
          for <code>nor $v0, $v0, $zero</code>.
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealComplete = true}>Reveal Step 2</button>
    </p>

    <div class="reveal" data-open={revealMars}>
      <div class="reveal-inner">
        <div class="callout">
          <strong>MARS note:</strong> In the Basic column, MARS will show
          <code>nor $v0, $v0, $zero</code> instead of <code>not $v0, $v0</code>.
          This is the real instruction behind the pseudo-instruction. Don't be alarmed.
        </div>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealMars = true}>What does MARS show?</button>
    </p>

    <h3>Cross-Subprogram Comparison</h3>

    <div class="question">
      <p>Compare NOR and NAND side by side. What's structurally identical? What's different?</p>
    </div>
  </div>

  <Figure caption="NOR — 1 instruction (hardware support)">
    <MipsEditor bind:this={norCompareEditor} instanceId="mips-nor-compare" lines={norCompareLines} title="NOR (body only)" />
  </Figure>

  <Figure caption="NAND — 2 instructions (composition)">
    <MipsEditor bind:this={nandCompareEditor} instanceId="mips-nand-compare" lines={nandCompareLines} title="NAND (body only)" />
  </Figure>

  <div class="prose">
    <div class="reveal" data-open={revealComparison}>
      <div class="reveal-inner">
        <div class="insight">
          <strong>Same scaffold, same register contract.</strong> NOR is 1 instruction (hardware support);
          NAND is 2 (composition). The difference is purely about what the hardware provides, not about
          the logic. This pattern — "the hardware gives you X, but you need to build Y from pieces" —
          is fundamental to assembly programming.
        </div>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealComparison = true}>Reveal comparison insight</button>
    </p>
  </div>
</section>
