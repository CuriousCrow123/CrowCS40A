<script lang="ts">
  import type { Param } from '../../lib/params';
  import { loadParams, saveParams } from '../../lib/params';
  import { clearState } from '../../lib/state';
  import type { Line } from '../../lib/types';
  import type { MipsToken } from '../../lib/mips-tokenizer';
  import { tokenizeMipsLine } from '../../lib/mips-tokenizer';
  import WidgetDebugPanel from '../debug/WidgetDebugPanel.svelte';

  const WIDGET_ID = 'mips-editor';

  const paramDefs: Param[] = [
    { name: 'fontSize',     value: 0.875, unit: 'rem', category: 'style', min: 0.625, max: 1.5,  step: 0.0625, description: 'Code font size' },
    { name: 'lineHeight',   value: 1.6,   unit: '',    category: 'style', min: 1.2,   max: 2.4,  step: 0.1,    description: 'Line height multiplier' },
    { name: 'padding',      value: 1.25,  unit: 'rem', category: 'style', min: 0.5,   max: 3,    step: 0.25,   description: 'Container padding' },
    { name: 'borderRadius', value: 8,     unit: 'px',  category: 'style', min: 0,     max: 16,   step: 1,      description: 'Corner rounding' },
    { name: 'gutterWidth',  value: 2.5,   unit: 'rem', category: 'style', min: 1.5,   max: 4,    step: 0.25,   description: 'Line number gutter width' },
  ];

  let params = $state(loadParams(WIDGET_ID, paramDefs));

  let { instanceId, lines, title }: {
    instanceId: string;
    lines: Line[];
    title?: string;
  } = $props();

  // --- Tokenize once on mount, not reactively ---
  const tokenized: (MipsToken[] | null)[] = lines.map((line) =>
    line.kind === 'blank' ? null : tokenizeMipsLine(line.code)
  );

  // --- Student state (persisted separately from tuning params) ---
  const STORAGE_KEY = `widget-state-${instanceId}-revealed`;

  function loadRevealed(): Set<number> {
    if (typeof localStorage === 'undefined') return new Set();
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]');
      return new Set(saved as number[]);
    } catch {
      return new Set();
    }
  }

  let revealedLines = $state(loadRevealed());
  let highlightedLine = $state<number | null>(null);
  let announceText = $state('');

  $effect(() => {
    if (typeof localStorage === 'undefined') return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...revealedLines]));
    } catch { /* quota exceeded */ }
  });

  // --- Exported imperative API ---
  export function revealLine(n: number) {
    if (n < 0 || n >= lines.length) return;
    const line = lines[n];
    if (line.kind !== 'hidden') return;
    revealedLines = new Set([...revealedLines, n]);
    announceText = `Revealed line ${n + 1}: ${line.code}`;
  }

  export function revealAll() {
    const next = new Set(revealedLines);
    lines.forEach((line, i) => {
      if (line.kind === 'hidden') next.add(i);
    });
    revealedLines = next;
    announceText = 'All hidden lines revealed.';
  }

  export function highlightLine(n: number) {
    if (n < 0 || n >= lines.length) return;
    highlightedLine = n;
    setTimeout(() => {
      if (highlightedLine === n) highlightedLine = null;
    }, 1200);
  }

  export function reset() {
    revealedLines = new Set();
    highlightedLine = null;
    announceText = '';
    if (typeof localStorage !== 'undefined') {
      localStorage.removeItem(STORAGE_KEY);
    }
  }
</script>

<figure
  role="figure"
  aria-labelledby={title ? `${instanceId}-label` : undefined}
  class="mips-editor"
  style="
    --mips-editor-font-size: {params.fontSize}rem;
    --mips-editor-line-height: {params.lineHeight};
    --mips-editor-padding: {params.padding}rem;
    --mips-editor-border-radius: {params.borderRadius}px;
    --mips-editor-gutter-width: {params.gutterWidth}rem;
  "
>
  {#if title}
    <figcaption id="{instanceId}-label" class="title-bar">{title}</figcaption>
  {/if}

  <pre class="code-block"><code>{#each lines as line, i}{@const isHidden = line.kind === 'hidden' && !revealedLines.has(i)}{@const isRevealed = line.kind === 'hidden' && revealedLines.has(i)}<span
          class="code-line"
          class:highlighted={highlightedLine === i}
          class:revealed={isRevealed}
          class:emphasized={line.kind === 'visible' && line.emphasized}
          hidden={isHidden ? true : undefined}
        ><span class="gutter">{i + 1}</span><span class="line-content">{#if line.kind === 'blank'}<span class="blank-hint">{line.hint ?? '???'}</span>{:else if tokenized[i]}{#each tokenized[i] as tok}<span class={tok.type}>{tok.text}</span>{/each}{/if}</span></span>{#if isHidden}<span
          class="code-line placeholder"
          aria-hidden="true"
        ><span class="gutter">{i + 1}</span><span class="line-content blurred">{'x'.repeat(
            line.kind === 'hidden' ? line.code.length : 8
          )}</span></span>{/if}{/each}</code></pre>

  <div class="sr-only" aria-live="polite">{announceText}</div>

  <WidgetDebugPanel defs={paramDefs} bind:values={params} widgetId={WIDGET_ID} />
</figure>

<style>
  .mips-editor {
    position: relative;
    margin: 0;
    border-radius: var(--mips-editor-border-radius);
    overflow: hidden;
  }

  .title-bar {
    background: color-mix(in srgb, var(--color-bg-raised), #000 15%);
    padding: 0.5rem var(--mips-editor-padding);
    font-family: var(--font-mono);
    font-size: calc(var(--mips-editor-font-size) * 0.85);
    color: var(--color-text-muted);
    border-bottom: 1px solid var(--color-border);
  }

  .code-block {
    margin: 0;
    padding: var(--mips-editor-padding);
    background: var(--color-bg-raised);
    font-family: var(--font-mono);
    font-size: var(--mips-editor-font-size);
    line-height: var(--mips-editor-line-height);
    overflow-x: auto;
    tab-size: 4;
  }

  .code-block code {
    display: block;
  }

  .code-line {
    display: flex;
    align-items: baseline;
    min-height: calc(var(--mips-editor-font-size) * var(--mips-editor-line-height));
    transition: background-color 0.3s ease, opacity 0.4s ease;
  }

  .code-line[hidden] {
    display: none;
  }

  .code-line.placeholder {
    display: flex;
  }

  .code-line.highlighted {
    background: color-mix(in srgb, var(--color-accent), transparent 85%);
  }

  .code-line.revealed {
    animation: fade-in 0.4s ease;
  }

  .code-line.emphasized {
    background: color-mix(in srgb, var(--color-accent), transparent 92%);
  }

  @keyframes fade-in {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .gutter {
    display: inline-block;
    width: var(--mips-editor-gutter-width);
    flex-shrink: 0;
    text-align: right;
    padding-right: 0.75em;
    color: var(--color-text-muted);
    opacity: 0.4;
    user-select: none;
  }

  .line-content {
    flex: 1;
    white-space: pre;
  }

  /* Syntax highlighting classes */
  .line-content :global(.kw) {
    color: var(--color-accent);
  }

  .line-content :global(.reg) {
    color: var(--color-highlight);
  }

  .line-content :global(.num) {
    color: var(--color-success);
  }

  .line-content :global(.dir) {
    color: var(--color-text-muted);
  }

  .line-content :global(.lbl) {
    color: var(--color-text);
    font-weight: 700;
  }

  .line-content :global(.cmt) {
    color: var(--color-text-muted);
    font-style: italic;
  }

  .line-content :global(.text) {
    color: var(--color-text);
  }

  /* Blank fill-in slots */
  .blank-hint {
    color: var(--color-accent);
    border-bottom: 1.5px dashed var(--color-accent);
    padding-bottom: 1px;
    font-style: italic;
  }

  /* Blurred placeholder for hidden lines */
  .blurred {
    filter: blur(4px);
    opacity: 0.3;
    user-select: none;
    color: var(--color-text-muted);
  }

  /* Screen reader only */
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
</style>
