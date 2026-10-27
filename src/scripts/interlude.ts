import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const VERTEX_SHADER = `
attribute vec2 aPosition;
varying vec2 vUv;

void main() {
  vUv = aPosition * 0.5 + 0.5;
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

// La cubierta es crema, igual que el papel del hero. El shader solo dibuja esa
// cubierta y el borde quemado: la foto queda intacta debajo.
const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform vec2 uResolution;
uniform vec3 uCover;
uniform float uEdge;
uniform float uSide;
uniform float uTime;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);

  float a = hash(i);
  float b = hash(i + vec2(1.0, 0.0));
  float c = hash(i + vec2(0.0, 1.0));
  float d = hash(i + vec2(1.0, 1.0));

  return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;

  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p *= 2.03;
    amplitude *= 0.5;
  }

  return value;
}

void main() {
  vec2 uv = vUv;
  vec2 warp = vec2(
    fbm(uv * 3.2 + vec2(0.0, uTime * 0.008)),
    fbm(uv * 3.2 + vec2(5.2, 1.3))
  );
  float grain = fbm(uv * vec2(4.6, 3.6) + warp * 1.5);
  float edgeNoise =
    (noise(uv * 14.0 + vec2(0.0, uTime * 0.18)) - 0.5) * 0.055 +
    (noise(uv * 48.0 - vec2(0.0, uTime * 0.35)) - 0.5) * 0.018 +
    (noise(uv * 110.0 + uTime * 0.1) - 0.5) * 0.006;
  float edge =
    uEdge +
    (grain - 0.5) * 0.11 +
    (warp.x - 0.5) * 0.03 +
    edgeNoise;

  float distanceToEdge = (uv.y - edge) * uSide;
  float cover = smoothstep(-0.0025, 0.0025, distanceToEdge);

  float flicker = 0.72 + 0.28 * sin(uTime * 6.0 + grain * 40.0);
  float emberCore = 1.0 - smoothstep(0.0, 0.007, abs(uv.y - edge));
  float emberNoise = noise(uv * 75.0 + vec2(0.0, uTime * 0.9));
  float ember = emberCore * (0.35 + 0.65 * emberNoise) * flicker;
  vec3 emberColor = mix(
    vec3(0.95, 0.2, 0.02),
    vec3(1.0, 0.86, 0.48),
    smoothstep(0.0, 0.008, abs(uv.y - edge))
  );

  // Sobre la foto solo se derrama un halo muy fino.
  if (cover < 0.001) {
    float halo = 1.0 - smoothstep(0.0, 0.02, abs(uv.y - edge));
    if (halo < 0.001) discard;
    gl_FragColor = vec4(emberColor, halo * 0.12);
    return;
  }

  vec3 color = uCover;
  color += (grain - 0.5) * 0.018;

  // Borde carbonizado del papel, siempre del lado de la cubierta.
  float charOuter = 1.0 - smoothstep(0.0, 0.06, max(distanceToEdge, 0.0));
  color = mix(color, vec3(0.18, 0.1, 0.055), charOuter * 0.7);
  float charCore = 1.0 - smoothstep(0.0, 0.012, max(distanceToEdge, 0.0));
  color = mix(color, vec3(0.07, 0.04, 0.02), charCore * 0.8);

  color = mix(color, emberColor, ember * 0.8);

  vec2 sparkCells = uv * uResolution / 22.0;
  vec2 sparkId = floor(sparkCells);
  vec2 sparkPos = fract(sparkCells) - 0.5;
  float sparkRand = hash(sparkId + vec2(floor(uTime * 4.0) * 13.0));
  float sparkDot = smoothstep(0.14, 0.0, length(sparkPos));
  float sparks =
    step(0.972, sparkRand) *
    sparkDot *
    (1.0 - smoothstep(0.0, 0.12, max(distanceToEdge, 0.0)));
  color += vec3(1.0, 0.45, 0.08) * sparks * 1.4;

  gl_FragColor = vec4(color, cover);
}
`;

const EDGE_BOTTOM = -0.2;
const EDGE_TOP = 1.2;
const OPEN_END = 0.42;
const HOLD_END = 0.56;
// Las capas miden 120% del viewport (inset -10% por lado). Este desplazamiento
// alinea el borde izquierdo de la foto con el borde izquierdo de la pantalla.
const BASE_X = (10 / 120) * 100;

function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string
): WebGLShader | null {
  const shader = gl.createShader(type);
  if (!shader) return null;

  gl.shaderSource(shader, source);
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    console.error('Error compilando shader del interlude:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

function getCoverColor(root: HTMLElement) {
  const raw = getComputedStyle(root).backgroundColor;
  const channels = raw.match(/[\d.]+/g);

  if (!channels || channels.length < 3) {
    return [243 / 255, 238 / 255, 228 / 255];
  }

  return [
    Number(channels[0]) / 255,
    Number(channels[1]) / 255,
    Number(channels[2]) / 255,
  ];
}

interface CoverBurn {
  setState(edge: number, side: number, immediate?: boolean): void;
}

function createCoverBurn(
  root: HTMLElement,
  canvas: HTMLCanvasElement
): CoverBurn | null {
  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
  });

  if (!gl) {
    root.classList.add('no-burn');
    return null;
  }

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertexShader || !fragmentShader) {
    root.classList.add('no-burn');
    return null;
  }

  const program = gl.createProgram();
  if (!program) {
    root.classList.add('no-burn');
    return null;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Error enlazando shader del interlude:', gl.getProgramInfoLog(program));
    root.classList.add('no-burn');
    return null;
  }

  gl.useProgram(program);
  gl.disable(gl.DEPTH_TEST);
  gl.disable(gl.BLEND);
  gl.clearColor(0, 0, 0, 0);

  const positionBuffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
  gl.bufferData(
    gl.ARRAY_BUFFER,
    new Float32Array([-1, -1, 3, -1, -1, 3]),
    gl.STATIC_DRAW
  );

  const positionLocation = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(positionLocation);
  gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);

  const uniforms = {
    resolution: gl.getUniformLocation(program, 'uResolution'),
    cover: gl.getUniformLocation(program, 'uCover'),
    edge: gl.getUniformLocation(program, 'uEdge'),
    side: gl.getUniformLocation(program, 'uSide'),
    time: gl.getUniformLocation(program, 'uTime'),
  };

  const [r, g, b] = getCoverColor(root);
  gl.uniform3f(uniforms.cover, r, g, b);

  let targetEdge = EDGE_BOTTOM;
  let currentEdge = EDGE_BOTTOM;
  let targetSide = 1;
  let currentSide = 1;
  let visible = true;
  let hasDrawn = false;
  let forceDraw = false;

  const burn: CoverBurn = {
    setState(edge: number, side: number, immediate = false) {
      targetEdge = Math.max(EDGE_BOTTOM - 0.05, Math.min(EDGE_TOP + 0.05, edge));
      targetSide = side;
      if (immediate) {
        currentEdge = targetEdge;
        currentSide = targetSide;
        forceDraw = true;
      }
    },
  };

  const getDpr = () => {
    const mobile = window.matchMedia('(max-width: 860px)').matches;
    const width = canvas.clientWidth || window.innerWidth;
    const height = canvas.clientHeight || window.innerHeight;
    let dpr = Math.min(window.devicePixelRatio || 1, mobile ? 1.7 : 2);
    const maxPixels = 4_000_000;
    const pixels = width * height * dpr * dpr;

    if (pixels > maxPixels) {
      dpr = Math.sqrt(maxPixels / (width * height));
    }

    return dpr;
  };

  const resize = () => {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (!width || !height) return;

    const dpr = getDpr();
    const nextWidth = Math.round(width * dpr);
    const nextHeight = Math.round(height * dpr);

    if (canvas.width !== nextWidth || canvas.height !== nextHeight) {
      canvas.width = nextWidth;
      canvas.height = nextHeight;
      gl.viewport(0, 0, nextWidth, nextHeight);
      gl.uniform2f(uniforms.resolution, nextWidth, nextHeight);
    }
  };

  const draw = (time: number) => {
    if (!visible) return;

    resize();

    const delta = targetEdge - currentEdge;
    const atRest = Math.abs(delta) < 0.0006 && currentSide === targetSide;
    const atExtreme =
      currentEdge <= EDGE_BOTTOM + 0.01 || currentEdge >= EDGE_TOP - 0.01;

    if (hasDrawn && atRest && atExtreme && !forceDraw) return;

    currentEdge += delta * 0.14;
    currentSide = targetSide;
    forceDraw = false;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.edge, currentEdge);
    gl.uniform1f(uniforms.side, currentSide);
    gl.uniform1f(uniforms.time, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    hasDrawn = true;
  };

  resize();
  draw(0);
  root.classList.add('is-webgl');
  gsap.ticker.add(draw);

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { rootMargin: '180px' }
  );
  observer.observe(root);

  window.addEventListener('resize', resize, { passive: true });

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    root.classList.remove('is-webgl');
    root.classList.add('no-burn');
    visible = false;
  });

  return burn;
}

function setLayerDepths(
  scene: HTMLElement,
  back: HTMLElement,
  front: HTMLElement
) {
  gsap.set(scene, { transformStyle: 'preserve-3d' });
  // La escala compensa la perspectiva: a la distancia de la capa de atrás,
  // ambas capas se ven del mismo tamaño cuando están en reposo.
  gsap.set(back, { z: -180, scale: 1.15 });
  gsap.set(front, { z: 0, scale: 1 });
}

function ease(t: number) {
  return t * t * (3 - 2 * t);
}

function stateFor(progress: number) {
  if (progress <= OPEN_END) {
    return {
      edge: EDGE_BOTTOM + (EDGE_TOP - EDGE_BOTTOM) * ease(progress / OPEN_END),
      side: 1,
    };
  }

  if (progress <= HOLD_END) {
    return { edge: EDGE_TOP, side: 1 };
  }

  return {
    edge:
      EDGE_BOTTOM +
      (EDGE_TOP - EDGE_BOTTOM) * ease((progress - HOLD_END) / (1 - HOLD_END)),
    side: -1,
  };
}

function addDepth(
  timeline: gsap.core.Timeline,
  back: HTMLElement,
  front: HTMLElement
) {
  const mobile = () => window.matchMedia('(max-width: 860px)').matches;

  timeline
    .fromTo(
      back,
      {
        yPercent: () => (mobile() ? -2 : -3),
        xPercent: () => BASE_X,
      },
      {
        yPercent: () => (mobile() ? 2 : 3),
        xPercent: () => BASE_X - (mobile() ? 0.5 : 1),
        duration: 1,
        ease: 'none',
      },
      0
    )
    .fromTo(
      front,
      {
        yPercent: () => (mobile() ? 5 : 7),
        xPercent: () => BASE_X,
      },
      {
        yPercent: () => (mobile() ? -5 : -7),
        xPercent: () => BASE_X + (mobile() ? 0.5 : 1),
        duration: 1,
        ease: 'none',
      },
      0
    );
}

function setupPinned(
  section: HTMLElement,
  scene: HTMLElement,
  back: HTMLElement,
  front: HTMLElement,
  burn: CoverBurn
) {
  const mobile = () => window.matchMedia('(max-width: 860px)').matches;
  const content = section.querySelector<HTMLElement>('.interlude__content');
  const photoContent = section.querySelector<HTMLElement>(
    '[data-interlude-content="photo"]'
  );
  const paperContent = section.querySelector<HTMLElement>(
    '[data-interlude-content="paper"]'
  );
  let phase = -1;

  const applyBurn = (progress: number) => {
    const nextPhase = progress > HOLD_END ? 2 : progress > OPEN_END ? 1 : 0;
    const state = stateFor(progress);
    const immediate = nextPhase !== phase;
    phase = nextPhase;
    burn.setState(state.edge, state.side, immediate);
  };

  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top top',
      end: () => (mobile() ? '+=125%' : '+=165%'),
      pin: true,
      pinSpacing: true,
      scrub: 0.75,
      anticipatePin: 1,
      invalidateOnRefresh: true,
      onUpdate: (self) => applyBurn(self.progress),
      onRefresh: (self) => applyBurn(self.progress),
    },
  });

  addDepth(timeline, back, front);

  timeline
    .fromTo(
      scene,
      { rotateX: 1.4 },
      { rotateX: 0, duration: OPEN_END, ease: 'none' },
      0
    )
    .fromTo(
      scene,
      { rotateX: 0 },
      {
        rotateX: -1.4,
        duration: 1 - HOLD_END,
        ease: 'none',
        immediateRender: false,
      },
      HOLD_END
    );

  if (content) {
    gsap.set(content, { yPercent: 0 });

    timeline
      .fromTo(
        content,
        { yPercent: 0 },
        { yPercent: () => (mobile() ? -2 : -3), duration: 0.5, ease: 'none' },
        0
      )
      .to(content, { yPercent: 0, duration: 0.5, ease: 'none' }, 0.5);
  }

  if (photoContent) {
    gsap.set(photoContent, { opacity: 0 });
    timeline
      .to(photoContent, { opacity: 1, duration: 0.12, ease: 'none' }, 0.18)
      .to(photoContent, { opacity: 0, duration: 0.1, ease: 'none' }, 0.58);
  }

  if (paperContent) {
    gsap.set(paperContent, { opacity: 1 });
    timeline
      .to(paperContent, { opacity: 0, duration: 0.12, ease: 'none' }, 0.03)
      .to(paperContent, { opacity: 1, duration: 0.1, ease: 'none' }, 0.78);
  }
}

function setupParallax(
  section: HTMLElement,
  scene: HTMLElement,
  back: HTMLElement,
  front: HTMLElement
) {
  const timeline = gsap.timeline({
    scrollTrigger: {
      trigger: section,
      start: 'top bottom',
      end: 'bottom top',
      scrub: true,
      invalidateOnRefresh: true,
    },
  });

  addDepth(timeline, back, front);

  timeline.fromTo(
    scene,
    { rotateX: 1 },
    { rotateX: -1, duration: 1, ease: 'none' },
    0
  );
}

export function initInterlude() {
  const section = document.querySelector<HTMLElement>('[data-interlude]');
  const scene = section?.querySelector<HTMLElement>('[data-interlude-scene]');
  const canvas = section?.querySelector<HTMLCanvasElement>('[data-interlude-canvas]');
  const back = scene?.querySelector<HTMLElement>('[data-interlude-depth="back"]');
  const front = scene?.querySelector<HTMLElement>('[data-interlude-depth="front"]');

  if (!section || !scene || !canvas || !back || !front) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    section.classList.add('no-burn');
    return;
  }

  setLayerDepths(scene, back, front);

  const burn = createCoverBurn(section, canvas);

  if (burn) {
    setupPinned(section, scene, back, front, burn);
  } else {
    section.classList.add('no-burn');
    setupParallax(section, scene, back, front);
  }

  ScrollTrigger.refresh();
}
