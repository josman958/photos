import type { ImageMetadata } from 'astro';

// Fotos propias
import heroPhoto from '../assets/IMG_7957.jpeg';
import aboutPhoto from '../assets/IMG_3752.jpeg';
import laguna69 from '../assets/_A744333.jpeg';
import churup from '../assets/churup2.jpeg';

// Imágenes de relleno (Unsplash) — reemplazables por el archivo final.
import mountainLake from '../assets/fill/mountain-lake.jpg';
import mountainRange from '../assets/fill/mountain-range.jpg';
import foggyHills from '../assets/fill/foggy-hills.jpg';
import alpineLake from '../assets/fill/alpine-lake.jpg';
import roadTrip from '../assets/fill/road-trip.jpg';
import hiker from '../assets/fill/hiker.jpg';
import portraitMan from '../assets/fill/portrait-man.jpg';
import portraitWoman from '../assets/fill/portrait-woman.jpg';
import peaks from '../assets/fill/peaks.jpg';
import nightPeak from '../assets/fill/night-peak.jpg';
import valley from '../assets/fill/valley.jpg';

export type Category = 'Paisaje' | 'Viaje' | 'Retrato';

export interface GalleryPhoto {
  src: ImageMetadata;
  alt: string;
  title: string;
  category: Category;
  location: string;
  year: string;
  ratio: string;
  sizes: string;
  widths: number[];
}

export const hero = {
  src: heroPhoto,
  alt: 'Laguna turquesa rodeada de montañas nevadas en la Cordillera Blanca, Huaraz.',
  caption: 'Laguna 69 · Cordillera Blanca',
};

export const about = {
  src: aboutPhoto,
  alt: 'Retrato de Josman sonriendo en un campo de flores con montañas al fondo.',
  caption: 'Valle de las Flores · Huaraz, 2025',
};

export const aboutDetail = {
  src: mountainRange,
  alt: 'Valle verde con montañas nevadas al fondo.',
  caption: 'Ruta a la base · Cordillera Blanca',
};

export const gallery: GalleryPhoto[] = [
  {
    src: laguna69,
    alt: 'Viajero de pie frente a la laguna 69, con picos nevados y agua turquesa al fondo.',
    title: 'Laguna 69',
    category: 'Viaje',
    location: 'Huaraz, Perú',
    year: '2025',
    ratio: '4 / 5',
    sizes: '(max-width: 900px) 100vw, 58vw',
    widths: [600, 900, 1200, 1600],
  },
  {
    src: mountainLake,
    alt: 'Amanecer sobre un mar de nubes con picos nevados iluminados por el sol.',
    title: 'Amanecer sobre la cordillera',
    category: 'Paisaje',
    location: 'Cordillera Blanca',
    year: '2025',
    ratio: '5 / 4',
    sizes: '(max-width: 900px) 100vw, 32vw',
    widths: [500, 800, 1200, 1600],
  },
  {
    src: churup,
    alt: 'Persona sentada frente a la laguna Churup, rodeada de montañas y vegetación.',
    title: 'Laguna Churup',
    category: 'Paisaje',
    location: 'Huaraz, Perú',
    year: '2024',
    ratio: '1 / 1',
    sizes: '(max-width: 900px) 100vw, 30vw',
    widths: [400, 800, 1200],
  },
  {
    src: foggyHills,
    alt: 'Valle verde cubierto por niebla con una carretera solitaria y el sol asomando.',
    title: 'Niebla en el valle',
    category: 'Paisaje',
    location: 'Áncash, Perú',
    year: '2024',
    ratio: '3 / 2',
    sizes: '(max-width: 900px) 100vw, 46vw',
    widths: [600, 900, 1200, 1600],
  },
  {
    src: portraitWoman,
    alt: 'Retrato de una mujer sonriendo con luz cálida de tarde.',
    title: 'Luz de tarde',
    category: 'Retrato',
    location: 'Lima, Perú',
    year: '2025',
    ratio: '3 / 4',
    sizes: '(max-width: 900px) 100vw, 30vw',
    widths: [400, 600, 900],
  },
  {
    src: hiker,
    alt: 'Dos excursionistas caminan por un sendero hacia montañas nevadas.',
    title: 'Camino a la base',
    category: 'Viaje',
    location: 'Parque Nacional Huascarán',
    year: '2024',
    ratio: '3 / 2',
    sizes: '(max-width: 900px) 100vw, 56vw',
    widths: [600, 900, 1200, 1600],
  },
  {
    src: peaks,
    alt: 'Cumbres nevadas de la Cordillera Blanca bajo un cielo con nubes.',
    title: 'Cordillera, 4:50 p.m.',
    category: 'Paisaje',
    location: 'Cordillera Blanca',
    year: '2025',
    ratio: '2 / 1',
    sizes: '(max-width: 900px) 100vw, 58vw',
    widths: [800, 1200, 1600, 2000],
  },
  {
    src: alpineLake,
    alt: 'Lago turquesa con botes de madera y montañas rocosas alrededor.',
    title: 'Lago sereno',
    category: 'Viaje',
    location: 'Dolomitas, Italia',
    year: '2024',
    ratio: '4 / 3',
    sizes: '(max-width: 900px) 100vw, 34vw',
    widths: [600, 900, 1200, 1600],
  },
];

export const interlude = {
  src: nightPeak,
  alt: 'Cielo estrellado con la Vía Láctea sobre montañas nevadas.',
  quote: 'La montaña no se conquista: se escucha.',
  note: 'Cuaderno de ruta · 03:40 a.m.',
};

export const collections = [
  {
    number: '01',
    name: 'Paisaje',
    src: valley,
    alt: 'Campo dorado al pie de una montaña nevada.',
    ratio: '4 / 5',
    copy: 'Montañas, lagunas y esa luz que cambia en segundos.',
    sizes: '(max-width: 900px) 100vw, 30vw',
    widths: [500, 800, 1200],
  },
  {
    number: '02',
    name: 'Viaje',
    src: roadTrip,
    alt: 'Furgoneta amarilla en una carretera desértica entre rocas rojas.',
    ratio: '4 / 5',
    copy: 'Rutas, caminos y la historia de lo que encontramos.',
    sizes: '(max-width: 900px) 100vw, 30vw',
    widths: [500, 800, 1200],
  },
  {
    number: '03',
    name: 'Retrato',
    src: portraitMan,
    alt: 'Retrato de un hombre con jersey gris y camisa azul.',
    ratio: '4 / 5',
    copy: 'Personas en su paisaje, sin poses prestadas.',
    sizes: '(max-width: 900px) 100vw, 30vw',
    widths: [500, 800, 1200],
  },
];
