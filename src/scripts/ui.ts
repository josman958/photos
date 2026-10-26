import ScrollSmoother from 'gsap/ScrollSmoother';

export function initUI() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  const hero = document.querySelector<HTMLElement>('[data-hero]');
  const progress = document.querySelector<HTMLElement>('[data-scroll-progress]');
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const toggle = document.querySelector<HTMLButtonElement>('[data-menu-toggle]');

  let menuOpen = false;
  let ticking = false;

  const updateHeader = () => {
    if (!header) return;
    const overHero = hero ? hero.getBoundingClientRect().bottom > 100 : false;
    header.classList.toggle('is-solid', !overHero);
  };

  const updateProgress = () => {
    if (!progress) return;
    const max = document.documentElement.scrollHeight - window.innerHeight;
    const y = window.scrollY || window.pageYOffset || 0;
    const value = max > 0 ? Math.min(1, Math.max(0, y / max)) : 0;
    progress.style.transform = `scaleX(${value})`;
  };

  const onScroll = () => {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      updateHeader();
      updateProgress();
      ticking = false;
    });
  };

  const setMenu = (open: boolean) => {
    if (!menu || !toggle) return;
    menuOpen = open;
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    menu.toggleAttribute('inert', !open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    document.body.classList.toggle('menu-open', open);
    document.documentElement.classList.toggle('menu-open', open);
    header?.classList.toggle('is-menu-open', open);

    const smoother = ScrollSmoother.get();
    if (smoother) smoother.paused(open);
  };

  const closeMenu = () => {
    if (menuOpen) setMenu(false);
  };

  if (menu) menu.toggleAttribute('inert', true);

  toggle?.addEventListener('click', () => setMenu(!menuOpen));

  window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeMenu();
  });

  window.addEventListener('resize', () => {
    if (window.innerWidth > 1100) closeMenu();
    onScroll();
  });

  document.querySelectorAll<HTMLAnchorElement>('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href');
      if (!href || href === '#') return;

      const target = document.querySelector<HTMLElement>(href);
      if (!target) return;

      event.preventDefault();
      closeMenu();

      const smoother = ScrollSmoother.get();
      if (smoother) {
        smoother.scrollTo(target, true, 'top 96px');
      } else {
        const top = target.getBoundingClientRect().top + window.scrollY - 96;
        window.scrollTo({ top, behavior: 'smooth' });
      }

      if (href === '#contenido') {
        target.setAttribute('tabindex', '-1');
        window.setTimeout(() => target.focus({ preventScroll: true }), 450);
      }
    });
  });

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('load', onScroll);
  window.addEventListener('hashchange', onScroll);

  updateHeader();
  updateProgress();
  window.setTimeout(onScroll, 120);
}
