<script lang="ts">
  import Figure from '../../essay/Figure.svelte';
  import MipsEditor from '../../widgets/MipsEditor.svelte';
  import ShiftVisualizer from '../../widgets/ShiftVisualizer.svelte';
  import type { Line } from '../../../lib/types';

  let shiftDemo: ReturnType<typeof ShiftVisualizer>;
  let shiftMult4: ReturnType<typeof ShiftVisualizer>;
  let codeEditor: ReturnType<typeof MipsEditor>;

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
</script>

<section>
  <div class="prose">
    <h2 id="act-3-mult4">Act 3: Mult4 — Guided Problem</h2>

    <p>
      The first two subprograms used bitwise logic operators. This one uses a different
      kind of bit manipulation — <strong>shifting</strong> — to achieve arithmetic.
    </p>

    <p>
      You're given only the comment header and must write the entire body yourself.
    </p>

    <h3>The Constraint</h3>

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
      <button class="action" onclick={() => revealWhy = true}>Reveal why</button>
    </p>

    <h3>The Decimal Analogy</h3>

    <p>
      When you multiply by 10 in decimal, you shift digits left one place and add a zero:
      42 → 420. Binary works the same way.
    </p>

    <div class="question">
      <p>If you shift the 4-bit binary number 0101 (decimal 5) left by 1 position, what do you get?</p>
    </div>

    <p>
      Predict it, then
      <button class="action" onclick={() => shiftDemo?.animate()} disabled={!shiftDemo}>animate the shift</button>.
    </p>
  </div>

  <Figure caption="Shifting 0101 (5) left by 1 = 1010 (10) — shifting left by 1 multiplies by 2">
    <ShiftVisualizer bind:this={shiftDemo} instanceId="shift-demo" value={5} shiftAmount={1} direction="left" />
  </Figure>

  <div class="prose">
    <h3>Generalize</h3>

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
      <button class="action" onclick={() => revealGeneralize = true}>Reveal answer</button>
    </p>

    <h3>Predict Before Coding</h3>

    <div class="question">
      <p>
        If <code>$a0</code> = 3 (binary: 0011), predict what <code>sll $v0, $a0, 2</code> produces.
      </p>
    </div>

    <p>
      <button class="action" onclick={() => shiftMult4?.animate()} disabled={!shiftMult4}>Animate to verify</button>
    </p>
  </div>

  <Figure caption="Shifting 0011 (3) left by 2 = 1100 (12) — that's 3 × 4!">
    <ShiftVisualizer bind:this={shiftMult4} instanceId="shift-mult4" value={3} shiftAmount={2} direction="left" />
  </Figure>

  <div class="prose">
    <h3>Write the Body</h3>

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
      <button class="action" onclick={() => codeEditor?.revealAll()} disabled={!codeEditor}>Reveal the instruction</button>
    </p>

    <div class="reveal" data-open={revealCode}>
      <div class="reveal-inner">
        <p>
          <code>sll $v0, $a0, 2</code> — shift left logical by 2 positions = multiply by 4.
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealCode = true}>Explain the answer</button>
    </p>

    <div class="callout">
      <strong>Edge case:</strong> If <code>$a0</code> is very large (> 2²⁹ - 1 or &lt; -2²⁹),
      the upper bits are silently lost — the same overflow issue as integer overflow, but
      <code>sll</code> does NOT trap. It just discards the bits.
    </div>

    <h3>Reflection</h3>

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
      <button class="action" onclick={() => revealReflection = true}>Reveal answer</button>
    </p>
  </div>
</section>
