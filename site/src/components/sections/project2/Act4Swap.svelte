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

  let revealSelfInverse = $state(false);
  let revealChallenge = $state(false);
  let revealEdgeCase = $state(false);
  let revealMapping = $state(false);
  let revealConvention = $state(false);
  let revealHonesty = $state(false);
  let revealBookend = $state(false);

  const xorColumns: Column[] = [
    { header: 'A', values: [0, 0, 1, 1] },
    { header: 'B', values: [0, 1, 0, 1] },
    { header: 'A XOR B', values: [0, 1, 1, 0] },
  ];

  const swapCode = [
    '.text',
    'Swap:',
    '# Subprogram:   Swap',
    '# Author:       [student name]',
    '# Purpose:      Swaps two values using XOR and MOVE',
    '# Input:        $a0 = first value, $a1 = second value',
    '# Output:       $v0 = original $a1, $v1 = original $a0',
    '# Side effects: $a0 and $a1 are modified',
    '    xor   $a0, $a0, $a1',
    '    xor   $a1, $a0, $a1',
    '    xor   $a0, $a0, $a1',
    '    move  $v0, $a0',
    '    move  $v1, $a1',
    '    jr    $ra',
  ];

  const swapSteps: Step[] = [
    { instruction: 'Initial', line: 0, registers: { '$a0': 'A', '$a1': 'B', '$v0': '?', '$v1': '?' }, annotation: 'Starting values: $a0 = A, $a1 = B' },
    { instruction: 'xor $a0, $a0, $a1', line: 8, registers: { '$a0': 'A XOR B', '$a1': 'B', '$v0': '?', '$v1': '?' }, reading: ['$a0', '$a1'], changed: ['$a0'], annotation: '$a0 now holds A XOR B — the original A is "encoded" with B' },
    { instruction: 'xor $a1, $a0, $a1', line: 9, registers: { '$a0': 'A XOR B', '$a1': 'A', '$v0': '?', '$v1': '?' }, reading: ['$a0', '$a1'], changed: ['$a1'], annotation: 'Self-inverse: (A XOR B) XOR B = A — original A recovered in $a1!' },
    { instruction: 'xor $a0, $a0, $a1', line: 10, registers: { '$a0': 'B', '$a1': 'A', '$v0': '?', '$v1': '?' }, reading: ['$a0', '$a1'], changed: ['$a0'], annotation: 'Self-inverse: (A XOR B) XOR A = B — original B now in $a0' },
    { instruction: 'move $v0, $a0', line: 11, registers: { '$a0': 'B', '$a1': 'A', '$v0': 'B', '$v1': '?' }, reading: ['$a0'], changed: ['$v0'], annotation: '$v0 = B (original $a1) — first output register set' },
    { instruction: 'move $v1, $a1', line: 12, registers: { '$a0': 'B', '$a1': 'A', '$v0': 'B', '$v1': 'A' }, reading: ['$a1'], changed: ['$v1'], annotation: 'Swap complete! $v0 = B, $v1 = A — both outputs set' },
  ];

  const swapLines: Line[] = [
    { kind: 'visible', code: '.text' },
    { kind: 'visible', code: 'Swap:' },
    { kind: 'visible', code: '# Subprogram:   Swap' },
    { kind: 'visible', code: '# Author:       [student name]' },
    { kind: 'visible', code: '# Purpose:      Swaps two values using XOR and MOVE' },
    { kind: 'visible', code: '# Input:        $a0 = first value, $a1 = second value' },
    { kind: 'visible', code: '# Output:       $v0 = original $a1, $v1 = original $a0' },
    { kind: 'visible', code: '# Side effects: $a0 and $a1 are modified' },
    { kind: 'hidden', code: '    xor   $a0, $a0, $a1', comment: '$a0 = A XOR B' },
    { kind: 'hidden', code: '    xor   $a1, $a0, $a1', comment: '$a1 = (A XOR B) XOR B = A' },
    { kind: 'hidden', code: '    xor   $a0, $a0, $a1', comment: '$a0 = (A XOR B) XOR A = B' },
    { kind: 'hidden', code: '    move  $v0, $a0', comment: '$v0 = B (original $a1)' },
    { kind: 'hidden', code: '    move  $v1, $a1', comment: '$v1 = A (original $a0)' },
    { kind: 'visible', code: '    jr    $ra' },
  ];
</script>

<section>
  <div class="prose">
    <h2 id="act-4-swap">Act 4: Swap — Independent Problem</h2>

    <p>
      This is the most conceptually dense subprogram. You'll write <strong>everything from scratch</strong>,
      then compare against the worked solution. The XOR swap requires understanding a <em>property</em>
      of XOR (self-inverse), not just its truth table.
    </p>

    <h3>Recall: XOR Truth Table</h3>

    <div class="question">
      <p>Compute 1010 XOR 1100, bit by bit. XOR outputs 1 when the inputs <em>differ</em>.</p>
    </div>

    <p>
      <button class="action" onclick={() => truthTable?.reveal()} disabled={!truthTable}>Show XOR column</button>, then
      <button class="action" onclick={() => bitOp?.animate()} disabled={!bitOp}>animate the bitwise operation</button>.
    </p>
  </div>

  <Figure caption="XOR truth table — output is 1 when inputs differ">
    <TruthTable bind:this={truthTable} instanceId="tt-xor" columns={xorColumns} revealColumns={[2]} />
  </Figure>

  <Figure caption="0110 XOR 1100 — applying XOR bitwise">
    <BitOperator bind:this={bitOp} instanceId="bitop-xor" valueA={0b0110} valueB={0b1100} operation="XOR" />
  </Figure>

  <div class="prose">
    <h3>Discover the Self-Inverse Property</h3>

    <div class="question">
      <p>
        XOR 1010 with 1100 to get 0110. Now XOR that result (0110) with 1100 <em>again</em>.
        What do you get?
      </p>
    </div>

    <div class="reveal" data-open={revealSelfInverse}>
      <div class="reveal-inner">
        <div class="insight">
          <strong>0110 XOR 1100 = 1010 — the ORIGINAL first value!</strong>
          XOR-ing with the same value twice cancels out: <code>(A XOR B) XOR B = A</code>.
          It's like flipping a light switch twice — it returns to its original state.
        </div>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealSelfInverse = true} disabled={!hydrated}>Reveal the property</button>
    </p>

    <h3>The Challenge</h3>

    <div class="question">
      <p>
        How would you swap the values in <code>$a0</code> and <code>$a1</code> if you had
        <strong>NO temporary register</strong> available? You can only use XOR and MOVE.
      </p>
    </div>

    <p>
      Let yourself sit with this. The impossibility feeling makes the reveal more impactful.
    </p>

    <div class="reveal" data-open={revealChallenge}>
      <div class="reveal-inner">
        <p>
          Three XOR operations, then two MOVEs. Step through the trace below to see how.
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealChallenge = true} disabled={!hydrated}>I'm stuck — show me the approach</button>
    </p>

    <h3>The Swap Algorithm Trace</h3>

    <p>
      Step through the XOR swap. Watch how the self-inverse property makes each step work.
    </p>
  </div>

  <Figure caption="XOR swap trace — 3 XOR operations + 2 MOVEs">
    <ExecutionTracer
      instanceId="tracer-swap"
      code={swapCode}
      registers={['$a0', '$a1', '$v0', '$v1']}
      steps={swapSteps}
      title="Swap Subprogram"
    />
  </Figure>

  <div class="prose">
    <h3>Edge Case: What if $a0 = $a1?</h3>

    <div class="question">
      <p>Trace through with both equal to A. Does it still work?</p>
    </div>

    <div class="reveal" data-open={revealEdgeCase}>
      <div class="reveal-inner">
        <p>
          Step 1: <code>$a0 = A XOR A = 0</code>. Step 2: <code>$a1 = 0 XOR A = A</code>.
          Step 3: <code>$a0 = 0 XOR A = A</code>. Result: both still A. Correct!
        </p>
        <p>
          The intermediate zero might alarm you, but it resolves correctly.
          Swapping identical values is a no-op.
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealEdgeCase = true} disabled={!hydrated}>Reveal edge case trace</button>
    </p>

    <h3>Moving to Return Registers</h3>

    <div class="callout">
      <strong>Assignment spec warning:</strong> The assignment text contains confusing notation.
      Line 12 says "$a0 → $v0 and $a1 → $v1", which LOOKS like "put $a0's value in $v0."
      But line 13 clarifies: "the original $a0 register is returned in $v1 and the original $a1
      is returned in $v0." <strong>Follow line 13</strong> — the originals are SWAPPED in the
      return registers.
    </div>

    <div class="question">
      <p>
        After the three XORs: <code>$a0 = B</code> (original $a1), <code>$a1 = A</code> (original $a0).
        The spec wants original $a1 in $v0 and original $a0 in $v1.
        Which register currently holds each?
      </p>
    </div>

    <div class="reveal" data-open={revealMapping}>
      <div class="reveal-inner">
        <p>
          <code>$a0</code> currently holds B (original $a1) → <code>move $v0, $a0</code><br/>
          <code>$a1</code> currently holds A (original $a0) → <code>move $v1, $a1</code>
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealMapping = true} disabled={!hydrated}>Reveal mapping</button>
    </p>

    <h3>Why Modifying $a0 and $a1 is OK</h3>

    <div class="question">
      <p>We changed <code>$a0</code> and <code>$a1</code>. Won't the caller be upset?</p>
    </div>

    <div class="reveal" data-open={revealConvention}>
      <div class="reveal-inner">
        <p>
          No. The <code>$a</code> registers are caller-saved ("non-saved registers are clobbered").
          The calling convention says the callee is free to modify them. That's why we document
          it as a side effect in the header comment.
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealConvention = true} disabled={!hydrated}>Reveal answer</button>
    </p>

    <h3>Write the Complete Subprogram</h3>

    <p>
      Try writing it yourself first. When you're ready, reveal the reference solution line by line:
      <button class="action" onclick={() => codeEditor?.revealAll()} disabled={!codeEditor}>Reveal all lines</button>
    </p>
  </div>

  <Figure caption="Swap reference solution — 5 instructions in the body">
    <MipsEditor bind:this={codeEditor} instanceId="mips-swap" lines={swapLines} title="Swap Subprogram" />
  </Figure>

  <div class="prose">
    <h3>Honesty About XOR Swap</h3>

    <div class="question">
      <p>Could we skip the XOR and just do <code>move $v0, $a1</code> / <code>move $v1, $a0</code> to achieve the same result?</p>
    </div>

    <div class="reveal" data-open={revealHonesty}>
      <div class="reveal-inner">
        <div class="insight">
          <strong>Yes!</strong> For THIS specific case (moving to different registers), you could.
          The XOR swap is meaningful when you must swap values <em>in place</em> with no third
          register available. On modern pipelined processors, the three dependent XOR instructions
          actually create pipeline stalls — a temp-register swap is faster. This is a learning
          exercise about XOR's algebraic properties, not a performance optimization.
        </div>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealHonesty = true} disabled={!hydrated}>Reveal the honest answer</button>
    </p>

    <h3>Narrative Bookend</h3>

    <div class="question">
      <p>Which of the four subprograms taught you the most? Why?</p>
    </div>

    <div class="reveal" data-open={revealBookend}>
      <div class="reveal-inner">
        <p>
          There's no right answer here. But consider: when would the XOR swap be genuinely
          necessary? Can you imagine a scenario with only two available registers?
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealBookend = true} disabled={!hydrated}>Reflect</button>
    </p>
  </div>
</section>
