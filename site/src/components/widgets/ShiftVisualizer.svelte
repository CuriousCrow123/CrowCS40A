<script lang="ts">
  import type { Param } from '../../lib/params';
  import { loadParams, saveParams } from '../../lib/params';
  import { createReducedMotion } from '../../lib/motion';
  import WidgetDebugPanel from '../debug/WidgetDebugPanel.svelte';

  const paramDefs: Param[] = [
    { name: 'bitSize',      value: 2.5,  unit: 'rem', category: 'style',    min: 1.5, max: 4,   step: 0.25,  description: 'Bit cell size' },
    { name: 'fontSize',     value: 1,    unit: 'rem', category: 'style',    min: 0.7, max: 1.5, step: 0.05,  description: 'Bit value font size' },
    { name: 'gap',          value: 0.75, unit: 'rem', category: 'style',    min: 0,   max: 2,   step: 0.125, description: 'Gap between before/after rows' },
    { name: 'animSpeed',    value: 300,  unit: 'ms',  category: 'behavior', min: 100, max: 800, step: 50,    description: 'Shift animation duration' },
    { name: 'borderRadius', value: 4,    unit: 'px',  category: 'style',    min: 0,   max: 12,  step: 1,     description: 'Bit cell rounding' },
  ];

  let { instanceId, value, shiftAmount, direction = 'left', bitWidth = 4 }: {
    instanceId: string;
    value: number;
    shiftAmount: number;
    direction?: 'left' | 'right';
    bitWidth?: number;
  } = $props();

  let params = $state(loadParams(instanceId, paramDefs));

  const reducedMotion = createReducedMotion();

  // Animation state
  let animCancel = $state<{ canceled: boolean } | null>(null);
  let showingResult = $state(false);
  let animPhase = $state<'idle' | 'shifting' | 'done'>('idle');
  let announcement = $state('');

  // Mask to bitWidth
  let mask = $derived((1 << bitWidth) - 1);

  // Original value bits (MSB first)
  let originalBits = $derived(toBits(value & mask, bitWidth));

  // Shifted result — use wider width to capture overflow, then take bitWidth
  let shiftedValue = $derived(
    direction === 'left'
      ? (value << shiftAmount) & mask
      : (value & mask) >>> shiftAmount
  );
  let resultBits = $derived(toBits(shiftedValue, bitWidth));

  // Decimal display values
  let decOriginal = $derived(value & mask);
  let decResult = $derived(shiftedValue);

  // Which bit positions are newly zero-filled
  let zeroFillPositions = $derived(getZeroFillPositions());

  // Which bit positions overflow (fall off the edge)
  let overflowBits = $derived(getOverflowBits());

  // Operator symbol
  let opSymbol = $derived(direction === 'left' ? '<<' : '>>');

  // Persist params on change
  $effect(() => {
    saveParams(instanceId, params, paramDefs);
  });

  // Cleanup on unmount
  $effect(() => {
    return () => { if (animCancel) animCancel.canceled = true; };
  });

  function toBits(val: number, width: number): number[] {
    const bits: number[] = [];
    for (let i = width - 1; i >= 0; i--) {
      bits.push((val >> i) & 1);
    }
    return bits;
  }

  function getZeroFillPositions(): Set<number> {
    const positions = new Set<number>();
    if (direction === 'left') {
      // Zero-fill on the right side (last shiftAmount positions)
      for (let i = 0; i < shiftAmount && i < bitWidth; i++) {
        positions.add(bitWidth - 1 - i);
      }
    } else {
      // Zero-fill on the left side (first shiftAmount positions)
      for (let i = 0; i < shiftAmount && i < bitWidth; i++) {
        positions.add(i);
      }
    }
    return positions;
  }

  function getOverflowBits(): { index: number; bit: number }[] {
    const bits: { index: number; bit: number }[] = [];
    if (direction === 'left') {
      // MSB side bits fall off (first shiftAmount bits of original)
      for (let i = 0; i < shiftAmount && i < bitWidth; i++) {
        bits.push({ index: i, bit: originalBits[i] });
      }
    } else {
      // LSB side bits fall off (last shiftAmount bits of original)
      for (let i = 0; i < shiftAmount && i < bitWidth; i++) {
        bits.push({ index: bitWidth - 1 - i, bit: originalBits[bitWidth - 1 - i] });
      }
    }
    return bits;
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

    showingResult = false;
    animPhase = 'shifting';
    announcement = `Animating ${opSymbol} ${shiftAmount}`;

    setTimeout(() => {
      if (token.canceled) return;
      animPhase = 'done';
      showingResult = true;
      announcement = `${decOriginal} ${opSymbol} ${shiftAmount} = ${decResult}`;
    }, params.animSpeed);
  }

  export function showResult() {
    if (animCancel) animCancel.canceled = true;
    animCancel = null;
    animPhase = 'done';
    showingResult = true;
    announcement = `${decOriginal} ${opSymbol} ${shiftAmount} = ${decResult}`;
  }

  export function reset() {
    if (animCancel) animCancel.canceled = true;
    animCancel = null;
    showingResult = false;
    animPhase = 'idle';
    announcement = 'Result cleared';
  }

  export function setValue(n: number) {
    value = n;
    reset();
  }
</script>

<div
  class="shift-visualizer"
  style="
    --shift-bit-size: {params.bitSize}rem;
    --shift-font-size: {params.fontSize}rem;
    --shift-gap: {params.gap}rem;
    --shift-radius: {params.borderRadius}px;
    --shift-anim-speed: {params.animSpeed}ms;
  "
>
  <!-- Before row -->
  <div class="bit-row">
    <span class="row-label">Before</span>
    <div class="bits">
      {#each originalBits as bit, i}
        <div
          class="bit-cell"
          class:one={bit === 1}
          class:overflow={animPhase !== 'idle' && overflowBits.some(o => o.index === i)}
          class:fading={animPhase === 'done' && overflowBits.some(o => o.index === i)}
        >
          {bit}
        </div>
      {/each}
    </div>
    <span class="dec-label">{decOriginal}</span>
  </div>

  <!-- Shift indicator -->
  <div class="shift-indicator">
    <span class="shift-arrow">
      {#if direction === 'left'}
        {#each { length: shiftAmount } as _}
          <span class="arrow-char">&larr;</span>
        {/each}
      {:else}
        {#each { length: shiftAmount } as _}
          <span class="arrow-char">&rarr;</span>
        {/each}
      {/if}
    </span>
    <span class="shift-label">{opSymbol} {shiftAmount}</span>
  </div>

  <!-- After row (result) -->
  {#if showingResult || animPhase === 'shifting'}
    <div class="bit-row result-row" class:visible={showingResult}>
      <span class="row-label">After</span>
      <div class="bits" class:sliding={animPhase === 'shifting'}>
        {#each resultBits as bit, i}
          <div
            class="bit-cell"
            class:one={bit === 1}
            class:zero-fill={zeroFillPositions.has(i)}
          >
            {bit}
          </div>
        {/each}
      </div>
      <span class="dec-label">{decResult}</span>
    </div>
  {/if}

  <!-- Summary expression -->
  {#if showingResult}
    <div class="expression">
      <span class="expr-text">
        {decOriginal}
        <span class="expr-bits">({originalBits.join('')})</span>
        {opSymbol} {shiftAmount} =
        {decResult}
        <span class="expr-bits">({resultBits.join('')})</span>
      </span>
    </div>
  {/if}

  <!-- Screen reader announcements -->
  <div class="sr-only" aria-live="polite">{announcement}</div>

  <WidgetDebugPanel defs={paramDefs} bind:values={params} widgetId={instanceId} />
</div>

<style>
  .shift-visualizer {
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--shift-gap);
    padding: 1rem;
  }

  .bit-row {
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .row-label {
    font-family: var(--font-mono);
    font-size: calc(var(--shift-font-size) * 0.85);
    font-weight: 600;
    color: var(--color-text-muted);
    width: 3.5em;
    text-align: right;
  }

  .bits {
    display: flex;
    gap: 0.25rem;
  }

  .bit-cell {
    width: var(--shift-bit-size);
    height: var(--shift-bit-size);
    display: grid;
    place-items: center;
    font-family: var(--font-mono);
    font-size: var(--shift-font-size);
    font-weight: 600;
    border: 1px solid var(--color-border);
    border-radius: var(--shift-radius);
    background: var(--color-bg-surface);
    color: var(--color-text-muted);
    transition:
      color var(--shift-anim-speed) ease-out,
      border-color var(--shift-anim-speed) ease-out,
      background-color var(--shift-anim-speed) ease-out,
      opacity var(--shift-anim-speed) ease-out;
  }

  .bit-cell.one {
    color: var(--color-accent);
    border-color: var(--color-accent);
  }

  .bit-cell.overflow {
    border-color: var(--color-text-muted);
  }

  .bit-cell.fading {
    opacity: 0.25;
  }

  .bit-cell.zero-fill {
    background: var(--color-highlight, rgba(255, 200, 50, 0.15));
    border-color: var(--color-accent);
  }

  .shift-indicator {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-family: var(--font-mono);
    color: var(--color-accent);
  }

  .shift-arrow {
    display: flex;
    gap: 0.125rem;
    font-size: calc(var(--shift-font-size) * 1.2);
  }

  .arrow-char {
    line-height: 1;
  }

  .shift-label {
    font-size: var(--shift-font-size);
    font-weight: 700;
  }

  .result-row {
    opacity: 0;
    transform: translateY(-0.5rem);
    transition:
      opacity var(--shift-anim-speed) ease-out,
      transform var(--shift-anim-speed) ease-out;
  }

  .result-row.visible {
    opacity: 1;
    transform: translateY(0);
  }

  .result-row .bits.sliding {
    transform: translateX(
      calc(
        (var(--shift-bit-size) + 0.25rem) *
        var(--shift-slide-dir, 0)
      )
    );
    transition: transform var(--shift-anim-speed) ease-out;
  }

  .expression {
    margin-top: 0.25rem;
    font-family: var(--font-mono);
    font-size: calc(var(--shift-font-size) * 0.85);
    color: var(--color-text);
  }

  .expr-bits {
    color: var(--color-text-muted);
  }

  .dec-label {
    font-family: var(--font-mono);
    font-size: calc(var(--shift-font-size) * 0.85);
    color: var(--color-text-muted);
    min-width: 2em;
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
    .bit-cell,
    .result-row {
      transition: none;
    }

    .result-row .bits.sliding {
      transition: none;
    }
  }
</style>
