/**
 * Student interaction state persistence — separate from widget tuning params.
 *
 * Params (params.ts) are developer-facing tuning knobs cleared by WidgetDebugPanel "Reset all".
 * State (this file) is student-facing progress (reveals, steps) that persists across sessions.
 */

const STATE_PREFIX = 'widget-state-';

export function loadState<T>(instanceId: string, defaults: T): T {
  if (typeof localStorage === 'undefined') return defaults;
  try {
    const saved = JSON.parse(localStorage.getItem(STATE_PREFIX + instanceId) ?? 'null');
    return saved ? { ...defaults, ...saved } : defaults;
  } catch {
    return defaults;
  }
}

export function saveState<T extends Record<string, unknown>>(instanceId: string, state: T): void {
  if (typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STATE_PREFIX + instanceId, JSON.stringify(state));
  } catch {
    /* quota exceeded — silently fail */
  }
}

export function clearState(instanceId: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.removeItem(STATE_PREFIX + instanceId);
}
