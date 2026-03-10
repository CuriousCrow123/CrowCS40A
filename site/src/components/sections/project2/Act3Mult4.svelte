<script lang="ts">
  import Figure from '../../essay/Figure.svelte';
  import MipsEditor from '../../widgets/MipsEditor.svelte';
  import ShiftVisualizer from '../../widgets/ShiftVisualizer.svelte';
  import ExecutionTracer from '../../widgets/ExecutionTracer.svelte';
  import SubprogramAnimator from '../../widgets/SubprogramAnimator.svelte';
  import type { Line, Step, RegisterBinding } from '../../../lib/types';

  let shiftDemo = $state<ReturnType<typeof ShiftVisualizer>>();
  let shiftMult4 = $state<ReturnType<typeof ShiftVisualizer>>();
  let codeEditor = $state<ReturnType<typeof MipsEditor>>();
  let animator = $state<ReturnType<typeof SubprogramAnimator>>();

  const mult4Code = [
    '# --- main (caller) ---',
    'main:',
    '    li    $a0, 7',
    '    jal   Mult4',
    '    move  $t0, $v0',
    '',
    '# --- Mult4 (subprogram) ---',
    'Mult4:',
    '    sll   $v0, $a0, 2',
    '    jr    $ra',
  ];

  const mult4Addresses = [
    '0x00400000', '0x00400000', '0x00400004', '0x00400008',
    '0x0040000C', '',
    '0x00400010', '0x00400010', '0x00400014', '0x00400018',
  ];

  const mult4Steps: Step[] = [
    { instruction: 'Initial state', line: 1, registers: { '$a0': '?', '$v0': '?', '$ra': '?', '$pc': '0x00400000' }, annotation: 'Program starts at main' },
    { instruction: 'li $a0, 7', line: 2, registers: { '$a0': '7', '$v0': '?', '$ra': '?', '$pc': '0x00400004' }, changed: ['$a0', '$pc'], annotation: 'Load value to multiply into $a0' },
    { instruction: 'jal Mult4', line: 3, registers: { '$a0': '7', '$v0': '?', '$ra': '0x0040000C', '$pc': '0x00400014' }, changed: ['$ra', '$pc'], annotation: 'jal saves return address (0x0040000C) in $ra, jumps to Mult4 (0x00400014)' },
    { instruction: 'sll $v0, $a0, 2', line: 8, registers: { '$a0': '7', '$v0': '28', '$ra': '0x0040000C', '$pc': '0x00400018' }, reading: ['$a0'], changed: ['$v0', '$pc'], annotation: 'Read $a0 (7) → shift left by 2 → write 28 to $v0. That\'s 7 × 4!' },
    { instruction: 'jr $ra', line: 9, registers: { '$a0': '7', '$v0': '28', '$ra': '0x0040000C', '$pc': '0x0040000C' }, reading: ['$ra'], changed: ['$pc'], annotation: 'jr copies $ra (0x0040000C) into $pc — back to caller' },
    { instruction: 'move $t0, $v0', line: 4, registers: { '$a0': '7', '$v0': '28', '$ra': '0x0040000C', '$pc': '0x00400010' }, changed: ['$pc'], annotation: 'Back in main! Caller saves result (28) — 7 × 4 confirmed' },
  ];

  let hydrated = $state(false);
  $effect(() => { hydrated = true; });

  let revealWhy = $state(false);
  let revealGeneralize = $state(false);
  let revealCode = $state(false);
  let revealReflection = $state(false);

  const mult4Lines: Line[] = [
    { kind: 'visible', code: '.text' },
    { kind: 'visible', code: 'Mult4:' },
    { kind: 'visible', code: '# Subprogram:   Mult4' },
    { kind: 'visible', code: '# Author:       [student name]' },
    { kind: 'visible', code: '# Purpose:      Multiplies input by 4 using only shift' },
    { kind: 'visible', code: '# Input:        $a0 = value to multiply' },
    { kind: 'visible', code: '# Output:       $v0 = $a0 * 4' },
    { kind: 'visible', code: '# Side effects: none' },
    { kind: 'hidden', code: '    sll   $v0, $a0, 2', comment: 'Shift left by 2 = multiply by 2^2 = 4' },
    { kind: 'visible', code: '    jr    $ra' },
  ];

  const mult4Inputs: RegisterBinding[] = [
    { register: '$a0', value: '7' },
  ];
  const mult4Outputs: RegisterBinding[] = [
    { register: '$v0', value: '28' },
  ];
</script>

<section>
  <div class="prose">
    <h2 id="section-3-mult4">Section 3: Mult4 — Guided Problem</h2>

    <p>
      The first two subprograms used bitwise logic operators. This one uses a different
      kind of bit manipulation — <strong>shifting</strong> — to achieve arithmetic.
    </p>

    <p>
      You're given only the comment header and must write the entire body yourself.
    </p>

    <h3 id="mult4-no-multiply">The Constraint: No Multiply</h3>

    <p>
      <strong>Mult4 must multiply by 4 using ONLY the shift operation.</strong>
      No <code>mul</code>, no <code>add</code>.
    </p>

    <div class="question">
      <p>Why would anyone multiply without using multiply?</p>
    </div>

    <div class="reveal" data-open={revealWhy}>
      <div class="reveal-inner">
        <p>
          Shifts are faster in hardware — a single cycle, vs. multiple cycles for multiplication.
          When you're multiplying by a power of 2, a shift is both faster and simpler.
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealWhy = !revealWhy} aria-expanded={revealWhy} disabled={!hydrated}>{revealWhy ? 'Hide' : 'Reveal why'}</button>
    </p>

    <h3 id="mult4-shifting-multiplying">Shifting = Multiplying</h3>

    <p>
      When you multiply by 10 in decimal, you shift digits left one place and add a zero:
      42 → 420. Binary works the same way.
    </p>

    <div class="question">
      <p>If you shift the 4-bit binary number 0101 (decimal 5) left by 1 position, what do you get?</p>
    </div>

    <p>
      Predict it, then
      <button class="action" onclick={() => shiftDemo?.animate()} disabled={!shiftDemo}>animate the shift</button> (<button class="action" onclick={() => shiftDemo?.reset()} aria-label="Reset shift visualizer" disabled={!shiftDemo}>reset</button>).
    </p>
  </div>

  <Figure caption="Shifting 0101 (5) left by 1 = 1010 (10) — shifting left by 1 multiplies by 2">
    <ShiftVisualizer bind:this={shiftDemo} instanceId="shift-demo" value={5} shiftAmount={1} direction="left" />
  </Figure>

  <div class="prose">
    <h3 id="mult4-from-2-to-4">From ×2 to ×4</h3>

    <div class="question">
      <p>4 = 2<sup>?</sup>. So to multiply by 4, how many positions do we shift?</p>
    </div>

    <div class="reveal" data-open={revealGeneralize}>
      <div class="reveal-inner">
        <p>
          4 = 2², so shift left by <strong>2</strong>.
        </p>
        <div class="callout">
          <strong>Common mistake warning:</strong> Shifting by <strong>4</strong> would multiply
          by 2⁴ = <strong>16</strong>, not by 4. The shift amount is the <em>exponent</em>,
          not the multiplier.
        </div>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealGeneralize = !revealGeneralize} aria-expanded={revealGeneralize} disabled={!hydrated}>{revealGeneralize ? 'Hide' : 'Reveal answer'}</button>
    </p>

    <h3 id="mult4-predict-result">Predict the Result</h3>

    <div class="question">
      <p>
        If <code>$a0</code> = 3 (binary: 0011), predict what <code>sll $v0, $a0, 2</code> produces.
      </p>
    </div>

    <p>
      <button class="action" onclick={() => shiftMult4?.animate()} disabled={!shiftMult4}>Animate to verify</button> (<button class="action" onclick={() => shiftMult4?.reset()} aria-label="Reset shift visualizer" disabled={!shiftMult4}>reset</button>)
    </p>
  </div>

  <Figure caption="Shifting 0011 (3) left by 2 = 1100 (12) — that's 3 × 4!">
    <ShiftVisualizer bind:this={shiftMult4} instanceId="shift-mult4" value={3} shiftAmount={2} direction="left" />
  </Figure>

  <div class="prose">
    <h3 id="mult4-write-body">Write the Body</h3>

    <p>
      You have the scaffold. The hidden line is the one instruction you need.
      Can you derive it?
    </p>
  </div>

  <Figure caption="Mult4 — reveal the instruction when you're ready">
    <MipsEditor bind:this={codeEditor} instanceId="mips-mult4" lines={mult4Lines} title="Mult4 Subprogram" />
  </Figure>

  <div class="prose">
    <p>
      <button class="action" onclick={() => codeEditor?.revealAll()} disabled={!codeEditor}>Reveal the instruction</button> (<button class="action" onclick={() => codeEditor?.reset()} aria-label="Reset code editor" disabled={!codeEditor}>reset</button>)
    </p>

    <div class="reveal" data-open={revealCode}>
      <div class="reveal-inner">
        <p>
          <code>sll $v0, $a0, 2</code> — shift left logical by 2 positions = multiply by 4.
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealCode = !revealCode} aria-expanded={revealCode} disabled={!hydrated}>{revealCode ? 'Hide' : 'Explain the answer'}</button>
    </p>

    <h3 id="mult4-black-box">Black-Box View</h3>

    <p>
      Before the trace, see Mult4 as a "black box" — one input, one output, one shift.
      <button class="action" onclick={() => animator?.animate()} disabled={!animator}>Animate the data flow</button>
      (<button class="action" onclick={() => animator?.reset()} aria-label="Reset Mult4 animation" disabled={!animator}>reset</button>).
    </p>
  </div>

  <Figure caption="Mult4 as a black box — $a0 goes in, $v0 = $a0 × 4 comes out">
    <SubprogramAnimator bind:this={animator} instanceId="subprog-mult4" inputs={mult4Inputs} outputs={mult4Outputs} operation="SLL" />
  </Figure>

  <div class="prose">
    <h3 id="mult4-execution-trace">Execution Trace</h3>
    <p>
      This trace shows the <strong>complete program</strong>: <code>main</code> loads the argument,
      calls Mult4 with <code>jal</code>, and receives the result. Watch <code>$ra</code> and
      <code>$pc</code> — only one argument register this time, but the call/return pattern is identical.
    </p>
  </div>

  <Figure caption="Mult4 execution trace — one shift instruction does it all">
    <ExecutionTracer
      instanceId="tracer-mult4"
      code={mult4Code}
      registers={['$a0', '$v0', '$ra', '$pc']}
      steps={mult4Steps}
      title="Mult4 — Full Call & Return"
      addresses={mult4Addresses}
    />
  </Figure>

  <div class="prose">
    <div class="callout">
      <strong>Edge case:</strong> If <code>$a0</code> is very large (> 2²⁹ - 1 or &lt; -2²⁹),
      the upper bits are silently lost — the same overflow issue as integer overflow, but
      <code>sll</code> does NOT trap. It just discards the bits.
    </div>

    <h3 id="mult4-reflection">Reflection</h3>

    <div class="question">
      <p>How would you multiply by 8 using only shifts?</p>
    </div>

    <div class="reveal" data-open={revealReflection}>
      <div class="reveal-inner">
        <p>
          <code>sll $v0, $a0, 3</code> — because 8 = 2³. Same pattern, different exponent.
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealReflection = !revealReflection} aria-expanded={revealReflection} disabled={!hydrated}>{revealReflection ? 'Hide' : 'Reveal answer'}</button>
    </p>
  </div>
</section>
