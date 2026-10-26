// @ts-check
import { defineConfig } from 'astro/config';

// Proyecto publicado como GitHub Pages de proyecto:
// https://josman958.github.io/photos/
export default defineConfig({
  site: 'https://josman958.github.io',
  base: '/photos',
  trailingSlash: 'ignore',
  devToolbar: {
    enabled: false,
  },
});
