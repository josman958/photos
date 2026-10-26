# Josman — Fotografía

Landing page de fotografía de paisaje, viaje y retrato, construida con Astro y GSAP para publicarse en GitHub Pages.

- Sitio: https://josman958.github.io/photos/
- Stack: Astro 7, GSAP 3.15, WebGL (shader propio), CSS.
- Animaciones: quema del hero con shader, parallax por capas, revelados de imágenes y textos, scroll suave y lightbox.

## Comandos

```sh
npm install
npm run dev
npm run build
npm run preview
```

El servidor de desarrollo se levanta con `npm run dev` (por defecto en `http://localhost:4321/photos/`).

## Dónde cambiar el contenido

### Datos de contacto y textos

Edita `src/data/site.ts`:

- Nombre, email, WhatsApp, Instagram y ubicación.
- Enlaces del menú.
- Testimonios.

> Los datos actuales (email, teléfono, Instagram, testimonios y marcas de tiempo) son ficticios, pensados para que el sitio se vea completo. Reemplázalos por los reales antes de publicar.

### Fotos

Las fotos propias están en `src/assets/` y las de relleno en `src/assets/fill/`.

Para cambiar una foto:

1. Exporta desde tu iPhone como **JPG** (no HEIC), lado largo entre 2500 y 3000 px, color sRGB, calidad 85–90.
2. Coloca el archivo en `src/assets/` (o en `src/assets/fill/`).
3. Abre `src/data/photos.ts` y actualiza el `import` y los datos de la foto: título, categoría, lugar, año, texto alternativo y proporción.

La galería se genera desde `gallery`. Cada elemento admite:

```ts
{
  src: importado,          // ImageMetadata
  alt: 'Descripción',      // obligatorio para accesibilidad
  title: 'Título',
  category: 'Paisaje' | 'Viaje' | 'Retrato',
  location: 'Lugar',
  year: '2025',
  ratio: '4 / 5',          // proporción de la tarjeta
  sizes: '(max-width: 900px) 100vw, 58vw',
  widths: [600, 900, 1200, 1600],
}
```

Astro genera automáticamente las versiones WebP y los tamaños responsive. No hace falta subir imágenes a `public/`.

El diseño está pensado para 8 fotos en la galería. Si añades más, las adicionales se acomodan automáticamente en dos columnas; si quieres un orden editorial específico, ajusta los `grid-column`/`grid-row` en `src/styles/global.css`.

### Hero

El hero usa `IMG_7957.jpeg` y la quema se genera en `src/scripts/burn.ts` con un shader WebGL propio. El texto se desvanece al inicio del scroll y el papel crema aparece debajo. Si la foto del hero cambia, actualiza el import en `src/data/photos.ts`; el shader tomará la versión optimizada automáticamente.

### Estilo

- `src/styles/global.css`: variables de color, tipografía, layout y responsive.
- `src/assets/fonts/`: Fraunces y Manrope autoalojadas.
- `src/assets/textures/grain.png`: grano de papel.

## Estructura

```text
src/
├─ assets/                 # fotos, fuentes y texturas
├─ components/             # secciones y componentes
├─ data/                   # sitio y fotos
├─ layouts/BaseLayout.astro
├─ pages/index.astro
├─ scripts/
│  ├─ burn.ts              # shader de quema + ScrollTrigger
│  ├─ motion.ts            # GSAP, ScrollSmoother, reveals, parallax
│  ├─ lightbox.ts
│  └─ ui.ts                # header, menú, anclas, progreso
└─ styles/global.css
```

## Publicación en GitHub Pages

El workflow `.github/workflows/deploy.yml` compila y publica en cada push a `main`.

1. Crea el repositorio `photos` en GitHub (público, si usas el plan gratuito).
2. Sube el proyecto a la rama `main`.
3. En el repositorio: **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. El sitio quedará en `https://josman958.github.io/photos/`.

La configuración de `astro.config.mjs` ya tiene:

```js
site: 'https://josman958.github.io',
base: '/photos',
```

Si cambias el nombre del repositorio o usas un dominio propio, actualiza `base` y `site`; los assets y enlaces internos se ajustan solos.

## Notas técnicas

- `prefers-reduced-motion`: desactiva scroll suave, parallax, quema y animaciones de entrada.
- Si WebGL no está disponible, el hero muestra la imagen estática y no se fija la sección.
- El lightbox usa `<dialog>` nativo, con navegación por teclado y foco restaurado.
- La quema se pausa cuando el hero sale del viewport y limita el DPR del canvas para cuidar la batería.
- Las imágenes de relleno provienen de Unsplash y están pensadas para reemplazarse por el archivo final. Licencia Unsplash.
