<script lang="ts">
  import Figure from '../../essay/Figure.svelte';
  import MipsEditor from '../../widgets/MipsEditor.svelte';
  import TruthTable from '../../widgets/TruthTable.svelte';
  import ExecutionTracer from '../../widgets/ExecutionTracer.svelte';
  import SubprogramAnimator from '../../widgets/SubprogramAnimator.svelte';
  import type { Line, Column, Step, RegisterBinding } from '../../../lib/types';

  let truthTable = $state<ReturnType<typeof TruthTable>>();
  let completionEditor = $state<ReturnType<typeof MipsEditor>>();
  let norCompareEditor = $state<ReturnType<typeof MipsEditor>>();
  let nandCompareEditor = $state<ReturnType<typeof MipsEditor>>();
  let animator = $state<ReturnType<typeof SubprogramAnimator>>();

  let hydrated = $state(false);
  $effect(() => { hydrated = true; });

  let revealPattern = $state(false);
  let revealComplete = $state(false);
  let revealMars = $state(false);
  let revealComparison = $state(false);

  const nandCode = [
    '# --- main (caller) ---',
    'main:',
    '    li    $a0, 0xFF00FF00',
    '    li    $a1, 0xFFFF0000',
    '    jal   NAND',
    '    move  $t0, $v0',
    '',
    '# --- NAND (subprogram) ---',
    'NAND:',
    '    and   $v0, $a0, $a1',
    '    not   $v0, $v0',
    '    jr    $ra',
  ];

  const nandAddresses = [
    '0x00400000', '0x00400000', '0x00400004', '0x00400008',
    '0x0040000C', '0x00400010', '',
    '0x00400014', '0x00400014', '0x00400018', '0x0040001C', '0x00400020',
  ];

  const nandSteps: Step[] = [
    { instruction: 'Initial state', line: 1, registers: { '$a0': '?', '$a1': '?', '$v0': '?', '$ra': '?', '$pc': '0x00400000' }, annotation: 'Program starts at main' },
    { instruction: 'li $a0, 0xFF00FF00', line: 2, registers: { '$a0': '0xFF00FF00', '$a1': '?', '$v0': '?', '$ra': '?', '$pc': '0x00400004' }, changed: ['$a0', '$pc'], annotation: 'Load first argument into $a0' },
    { instruction: 'li $a1, 0xFFFF0000', line: 3, registers: { '$a0': '0xFF00FF00', '$a1': '0xFFFF0000', '$v0': '?', '$ra': '?', '$pc': '0x00400008' }, changed: ['$a1', '$pc'], annotation: 'Load second argument into $a1' },
    { instruction: 'jal NAND', line: 4, registers: { '$a0': '0xFF00FF00', '$a1': '0xFFFF0000', '$v0': '?', '$ra': '0x00400010', '$pc': '0x00400018' }, changed: ['$ra', '$pc'], annotation: 'jal saves return address (0x00400010) in $ra, jumps to NAND (0x00400018)' },
    { instruction: 'and $v0, $a0, $a1', line: 9, registers: { '$a0': '0xFF00FF00', '$a1': '0xFFFF0000', '$v0': '0xFF000000', '$ra': '0x00400010', '$pc': '0x0040001C' }, reading: ['$a0', '$a1'], changed: ['$v0', '$pc'], annotation: 'Step 1: AND the inputs — intermediate result in $v0' },
    { instruction: 'not $v0, $v0', line: 10, registers: { '$a0': '0xFF00FF00', '$a1': '0xFFFF0000', '$v0': '0x00FFFFFF', '$ra': '0x00400010', '$pc': '0x00400020' }, reading: ['$v0'], changed: ['$v0', '$pc'], annotation: 'Step 2: NOT the intermediate — $v0 is both source AND destination!' },
    { instruction: 'jr $ra', line: 11, registers: { '$a0': '0xFF00FF00', '$a1': '0xFFFF0000', '$v0': '0x00FFFFFF', '$ra': '0x00400010', '$pc': '0x00400010' }, reading: ['$ra'], changed: ['$pc'], annotation: 'jr copies $ra (0x00400010) into $pc — back to caller' },
    { instruction: 'move $t0, $v0', line: 5, registers: { '$a0': '0xFF00FF00', '$a1': '0xFFFF0000', '$v0': '0x00FFFFFF', '$ra': '0x00400010', '$pc': '0x00400014' }, changed: ['$pc'], annotation: 'Back in main! Caller saves NAND result — call/return complete' },
  ];

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

  const nandInputs: RegisterBinding[] = [
    { register: '$a0', value: '0xFF00FF00' },
    { register: '$a1', value: '0xFFFF0000' },
  ];
  const nandOutputs: RegisterBinding[] = [
    { register: '$v0', value: '0x00FFFFFF' },
  ];
</script>

<section>
  <div class="prose">
    <h2 id="section-2-nand">Section 2: NAND — Completion Problem</h2>

    <p>
      NOR had a hardware instruction. Let's see if NAND does too.
      This time, you'll <strong>complete</strong> a partially-written subprogram.
    </p>

    <h3 id="nand-from-nor">From NOR to NAND</h3>

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
      <button class="action" onclick={() => revealPattern = !revealPattern} aria-expanded={revealPattern} disabled={!hydrated}>{revealPattern ? 'Hide' : 'Reveal what happens'}</button>
    </p>

    <h3 id="nand-truth-table">NAND Truth Table</h3>

    <div class="question">
      <p>Fill in NAND. Express it as a composition of operations you already know.</p>
    </div>

    <p>
      Think first, then
      <button class="action" onclick={() => truthTable?.reveal()} disabled={!truthTable}>reveal the NAND column</button> (<button class="action" onclick={() => truthTable?.reset()} aria-label="Reset NAND truth table" disabled={!truthTable}>reset</button>).
    </p>
  </div>

  <Figure caption="NAND truth table — NAND = NOT(AND), output is 0 only when BOTH inputs are 1">
    <TruthTable bind:this={truthTable} instanceId="tt-nand" columns={nandColumns} revealColumns={[3]} />
  </Figure>

  <div class="prose">
    <h3 id="nand-fill-step-2">Fill In Step 2</h3>

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
      <button class="action" onclick={() => revealComplete = !revealComplete} aria-expanded={revealComplete} disabled={!hydrated}>{revealComplete ? 'Hide' : 'Reveal Step 2'}</button>
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
      <button class="action" onclick={() => revealMars = !revealMars} aria-expanded={revealMars} disabled={!hydrated}>{revealMars ? 'Hide' : 'What does MARS show?'}</button>
    </p>

    <h3 id="nand-black-box">Black-Box View</h3>

    <p>
      See NAND as a "black box" — same register contract as NOR, different operation inside.
      <button class="action" onclick={() => animator?.animate()} disabled={!animator}>Animate the data flow</button>
      (<button class="action" onclick={() => animator?.reset()} aria-label="Reset NAND animation" disabled={!animator}>reset</button>).
    </p>
  </div>

  <Figure caption="NAND as a black box — $a0 and $a1 go in, $v0 comes out">
    <SubprogramAnimator bind:this={animator} instanceId="subprog-nand" inputs={nandInputs} outputs={nandOutputs} operation="NAND" />
  </Figure>

  <div class="prose">
    <h3 id="nand-execution-trace">Execution Trace</h3>
    <p>
      This trace shows the <strong>complete program</strong>: <code>main</code> loads arguments,
      calls NAND with <code>jal</code>, and receives the result. Watch <code>$ra</code> and
      <code>$pc</code> through the call/return, and pay attention to Step 2 where <code>$v0</code>
      is both source and destination.
    </p>
  </div>

  <Figure caption="NAND execution trace — two instructions, watch $v0 serve as both source and destination in Step 2">
    <ExecutionTracer
      instanceId="tracer-nand"
      code={nandCode}
      registers={['$a0', '$a1', '$v0', '$ra', '$pc']}
      steps={nandSteps}
      title="NAND — Full Call & Return"
      addresses={nandAddresses}
    />
  </Figure>

  <div class="prose">
    <h3 id="nand-vs-nor">NOR vs. NAND</h3>

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
      <button class="action" onclick={() => revealComparison = !revealComparison} aria-expanded={revealComparison} disabled={!hydrated}>{revealComparison ? 'Hide' : 'Reveal comparison insight'}</button>
    </p>
  </div>
</section>
