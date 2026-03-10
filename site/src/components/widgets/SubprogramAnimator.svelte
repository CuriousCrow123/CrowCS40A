<script lang="ts">
  import type { Param } from '../../lib/params';
  import type { SubprogramOp, RegisterBinding } from '../../lib/types';
  import { loadParams, saveParams } from '../../lib/params';
  import { createReducedMotion } from '../../lib/motion.svelte';
  import WidgetDebugPanel from '../debug/WidgetDebugPanel.svelte';

  const paramDefs: Param[] = [
    { name: 'cardSize',  value: 5,   unit: 'rem', category: 'style',    min: 3,   max: 8,    step: 0.5,  description: 'Register card width' },
    { name: 'fontSize',  value: 0.9, unit: 'rem', category: 'style',    min: 0.7, max: 1.3,  step: 0.05, description: 'Register value font size' },
    { name: 'gap',       value: 1,   unit: 'rem', category: 'style',    min: 0.5, max: 2,    step: 0.25, description: 'Gap between groups' },
    { name: 'animSpeed', value: 500, unit: 'ms',  category: 'behavior', min: 200, max: 1200, step: 50,   description: 'Delay between animation phases' },
  ];

  let {
    instanceId,
    inputs,
    outputs,
    operation,
  }: {
    instanceId: string;
    inputs: RegisterBinding[];
    outputs: RegisterBinding[];
    operation: SubprogramOp;
  } = $props();

  let params = $state(loadParams(instanceId, paramDefs));

  const reducedMotion = createReducedMotion();

  // Animation state — cancel token is plain let (not $state) to avoid Svelte proxy overhead
  let animCancel: { canceled: boolean } | null = null;
  let phase = $state<'idle' | 'highlighting' | 'revealing'>('idle');
  let animGeneration = $state(0);
  let announcement = $state('');

  // Persist params on change
  $effect(() => {
    saveParams(instanceId, params, paramDefs);
  });

  // Cleanup animation on unmount
  $effect(() => {
    return () => { if (animCancel) animCancel.canceled = true; };
  });

  export function animate() {
    if (reducedMotion.current) {
      showResult();
      return;
    }

    if (animCancel) animCancel.canceled = true;
    const token = { canceled: false };
    animCancel = token;

    // Reset to idle first, then highlight in the next frame.
    // This ensures CSS transitions restart even on rapid re-animation.
    animGeneration++;
    phase = 'idle';

    requestAnimationFrame(() => {
      if (token.canceled) return;
      phase = 'highlighting';
      announcement = `Animating ${operation}: ${inputs.map(i => i.register + ' = ' + i.value).join(', ')}`;

      setTimeout(() => {
        if (token.canceled) return;
        phase = 'revealing';
        animCancel = null;
        announcement = `Result: ${outputs.map(o => o.register + ' = ' + o.value).join(', ')}`;
      }, params.animSpeed);
    });
  }

  export function showResult() {
    if (animCancel) animCancel.canceled = true;
    animCancel = null;
    animGeneration++;
    phase = 'revealing';
    announcement = `Result: ${outputs.map(o => o.register + ' = ' + o.value).join(', ')}`;
  }

  export function reset() {
    if (animCancel) animCancel.canceled = true;
    animCancel = null;
    animGeneration++;
    phase = 'idle';
    announcement = 'Animation reset';
  }
</script>

<div
  class="subprogram-animator"
  style="
    --subprog-card-size: {params.cardSize}rem;
    --subprog-font-size: {params.fontSize}rem;
    --subprog-gap: {params.gap}rem;
  "
>
  <!-- Input registers -->
  <div class="register-group">
    {#each inputs as input}
      <div
        class="register-card"
        class:highlight={phase === 'highlighting' || phase === 'revealing'}
      >
        <span class="register-name">{input.register}</span>
        <span class="register-value">{input.value}</span>
      </div>
    {/each}
  </div>

  <!-- Arrow: inputs → operation -->
  <span class="arrow" class:active={phase === 'highlighting' || phase === 'revealing'} aria-hidden="true">▶</span>

  <!-- Operation box -->
  <div
    class="op-box"
    class:active={phase === 'revealing'}
  >
    {operation}
  </div>

  <!-- Arrow: operation → outputs -->
  <span class="arrow" class:active={phase === 'revealing'} aria-hidden="true">▶</span>

  <!-- Output registers -->
  <div class="register-group">
    {#each outputs as output (animGeneration + '-' + output.register)}
      <div
        class="register-card output-card"
        class:revealed={phase === 'revealing'}
      >
        <span class="register-name">{output.register}</span>
        <span class="register-value">
          {#if phase === 'revealing'}
            {output.value}
          {:else}
            ?
          {/if}
        </span>
      </div>
    {/each}
  </div>

  <!-- Screen reader announcements -->
  <div class="sr-only" aria-live="polite">{announcement}</div>

  <WidgetDebugPanel defs={paramDefs} bind:values={params} widgetId={instanceId} />
</div>

<style>
  .subprogram-animator {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--subprog-gap);
    padding: 1rem;
  }

  .register-group {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .register-card {
    width: var(--subprog-card-size);
    padding: 0.5rem;
    border: 2px solid var(--color-border);
    border-radius: 6px;
    background: var(--color-bg-surface);
    text-align: center;
    transition:
      border-color 200ms ease-out,
      box-shadow 200ms ease-out;
  }

  .register-card.highlight {
    border-color: var(--color-accent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--color-accent) 30%, transparent);
  }

  .output-card {
    opacity: 0.4;
    transform: scale(0.95);
    transition:
      opacity 300ms ease-out,
      transform 300ms ease-out,
      border-color 200ms ease-out,
      box-shadow 200ms ease-out;
  }

  .output-card.revealed {
    opacity: 1;
    transform: scale(1);
    border-color: var(--color-accent);
    box-shadow: 0 0 8px color-mix(in srgb, var(--color-accent) 30%, transparent);
  }

  .register-name {
    display: block;
    font-family: var(--font-mono);
    font-size: calc(var(--subprog-font-size) * 0.85);
    font-weight: 600;
    color: var(--color-text-muted);
    margin-bottom: 0.25rem;
  }

  .register-value {
    display: block;
    font-family: var(--font-mono);
    font-size: var(--subprog-font-size);
    font-weight: 700;
    color: var(--color-text);
    word-break: break-all;
  }

  .arrow {
    font-size: 1rem;
    color: var(--color-border);
    transition: color 200ms ease-out;
    flex-shrink: 0;
  }

  .arrow.active {
    color: var(--color-accent);
  }

  .op-box {
    padding: 0.75rem 1.25rem;
    border: 2px solid var(--color-border);
    border-radius: 8px;
    background: var(--color-bg-raised);
    font-family: var(--font-mono);
    font-size: var(--subprog-font-size);
    font-weight: 700;
    color: var(--color-text-muted);
    text-align: center;
    white-space: nowrap;
    transition:
      border-color 200ms ease-out,
      color 200ms ease-out,
      transform 200ms ease-out,
      box-shadow 200ms ease-out;
    flex-shrink: 0;
  }

  .op-box.active {
    border-color: var(--color-accent);
    color: var(--color-accent);
    transform: scale(1.03);
    box-shadow: 0 0 12px color-mix(in srgb, var(--color-accent) 25%, transparent);
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

  @media (max-width: 52rem) {
    .subprogram-animator {
      flex-direction: column;
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .register-card,
    .output-card,
    .op-box,
    .arrow {
      transition: none;
    }
  }
</style>
