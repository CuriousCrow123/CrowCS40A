<script lang="ts">
  import Figure from '../../essay/Figure.svelte';
  import MipsEditor from '../../widgets/MipsEditor.svelte';
  import type { Line } from '../../../lib/types';

  let testEditor: ReturnType<typeof MipsEditor>;

  let revealReflection = $state(false);

  const testHarnessLines: Line[] = [
    { kind: 'visible', code: '# File:    main.asm' },
    { kind: 'visible', code: '# Purpose: Test harness for Project 2 subprograms' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.include "utils.asm"' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.data' },
    { kind: 'visible', code: 'norLabel:   .asciiz "NOR result:  "' },
    { kind: 'visible', code: 'nandLabel:  .asciiz "NAND result: "' },
    { kind: 'visible', code: 'mult4Label: .asciiz "Mult4 result: "' },
    { kind: 'visible', code: 'swapLabel1: .asciiz "Swap $v0: "' },
    { kind: 'visible', code: 'swapLabel2: .asciiz "Swap $v1: "' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '.text' },
    { kind: 'visible', code: 'main:' },
    { kind: 'visible', code: '    # Test NOR: 0xF0F0F0F0 NOR 0x0F0F0F0F = 0x00000000' },
    { kind: 'visible', code: '    li    $a0, 0xF0F0F0F0' },
    { kind: 'visible', code: '    li    $a1, 0x0F0F0F0F' },
    { kind: 'visible', code: '    jal   NOR' },
    { kind: 'visible', code: '    move  $a1, $v0' },
    { kind: 'visible', code: '    la    $a0, norLabel' },
    { kind: 'visible', code: '    jal   PrintInt' },
    { kind: 'visible', code: '    jal   PrintNewLine' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '    # Test NAND: 0xFF00FF00 NAND 0xFFFF0000 = NOT(0xFF000000) = 0x00FFFFFF' },
    { kind: 'visible', code: '    li    $a0, 0xFF00FF00' },
    { kind: 'visible', code: '    li    $a1, 0xFFFF0000' },
    { kind: 'visible', code: '    jal   NAND' },
    { kind: 'visible', code: '    move  $a1, $v0' },
    { kind: 'visible', code: '    la    $a0, nandLabel' },
    { kind: 'visible', code: '    jal   PrintInt' },
    { kind: 'visible', code: '    jal   PrintNewLine' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '    # Test Mult4: 7 * 4 = 28' },
    { kind: 'visible', code: '    li    $a0, 7' },
    { kind: 'visible', code: '    jal   Mult4' },
    { kind: 'visible', code: '    move  $a1, $v0' },
    { kind: 'visible', code: '    la    $a0, mult4Label' },
    { kind: 'visible', code: '    jal   PrintInt' },
    { kind: 'visible', code: '    jal   PrintNewLine' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '    # Test Swap: $a0=10, $a1=20 → $v0=20, $v1=10' },
    { kind: 'visible', code: '    li    $a0, 10' },
    { kind: 'visible', code: '    li    $a1, 20' },
    { kind: 'visible', code: '    jal   Swap' },
    { kind: 'visible', code: '    move  $a1, $v0' },
    { kind: 'visible', code: '    la    $a0, swapLabel1' },
    { kind: 'visible', code: '    jal   PrintInt' },
    { kind: 'visible', code: '    jal   PrintNewLine' },
    { kind: 'visible', code: '    move  $a1, $v1' },
    { kind: 'visible', code: '    la    $a0, swapLabel2' },
    { kind: 'visible', code: '    jal   PrintInt' },
    { kind: 'visible', code: '    jal   PrintNewLine' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '    jal   Exit' },
  ];
</script>

<section>
  <div class="prose">
    <h2 id="act-6-verification">Act 6: Verification</h2>

    <p>
      You need a way to confirm your code works. The assignment says "other subprograms
      in utils.asm can be used" for I/O — so let's write a test harness that calls
      each subprogram and prints the results.
    </p>

    <p>
      Create a separate <code>main.asm</code> file with this test harness. It uses
      <code>.include "utils.asm"</code> to pull in your updated utility file.
    </p>
  </div>

  <Figure caption="Test harness — paste this into main.asm and run in MARS">
    <MipsEditor bind:this={testEditor} instanceId="mips-test-harness" lines={testHarnessLines} title="main.asm — Test Harness" />
  </Figure>

  <div class="prose">
    <h3>Expected Output</h3>

    <div class="callout">
      <strong>When you run this in MARS, you should see:</strong><br/>
      <code>NOR result:  0</code><br/>
      <code>NAND result: 16777215</code> (which is 0x00FFFFFF)<br/>
      <code>Mult4 result: 28</code><br/>
      <code>Swap $v0: 20</code><br/>
      <code>Swap $v1: 10</code>
    </div>

    <div class="callout">
      <strong>Debugging tip:</strong> Step through in MARS using the single-step button
      and check register values at each <code>jr $ra</code>. This test harness calls
      subprograms from within <code>main</code>, which itself is the entry point —
      so <code>$ra</code> is never at risk of being overwritten.
    </div>

    <h3>Final Reflection</h3>

    <div class="question">
      <p>Which of the four subprograms taught you the most? Why?</p>
    </div>

    <div class="reveal" data-open={revealReflection}>
      <div class="reveal-inner">
        <p>
          You built four subprograms with a total of <strong>13 lines of actual MIPS code</strong>
          (excluding comments). But each line was <em>accountable</em> — traceable to a specific
          concept you activated before writing it.
        </p>
        <ul>
          <li><strong>NOR</strong>: 1 instruction — hardware provides it directly</li>
          <li><strong>NAND</strong>: 2 instructions — composition when hardware doesn't help</li>
          <li><strong>Mult4</strong>: 1 instruction — arithmetic via bit manipulation</li>
          <li><strong>Swap</strong>: 5 instructions — algorithmic cleverness with XOR</li>
        </ul>
        <p>
          Assembly programming isn't about memorizing instructions — it's about understanding
          what each instruction does, so you can compose them into solutions.
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealReflection = true}>Reveal final summary</button>
    </p>
  </div>
</section>
