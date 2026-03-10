---
title: "feat: Add nested h3 subsections to Table of Contents"
type: feat
status: completed
date: 2026-03-10
---

# feat: Add nested h3 subsections to Table of Contents

The TOC currently shows only the 9 top-level `h2` headings. Students navigating the essay can't jump to specific subsections (e.g., "The Constraint" inside Act 3, or "The Five Services You Need" inside the Syscall Interlude). Adding h3 entries gives ~40+ additional jump targets.

## Current State

- `TableOfContents.svelte` scans only `h2[id]` elements (line 10)
- Renders a flat `<ol>` with no nesting
- IntersectionObserver tracks which h2 is in view
- No h3 elements in section files have `id` attributes

## Changes Required

### 1. Add `id` attributes to all h3 elements in section files

Every `<h3>` inside a section needs a kebab-case `id` derived from its text content. This enables both TOC linking and direct URL anchoring.

**Files to modify:**

| File | h3 headings to add `id` to |
|---|---|
| `Prologue.svelte` | "How This Essay Works", "Binary Refresher", "What You'll Build" |
| `Act0Scaffold.svelte` | "The Call/Return Dance", "The Register Contract" |
| `Act1Nor.svelte` | "NOR Truth Table", "Bitwise NOR", "Wire Up the Subprogram", "Black-Box View", "Execution Trace", "Reflection" |
| `Act2Nand.svelte` | "Pattern Recognition", "NAND Truth Table", "Complete the Subprogram", "Black-Box View", "Execution Trace", "Cross-Subprogram Comparison" |
| `Act3Mult4.svelte` | "The Constraint", "The Decimal Analogy", "Generalize", "Predict Before Coding", "Write the Body", "Black-Box View", "Execution Trace", "Reflection" |
| `Act4Swap.svelte` | (multiple — ~7 h3s) |
| `InterlSyscall.svelte` | "The Syscall Protocol", "The Five Services You Need", "Hello World Trace", "How utils.asm Uses Syscall" |
| `Act5Deliverables.svelte` | (scan for h3s) |
| `Act6Verification.svelte` | (scan for h3s) |

**ID convention:** lowercase, hyphenated, prefixed with parent section for uniqueness. Examples:
- `<h3 id="the-constraint">The Constraint</h3>`
- `<h3 id="execution-trace-nand">Execution Trace</h3>` (disambiguate repeated names with parent context)

### 2. Update `TableOfContents.svelte`

#### a. Data model

Change from flat entries to nested:

```typescript
type TocEntry = {
  id: string;
  text: string;
  children: TocEntry[];
};
```

#### b. DOM scanning (line 10)

Query both `h2[id]` and `h3[id]`, then group h3s under their preceding h2:

```typescript
const headings = document.querySelectorAll('h2[id], h3[id]');
const tocEntries: TocEntry[] = [];
let current: TocEntry | null = null;

for (const h of headings) {
  if (h.tagName === 'H2') {
    current = { id: h.id, text: h.textContent?.trim() ?? '', children: [] };
    tocEntries.push(current);
  } else if (h.tagName === 'H3' && current) {
    current.children.push({ id: h.id, text: h.textContent?.trim() ?? '', children: [] });
  }
}
entries = tocEntries;
```

#### c. IntersectionObserver

Observe both h2 and h3 elements. Track `activeId` across both levels. Determine active parent from either a direct h2 hit or the parent h2 of an active h3.

#### d. Rendering

Nested `<ol>` inside each h2 `<li>`:

```svelte
<ol class="toc-list">
  {#each entries as entry}
    <li>
      <button class="toc-link" class:active={activeId === entry.id} onclick={() => scrollTo(entry.id)}>
        {entry.text}
      </button>
      {#if entry.children.length > 0}
        <ol class="toc-sublist">
          {#each entry.children as child}
            <li>
              <button class="toc-link sub" class:active={activeId === child.id} onclick={() => scrollTo(child.id)}>
                {child.text}
              </button>
            </li>
          {/each}
        </ol>
      {/if}
    </li>
  {/each}
</ol>
```

#### e. Styling

- `.toc-sublist`: no bullets, indented with `padding-left`
- `.toc-link.sub`: smaller font size (~0.8rem), slightly dimmer color
- Compact gap for sub-entries to visually group them under their parent
- Collapsing sub-entries is NOT needed — the sidebar has enough vertical space with scroll

## Acceptance Criteria

- [x] All h3 elements across all section files have `id` attributes
- [x] TOC shows h3 entries nested under their parent h2
- [x] Clicking any TOC entry (h2 or h3) smooth-scrolls to the heading
- [x] IntersectionObserver highlights the correct entry at both h2 and h3 levels
- [x] h3 entries are visually indented and smaller than h2 entries
- [x] Mobile close-on-click still works for h3 entries
- [x] No duplicate `id` values across the entire page
- [x] Build passes cleanly

## Files to Modify

- `site/src/components/essay/TableOfContents.svelte` — nested data model, scanning, rendering, styles
- `site/src/components/sections/project2/Prologue.svelte` — add h3 ids
- `site/src/components/sections/project2/Act0Scaffold.svelte` — add h3 ids
- `site/src/components/sections/project2/Act1Nor.svelte` — add h3 ids
- `site/src/components/sections/project2/Act2Nand.svelte` — add h3 ids
- `site/src/components/sections/project2/Act3Mult4.svelte` — add h3 ids
- `site/src/components/sections/project2/Act4Swap.svelte` — add h3 ids
- `site/src/components/sections/project2/InterlSyscall.svelte` — add h3 ids
- `site/src/components/sections/project2/Act5Deliverables.svelte` — add h3 ids
- `site/src/components/sections/project2/Act6Verification.svelte` — add h3 ids
