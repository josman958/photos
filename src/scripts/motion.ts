import gsap from 'gsap';
import ScrollTrigger from 'gsap/ScrollTrigger';
import ScrollSmoother from 'gsap/ScrollSmoother';
import { SplitText } from 'gsap/SplitText';
import { initHeroBurn } from './burn';
import { initInterlude } from './interlude';

gsap.registerPlugin(ScrollTrigger, ScrollSmoother, SplitText);

const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initReveals() {
  document.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element) => {
    gsap.from(element, {
      y: 28,
      autoAlpha: 0,
      duration: 1.05,
      ease: 'power3.out',
      overwrite: 'auto',
      scrollTrigger: {
        trigger: element,
        start: 'top 88%',
        once: true,
      },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-reveal-media]').forEach((element) => {
    gsap.from(element, {
      clipPath: 'inset(0 0 100% 0)',
      duration: 1.2,
      ease: 'power4.inOut',
      scrollTrigger: {
        trigger: element,
        start: 'top 90%',
        once: true,
      },
    });
  });

  document.querySelectorAll<HTMLElement>('[data-split]').forEach((element) => {
    try {
      SplitText.create(element, {
        type: 'lines',
        mask: 'lines',
        linesClass: 'split-line',
      });

      gsap.from(element.querySelectorAll('.split-line'), {
        yPercent: 112,
        duration: 1.1,
        stagger: 0.08,
        ease: 'power4.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 86%',
          once: true,
        },
      });
    } catch {
      gsap.from(element, {
        y: 26,
        autoAlpha: 0,
        duration: 1,
        ease: 'power3.out',
        scrollTrigger: {
          trigger: element,
          start: 'top 86%',
          once: true,
        },
      });
    }
  });
}

function initParallax() {
  document.querySelectorAll<HTMLElement>('[data-parallax]').forEach((element) => {
    const speed = Number.parseFloat(element.dataset.parallax || '0.1');
    if (!Number.isFinite(speed) || speed === 0) return;

    const scope =
      element.closest<HTMLElement>('[data-parallax-scope]') ?? element.parentElement;
    if (!scope) return;

    const distance = Math.min(speed * 35, 7);

    gsap.fromTo(
      element,
      { yPercent: -distance },
      {
        yPercent: distance,
        ease: 'none',
        scrollTrigger: {
          trigger: scope,
          start: 'top bottom',
          end: 'bottom top',
          scrub: true,
          invalidateOnRefresh: true,
        },
      }
    );
  });
}

function initHeroLoad() {
  const content = document.querySelector<HTMLElement>('[data-hero-content]');
  if (!content) return;

  gsap.from(
    [
      content.querySelector('.hero__top'),
      content.querySelector('.hero__title'),
      content.querySelector('.hero__bottom'),
    ],
    {
      y: 34,
      autoAlpha: 0,
      duration: 1.15,
      stagger: 0.12,
      delay: 0.15,
      ease: 'power3.out',
      overwrite: 'auto',
    }
  );

  const index = document.querySelector('.hero__index');
  if (index) {
    gsap.from(index, {
      autoAlpha: 0,
      duration: 1.2,
      delay: 0.65,
      ease: 'power2.out',
    });
  }
}

function initMarquee() {
  const track = document.querySelector<HTMLElement>('[data-marquee]');
  if (!track) return;

  gsap.to(track, {
    xPercent: -50,
    duration: 34,
    ease: 'none',
    repeat: -1,
  });
}

export async function initMotion() {
  if (reduceMotion) return;

  ScrollTrigger.config({ ignoreMobileResize: true });

  ScrollSmoother.create({
    wrapper: '#smooth-wrapper',
    content: '#smooth-content',
    smooth: 1.15,
    smoothTouch: 0,
    effects: false,
    normalizeScroll: false,
  });

  // El interlude se prepara antes de fuentes para que su pin no mueva el layout.
  initInterlude();

  await document.fonts.ready;

  initHeroLoad();
  initReveals();
  initParallax();
  initMarquee();
  initHeroBurn();

  ScrollTrigger.refresh();

  window.addEventListener('load', () => {
    ScrollTrigger.refresh();
  });

  window.setTimeout(() => ScrollTrigger.refresh(), 600);
}
