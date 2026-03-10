# CrowCode

Visual essay template built with Astro 5 + Svelte 5. All source lives in `site/`.

## Architecture Rules

### Token system

- Spatial design tokens (spacing, layout widths, radii) are defined in `site/src/lib/tokens.ts` — this is the **single source of truth**
- `BaseLayout.astro` generates CSS custom properties from `tokens.ts` at build time
- `global.css` uses these tokens but does NOT define them — it only contains non-spatial tokens (colors, typography, transitions)
- The debug panel (`DebugPanel.svelte`) is auto-generated from the same `tokens.ts` — never add sliders manually

### Adding a new spatial token

1. Add it to the `tokens` array in `site/src/lib/tokens.ts`
2. It automatically appears as a CSS custom property and in the debug panel
3. Do NOT add `--space-*`, `--radius-*`, or layout width tokens to `global.css`

### Widget parameters

- Each widget defines its own tunable params via a `paramDefs` array using the `Param` interface from `site/src/lib/params.ts`
- `WidgetDebugPanel.svelte` renders sliders for any widget's params — never build custom debug UI per widget
- Style params flow via scoped CSS custom properties (e.g. `--counter-font-size`), behavioral params are used directly in JS
- Widget debug panels are gated behind `import.meta.env.DEV` internally — widgets include `<WidgetDebugPanel>` unconditionally
- **Separation rule**: Widgets must NOT reference global spatial tokens (`--space-*`, `--radius-*`, layout widths) — all numeric styling comes from the widget's own `paramDefs` via scoped CSS custom properties. Non-spatial globals (`--color-*`, `--font-*`, `--transition-*`) are fine — they aren't controlled by the global debug panel

### Adding a new widget

1. Create `site/src/components/widgets/MyWidget.svelte`
2. Define a `paramDefs` array with tunable parameters using the `Param` interface
3. Initialize reactive params with `loadParams()` from `params.ts`
4. Use scoped CSS custom properties for style params, direct JS for behavioral params
5. Include `<WidgetDebugPanel>` with `bind:values` for the debug panel
6. Export methods via `export function` for prose control
7. Create `site/src/pages/sandbox/my-widget.astro` for isolated development

### Svelte 5 runes in utility files

- **Files using `$state`, `$effect`, `$derived`, or `$props` MUST use `.svelte.ts` extension** — plain `.ts` files are not processed by the Svelte compiler, so runes are emitted as raw `$state()` calls that throw `ReferenceError` at runtime
- This silently breaks hydration for any component that imports the utility, making all `bind:this` refs in that component's section permanently `undefined`
- Example: `lib/motion.svelte.ts` (not `motion.ts`) for a reactive `prefers-reduced-motion` detector

### Component patterns

- **Widgets** (`components/widgets/`) are self-contained, expose imperative APIs via `export function`
- **Sections** (`components/sections/`) compose widgets + prose, use `bind:this` for prose-widget interaction
- Prose text that triggers widget actions uses `<button class="action">` (styled in `global.css`)
- Every section's `<h2>` needs an `id` attribute for TOC auto-generation

### Dev tooling

- **Global debug panel**: gated behind `import.meta.env.DEV` — toggle with bottom-right button or `Ctrl+.`
- **Widget debug panels**: gear icon in each widget's top-right corner (dev only)
- Sandbox pages at `/sandbox/` for isolated widget development

## Commands

Run from `site/`:

- `npm run dev` — dev server
- `npm run build` — production build
- `npm run preview` — preview production build

## MIPS Assembly (MARS Simulator)

<mips-context>
- Target simulator: MARS 4.5 (MIPS-32)
- Full reference guide: `docs/mars-mips-reference.md`
</mips-context>

<mips-conventions>
- Every program needs `.data` and `.text` segments with `.globl main`
- Use syscalls for I/O: 4 = print string, 5 = read int, 1 = print int, 10 = exit
- Follow standard calling conventions: save `$ra` and any `$s` registers on the stack in functions
- Use pseudo-instructions (`li`, `la`, `move`, `blt`, `bge`, etc.) for readability
- Use `$t` registers for temporaries, `$s` registers for values that must survive function calls
- Arguments go in `$a0-$a3`, return values in `$v0-$v1`
</mips-conventions>
