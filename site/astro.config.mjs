import { defineConfig } from 'astro/config';
import svelte from '@astrojs/svelte';

export default defineConfig({
  site: 'https://CuriousCrow123.github.io',
  base: '/CrowCS40A',
  integrations: [svelte()],
});
