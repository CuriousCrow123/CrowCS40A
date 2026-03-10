<script lang="ts">
  import Figure from '../../essay/Figure.svelte';
  import ExecutionTracer from '../../widgets/ExecutionTracer.svelte';
  import type { Step } from '../../../lib/types';

  let tracer = $state<ReturnType<typeof ExecutionTracer>>();
  let hydrated = $state(false);
  $effect(() => { hydrated = true; });
  let revealExit = $state(false);

  const helloCode = [
    '.data',
    'msg: .asciiz "Hello!"',
    '.text',
    'main:',
    '    li  $v0, 4',
    '    la  $a0, msg',
    '    syscall',
    '    li  $v0, 10',
    '    syscall',
  ];

  const helloSteps: Step[] = [
    { instruction: 'Initial state', line: 3, registers: { '$v0': '?', '$a0': '?' }, annotation: 'Program starts at main:' },
    { instruction: 'li $v0, 4', line: 4, registers: { '$v0': '4', '$a0': '?' }, changed: ['$v0'], annotation: 'Service 4 = print string. Loaded into $v0.' },
    { instruction: 'la $a0, msg', line: 5, registers: { '$v0': '4', '$a0': '0x10010000' }, changed: ['$a0'], annotation: 'Load the address of our "Hello!" string into $a0' },
    { instruction: 'syscall', line: 6, registers: { '$v0': '4', '$a0': '0x10010000' }, reading: ['$v0', '$a0'], annotation: 'OS reads $v0 (service 4) and $a0 (string address) → prints "Hello!"' },
    { instruction: 'li $v0, 10', line: 7, registers: { '$v0': '10', '$a0': '0x10010000' }, changed: ['$v0'], annotation: 'Service 10 = exit. Loaded into $v0.' },
    { instruction: 'syscall', line: 8, registers: { '$v0': '10', '$a0': '0x10010000' }, reading: ['$v0'], annotation: 'OS reads $v0 (service 10) → program terminates' },
  ];
</script>

<section>
  <div class="prose">
    <h2 id="interlude-syscall">Interlude: How <code>syscall</code> Works</h2>

    <p>
      Before we write our own subprograms, let's understand a built-in one: <code>syscall</code>.
      It's not an instruction you write yourself — it's a handoff to the operating system.
      You say what you want by putting a service number in <code>$v0</code>, and any inputs in
      <code>$a0</code>–<code>$a1</code>. Then <code>syscall</code> does the work.
    </p>

    <h3>The Syscall Protocol</h3>

    <ol class="syscall-steps">
      <li><strong>Load service number</strong> → <code>$v0</code></li>
      <li><strong>Load input data</strong> → <code>$a0</code> (and <code>$a1</code> if needed)</li>
      <li><strong>Execute <code>syscall</code></strong> → OS does the work</li>
    </ol>

    <h3>The Five Services You Need</h3>
  </div>

  <div class="service-grid">
    <div class="callout service-card">
      <div class="service-header"><span class="service-number">1</span> Print Integer</div>
      <p><strong>Setup:</strong> <code>li $v0, 1</code> then put the integer in <code>$a0</code></p>
      <p><strong>Effect:</strong> Prints the decimal value of <code>$a0</code> to the console</p>
    </div>

    <div class="callout service-card">
      <div class="service-header"><span class="service-number">4</span> Print String</div>
      <p><strong>Setup:</strong> <code>li $v0, 4</code> then put the string address in <code>$a0</code></p>
      <p><strong>Effect:</strong> Prints the null-terminated string at the address in <code>$a0</code></p>
    </div>

    <div class="callout service-card">
      <div class="service-header"><span class="service-number">5</span> Read Integer</div>
      <p><strong>Setup:</strong> <code>li $v0, 5</code></p>
      <p><strong>Effect:</strong> Reads an integer from console, stores it in <code>$v0</code></p>
    </div>

    <div class="callout service-card">
      <div class="service-header"><span class="service-number">8</span> Read String</div>
      <p><strong>Setup:</strong> <code>li $v0, 8</code> then put buffer address in <code>$a0</code>, max length in <code>$a1</code></p>
      <p><strong>Effect:</strong> Reads up to <code>$a1</code> characters into the buffer at <code>$a0</code></p>
    </div>

    <div class="callout service-card">
      <div class="service-header"><span class="service-number">10</span> Exit</div>
      <p><strong>Setup:</strong> <code>li $v0, 10</code></p>
      <p><strong>Effect:</strong> Terminates the program</p>
    </div>
  </div>

  <div class="prose">
    <h3>Hello World Trace</h3>

    <p>
      Let's step through a complete Hello World program. Watch how each instruction sets up
      registers before <code>syscall</code> reads them.
    </p>
  </div>

  <Figure caption="Hello World — your first complete program trace">
    <ExecutionTracer
      bind:this={tracer}
      instanceId="tracer-hello-syscall"
      code={helloCode}
      registers={['$v0', '$a0']}
      steps={helloSteps}
      title="Hello World"
    />
  </Figure>

  <div class="prose">
    <div class="insight">
      <strong>Key insight:</strong> <code>syscall</code> doesn't know what to do until you tell it.
      The service number in <code>$v0</code> is the instruction manual — without it, the OS
      has no idea whether you want to print, read, or exit.
    </div>

    <h3>How <code>utils.asm</code> Uses Syscall</h3>

    <div class="callout">
      The <code>PrintInt</code>, <code>PrintString</code>, and <code>Exit</code> subprograms in
      <code>utils.asm</code> are thin wrappers around <code>syscall</code>. When you call
      <code>jal PrintInt</code>, it sets up <code>$v0</code> and <code>$a0</code> internally
      and calls <code>syscall</code> for you. You don't need to know how they work — just call them.
    </div>

    <div class="reveal" data-open={revealExit}>
      <div class="reveal-inner">
        <pre class="exit-listing"><code>Exit:
    li $v0, 10
    syscall</code></pre>
        <p>
          That's it — two instructions. <code>Exit</code> loads service 10 and calls <code>syscall</code>.
        </p>
      </div>
    </div>
    <p>
      <button class="action" onclick={() => revealExit = true} disabled={!hydrated}>Peek inside Exit</button>
    </p>
  </div>
</section>

<style>
  /* ===== SYSCALL STEPS ===== */

  .syscall-steps {
    list-style: none;
    counter-reset: step;
    padding-left: 0;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    margin-block: 1.5rem;
  }

  .syscall-steps li {
    counter-increment: step;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
    background: var(--color-bg-surface, #1a1a2e);
    border: 1px solid var(--color-border, #333);
    border-radius: 6px;
    font-size: 0.95rem;
  }

  .syscall-steps li::before {
    content: counter(step);
    display: grid;
    place-items: center;
    min-width: 2rem;
    height: 2rem;
    background: var(--color-accent, #4d9fff);
    color: var(--color-bg, #0a0a1a);
    border-radius: 50%;
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 0.85rem;
    flex-shrink: 0;
  }

  /* ===== SERVICE CARDS GRID ===== */

  .service-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(16rem, 1fr));
    gap: 1rem;
    max-width: var(--figure-width);
    margin-inline: auto;
    padding-inline: var(--space-lg, 1.5rem);
    margin-block: 1.5rem;
  }

  .service-card {
    display: flex;
    flex-direction: column;
    gap: 0.25rem;
  }

  .service-card p {
    margin: 0.25rem 0;
    font-size: 0.9rem;
  }

  .service-header {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: 600;
    font-size: 1rem;
    margin-bottom: 0.25rem;
  }

  .service-number {
    display: inline-grid;
    place-items: center;
    min-width: 2rem;
    height: 2rem;
    background: var(--color-accent, #4d9fff);
    color: var(--color-bg, #0a0a1a);
    border-radius: 4px;
    font-family: var(--font-mono);
    font-weight: 700;
    font-size: 0.9rem;
    flex-shrink: 0;
  }

  /* ===== EXIT LISTING ===== */

  .exit-listing {
    background: var(--color-bg-surface, #1a1a2e);
    border: 1px solid var(--color-border, #333);
    border-radius: 6px;
    padding: 0.75rem 1rem;
    font-family: var(--font-mono);
    font-size: 0.875rem;
    line-height: 1.6;
    overflow-x: auto;
    margin-block: 0.75rem;
  }

  .exit-listing code {
    background: none;
    padding: 0;
    font-size: inherit;
  }
</style>
