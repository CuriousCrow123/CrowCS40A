<script lang="ts">
  import Figure from '../../essay/Figure.svelte';
  import MipsEditor from '../../widgets/MipsEditor.svelte';
  import TruthTable from '../../widgets/TruthTable.svelte';
  import BitOperator from '../../widgets/BitOperator.svelte';
  import ExecutionTracer from '../../widgets/ExecutionTracer.svelte';
  import SubprogramAnimator from '../../widgets/SubprogramAnimator.svelte';
  import type { Line, Column, Step, RegisterBinding } from '../../../lib/types';

  let truthTable = $state<ReturnType<typeof TruthTable>>();
  let bitOp = $state<ReturnType<typeof BitOperator>>();
  let codeEditor = $state<ReturnType<typeof MipsEditor>>();
  let animator = $state<ReturnType<typeof SubprogramAnimator>>();

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
    '# --- main (caller) ---',
    'main:',
    '    li    $a0, 42',
    '    li    $a1, 99',
    '    jal   Swap',
    '    move  $t0, $v0',
    '    move  $t1, $v1',
    '',
    '# --- Swap (subprogram) ---',
    'Swap:',
    '    xor   $a0, $a0, $a1',
    '    xor   $a1, $a0, $a1',
    '    xor   $a0, $a0, $a1',
    '    move  $v0, $a0',
    '    move  $v1, $a1',
    '    jr    $ra',
  ];

  const swapAddresses = [
    '0x00400000', '0x00400000', '0x00400004', '0x00400008',
    '0x0040000C', '0x00400010', '0x00400014', '',
    '0x00400018', '0x00400018', '0x0040001C', '0x00400020',
    '0x00400024', '0x00400028', '0x0040002C', '0x00400030',
  ];

  const swapSteps: Step[] = [
    { instruction: 'Initial state', line: 1, registers: { '$a0': '?', '$a1': '?', '$v0': '?', '$v1': '?', '$ra': '?', '$pc': '0x00400000' }, annotation: 'Program starts at main' },
    { instruction: 'li $a0, 42', line: 2, registers: { '$a0': '42', '$a1': '?', '$v0': '?', '$v1': '?', '$ra': '?', '$pc': '0x00400004' }, changed: ['$a0', '$pc'], annotation: 'Load first value (A = 42) into $a0' },
    { instruction: 'li $a1, 99', line: 3, registers: { '$a0': '42', '$a1': '99', '$v0': '?', '$v1': '?', '$ra': '?', '$pc': '0x00400008' }, changed: ['$a1', '$pc'], annotation: 'Load second value (B = 99) into $a1' },
    { instruction: 'jal Swap', line: 4, registers: { '$a0': '42', '$a1': '99', '$v0': '?', '$v1': '?', '$ra': '0x00400010', '$pc': '0x0040001C' }, changed: ['$ra', '$pc'], annotation: 'jal saves return address (0x00400010) in $ra, jumps to Swap (0x0040001C)' },
    { instruction: 'xor $a0, $a0, $a1', line: 10, registers: { '$a0': '42 XOR 99', '$a1': '99', '$v0': '?', '$v1': '?', '$ra': '0x00400010', '$pc': '0x00400020' }, reading: ['$a0', '$a1'], changed: ['$a0', '$pc'], annotation: '$a0 now holds A XOR B — the original A is "encoded" with B' },
    { instruction: 'xor $a1, $a0, $a1', line: 11, registers: { '$a0': '42 XOR 99', '$a1': '42', '$v0': '?', '$v1': '?', '$ra': '0x00400010', '$pc': '0x00400024' }, reading: ['$a0', '$a1'], changed: ['$a1', '$pc'], annotation: 'Self-inverse: (A XOR B) XOR B = A — original 42 recovered in $a1!' },
    { instruction: 'xor $a0, $a0, $a1', line: 12, registers: { '$a0': '99', '$a1': '42', '$v0': '?', '$v1': '?', '$ra': '0x00400010', '$pc': '0x00400028' }, reading: ['$a0', '$a1'], changed: ['$a0', '$pc'], annotation: 'Self-inverse: (A XOR B) XOR A = B — original 99 now in $a0' },
    { instruction: 'move $v0, $a0', line: 13, registers: { '$a0': '99', '$a1': '42', '$v0': '99', '$v1': '?', '$ra': '0x00400010', '$pc': '0x0040002C' }, reading: ['$a0'], changed: ['$v0', '$pc'], annotation: '$v0 = 99 (original $a1) — first output register set' },
    { instruction: 'move $v1, $a1', line: 14, registers: { '$a0': '99', '$a1': '42', '$v0': '99', '$v1': '42', '$ra': '0x00400010', '$pc': '0x00400030' }, reading: ['$a1'], changed: ['$v1', '$pc'], annotation: 'Both outputs set: $v0 = 99 (was $a1), $v1 = 42 (was $a0)' },
    { instruction: 'jr $ra', line: 15, registers: { '$a0': '99', '$a1': '42', '$v0': '99', '$v1': '42', '$ra': '0x00400010', '$pc': '0x00400010' }, reading: ['$ra'], changed: ['$pc'], annotation: 'jr copies $ra (0x00400010) into $pc — back to caller' },
    { instruction: 'move $t0, $v0', line: 5, registers: { '$a0': '99', '$a1': '42', '$v0': '99', '$v1': '42', '$ra': '0x00400010', '$pc': '0x00400014' }, changed: ['$pc'], annotation: 'Back in main! Caller saves swapped values — call/return complete' },
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

  const swapInputs: RegisterBinding[] = [
    { register: '$a0', value: '42' },
    { register: '$a1', value: '99' },
  ];
  const swapOutputs: RegisterBinding[] = [
    { register: '$v0', value: '99' },
    { register: '$v1', value: '42' },
  ];
</script>

<section>
  <div class="prose">
    <h2 id="section-4-swap">Section 4: Swap — Independent Problem</h2>

    <p>
      This is the most conceptually dense subprogram. You'll write <strong>everything from scratch</strong>,
      then compare against the worked solution. The XOR swap requires understanding a <em>property</em>
      of XOR (self-inverse), not just its truth table.
    </p>

    <h3 id="xor-truth-table">XOR Truth Table</h3>

    <div class="question">
      <p>Compute 1010 XOR 1100, bit by bit. XOR outputs 1 when the inputs <em>differ</em>.</p>
    </div>

    <p>
      <button class="action" onclick={() => truthTable?.reveal()} disabled={!truthTable}>Show XOR column</button> (<button class="action" onclick={() => truthTable?.reset()} aria-label="Reset XOR truth table" disabled={!truthTable}>reset</button>), then
      <button class="action" onclick={() => bitOp?.animate()} disabled={!bitOp}>animate the bitwise operation</button> (<button class="action" onclick={() => bitOp?.reset()} aria-label="Reset bitwise XOR operation" disabled={!bitOp}>reset</button>).
    </p>
  </div>

  <Figure caption="XOR truth table — output is 1 when inputs differ">
    <TruthTable bind:this={truthTable} instanceId="tt-xor" columns={xorColumns} revealColumns={[2]} />
  </Figure>

  <Figure caption="0110 XOR 1100 — applying XOR bitwise">
    <BitOperator bind:this={bitOp} instanceId="bitop-xor" valueA={0b0110} valueB={0b1100} operation="XOR" />
  </Figure>

  <div class="prose">
    <h3 id="swap-self-inverse">The Self-Inverse Property</h3>

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
      <button class="action" onclick={() => revealSelfInverse = !revealSelfInverse} aria-expanded={revealSelfInverse} disabled={!hydrated}>{revealSelfInverse ? 'Hide' : 'Reveal the property'}</button>
    </p>

    <h3 id="swap-no-temp">The Challenge: No Temp Register</h3>

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
      <button class="action" onclick={() => revealChallenge = !revealChallenge} aria-expanded={revealChallenge} disabled={!hydrated}>{revealChallenge ? 'Hide' : "I'm stuck — show me the approach"}</button>
    </p>

    <h3 id="swap-black-box">Black-Box View</h3>

    <p>
      Swap is the most complex subprogram — two inputs, two outputs. See it as a black box first.
      <button class="action" onclick={() => animator?.animate()} disabled={!animator}>Animate the data flow</button>
      (<button class="action" onclick={() => animator?.reset()} aria-label="Reset Swap animation" disabled={!animator}>reset</button>).
    </p>
  </div>

  <Figure caption="Swap as a black box — $a0 and $a1 go in, their values come out swapped in $v0 and $v1">
    <SubprogramAnimator bind:this={animator} instanceId="subprog-swap" inputs={swapInputs} outputs={swapOutputs} operation="XOR Swap" />
  </Figure>

  <div class="prose">
    <h3 id="swap-execution-trace">Execution Trace</h3>

    <p>
      This trace shows the <strong>complete program</strong>: <code>main</code> loads two concrete
      values (42 and 99), calls Swap with <code>jal</code>, and receives them back swapped.
      Watch <code>$ra</code> and <code>$pc</code> through the call/return, and see how the
      self-inverse property makes each XOR step work.
    </p>
  </div>

  <Figure caption="XOR swap trace — 3 XOR operations + 2 MOVEs">
    <ExecutionTracer
      instanceId="tracer-swap"
      code={swapCode}
      registers={['$a0', '$a1', '$v0', '$v1', '$ra', '$pc']}
      steps={swapSteps}
      title="Swap — Full Call & Return"
      addresses={swapAddresses}
    />
  </Figure>

  <div class="prose">
    <h3 id="swap-equal-inputs">Edge Case: Equal Inputs</h3>

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
      <button class="action" onclick={() => revealEdgeCase = !revealEdgeCase} aria-expanded={revealEdgeCase} disabled={!hydrated}>{revealEdgeCase ? 'Hide' : 'Reveal edge case trace'}</button>
    </p>

    <h3 id="swap-return-registers">Moving to Return Registers</h3>

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
      <button class="action" onclick={() => revealMapping = !revealMapping} aria-expanded={revealMapping} disabled={!hydrated}>{revealMapping ? 'Hide' : 'Reveal mapping'}</button>
    </p>

    <h3 id="swap-modifying-args">Why Modifying $a0 and $a1 is OK</h3>

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
      <button class="action" onclick={() => revealConvention = !revealConvention} aria-expanded={revealConvention} disabled={!hydrated}>{revealConvention ? 'Hide' : 'Reveal answer'}</button>
    </p>

    <h3 id="swap-write-subprogram">Write the Complete Subprogram</h3>

    <p>
      Try writing it yourself first. When you're ready, reveal the reference solution line by line:
      <button class="action" onclick={() => codeEditor?.revealAll()} disabled={!codeEditor}>Reveal all lines</button> (<button class="action" onclick={() => codeEditor?.reset()} aria-label="Reset code editor" disabled={!codeEditor}>reset</button>)
    </p>
  </div>

  <Figure caption="Swap reference solution — 5 instructions in the body">
    <MipsEditor bind:this={codeEditor} instanceId="mips-swap" lines={swapLines} title="Swap Subprogram" />
  </Figure>

  <div class="prose">
    <h3 id="swap-honesty">Honesty About XOR Swap</h3>

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
      <button class="action" onclick={() => revealHonesty = !revealHonesty} aria-expanded={revealHonesty} disabled={!hydrated}>{revealHonesty ? 'Hide' : 'Reveal the honest answer'}</button>
    </p>

    <h3 id="swap-bookend">Narrative Bookend</h3>

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
      <button class="action" onclick={() => revealBookend = !revealBookend} aria-expanded={revealBookend} disabled={!hydrated}>{revealBookend ? 'Hide' : 'Reflect'}</button>
    </p>
  </div>
</section>
