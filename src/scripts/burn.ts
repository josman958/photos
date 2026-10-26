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

const FRAGMENT_SHADER = `
precision highp float;

varying vec2 vUv;

uniform sampler2D uTexture;
uniform vec2 uResolution;
uniform vec2 uImageSize;
uniform float uProgress;
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

vec2 coverUv(vec2 uv) {
  float canvasAspect = uResolution.x / uResolution.y;
  float imageAspect = uImageSize.x / uImageSize.y;
  vec2 scale = vec2(1.0);

  if (canvasAspect > imageAspect) {
    scale.y = imageAspect / canvasAspect;
  } else {
    scale.x = canvasAspect / imageAspect;
  }

  return (uv - 0.5) * scale + 0.5;
}

void main() {
  vec2 uv = vUv;
  vec2 warp = vec2(
    fbm(uv * 3.2 + vec2(0.0, uTime * 0.012)),
    fbm(uv * 3.2 + vec2(5.2, 1.3))
  );
  float grainNoise = fbm(uv * vec2(5.0, 3.6) + warp * 1.4);

  float front = -0.18 + uProgress * 1.36;
  float edgeNoise = (noise(uv * 34.0 + uTime * 0.4) - 0.5) * 0.018;
  float edge = front + (grainNoise - 0.5) * 0.22 + (warp.x - 0.5) * 0.05 + edgeNoise;

  if (uv.y < edge) discard;

  float distance = uv.y - edge;
  float charAmount = smoothstep(0.0, 0.16, distance);
  float distortion = 1.0 - smoothstep(0.0, 0.06, distance);

  vec2 textureUv = coverUv(uv);
  textureUv.x += (warp.y - 0.5) * 0.012 * distortion;
  textureUv.y += (warp.x - 0.5) * 0.006 * distortion;

  vec3 color = texture2D(uTexture, textureUv).rgb;
  color = mix(color * vec3(0.18, 0.11, 0.07), color, charAmount);

  float scorch = 1.0 - smoothstep(0.0, 0.28, distance);
  color = mix(color, color * vec3(0.55, 0.38, 0.26), scorch * 0.35);

  float smoke = (1.0 - smoothstep(0.0, 0.17, distance)) * smoothstep(0.0, 0.03, distance);
  color = mix(color, vec3(0.18, 0.14, 0.11), smoke * 0.2);

  float ember = 1.0 - smoothstep(0.0, 0.022, distance);
  float flicker = 0.65 + 0.35 * sin(uTime * 7.0 + grainNoise * 30.0);
  vec3 emberColor = mix(
    vec3(0.92, 0.16, 0.01),
    vec3(1.0, 0.76, 0.3),
    smoothstep(0.0, 0.02, distance)
  );
  color += emberColor * ember * flicker * 1.2;

  vec2 sparkCells = uv * uResolution / 18.0;
  vec2 sparkId = floor(sparkCells);
  vec2 sparkPos = fract(sparkCells) - 0.5;
  float sparkRand = hash(sparkId + vec2(floor(uTime * 3.0) * 17.0));
  float sparkDot = smoothstep(0.12, 0.0, length(sparkPos));
  float sparks =
    step(0.965, sparkRand) *
    sparkDot *
    (1.0 - smoothstep(0.0, 0.2, distance));
  color += vec3(1.0, 0.5, 0.1) * sparks * 1.8;

  float filmGrain = (hash(gl_FragCoord.xy + fract(uTime) * 100.0) - 0.5) * 0.05;
  color += filmGrain;

  vec2 vignetteUv = (uv - 0.5) * vec2(1.12, 1.0);
  float vignette = smoothstep(1.25, 0.45, length(vignetteUv));
  color *= mix(0.74, 1.0, vignette);

  color = mix(color, color * vec3(1.04, 1.0, 0.94), 0.5);

  gl_FragColor = vec4(color, 1.0);
}
`;

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
    console.error('Error compilando shader:', gl.getShaderInfoLog(shader));
    gl.deleteShader(shader);
    return null;
  }

  return shader;
}

export function initHeroBurn() {
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const canvas = document.querySelector<HTMLCanvasElement>('[data-hero-canvas]');
  const fallbackImage = document.querySelector<HTMLImageElement>(
    '[data-hero-fallback] img'
  );
  const content = document.querySelector<HTMLElement>('[data-hero-content]');
  const shade = document.querySelector<HTMLElement>('[data-hero-shade]');
  const heroIndex = document.querySelector<HTMLElement>('.hero__index');

  if (!hero || !canvas) return;

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (reduceMotion) {
    hero.classList.add('no-burn');
    return;
  }

  if (!fallbackImage) {
    hero.classList.add('no-burn');
    return;
  }

  const gl = canvas.getContext('webgl', {
    alpha: true,
    antialias: false,
    depth: false,
    premultipliedAlpha: false,
    powerPreference: 'high-performance',
  });

  if (!gl) {
    hero.classList.add('no-burn');
    return;
  }

  const vertexShader = compileShader(gl, gl.VERTEX_SHADER, VERTEX_SHADER);
  const fragmentShader = compileShader(gl, gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
  if (!vertexShader || !fragmentShader) {
    hero.classList.add('no-burn');
    return;
  }

  const program = gl.createProgram();
  if (!program) {
    hero.classList.add('no-burn');
    return;
  }

  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);
  gl.deleteShader(vertexShader);
  gl.deleteShader(fragmentShader);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('Error enlazando programa:', gl.getProgramInfoLog(program));
    hero.classList.add('no-burn');
    return;
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
    texture: gl.getUniformLocation(program, 'uTexture'),
    resolution: gl.getUniformLocation(program, 'uResolution'),
    imageSize: gl.getUniformLocation(program, 'uImageSize'),
    progress: gl.getUniformLocation(program, 'uProgress'),
    time: gl.getUniformLocation(program, 'uTime'),
  };

  const texture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE0);
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
  gl.uniform1i(uniforms.texture, 0);

  let targetProgress = 0;
  let currentProgress = 0;
  let visible = true;
  let hasDrawn = false;
  let imageWidth = 1;
  let imageHeight = 1;

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

    const delta = targetProgress - currentProgress;
    const atRest = Math.abs(delta) < 0.0005;

    if (
      hasDrawn &&
      atRest &&
      (currentProgress < 0.005 || currentProgress > 0.995)
    ) {
      return;
    }

    currentProgress += delta * 0.12;

    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.uniform1f(uniforms.progress, currentProgress);
    gl.uniform1f(uniforms.time, time);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
    hasDrawn = true;
  };

  const setupScroll = () => {
    const isMobile = () => window.matchMedia('(max-width: 860px)').matches;

    const timeline = gsap.timeline({
      scrollTrigger: {
        trigger: hero,
        start: 'top top',
        end: () => (isMobile() ? '+=78%' : '+=115%'),
        pin: true,
        pinSpacing: true,
        scrub: 0.65,
        anticipatePin: 1,
        invalidateOnRefresh: true,
        onUpdate: (self) => {
          targetProgress = self.progress;
          document.documentElement.classList.toggle(
            'hero-burned',
            self.progress > 0.55
          );
        },
        onRefresh: (self) => {
          targetProgress = self.progress;
        },
      },
    });

    if (content) {
      timeline.to(
        content,
        {
          autoAlpha: 0,
          y: -50,
          duration: 0.35,
          ease: 'power2.in',
          overwrite: 'auto',
        },
        0
      );
    }

    timeline.to(
      [shade, heroIndex].filter(Boolean),
      {
        autoAlpha: 0,
        duration: 0.3,
        ease: 'power2.in',
        overwrite: 'auto',
      },
      0
    );

    const paperInner = hero.querySelector<HTMLElement>('.hero__paper-inner');
    if (paperInner) {
      gsap.set(paperInner, { autoAlpha: 0 });
      timeline.to(
        paperInner,
        {
          autoAlpha: 1,
          duration: 0.2,
          ease: 'power2.out',
        },
        0.55
      );
    }

    timeline.to({}, { duration: 1 }, 0);

    ScrollTrigger.refresh();
  };

  const uploadTexture = () => {
    imageWidth = fallbackImage.naturalWidth || fallbackImage.width || 1;
    imageHeight = fallbackImage.naturalHeight || fallbackImage.height || 1;

    if (!imageWidth || !imageHeight) {
      hero.classList.add('no-burn');
      return;
    }

    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      fallbackImage
    );
    gl.uniform2f(uniforms.imageSize, imageWidth, imageHeight);

    resize();
    draw(0);
    hero.classList.add('is-webgl');
    setupScroll();

    gsap.ticker.add(draw);
  };

  const start = async () => {
    try {
      if (typeof fallbackImage.decode === 'function') {
        await fallbackImage.decode();
      } else if (!fallbackImage.complete) {
        await new Promise<void>((resolve, reject) => {
          fallbackImage.addEventListener('load', () => resolve(), { once: true });
          fallbackImage.addEventListener('error', () => reject(), { once: true });
        });
      }

      if (!fallbackImage.naturalWidth) {
        throw new Error('La imagen del hero no tiene dimensiones.');
      }

      uploadTexture();
    } catch {
      hero.classList.add('no-burn');
      console.warn('No se pudo cargar la textura del hero.');
    }
  };

  start();

  const observer = new IntersectionObserver(
    ([entry]) => {
      visible = entry.isIntersecting;
    },
    { rootMargin: '180px' }
  );
  observer.observe(hero);

  window.addEventListener('resize', resize, { passive: true });

  canvas.addEventListener('webglcontextlost', (event) => {
    event.preventDefault();
    hero.classList.remove('is-webgl');
    visible = false;
  });
}
