<script lang="ts">
  import type { Param } from '../../lib/params';
  import type { Column } from '../../lib/types';
  import { loadParams, saveParams } from '../../lib/params';
  import { loadState, saveState, clearState } from '../../lib/state';
  import WidgetDebugPanel from '../debug/WidgetDebugPanel.svelte';

  const WIDGET_ID = 'truth-table';

  const paramDefs: Param[] = [
    { name: 'cellSize',     value: 2.5,  unit: 'rem', category: 'style', min: 1.5, max: 4,   step: 0.25, description: 'Cell width/height' },
    { name: 'fontSize',     value: 0.9,  unit: 'rem', category: 'style', min: 0.7, max: 1.4, step: 0.05, description: 'Table font size' },
    { name: 'headerSize',   value: 0.75, unit: 'rem', category: 'style', min: 0.6, max: 1.2, step: 0.05, description: 'Header font size' },
    { name: 'borderRadius', value: 6,    unit: 'px',  category: 'style', min: 0,   max: 12,  step: 1,    description: 'Table corner rounding' },
    { name: 'gap',          value: 0,    unit: 'px',  category: 'style', min: 0,   max: 4,   step: 1,    description: 'Cell gap (border-spacing)' },
  ];

  let params = $state(loadParams(WIDGET_ID, paramDefs));

  let {
    instanceId,
    columns,
    revealColumns = [],
  }: {
    instanceId: string;
    columns: Column[];
    revealColumns?: number[];
  } = $props();

  // Runtime validation
  if (columns.length > 0) {
    const expected = columns[0].values.length;
    const bad = columns.find(c => c.values.length !== expected);
    if (bad) throw new Error(`Column "${bad.header}" has ${bad.values.length} rows, expected ${expected}`);
  }

  const rowCount = columns.length > 0 ? columns[0].values.length : 0;

  // Persistent state: which hidden columns have been revealed
  interface TruthTableState {
    revealedColumns: number[];
  }

  const defaultState: TruthTableState = { revealedColumns: [] };
  let persisted = $state(loadState<TruthTableState>(instanceId, defaultState));

  // Set of hidden column indices (from revealColumns prop)
  let hiddenSet = $derived(new Set(
    (revealColumns ?? []).filter(i => !persisted.revealedColumns.includes(i))
  ));

  // Highlight state (not persisted — ephemeral)
  let highlightedRow = $state<number | null>(null);

  // Screen reader announcement
  let announcement = $state('');

  function announce(msg: string) {
    announcement = '';
    // Force a re-render so aria-live picks up the change
    requestAnimationFrame(() => { announcement = msg; });
  }

  // Save state whenever revealedColumns changes
  $effect(() => {
    saveState(instanceId, persisted);
  });

  // Exported API
  export function reveal() {
    persisted.revealedColumns = [...(revealColumns ?? [])];
    announce('All hidden columns revealed.');
  }

  export function revealColumn(n: number) {
    if (!persisted.revealedColumns.includes(n)) {
      persisted.revealedColumns = [...persisted.revealedColumns, n];
      const colName = columns[n]?.header ?? `column ${n}`;
      announce(`Column "${colName}" revealed.`);
    }
  }

  export function highlightRow(n: number) {
    highlightedRow = n;
    announce(`Row ${n + 1} highlighted.`);
  }

  export function reset() {
    persisted = { revealedColumns: [] };
    highlightedRow = null;
    clearState(instanceId);
    announce('Truth table reset.');
  }
</script>

<div
  class="truth-table-root"
  style="
    --tt-cell-size: {params.cellSize}rem;
    --tt-font-size: {params.fontSize}rem;
    --tt-header-size: {params.headerSize}rem;
    --tt-border-radius: {params.borderRadius}px;
    --tt-gap: {params.gap}px;
  "
>
  <div class="sr-only" aria-live="polite" aria-atomic="true">
    {announcement}
  </div>

  <table>
    <caption class="sr-only">
      Truth table with {columns.length} columns and {rowCount} rows.
      {#if hiddenSet.size > 0}
        {hiddenSet.size} column{hiddenSet.size > 1 ? 's' : ''} hidden — reveal to see values.
      {/if}
    </caption>
    <thead>
      <tr>
        {#each columns as col, i}
          <th scope="col" class:result-col={revealColumns?.includes(i)}>
            {col.header}
          </th>
        {/each}
      </tr>
    </thead>
    <tbody>
      {#each { length: rowCount } as _, row}
        <tr
          class:highlighted={highlightedRow === row}
        >
          {#each columns as col, colIdx}
            <td
              class:hidden-cell={hiddenSet.has(colIdx)}
              class:revealed={revealColumns?.includes(colIdx) && !hiddenSet.has(colIdx)}
              class:zero={col.values[row] === 0 && !hiddenSet.has(colIdx)}
              class:one={col.values[row] === 1 && !hiddenSet.has(colIdx)}
            >
              {#if hiddenSet.has(colIdx)}
                <span class="placeholder" aria-label="Hidden value">?</span>
              {:else}
                <span class="cell-value">{col.values[row]}</span>
              {/if}
            </td>
          {/each}
        </tr>
      {/each}
    </tbody>
  </table>

  <WidgetDebugPanel defs={paramDefs} bind:values={params} widgetId={WIDGET_ID} />
</div>

<style>
  .truth-table-root {
    position: relative;
    display: inline-block;
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

  table {
    border-collapse: separate;
    border-spacing: var(--tt-gap);
    font-size: var(--tt-font-size);
    font-family: var(--font-mono);
    background: var(--color-bg-raised);
    border-radius: var(--tt-border-radius);
    overflow: hidden;
  }

  thead {
    background: var(--color-bg-surface);
  }

  th {
    font-family: var(--font-body);
    font-size: var(--tt-header-size);
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.05em;
    color: var(--color-text-muted);
    padding: 0;
    min-width: var(--tt-cell-size);
    min-height: var(--tt-cell-size);
    height: var(--tt-cell-size);
    text-align: center;
    vertical-align: middle;
    border-bottom: 1px solid var(--color-border);
    /* Ensure 44x44 touch target */
    min-width: max(var(--tt-cell-size), 2.75rem);
    min-height: max(var(--tt-cell-size), 2.75rem);
  }

  th.result-col {
    color: var(--color-accent);
  }

  td {
    text-align: center;
    vertical-align: middle;
    padding: 0;
    min-width: max(var(--tt-cell-size), 2.75rem);
    height: max(var(--tt-cell-size), 2.75rem);
    border-bottom: 1px solid color-mix(in srgb, var(--color-border) 50%, transparent);
    transition:
      background-color var(--transition-fast),
      opacity var(--transition-fast);
  }

  tbody tr:last-child td {
    border-bottom: none;
  }

  /* Hidden cells */
  td.hidden-cell {
    background: color-mix(in srgb, var(--color-bg-surface) 60%, transparent);
  }

  .placeholder {
    color: var(--color-text-muted);
    opacity: 0.4;
    font-style: italic;
    user-select: none;
  }

  /* Revealed cells — animate in */
  .cell-value {
    display: inline-block;
    transition: opacity var(--transition-fast);
  }

  td.revealed .cell-value {
    animation: reveal-fade 0.3s ease-out;
  }

  @keyframes reveal-fade {
    from {
      opacity: 0;
      transform: translateY(2px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  /* Binary value coloring */
  td.zero {
    color: var(--color-text-muted);
  }

  td.one {
    color: var(--color-accent);
    font-weight: 600;
  }

  /* Highlighted row */
  tr.highlighted td {
    background: color-mix(in srgb, var(--color-accent) 8%, transparent);
    border-left: 2px solid var(--color-accent);
  }

  tr.highlighted td:first-child {
    border-left: 3px solid var(--color-accent);
  }
</style>
