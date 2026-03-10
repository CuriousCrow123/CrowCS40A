<script lang="ts">
  import type { Param } from '../../lib/params';
  import { loadParams, saveParams } from '../../lib/params';
  import type { DisplayRegister, Step } from '../../lib/types';
  import { tokenizeMipsLine } from '../../lib/mips-tokenizer';
  import WidgetDebugPanel from '../debug/WidgetDebugPanel.svelte';

  const paramDefs: Param[] = [
    { name: 'fontSize',      value: 0.875, unit: 'rem', category: 'style', min: 0.7, max: 1.3, step: 0.05, description: 'Register value font size' },
    { name: 'labelSize',     value: 0.75,  unit: 'rem', category: 'style', min: 0.6, max: 1,   step: 0.05, description: 'Register name font size' },
    { name: 'cellPadding',   value: 0.75,  unit: 'rem', category: 'style', min: 0.25,max: 1.5, step: 0.125, description: 'Cell padding' },
    { name: 'gap',           value: 0.5,   unit: 'rem', category: 'style', min: 0,   max: 1.5, step: 0.125, description: 'Gap between register cells' },
    { name: 'borderRadius',  value: 6,     unit: 'px',  category: 'style', min: 0,   max: 12,  step: 1,    description: 'Cell corner rounding' },
    { name: 'codeFontSize',  value: 0.85,  unit: 'rem', category: 'style', min: 0.7, max: 1.2, step: 0.05, description: 'Code panel font size' },
    { name: 'codeLineHeight',value: 1.6,   unit: '',    category: 'style', min: 1.2, max: 2.2, step: 0.1,  description: 'Code panel line height' },
  ];

  let { instanceId, code, registers, steps, title, addresses }: {
    instanceId: string;
    code: string[];
    registers: DisplayRegister[];
    steps: Step[];
    title?: string;
    addresses?: string[];
  } = $props();

  let params = $state(loadParams(instanceId, paramDefs));
  $effect(() => { saveParams(instanceId, params, paramDefs); });

  let currentStep = $state(0);
  let flashGeneration = $state(0);

  let current = $derived(steps[currentStep]);
  let changedSet = $derived(new Set(current?.changed ?? []));
  let readingSet = $derived(new Set(current?.reading ?? []));
  let totalSteps = $derived(steps.length);
  let isFirst = $derived(currentStep === 0);
  let isLast = $derived(currentStep === totalSteps - 1);
  let currentLine = $derived(current?.line);

  // Track executed lines for dimming (handles non-linear jal/jr jumps)
  let executedLines = $derived.by(() => {
    const lines = new Set<number>();
    for (let i = 0; i < currentStep; i++) {
      const line = steps[i].line;
      if (line !== undefined) lines.add(line);
    }
    return lines;
  });

  // Tokenize code lines (memoized at tokenizer level)
  let tokenized = $derived(code.map(line => tokenizeMipsLine(line)));

  // A11y announcement
  let changeAnnouncement = $derived.by(() => {
    const parts: string[] = [];
    if (currentLine !== undefined) {
      parts.push(`Executing line ${currentLine + 1}: ${code[currentLine]?.trim() ?? ''}`);
    }
    const reading = current?.reading;
    if (reading && reading.length > 0) {
      parts.push('Reading ' + reading.map(r => `${r} (${current.registers[r] ?? '?'})`).join(', '));
    }
    const changed = current?.changed;
    if (changed && changed.length > 0) {
      parts.push(changed.map(r => `${r} changed to ${current.registers[r] ?? '?'}`).join('. '));
    }
    return parts.join('. ');
  });

  // Dev-mode validation
  if (import.meta.env.DEV) {
    $effect(() => {
      for (const s of steps) {
        if (s.line !== undefined && (s.line < 0 || s.line >= code.length)) {
          console.warn(`ExecutionTracer "${instanceId}": step line ${s.line} out of bounds (code has ${code.length} lines)`);
        }
      }
    });
  }

  export function step() {
    if (currentStep < totalSteps - 1) {
      currentStep++;
      flashGeneration++;
    }
  }

  export function stepBack() {
    if (currentStep > 0) {
      currentStep--;
      flashGeneration++;
    }
  }

  export function goToStep(n: number) {
    const clamped = Math.max(0, Math.min(n, totalSteps - 1));
    if (clamped !== currentStep) {
      currentStep = clamped;
      flashGeneration++;
    }
  }

  export function reset() {
    currentStep = 0;
    flashGeneration++;
  }

  function handleKeyboard(e: KeyboardEvent) {
    switch (e.key) {
      case 'ArrowRight': case 'n': e.preventDefault(); step(); break;
      case 'ArrowLeft': case 'p': e.preventDefault(); stepBack(); break;
      case 'Home': e.preventDefault(); reset(); break;
      case 'End': e.preventDefault(); goToStep(totalSteps - 1); break;
    }
  }
</script>

<div
  class="execution-tracer"
  role="application"
  aria-roledescription="code execution visualizer"
  aria-label={title ?? 'Execution trace'}
  tabindex="0"
  onkeydown={handleKeyboard}
  style="
    --tracer-font-size: {params.fontSize}rem;
    --tracer-label-size: {params.labelSize}rem;
    --tracer-cell-padding: {params.cellPadding}rem;
    --tracer-gap: {params.gap}rem;
    --tracer-radius: {params.borderRadius}px;
    --tracer-code-font-size: {params.codeFontSize}rem;
    --tracer-code-line-height: {params.codeLineHeight};
  "
>
  <!-- Code Panel -->
  <div class="code-panel">
    {#if title}
      <div class="code-title">{title}</div>
    {/if}
    <pre class="code-lines" role="region" aria-label="Assembly code">
      {#each tokenized as lineTokens, i}
        {@const isCurrent = currentLine === i}
        {@const isExecuted = executedLines.has(i)}
        <div
          class="code-line"
          class:current={isCurrent}
          class:executed={isExecuted && !isCurrent}
        >
          {#if addresses?.[i]}
            <span class="line-addr">{addresses[i]}</span>
          {/if}
          <span class="line-num">{i + 1}</span>
          <span class="line-code">{#each lineTokens as token}<span class={token.type}>{token.text}</span>{/each}</span>
        </div>
      {/each}
    </pre>
  </div>

  <!-- Register Panel -->
  <div class="register-panel">
    <div class="register-row">
      {#each registers as reg (reg)}
        {@const value = current.registers[reg] ?? '?'}
        {@const changed = changedSet.has(reg)}
        <div
          class="register-card"
          class:changed
          class:reading={readingSet.has(reg)}
          aria-label="{reg}: {value}"
          data-flash={changed ? flashGeneration : undefined}
        >
          <span class="reg-name">{reg}</span>
          {#if changed && readingSet.has(reg)}
            <span class="reg-role read-write-role" aria-hidden="true">read &rarr; write</span>
          {:else if readingSet.has(reg)}
            <span class="reg-role reading-role" aria-hidden="true">source</span>
          {:else if changed}
            <span class="reg-role writing-role" aria-hidden="true">dest</span>
          {/if}
          <span class="reg-value">{value}</span>
        </div>
      {/each}
    </div>

    <!-- Annotation -->
    {#if current.annotation}
      <p class="annotation">{current.annotation}</p>
    {/if}
  </div>

  <!-- Step controls (spans full width below both panels) -->
  <div class="step-controls">
    <button
      class="step-btn"
      onclick={() => stepBack()}
      disabled={isFirst}
      aria-label="Previous step"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M10 12L6 8L10 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>

    <span class="step-indicator" aria-live="polite" aria-atomic="true">
      Step {currentStep + 1} of {totalSteps}
    </span>

    <button
      class="step-btn"
      onclick={() => step()}
      disabled={isLast}
      aria-label="Next step"
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <path d="M6 4L10 8L6 12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
  </div>

  <!-- SR-only live region for detailed change announcements -->
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {changeAnnouncement}
  </div>

  <WidgetDebugPanel defs={paramDefs} bind:values={params} widgetId={instanceId} />
</div>

<style>
  .execution-tracer {
    position: relative;
    display: grid;
    grid-template-columns: 1fr;
    gap: 1rem;
    width: 100%;
  }

  .execution-tracer:focus-visible {
    outline: 2px solid var(--color-accent, #4d9fff);
    outline-offset: 4px;
    border-radius: var(--tracer-radius);
  }

  @media (min-width: 52rem) {
    .execution-tracer {
      grid-template-columns: 1.2fr 0.8fr;
    }

    .step-controls {
      grid-column: 1 / -1;
    }

    .register-panel {
      position: sticky;
      top: 1.5rem;
      max-height: calc(100vh - 3rem);
      overflow-y: auto;
    }
  }

  .sr-only {
    position: absolute;
    width: 1px;
    height: 1px;
    padding: 0;
    margin: -1px;
    overflow: hidden;
    clip: rect(0, 0, 0, 0);
    white-space: nowrap;
    border: 0;
  }

  /* ===== CODE PANEL ===== */

  .code-panel {
    background: var(--color-bg-surface, #1a1a2e);
    border: 1px solid var(--color-border, #333);
    border-radius: var(--tracer-radius);
    overflow: hidden;
  }

  .code-title {
    padding: 0.5rem 0.75rem;
    font-family: var(--font-mono);
    font-size: var(--tracer-label-size);
    color: var(--color-text-muted, #888);
    border-bottom: 1px solid var(--color-border, #333);
    user-select: none;
  }

  .code-lines {
    margin: 0;
    padding: 0.5rem 0;
    overflow-x: auto;
    font-family: var(--font-mono);
    font-size: var(--tracer-code-font-size);
    line-height: var(--tracer-code-line-height);
  }

  .code-line {
    display: flex;
    align-items: baseline;
    padding: 0 0.75rem;
    border-left: 3px solid transparent;
    transition: opacity var(--transition-fast, 150ms);
  }

  .code-line.current {
    border-left-color: var(--color-accent, #4d9fff);
    background: color-mix(in srgb, var(--color-accent, #4d9fff) 10%, transparent);
  }

  .code-line.executed {
    opacity: 0.45;
  }

  .line-addr {
    display: inline-block;
    min-width: 6.5rem;
    color: var(--color-text-muted, #888);
    opacity: 0.6;
    user-select: none;
    font-size: 0.75em;
  }

  .line-num {
    display: inline-block;
    min-width: 2rem;
    text-align: right;
    padding-right: 0.75rem;
    color: var(--color-text-muted, #888);
    opacity: 0.4;
    user-select: none;
  }

  .line-code {
    white-space: pre;
  }

  /* Syntax highlighting — matches MipsEditor token classes */
  .line-code :global(.kw)  { color: #7c9cff; }
  .line-code :global(.reg) { color: #e0a4ff; }
  .line-code :global(.num) { color: #f5a623; }
  .line-code :global(.dir) { color: #6ac4a0; }
  .line-code :global(.lbl) { color: #e0e0e0; font-weight: 600; }
  .line-code :global(.cmt) { color: #666; font-style: italic; }
  .line-code :global(.text){ color: #ccc; }

  /* ===== REGISTER PANEL ===== */

  .register-panel {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
  }

  .register-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--tracer-gap);
    width: 100%;
  }

  .register-card {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: var(--tracer-cell-padding);
    background: var(--color-bg-surface, #1a1a2e);
    border: 1px solid var(--color-border, #333);
    border-radius: var(--tracer-radius);
    min-width: 4.5rem;
    transition: border-color var(--transition-fast, 150ms);
  }

  /* Compositor-friendly flash via pseudo-element opacity */
  .register-card.changed::after {
    content: '';
    position: absolute;
    inset: 0;
    border-radius: inherit;
    background: var(--color-accent, #4d9fff);
    pointer-events: none;
    opacity: 0;
    animation: flash 200ms ease-out forwards;
  }

  .register-card.changed {
    border-color: var(--color-accent, #4d9fff);
  }

  @keyframes flash {
    0% { opacity: 0.25; }
    100% { opacity: 0; }
  }

  .register-card.reading {
    border-color: var(--color-highlight, #f5a623);
    background: color-mix(in srgb, var(--color-highlight, #f5a623) 8%, var(--color-bg-surface, #1a1a2e));
  }

  .register-card.changed.reading {
    border-color: var(--color-accent, #4d9fff);
    background: color-mix(in srgb, var(--color-accent, #4d9fff) 12%, var(--color-bg-surface, #1a1a2e));
  }

  .register-card.changed.reading::after {
    animation: flash-readwrite 300ms ease-out forwards;
  }

  @keyframes flash-readwrite {
    0% { opacity: 0.3; background: var(--color-highlight, #f5a623); }
    50% { opacity: 0.2; background: var(--color-accent, #4d9fff); }
    100% { opacity: 0; }
  }

  .reg-name {
    font-family: var(--font-mono);
    font-size: var(--tracer-label-size);
    color: var(--color-text-muted, #888);
    user-select: none;
  }

  .reg-value {
    font-family: var(--font-mono);
    font-size: var(--tracer-font-size);
    font-weight: 500;
    color: var(--color-text, #e0e0e0);
    white-space: nowrap;
  }

  .reg-role {
    font-family: var(--font-mono);
    font-size: calc(var(--tracer-label-size) * 0.75);
    letter-spacing: 0.02em;
    user-select: none;
  }

  .reading-role { color: var(--color-highlight, #f5a623); }
  .writing-role { color: var(--color-accent, #4d9fff); }
  .read-write-role { color: var(--color-accent, #4d9fff); }

  @media (prefers-reduced-motion: reduce) {
    .register-card.changed::after,
    .register-card.changed.reading::after {
      animation: none;
    }
    .code-line { transition: none; }
  }

  .annotation {
    font-size: var(--tracer-label-size);
    color: var(--color-text-muted, #888);
    text-align: center;
    font-style: italic;
    margin: 0;
    padding: 0 0.5rem;
  }

  /* ===== STEP CONTROLS ===== */

  .step-controls {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 0.75rem;
  }

  .step-indicator {
    font-family: var(--font-mono);
    font-size: var(--tracer-label-size);
    color: var(--color-text-muted, #888);
    user-select: none;
  }

  .step-btn {
    display: grid;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    padding: 0.5rem;
    background: var(--color-bg-surface, #1a1a2e);
    color: var(--color-text, #e0e0e0);
    border: 1px solid var(--color-border, #333);
    border-radius: var(--tracer-radius);
    cursor: pointer;
    transition: border-color var(--transition-fast, 150ms);
  }

  .step-btn:hover:not(:disabled) {
    border-color: var(--color-accent, #4d9fff);
  }

  .step-btn:focus-visible {
    outline: 2px solid var(--color-accent, #4d9fff);
    outline-offset: 2px;
  }

  .step-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
