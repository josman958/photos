import ScrollSmoother from 'gsap/ScrollSmoother';

export function initLightbox() {
  const dialog = document.querySelector<HTMLDialogElement>('[data-lightbox]');
  const image = document.querySelector<HTMLImageElement>('[data-lightbox-image]');
  const caption = document.querySelector<HTMLElement>('[data-lightbox-caption]');
  const count = document.querySelector<HTMLElement>('[data-lightbox-count]');
  const items = Array.from(
    document.querySelectorAll<HTMLButtonElement>('[data-lightbox-item]')
  );

  if (!dialog || !image || !items.length) return;

  let current = 0;
  let lastFocused: HTMLElement | null = null;

  const render = (nextIndex: number) => {
    current = (nextIndex + items.length) % items.length;
    const item = items[current];

    image.src = item.dataset.full || '';
    image.alt = item.dataset.alt || '';
    image.decoding = 'async';

    if (caption) {
      caption.textContent = `${item.dataset.title || ''} — ${item.dataset.meta || ''}`;
    }

    if (count) {
      count.textContent = `${String(current + 1).padStart(2, '0')} / ${String(
        items.length
      ).padStart(2, '0')}`;
    }
  };

  const open = (index: number) => {
    lastFocused = document.activeElement as HTMLElement | null;
    render(index);
    dialog.showModal();
    document.body.classList.add('lightbox-open');
    ScrollSmoother.get()?.paused(true);
    dialog.querySelector<HTMLElement>('[data-lightbox-close]')?.focus();
  };

  const close = () => {
    if (!dialog.open) return;
    dialog.close();
    document.body.classList.remove('lightbox-open');
    ScrollSmoother.get()?.paused(false);
    lastFocused?.focus({ preventScroll: true });
  };

  items.forEach((item, index) => {
    item.addEventListener('click', () => open(index));
  });

  dialog.querySelector('[data-lightbox-close]')?.addEventListener('click', close);
  dialog
    .querySelector('[data-lightbox-prev]')
    ?.addEventListener('click', () => render(current - 1));
  dialog
    .querySelector('[data-lightbox-next]')
    ?.addEventListener('click', () => render(current + 1));

  dialog.addEventListener('click', (event) => {
    if (event.target === dialog) close();
  });

  dialog.querySelector('.lightbox__stage')?.addEventListener('click', (event) => {
    if (event.target === event.currentTarget) close();
  });

  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });

  document.addEventListener('keydown', (event) => {
    if (!dialog.open) return;

    if (event.key === 'ArrowLeft') {
      event.preventDefault();
      render(current - 1);
    }

    if (event.key === 'ArrowRight') {
      event.preventDefault();
      render(current + 1);
    }
  });
}
