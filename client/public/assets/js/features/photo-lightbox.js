/**
 * Full-screen photo viewer — guest browse preview and admin photo grids.
 */

let root = null;
let imgEl = null;
let counterEl = null;
let prevBtn = null;
let nextBtn = null;
let returnFocus = null;
let inited = false;

const state = { images: [], index: 0, alt: 'Photo' };

function ensureDom() {
  if (root) return;
  root = document.createElement('div');
  root.id = 'photo-lightbox';
  root.className = 'photo-lightbox';
  root.hidden = true;
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = `
    <button type="button" class="photo-lightbox__backdrop" data-lightbox-close aria-label="Close fullscreen"></button>
    <div class="photo-lightbox__panel" role="dialog" aria-modal="true" aria-label="Photo viewer">
      <button type="button" class="photo-lightbox__close" data-lightbox-close aria-label="Close">
        <span class="material-symbols-outlined">close</span>
      </button>
      <div class="photo-lightbox__stage">
        <img class="photo-lightbox__img" src="" alt="" />
        <button type="button" class="photo-lightbox__nav photo-lightbox__nav--prev" data-lightbox-prev aria-label="Previous photo">
          <span class="material-symbols-outlined">chevron_left</span>
        </button>
        <button type="button" class="photo-lightbox__nav photo-lightbox__nav--next" data-lightbox-next aria-label="Next photo">
          <span class="material-symbols-outlined">chevron_right</span>
        </button>
        <p class="photo-lightbox__counter"></p>
      </div>
    </div>`;
  document.body.appendChild(root);

  imgEl = root.querySelector('.photo-lightbox__img');
  counterEl = root.querySelector('.photo-lightbox__counter');
  prevBtn = root.querySelector('[data-lightbox-prev]');
  nextBtn = root.querySelector('[data-lightbox-next]');

  root.addEventListener('click', (e) => {
    if (e.target.closest('[data-lightbox-close]')) {
      closePhotoLightbox();
      return;
    }
    if (e.target.closest('[data-lightbox-prev]')) {
      step(-1);
      return;
    }
    if (e.target.closest('[data-lightbox-next]')) {
      step(1);
    }
  });

  let touchX = null;
  const stage = root.querySelector('.photo-lightbox__stage');
  stage?.addEventListener('touchstart', (e) => {
    touchX = e.changedTouches[0]?.clientX ?? null;
  }, { passive: true });
  stage?.addEventListener('touchend', (e) => {
    if (touchX == null) return;
    const dx = (e.changedTouches[0]?.clientX ?? touchX) - touchX;
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1);
    touchX = null;
  }, { passive: true });

  document.addEventListener('keydown', onKeydown);
}

function onKeydown(e) {
  if (root?.hidden) return;
  if (e.key === 'Escape') {
    e.stopPropagation();
    closePhotoLightbox();
    return;
  }
  if (e.key === 'ArrowLeft') {
    e.stopPropagation();
    step(-1);
  }
  if (e.key === 'ArrowRight') {
    e.stopPropagation();
    step(1);
  }
}

function paint() {
  const { images, index, alt } = state;
  if (!images.length || !imgEl) return;
  imgEl.src = images[index];
  imgEl.alt = `${alt} — photo ${index + 1} of ${images.length}`;
  if (counterEl) {
    counterEl.textContent = `${index + 1} / ${images.length}`;
    counterEl.classList.toggle('is-hidden', images.length < 2);
  }
  prevBtn?.classList.toggle('is-hidden', images.length < 2);
  nextBtn?.classList.toggle('is-hidden', images.length < 2);
}

function step(delta) {
  const len = state.images.length;
  if (len < 2) return;
  state.index = (state.index + delta + len) % len;
  paint();
}

function openFromThumb(thumb) {
  const grid = thumb?.closest('.mf-photo-grid');
  if (!grid || !thumb) return;
  const thumbs = [...grid.querySelectorAll('.mf-photo-thumb')];
  const imgs = thumbs.map((t) => t.querySelector('img')?.src).filter(Boolean);
  const idx = thumbs.indexOf(thumb);
  const alt = thumb.querySelector('img')?.alt || 'Photo';
  openPhotoLightbox({ images: imgs, index: Math.max(0, idx), alt });
}

function onDocClick(e) {
  const expandBtn = e.target.closest('[data-photo-expand]');
  if (expandBtn) {
    e.preventDefault();
    e.stopPropagation();
    openFromThumb(expandBtn.closest('.mf-photo-thumb'));
    return;
  }
  const img = e.target.closest('.mf-photo-thumb img');
  if (img && !e.target.closest('.mf-photo-actions, [data-photo-expand], label')) {
    e.preventDefault();
    e.stopPropagation();
    openFromThumb(img.closest('.mf-photo-thumb'));
  }
}

export function openPhotoLightbox({ images, index = 0, alt = 'Photo' } = {}) {
  const list = Array.isArray(images) ? images.filter(Boolean) : [];
  if (!list.length) return;
  ensureDom();
  returnFocus = document.activeElement;
  state.images = list;
  state.index = Math.max(0, Math.min(index, list.length - 1));
  state.alt = alt;
  paint();
  root.hidden = false;
  root.setAttribute('aria-hidden', 'false');
  document.body.classList.add('photo-lightbox-open');
  root.querySelector('.photo-lightbox__close')?.focus?.();
}

export function closePhotoLightbox() {
  if (!root || root.hidden) return;
  root.hidden = true;
  root.setAttribute('aria-hidden', 'true');
  document.body.classList.remove('photo-lightbox-open');
  if (imgEl) imgEl.removeAttribute('src');
  state.images = [];
  state.index = 0;
  if (returnFocus && typeof returnFocus.focus === 'function') returnFocus.focus();
  returnFocus = null;
}

export function isPhotoLightboxOpen() {
  return Boolean(root && !root.hidden);
}

export function initPhotoLightbox() {
  ensureDom();
  if (inited) return;
  inited = true;
  document.addEventListener('click', onDocClick);
}
