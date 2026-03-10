---
title: "feat: Visually distinguish hex addresses from hex data values"
type: feat
status: completed
date: 2026-03-10
---

# Visually Distinguish Hex Addresses from Hex Data Values

Students see `0x00400004` (a text-segment address) and `0xF0F0F0F0` (a NOR operand) rendered identically throughout the visual essay. Add a subtle accent-blue tint + dotted underline to hex addresses so they are visually distinct from hex data values in both prose and the ExecutionTracer widget.

## Enhancement Summary

**Deepened on:** 2026-03-10
**Agents used:** TypeScript reviewer, code simplicity reviewer, pattern recognition, architecture strategist, frontend races, performance oracle

### Key Improvements from Research

1. **Move `addressRegisters` from `Step` type to ExecutionTracer prop** — both reviewers agree this is a presentation concern, not a data-model concern. Keeps `Step` clean; sections pass overrides via a new `addressRegisterOverrides` prop.
2. **Keep annotation tokenizer** — user explicitly requested tokenization into segments for `.hex-addr` styling. Simplicity reviewer's YAGNI cut overridden by user intent.
3. **Use `$derived` for override set** — cache the per-step `Set<DisplayRegister>` in a `$derived` to avoid recreating on every `isAddressReg` call.

### Simplicity Notes

The simplicity reviewer recommended cutting annotation tokenizer and `addressRegisters` as YAGNI. However, the user explicitly chose annotation tokenization and per-step address register overrides for InterlSyscall. The TypeScript reviewer's compromise — moving the override from `Step` to a component prop — keeps the data model clean while preserving the feature.

## Key Decisions

| Decision | Choice | Rationale |
|---|---|---|
| Scope | Prose (Prologue) + ExecutionTracer | Code editor literals excluded per user request |
| Visual style | Accent-blue tint + dotted underline | Color for sighted users, underline as secondary cue for WCAG 1.4.1 |
| Annotation rendering | Tokenize into segments, render with `{#each}` | Safe (no `{@html}`), matches existing `tokenizeMipsLine` pattern |
| Address classification | `ADDRESS_REGISTERS` default + per-step override via prop | Handles `$a0 = 0x10010000` in InterlSyscall correctly |
| InterlSyscall edge case | `addressRegisterOverrides` prop on ExecutionTracer | Per-step override map; presentation concern stays out of `Step` type |
| CSS approach | Global `--color-hex-addr` token + `.hex-addr` class | Consistent across prose and widgets |

## Acceptance Criteria

- [x] New CSS token `--color-hex-addr` defined in `global.css` (non-spatial, color token)
- [x] `.hex-addr` class in `global.css` applies accent tint + dotted underline to any element
- [x] Prologue `<code>` tags for addresses get `class="hex-addr"`
- [x] ExecutionTracer `.reg-value` spans for address registers get `.hex-addr` class
- [x] ExecutionTracer annotations tokenized into text/address segments with styled `<span class="hex-addr">`
- [x] ExecutionTracer gains `addressRegisterOverrides` prop (map of step index → `DisplayRegister[]`)
- [x] InterlSyscall passes `addressRegisterOverrides` to ExecutionTracer for steps where `$a0` holds `0x10010000`
- [x] Default classification falls back to `ADDRESS_REGISTERS` constant (`$pc`, `$ra`) when no override exists
- [x] Bare `0x00FFFFFF` in Act6Verification wrapped in `<code>` for consistency
- [x] Build passes with no errors

## Implementation

### 1. CSS token + class (`site/src/styles/global.css`)

```css
/* Non-spatial color token — address hex values get a muted accent tint */
--color-hex-addr: color-mix(in srgb, var(--color-accent) 65%, var(--color-text-muted));
```

```css
/* Global utility class for hex address values */
.hex-addr {
  color: var(--color-hex-addr);
  text-decoration: underline;
  text-decoration-style: dotted;
  text-underline-offset: 2px;
  text-decoration-color: color-mix(in srgb, var(--color-hex-addr) 50%, transparent);
}
```

### 2. ExecutionTracer prop (`site/src/components/widgets/ExecutionTracer.svelte`)

Add prop for per-step address register overrides (no change to `Step` type):

```typescript
let {
  // ... existing props ...
  /** Per-step overrides: which registers hold addresses (default: $pc, $ra). */
  addressRegisterOverrides = {},
}: {
  // ... existing prop types ...
  addressRegisterOverrides?: Record<number, DisplayRegister[]>;
} = $props();
```

Cache the override set for the current step:

```typescript
let currentAddrRegs = $derived<ReadonlySet<DisplayRegister>>(
  addressRegisterOverrides[stepIndex]
    ? new Set(addressRegisterOverrides[stepIndex])
    : ADDRESS_REGISTERS
);
```

### 3. ExecutionTracer register values (`site/src/components/widgets/ExecutionTracer.svelte`)

Update address classification to use the derived set:

```typescript
function isAddressReg(reg: DisplayRegister): boolean {
  return currentAddrRegs.has(reg);
}
```

Add `.hex-addr` class to register value spans:

```svelte
<span class="reg-value" class:hex-addr={isAddressReg(reg)}>{value}</span>
```

### 4. Annotation tokenizer (`site/src/components/widgets/ExecutionTracer.svelte`)

Inline tokenizer (single consumer, no separate file):

```typescript
type AnnotationToken = { type: 'text' | 'addr'; value: string };

function tokenizeAnnotation(text: string, simple: boolean): AnnotationToken[] {
  const tokens: AnnotationToken[] = [];
  let lastIndex = 0;
  for (const match of text.matchAll(HEX_ADDR_RE)) {
    if (match.index! > lastIndex) {
      tokens.push({ type: 'text', value: text.slice(lastIndex, match.index!) });
    }
    tokens.push({ type: 'addr', value: formatAddr(match[0], simple) });
    lastIndex = match.index! + match[0].length;
  }
  if (lastIndex < text.length) {
    tokens.push({ type: 'text', value: text.slice(lastIndex) });
  }
  return tokens;
}
```

Template change — replace `{formattedAnnotation}` with `{#each}`:

```svelte
{#if current.annotation}
  <p class="annotation">
    {#each tokenizeAnnotation(current.annotation, simpleAddresses) as token}
      {#if token.type === 'addr'}<span class="hex-addr">{token.value}</span>{:else}{token.value}{/if}
    {/each}
  </p>
{/if}
```

Remove the `formattedAnnotation` derived (replaced by inline tokenization).

### 5. Prologue prose (`site/src/components/sections/project2/Prologue.svelte`)

Add `class="hex-addr"` to address `<code>` tags:

```html
<td><code class="hex-addr">0x00400000</code></td>
<!-- ... repeat for all 6 address <code> tags -->
```

### 6. InterlSyscall override (`site/src/components/sections/project2/InterlSyscall.svelte`)

Pass `addressRegisterOverrides` prop to ExecutionTracer, mapping step indices where `$a0` holds `0x10010000`:

```svelte
<ExecutionTracer
  {steps}
  addressRegisterOverrides={{ 0: ['$pc', '$ra', '$a0'], 2: ['$pc', '$ra', '$a0'] }}
/>
```

(Exact step indices TBD from reading the actual step data.)

### 7. Act6Verification fix (`site/src/components/sections/project2/Act6Verification.svelte`)

Wrap bare `0x00FFFFFF` in `<code>` tag for consistency.

## Files to modify

| File | Change |
|---|---|
| `site/src/styles/global.css` | Add `--color-hex-addr` token and `.hex-addr` class |
| `site/src/components/widgets/ExecutionTracer.svelte` | Add `addressRegisterOverrides` prop, `isAddressReg()`, `.hex-addr` on reg values, annotation tokenizer |
| `site/src/components/sections/project2/Prologue.svelte` | Add `class="hex-addr"` to address `<code>` tags |
| `site/src/components/sections/project2/InterlSyscall.svelte` | Pass `addressRegisterOverrides` to ExecutionTracer |
| `site/src/components/sections/project2/Act6Verification.svelte` | Wrap bare hex in `<code>` |

**Not modified:** `site/src/lib/types.ts` — `Step` type stays clean (presentation concern handled via prop).

## Edge Cases

- **`0x00000000` (NOR result)**: This is a data value in `$v0`, not an address. The register-based classification correctly leaves it unstyled.
- **Annotations only contain addresses**: Verified by grep — all hex in annotation strings are jal/jr targets or `$ra` values. The regex approach is safe for current data.
- **Simple address mode**: Tokenizer runs `formatAddr` on matches, so truncated addresses like `0x0010` still get `.hex-addr` styling.
- **Future annotations with data hex**: If an annotation ever includes a data value like `0xF0F0F0F0`, the regex would misclassify it as an address. Acceptable risk — annotations are author-controlled.
- **Sections without overrides**: When `addressRegisterOverrides` is empty (default), all sections fall back to `ADDRESS_REGISTERS` (`$pc`, `$ra`) — no changes needed in Act1–Act5.

## Sources

- ExecutionTracer widget: [ExecutionTracer.svelte](site/src/components/widgets/ExecutionTracer.svelte)
- Types: [types.ts](site/src/lib/types.ts)
- Prologue: [Prologue.svelte](site/src/components/sections/project2/Prologue.svelte)
- InterlSyscall: [InterlSyscall.svelte](site/src/components/sections/project2/InterlSyscall.svelte)
- Global styles: [global.css](site/src/styles/global.css)
- Prior feature: [toggle hex addresses plan](docs/plans/2026-03-10-feat-toggle-simple-full-hex-addresses-plan.md)
