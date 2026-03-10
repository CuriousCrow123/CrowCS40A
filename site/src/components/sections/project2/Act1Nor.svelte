<script lang="ts">
  import Figure from '../../essay/Figure.svelte';
  import MipsEditor from '../../widgets/MipsEditor.svelte';
  import TruthTable from '../../widgets/TruthTable.svelte';
  import BitOperator from '../../widgets/BitOperator.svelte';
  import ExecutionTracer from '../../widgets/ExecutionTracer.svelte';
  import type { Line, Column, Step } from '../../../lib/types';

  let truthTable = $state<ReturnType<typeof TruthTable>>();
  let bitOp = $state<ReturnType<typeof BitOperator>>();
  let codeEditor = $state<ReturnType<typeof MipsEditor>>();

  let hydrated = $state(false);
  $effect(() => { hydrated = true; });

  let revealSurprise = $state(false);
  let revealWireUp = $state(false);
  let revealReflection = $state(false);

  const norColumns: Column[] = [
    { header: 'A', values: [0, 0, 1, 1] },
    { header: 'B', values: [0, 1, 0, 1] },
    { header: 'A OR B', values: [0, 1, 1, 1] },
    { header: 'A NOR B', values: [1, 0, 0, 0] },
  ];

  const norCode = [
    '.text',
    'NOR:',
    '# Subprogram:   NOR',
    '# Author:       [student name]',
    '# Purpose:      Performs bitwise NOR on two values',
    '# Input:        $a0 = first value, $a1 = second value',
    '# Output:       $v0 = $a0 NOR $a1',
    '# Side effects: none',
    '    nor   $v0, $a0, $a1',
    '    jr    $ra',
  ];

  const norSteps: Step[] = [
    { instruction: 'Initial state', line: 0, registers: { '$a0': '0xF0F0F0F0', '$a1': '0x0F0F0F0F', '$v0': '?' }, annotation: 'Caller loaded arguments into $a0 and $a1' },
    { instruction: 'nor $v0, $a0, $a1', line: 8, registers: { '$a0': '0xF0F0F0F0', '$a1': '0x0F0F0F0F', '$v0': '0x00000000' }, reading: ['$a0', '$a1'], changed: ['$v0'], annotation: 'nor rd, rs, rt — read $a0 (rs) and $a1 (rt), NOR all 32 bits, write result to $v0 (rd)' },
    { instruction: 'jr $ra', line: 9, registers: { '$a0': '0xF0F0F0F0', '$a1': '0x0F0F0F0F', '$v0': '0x00000000' }, annotation: 'Return to caller — result is in $v0' },
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

    <h3>One Instruction Does It All</h3>

    <p>
      Because <code>nor</code> is a real MIPS hardware instruction, the entire body is one line.
      No building from pieces needed.
    </p>

    <div class="reveal" data-open={revealSurprise}>
      <div class="reveal-inner">
        <div class="insight">
          <strong>Fun fact:</strong> <code>not</code> is actually a <em>pseudo-instruction</em> that
          the assembler implements as <code>nor rd, rs, $zero</code>. NOR-with-zero gives you NOT
          for free — that's why MIPS includes <code>nor</code> in hardware instead of <code>not</code>.
        </div>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealSurprise = true} disabled={!hydrated}>Why NOR instead of NOT?</button>
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
      <button class="action" onclick={() => revealWireUp = true} disabled={!hydrated}>Reveal the instruction</button>
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
    <h3>Execution Trace</h3>
    <p>
      Watch code and registers side by side. Step through to see how <code>nor</code> reads
      two source registers and writes one destination — the simplest possible trace.
    </p>
  </div>

  <Figure caption="NOR execution trace — code panel + registers synchronized step-by-step">
    <ExecutionTracer
      instanceId="tracer-nor"
      code={norCode}
      registers={['$a0', '$a1', '$v0']}
      steps={norSteps}
      title="NOR Subprogram"
    />
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
      <button class="action" onclick={() => revealReflection = true} disabled={!hydrated}>Reveal insight</button>
    </p>
  </div>
</section>
