<script lang="ts">
  import Figure from '../../essay/Figure.svelte';
  import MipsEditor from '../../widgets/MipsEditor.svelte';
  import RegisterFile from '../../widgets/RegisterFile.svelte';
  import type { Line, Step } from '../../../lib/types';

  let editor = $state<ReturnType<typeof MipsEditor>>();
  let scaffoldTrace = $state<ReturnType<typeof RegisterFile>>();

  let hydrated = $state(false);
  $effect(() => { hydrated = true; });

  let revealOpen1 = $state(false);
  let revealOpen2 = $state(false);

  const callReturnSteps: Step[] = [
    { instruction: 'Before jal NOR', registers: { '$a0': '0xF0F0F0F0', '$a1': '0x0F0F0F0F', '$v0': '?', '$ra': '?' }, annotation: 'Caller has loaded arguments — ready to call subprogram' },
    { instruction: 'jal NOR', registers: { '$a0': '0xF0F0F0F0', '$a1': '0x0F0F0F0F', '$v0': '?', '$ra': '0x00400028' }, changed: ['$ra'], annotation: 'jal saves the return address in $ra automatically' },
    { instruction: '(inside NOR body)', registers: { '$a0': '0xF0F0F0F0', '$a1': '0x0F0F0F0F', '$v0': '0x00000000', '$ra': '0x00400028' }, reading: ['$a0', '$a1'], changed: ['$v0'], annotation: 'Subprogram reads inputs, writes result to $v0' },
    { instruction: 'jr $ra', registers: { '$a0': '0xF0F0F0F0', '$a1': '0x0F0F0F0F', '$v0': '0x00000000', '$ra': '0x00400028' }, reading: ['$ra'], annotation: 'jr reads $ra to jump back to the caller' },
  ];

  const scaffoldLines: Line[] = [
    { kind: 'visible', code: '.text' },
    { kind: 'visible', code: 'SubprogramName:' },
    { kind: 'visible', code: '# Subprogram:   SubprogramName' },
    { kind: 'visible', code: '# Author:       [student name]' },
    { kind: 'visible', code: '# Purpose:      [what it does]' },
    { kind: 'visible', code: '# Input:        $a0 = [description], $a1 = [description]' },
    { kind: 'visible', code: '# Output:       $v0 = [description]' },
    { kind: 'visible', code: '# Side effects: [description or "none"]' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '    # === BODY GOES HERE ===' },
    { kind: 'visible', code: '' },
    { kind: 'visible', code: '    jr $ra' },
  ];
</script>

<section>
  <div class="prose">
    <h2 id="act-0-scaffold">Act 0: The Subprogram Scaffold</h2>

    <p>
      Before writing any new subprograms, let's recall what every MIPS subprogram needs.
      You learned this structure in Chapter 5 — this is a quick check, not a re-derivation.
    </p>

    <div class="question">
      <p>What are the three things every MIPS subprogram needs? And what registers are used for inputs vs. outputs?</p>
    </div>

    <div class="reveal" data-open={revealOpen1}>
      <div class="reveal-inner">
        <p>
          Every subprogram needs: <strong>a label</strong> (the entry point name),
          <strong>a body</strong> (the actual work), and <strong><code>jr $ra</code></strong>
          (to return to the caller). Inputs arrive in <code>$a0</code>–<code>$a3</code>,
          and outputs go in <code>$v0</code>–<code>$v1</code>.
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealOpen1 = true} disabled={!hydrated}>Reveal answer</button>
    </p>

    <div class="question">
      <p>What happens if you forget <code>jr $ra</code>?</p>
    </div>

    <div class="reveal" data-open={revealOpen2}>
      <div class="reveal-inner">
        <div class="callout">
          <strong>The #1 subprogram bug:</strong> Without <code>jr $ra</code>, execution
          "falls through" into whatever code follows in memory — undefined behavior.
          Your subprogram might appear to work by accident, then break when you add more code below it.
        </div>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealOpen2 = true} disabled={!hydrated}>Reveal answer</button>
    </p>

    <p>
      Here's the template. Keep it in mind — you'll fill it in four times, once for each subprogram.
    </p>
  </div>

  <Figure caption="The subprogram scaffold — every subprogram follows this structure">
    <MipsEditor bind:this={editor} instanceId="mips-scaffold" lines={scaffoldLines} title="Subprogram Template" />
  </Figure>

  <div class="prose">
    <h3>The Call/Return Dance</h3>
    <p>
      What actually happens in the registers when you call a subprogram? Step through to see:
    </p>
    <p>
      <button class="action" onclick={() => scaffoldTrace?.step()} disabled={!scaffoldTrace}>Next step</button>
      <button class="action" onclick={() => scaffoldTrace?.stepBack()} disabled={!scaffoldTrace}>Previous step</button>
      <button class="action" onclick={() => scaffoldTrace?.reset()} disabled={!scaffoldTrace}>Reset</button>
    </p>
  </div>

  <Figure caption="Register trace: what jal and jr $ra do to the register file">
    <RegisterFile bind:this={scaffoldTrace} instanceId="regfile-scaffold" registers={['$a0', '$a1', '$v0', '$ra']} steps={callReturnSteps} />
  </Figure>

  <div class="prose">
    <div class="callout">
      <strong>Note on <code>.text</code>:</strong> Every subprogram starts with <code>.text</code>
      as a defensive measure — if a previous subprogram's <code>.data</code> section was the last
      thing assembled, our code would land in the wrong segment.
    </div>

    <div class="callout">
      <strong>Note on comment format:</strong> Match the existing <code>utils.asm</code> style exactly.
      Use <code># Subprogram:</code>, <code># Author:</code>, etc. — no dashed border lines.
    </div>
  </div>
</section>
