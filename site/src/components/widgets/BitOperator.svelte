<script lang="ts">
  import type { Param } from '../../lib/params';
  import type { BinaryBitOp } from '../../lib/types';
  import { loadParams, saveParams } from '../../lib/params';
  import { createReducedMotion } from '../../lib/motion.svelte';
  import WidgetDebugPanel from '../debug/WidgetDebugPanel.svelte';

  const paramDefs: Param[] = [
    { name: 'bitSize',      value: 2.5, unit: 'rem', category: 'style',    min: 1.5, max: 3.5,  step: 0.25,  description: 'Individual bit cell size (min 44px for touch)' },
    { name: 'fontSize',     value: 1,   unit: 'rem', category: 'style',    min: 0.7, max: 1.5,  step: 0.05,  description: 'Bit value font size' },
    { name: 'gap',          value: 0.5, unit: 'rem', category: 'style',    min: 0,   max: 1.5,  step: 0.125, description: 'Gap between rows' },
    { name: 'animSpeed',    value: 400, unit: 'ms',  category: 'behavior', min: 100, max: 1000, step: 50,    description: 'Per-bit animation delay' },
    { name: 'borderRadius', value: 4,   unit: 'px',  category: 'style',    min: 0,   max: 12,   step: 1,     description: 'Bit cell rounding' },
  ];

  let { instanceId, valueA, valueB, operation, bitWidth = 4 }: {
    instanceId: string;
    valueA: number;
    valueB: number;
    operation: BinaryBitOp;
    bitWidth?: number;
  } = $props();

  let params = $state(loadParams(instanceId, paramDefs));

  const reducedMotion = createReducedMotion();

  // Track which result bits have been revealed (-1 = none, 0..bitWidth-1)
  let revealedCount = $state(0);
  let showingResult = $state(false);
  let animCancel = $state<{ canceled: boolean } | null>(null);
  let announcement = $state('');

  // Derived bit arrays (MSB first)
  let bitsA = $derived(toBits(valueA, bitWidth));
  let bitsB = $derived(toBits(valueB, bitWidth));
  let bitsResult = $derived(
    bitsA.map((a, i) => computeBit(a, bitsB[i], operation))
  );

  // Derived decimal values
  let decA = $derived(valueA & ((1 << bitWidth) - 1));
  let decB = $derived(valueB & ((1 << bitWidth) - 1));
  let decResult = $derived(bitsResult.reduce((acc, b) => (acc << 1) | b, 0));

  // Persist params on change
  $effect(() => {
    saveParams(instanceId, params, paramDefs);
  });

  // Cleanup on unmount
  $effect(() => {
    return () => { if (animCancel) animCancel.canceled = true; };
  });

  function toBits(value: number, width: number): number[] {
    const bits: number[] = [];
    for (let i = width - 1; i >= 0; i--) {
      bits.push((value >> i) & 1);
    }
    return bits;
  }

  function computeBit(a: number, b: number, op: BinaryBitOp): number {
    switch (op) {
      case 'AND':  return a & b;
      case 'OR':   return a | b;
      case 'XOR':  return a ^ b;
      case 'NOR':  return (a | b) ^ 1;
      case 'NAND': return (a & b) ^ 1;
    }
  }

  export function animate() {
    if (reducedMotion.current) {
      showResult();
      return;
    }

    // Cancel any existing animation
    if (animCancel) animCancel.canceled = true;
    const token = { canceled: false };
    animCancel = token;

    revealedCount = 0;
    showingResult = true;
    announcement = `Animating ${operation} operation`;

    function revealNext(index: number) {
      if (token.canceled) return;
      if (index >= bitWidth) {
        announcement = `Result: ${decResult} (${bitsResult.join('')})`;
        return;
      }
      revealedCount = index + 1;
      setTimeout(() => revealNext(index + 1), params.animSpeed);
    }

    setTimeout(() => revealNext(0), params.animSpeed);
  }

  export function showResult() {
    if (animCancel) animCancel.canceled = true;
    animCancel = null;
    showingResult = true;
    revealedCount = bitWidth;
    announcement = `Result: ${decResult} (${bitsResult.join('')})`;
  }

  export function reset() {
    if (animCancel) animCancel.canceled = true;
    animCancel = null;
    showingResult = false;
    revealedCount = 0;
    announcement = 'Result cleared';
  }

  export function setValues(a: number, b: number) {
    valueA = a;
    valueB = b;
    reset();
  }
</script>

<div
  class="bit-operator"
  style="
    --bitop-bit-size: {params.bitSize}rem;
    --bitop-font-size: {params.fontSize}rem;
    --bitop-gap: {params.gap}rem;
    --bitop-radius: {params.borderRadius}px;
  "
>
  <!-- Row A -->
  <div class="bit-row">
    <span class="row-label">A</span>
    <div class="bits">
      {#each bitsA as bit}
        <div class="bit-cell" class:one={bit === 1}>{bit}</div>
      {/each}
    </div>
    <span class="dec-label">{decA}</span>
  </div>

  <!-- Operation label -->
  <div class="op-label">{operation}</div>

  <!-- Row B -->
  <div class="bit-row">
    <span class="row-label">B</span>
    <div class="bits">
      {#each bitsB as bit}
        <div class="bit-cell" class:one={bit === 1}>{bit}</div>
      {/each}
    </div>
    <span class="dec-label">{decB}</span>
  </div>

  <!-- Separator -->
  <hr class="separator" />

  <!-- Result row -->
  <div class="bit-row">
    <span class="row-label">=</span>
    <div class="bits">
      {#each bitsResult as bit, i}
        <div
          class="bit-cell result-bit"
          class:one={bit === 1}
          class:revealed={showingResult && i < revealedCount}
        >
          {#if showingResult && i < revealedCount}
            {bit}
          {/if}
        </div>
      {/each}
    </div>
    <span class="dec-label">
      {#if showingResult && revealedCount === bitWidth}
        {decResult}
      {/if}
    </span>
  </div>

  <!-- Screen reader announcements -->
  <div class="sr-only" aria-live="polite">{announcement}</div>

  <WidgetDebugPanel defs={paramDefs} bind:values={params} widgetId={instanceId} />
</div>

<style>
  .bit-operator {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--bitop-gap);
    padding: 1rem;
  }

  .bit-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .row-label {
    font-family: var(--font-mono);
    font-size: var(--bitop-font-size);
    font-weight: 600;
    color: var(--color-text-muted);
    width: 1.5em;
    text-align: right;
  }

  .bits {
    display: flex;
    gap: 0.25rem;
  }

  .bit-cell {
    width: var(--bitop-bit-size);
    height: var(--bitop-bit-size);
    display: grid;
    place-items: center;
    font-family: var(--font-mono);
    font-size: var(--bitop-font-size);
    font-weight: 600;
    border: 1px solid var(--color-border);
    border-radius: var(--bitop-radius);
    background: var(--color-bg-surface);
    color: var(--color-text-muted);
    transition: color var(--transition-fast), border-color var(--transition-fast);
  }

  .bit-cell.one {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .result-bit {
    opacity: 0;
    transform: scale(0.7);
    transition:
      opacity 200ms ease-out,
      transform 200ms ease-out,
      color var(--transition-fast),
      border-color var(--transition-fast);
  }

  .result-bit.revealed {
    opacity: 1;
    transform: scale(1);
  }

  .op-label {
    font-family: var(--font-mono);
    font-size: var(--bitop-font-size);
    font-weight: 700;
    color: var(--color-accent);
    letter-spacing: 0.05em;
  }

  .dec-label {
    font-family: var(--font-mono);
    font-size: calc(var(--bitop-font-size) * 0.85);
    color: var(--color-text-muted);
    min-width: 2em;
  }

  .separator {
    width: 100%;
    max-width: calc(var(--bitop-bit-size) * 4 + 0.25rem * 3 + 4rem);
    border: none;
    border-top: 2px solid var(--color-border);
    margin: 0;
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

  @media (prefers-reduced-motion: reduce) {
    .result-bit {
      transition: none;
    }
  }
</style>
