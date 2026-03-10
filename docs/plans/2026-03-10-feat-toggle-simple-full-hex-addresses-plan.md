---
title: "feat: Toggle simple/full hex addresses in ExecutionTracer"
type: feat
status: completed
date: 2026-03-10
---

# Toggle Simple/Full Hex Addresses in ExecutionTracer

Students see full 10-character MIPS addresses (`0x00400000`) throughout the ExecutionTracer. For many tasks the high-order bytes are noise. Add a click-to-toggle that switches **all** addresses in a tracer instance between full and simple (`0x0000`) format.

## Enhancement Summary

**Deepened on:** 2026-03-10
**Agents used:** TypeScript reviewer, pattern recognition, performance oracle, security sentinel, code simplicity, frontend races, architecture strategist, Svelte 5 framework docs, a11y best practices

### Key Improvements from Research

1. **Use `<button>` elements instead of clickable `<span>`** — every interactive element in this codebase is a `<button>`; clickable spans would be a first and require manual a11y wiring
2. **Add `startsWith('0x')` guard** to `formatAddress` — prevents silent corruption of non-hex inputs
3. **Use typed `ReadonlySet<DisplayRegister>`** for address register constant — compile-time typo prevention, O(1) lookup
4. **Add negative lookahead to annotation regex** — prevents partial matches on longer hex strings
5. **Use `aria-pressed` on toggle button** instead of live region announcement — avoids collision with step-change announcements
6. **Apply formatting to `aria-label` and `changeAnnouncement`** — a11y parity between visual and auditory output

### Simplicity Notes

The simplicity reviewer recommended cutting annotation regex, keyboard shortcut, and exported function as YAGNI. However, the user explicitly requested ALL hex addresses toggle (including annotations), so annotation formatting stays. Keyboard shortcut `a` and `export` are marked optional below.

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Simple format | `0x` prefix kept → `0x0004` | CS students need the hex signal; bare `0004` looks decimal/octal |
| Address vs data registers | Hardcode `$pc` and `$ra` as address registers | Only registers holding text-segment addresses across all 6 sections; easy to extend later |
| Toggle scope | Per-instance | Matches existing per-instance `paramDefs`; each tracer is independent |
| Persistence | Ephemeral (resets on reload) | Transient view preference, not a tunable parameter |
| Toggle UI | Click `<button>` elements in `.line-addr` position | All interactive elements in codebase are `<button>`; use `all: unset` for inline styling |
| Annotation addresses | Regex replace `0x[0-9a-fA-F]{8}(?![0-9a-fA-F])` | Negative lookahead prevents partial matches; all current annotation hex values are addresses |
| Layout stability | Keep `.line-addr` min-width at `6.5rem` | Prevents layout shift when toggling to shorter strings |
| A11y approach | `aria-pressed` on toggle buttons | Native toggle semantics; avoids live region collision with step announcements |

## Acceptance Criteria

- [x] Clicking any address button toggles ALL addresses in that tracer between full (`0x00400004`) and simple (`0x0004`)
- [x] Toggle applies to: line addresses, `$pc`/`$ra` register values, and hex in annotation text
- [x] Data registers (`$a0`, `$v0`, etc.) are **never** truncated
- [x] Address elements are `<button>` with `all: unset` styling, `cursor: pointer`, and hover effect
- [x] `aria-pressed` on address buttons communicates toggle state to screen readers
- [x] Formatting applied to `aria-label` on register cards and `changeAnnouncement` for a11y parity
- [x] No layout shift — `.line-addr` keeps fixed `min-width`
- [x] Toggle state is ephemeral (no localStorage)
- [x] Non-hex inputs pass through `formatAddress` unchanged (`startsWith('0x')` guard)
- [x] `prefers-reduced-motion` respected (no transition on the hover effect if reduced motion)
- [x] Keyboard shortcut `a` toggles address mode when tracer is focused

## Implementation

### Constants and utilities

```typescript
// Inside ExecutionTracer.svelte — single consumer, no separate file needed

import type { DisplayRegister } from '../../lib/types';

/** Registers that hold memory addresses (not data values). */
const ADDRESS_REGISTERS: ReadonlySet<DisplayRegister> = new Set(['$pc', '$ra']);

/** Regex matching full MIPS hex addresses in annotation text.
 *  Negative lookahead prevents partial match on longer hex strings. */
const HEX_ADDR_RE = /0x[0-9a-fA-F]{8}(?![0-9a-fA-F])/g;

/** Truncate a hex address to its last 4 digits, keeping the 0x prefix.
 *  Non-hex inputs pass through unchanged. */
function formatAddress(hex: string, simple: boolean): string {
  if (!simple || !hex || !hex.startsWith('0x')) return hex;
  return '0x' + hex.slice(-4);
}
```

### Research Insights

**Type safety (TypeScript reviewer):**
- `ADDRESS_REGISTERS` uses `satisfies` or explicit typing to catch typos at compile time
- `formatAddress` guards against non-hex input — if someone passes `"main:"`, it returns it unchanged instead of producing `"0xain:"`
- The `$derived` for annotation must handle `undefined` since `Step.annotation` is optional

**Svelte 5 event delegation (framework docs):**
- Svelte 5 already delegates `click` events at the application root — adding `onclick` to each `<button>` in the `{#each}` loop does NOT create N DOM listeners. No manual delegation needed.

**Performance (performance oracle):**
- ~16 `formatAddress` calls per step (10 lines + 6 registers) = sub-microsecond, negligible
- Regex on ~100 char annotation strings = sub-microsecond
- Svelte 5's signal-based reactivity updates only the affected text nodes — no virtual DOM diffing
- Use explicit `transition: opacity` (not `transition: all`) to stay compositor-only

**Security (security sentinel):**
- No XSS risk: all content rendered via Svelte text interpolation `{value}`, never `{@html}`
- All data is hardcoded in source — no user input path
- Add defensive comment: `<!-- Never use {@html} here -->`

### Files to modify

#### `site/src/components/widgets/ExecutionTracer.svelte`

1. **Add state**: `let simpleAddresses = $state(false);`
   - Plain `$state` is correct — matches `showingResult` in BitOperator/ShiftVisualizer. Not in `paramDefs` (numeric-only system).
   - Comment: `// Not in paramDefs — boolean toggle, see CLAUDE.md`

2. **Add toggle function**:
   ```typescript
   function toggleAddressMode() {
     simpleAddresses = !simpleAddresses;
   }
   ```
   - *(Optional)* Add `case 'a'` to `handleKeyboard` — follows `n`/`p` single-letter mnemonic pattern, no conflicts
   - *(Optional)* `export function toggleAddressMode()` — only if a section needs prose-button control. No consumer exists today; add when needed (YAGNI).

3. **Line addresses** (line ~141): Replace `<span class="line-addr">` with `<button>`:
   ```svelte
   {#if addresses?.[i]}<button
     class="line-addr"
     aria-pressed={simpleAddresses}
     onclick={toggleAddressMode}
   >{formatAddress(addresses[i], simpleAddresses)}</button>{/if}
   ```
   - Always render the button even for empty addresses to avoid vanishing click targets (use `{addresses?.[i] ? formatAddress(...) : '\u00A0'}`)

4. **Register values** (line ~148-165): For `$pc` and `$ra`, apply formatting:
   ```svelte
   {@const displayValue = ADDRESS_REGISTERS.has(reg)
     ? formatAddress(value, simpleAddresses)
     : value}
   <!-- ... -->
   <span class="reg-value">{displayValue}</span>
   ```
   - Also apply to `aria-label`: `aria-label="{reg}: {displayValue}"`

5. **Annotation text** (line ~172): Use `$derived` with regex:
   ```typescript
   let formattedAnnotation = $derived(
     current.annotation?.replace(HEX_ADDR_RE, match => formatAddress(match, simpleAddresses))
   );
   ```
   - Handles `undefined` safely via optional chaining
   - Template: `{#if formattedAnnotation}<p class="annotation">{formattedAnnotation}</p>{/if}`

6. **changeAnnouncement** (line ~55-69): Apply formatting to register values in the SR announcement text for a11y parity:
   ```typescript
   const displayVal = ADDRESS_REGISTERS.has(r)
     ? formatAddress(current.registers[r] ?? '?', simpleAddresses)
     : (current.registers[r] ?? '?');
   ```

7. **CSS**: Style the `<button>` as inline element matching current `.line-addr` aesthetics:
   ```css
   button.line-addr {
     all: unset;
     display: inline-block;
     min-width: 6.5rem;
     color: var(--color-text-muted, #888);
     opacity: 0.6;
     user-select: none;
     font-size: 0.75em;
     font-family: inherit;
     cursor: pointer;
     transition: opacity var(--transition-fast, 150ms);
   }

   button.line-addr:hover {
     opacity: 1;
     text-decoration: underline;
     text-decoration-style: dotted;
     text-underline-offset: 2px;
     color: var(--color-accent, #4d9fff);
   }

   button.line-addr:focus-visible {
     outline: 2px solid var(--color-accent, #4d9fff);
     outline-offset: 2px;
     border-radius: 2px;
   }

   @media (prefers-reduced-motion: reduce) {
     button.line-addr { transition: none; }
   }
   ```

#### No changes needed to section files

All address data stays as full hex strings. Formatting is purely a display concern inside ExecutionTracer.

## Edge Cases

- **Duplicate addresses on label lines**: `main:` and next instruction share `0x00400000` → both show `0x0000` in simple mode. Correct and expected.
- **`$ra` values not in 0x004 range**: `formatAddress` safely truncates any hex string — shows last 4 digits regardless of prefix.
- **Annotations without hex**: Regex finds no matches → string passes through unchanged.
- **Non-hex strings in addresses array**: `startsWith('0x')` guard returns input unchanged — no corruption.
- **Rapid toggle + step**: Both mutations are synchronous `$state` flips; Svelte 5 batches into a single microtask flush. No race condition.
- **Flash animation during toggle**: Register card DOM nodes are keyed by register name (`{#each registers as reg (reg)}`), so toggle does not recreate them or restart CSS animations.
- **Empty address strings**: `formatAddress('', simple)` returns `''` due to the `!hex` guard.
- **Undefined annotations**: Optional chaining `current.annotation?.replace(...)` returns `undefined`, and `{#if formattedAnnotation}` skips rendering.

## Sources

- ExecutionTracer widget: [ExecutionTracer.svelte](site/src/components/widgets/ExecutionTracer.svelte)
- Address arrays defined in section files: [Act1Nor.svelte](site/src/components/sections/project2/Act1Nor.svelte), [Act2Nand.svelte](site/src/components/sections/project2/Act2Nand.svelte), [Act3Mult4.svelte](site/src/components/sections/project2/Act3Mult4.svelte), [Act4Swap.svelte](site/src/components/sections/project2/Act4Swap.svelte)
- Param system: [params.ts](site/src/lib/params.ts) (not modified — boolean toggle doesn't use paramDefs)
- Institutional learning: [svelte5-runes-in-plain-ts-files.md](docs/solutions/build-errors/svelte5-runes-in-plain-ts-files.md) — all rune logic stays in `.svelte` file, no new utility files needed
