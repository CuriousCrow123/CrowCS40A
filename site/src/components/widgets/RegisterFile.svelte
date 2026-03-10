<script lang="ts">
  import type { Param } from '../../lib/params';
  import { loadParams, saveParams } from '../../lib/params';
  import type { MipsRegister, Step } from '../../lib/types';
  import WidgetDebugPanel from '../debug/WidgetDebugPanel.svelte';

  const WIDGET_ID = 'register-file';

  const paramDefs: Param[] = [
    { name: 'fontSize',     value: 0.875, unit: 'rem', category: 'style', min: 0.7, max: 1.3, step: 0.05, description: 'Register value font size' },
    { name: 'labelSize',    value: 0.75,  unit: 'rem', category: 'style', min: 0.6, max: 1,   step: 0.05, description: 'Register name font size' },
    { name: 'cellPadding',  value: 0.75,  unit: 'rem', category: 'style', min: 0.25,max: 1.5, step: 0.125, description: 'Cell padding' },
    { name: 'gap',          value: 0.5,   unit: 'rem', category: 'style', min: 0,   max: 1.5, step: 0.125, description: 'Gap between register cells' },
    { name: 'borderRadius', value: 6,     unit: 'px',  category: 'style', min: 0,   max: 12,  step: 1,    description: 'Cell corner rounding' },
  ];

  let params = $state(loadParams(WIDGET_ID, paramDefs));

  let { instanceId, registers, steps }: {
    instanceId: string;
    registers: MipsRegister[];
    steps: Step[];
  } = $props();

  // Persist param tuning
  $effect(() => { saveParams(WIDGET_ID, params, paramDefs); });

  let currentStep = $state(0);

  // Track which registers just changed for the flash animation
  // We use a generation counter to force re-triggering the animation even
  // when the same register changes on consecutive steps.
  let flashGeneration = $state(0);

  let current = $derived(steps[currentStep]);
  let changedSet = $derived(new Set(current?.changed ?? []));
  let readingSet = $derived(new Set(current?.reading ?? []));
  let totalSteps = $derived(steps.length);
  let isFirst = $derived(currentStep === 0);
  let isLast = $derived(currentStep === totalSteps - 1);

  // Build a live-region announcement for changed registers
  let changeAnnouncement = $derived.by(() => {
    const parts: string[] = [];
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
</script>

<div
  class="register-file"
  role="region"
  aria-labelledby="{instanceId}-heading"
  style="
    --regfile-font-size: {params.fontSize}rem;
    --regfile-label-size: {params.labelSize}rem;
    --regfile-cell-padding: {params.cellPadding}rem;
    --regfile-gap: {params.gap}rem;
    --regfile-radius: {params.borderRadius}px;
  "
>
  <h3 id="{instanceId}-heading" class="sr-only">Register File</h3>

  <!-- Instruction bar -->
  <div class="instruction-bar">
    <code class="instruction-text">{current.instruction}</code>
  </div>

  <!-- Register cards -->
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

  <!-- Step controls -->
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

  <!-- SR-only live region for change announcements -->
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {changeAnnouncement}
  </div>

  <WidgetDebugPanel defs={paramDefs} bind:values={params} widgetId={instanceId} />
</div>

<style>
  .register-file {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.75rem;
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

  /* Instruction bar */
  .instruction-bar {
    width: 100%;
    padding: 0.5rem 0.75rem;
    background: var(--color-bg-surface, #1a1a2e);
    border: 1px solid var(--color-border, #333);
    border-radius: var(--regfile-radius);
    text-align: center;
  }

  .instruction-text {
    font-family: var(--font-mono);
    font-size: var(--regfile-font-size);
    color: var(--color-accent, #7c9cff);
  }

  /* Register row */
  .register-row {
    display: flex;
    flex-wrap: wrap;
    justify-content: center;
    gap: var(--regfile-gap);
  }

  .register-card {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    padding: var(--regfile-cell-padding);
    background: var(--color-bg-surface, #1a1a2e);
    border: 1px solid var(--color-border, #333);
    border-radius: var(--regfile-radius);
    min-width: 4.5rem;
    transition: border-color var(--transition-fast, 150ms);
  }

  .register-card.changed {
    border-color: var(--color-accent, #7c9cff);
    animation: flash 300ms ease-out;
  }

  @keyframes flash {
    0% {
      background: color-mix(in srgb, var(--color-accent, #7c9cff) 30%, var(--color-bg-surface, #1a1a2e));
    }
    100% {
      background: var(--color-bg-surface, #1a1a2e);
    }
  }

  /* Reading registers — source operands */
  .register-card.reading {
    border-color: var(--color-highlight, #f5a623);
    background: color-mix(in srgb, var(--color-highlight, #f5a623) 8%, var(--color-bg-surface, #1a1a2e));
  }

  /* Combined read + write — register is both source and destination */
  /* Double-class selector for natural specificity over .changed and .reading alone */
  .register-card.changed.reading {
    border-color: var(--color-accent, #7c9cff);
    background: color-mix(in srgb, var(--color-accent, #7c9cff) 15%, var(--color-bg-surface, #1a1a2e));
    animation: flash-readwrite 400ms ease-out;
  }

  @keyframes flash-readwrite {
    0% {
      background: color-mix(in srgb, var(--color-highlight, #f5a623) 30%, var(--color-bg-surface, #1a1a2e));
    }
    50% {
      background: color-mix(in srgb, var(--color-accent, #7c9cff) 30%, var(--color-bg-surface, #1a1a2e));
    }
    100% {
      background: color-mix(in srgb, var(--color-accent, #7c9cff) 15%, var(--color-bg-surface, #1a1a2e));
    }
  }

  .reg-name {
    font-family: var(--font-mono);
    font-size: var(--regfile-label-size);
    color: var(--color-text-muted, #888);
    user-select: none;
  }

  .reg-value {
    font-family: var(--font-mono);
    font-size: var(--regfile-font-size);
    font-weight: 500;
    color: var(--color-text, #e0e0e0);
    white-space: nowrap;
  }

  .reg-role {
    font-family: var(--font-mono);
    font-size: calc(var(--regfile-label-size) * 0.75);
    letter-spacing: 0.02em;
    user-select: none;
  }

  .reading-role {
    color: var(--color-highlight, #f5a623);
  }

  .writing-role {
    color: var(--color-accent, #7c9cff);
  }

  .read-write-role {
    color: var(--color-accent, #7c9cff);
  }

  @media (prefers-reduced-motion: reduce) {
    .register-card.changed,
    .register-card.changed.reading {
      animation: none;
    }
  }

  /* Annotation */
  .annotation {
    font-size: var(--regfile-label-size);
    color: var(--color-text-muted, #888);
    text-align: center;
    font-style: italic;
    margin: 0;
  }

  /* Step controls */
  .step-controls {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .step-indicator {
    font-family: var(--font-mono);
    font-size: var(--regfile-label-size);
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
    border-radius: var(--regfile-radius);
    cursor: pointer;
    transition: border-color var(--transition-fast, 150ms);
  }

  .step-btn:hover:not(:disabled) {
    border-color: var(--color-accent, #7c9cff);
  }

  .step-btn:focus-visible {
    outline: 2px solid var(--color-accent, #7c9cff);
    outline-offset: 2px;
  }

  .step-btn:disabled {
    opacity: 0.35;
    cursor: not-allowed;
  }
</style>
