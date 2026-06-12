// Template: Frame
// Thick colored border around template, glass info panel at bottom inside the frame
import { createBadge, createPrice, createAddress, createMetricCards } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderFrame(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-frame';

  const BORDER = 60;

  // Colored border (solid background, photo inset inside)
  container.style.background = AC;

  // Photo inset
  const photoArea = document.createElement('div');
  photoArea.className = 'tpl-photo-frame';
  photoArea.style.position = 'absolute';
  photoArea.style.top = BORDER + 'px';
  photoArea.style.left = BORDER + 'px';
  photoArea.style.right = BORDER + 'px';
  photoArea.style.bottom = BORDER + 'px';
  photoArea.style.borderRadius = '16px';
  photoArea.style.overflow = 'hidden';

  const img = document.createElement('img');
  img.src = photoUrl;
  img.alt = '';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  img.style.display = 'block';
  photoArea.appendChild(img);

  // Gradient overlay on photo for bottom readability
  const grad = document.createElement('div');
  grad.className = 'tpl-overlay';
  grad.style.cssText = 'position:absolute;bottom:0;left:0;right:0;top:auto;height:60%;background:linear-gradient(to top, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.0) 100%)';
  photoArea.appendChild(grad);

  container.appendChild(photoArea);

  // Badge on photo (top-right) — positioned on container, not inside overflow:hidden photoArea
  if (data.contract) {
    const badge = createBadge(data.contract, {
      variant: 'white',
      fontFamily: FONT,
      fontSize: 31,
      paddingX: 24,
      paddingY: 12,
      radius: 8,
    });
    badge.style.color = AC;
    badge.style.position = 'absolute';
    badge.style.top = (BORDER + 32) + 'px';
    badge.style.right = (BORDER + 32) + 'px';
    badge.style.zIndex = '2';
    container.appendChild(badge);
  }

  // Glass info panel — positioned on container, not inside overflow:hidden photoArea
  const panel = document.createElement('div');
  panel.className = 'tpl-glass-panel';
  panel.style.position = 'absolute';
  panel.style.bottom = (BORDER + 32) + 'px';
  panel.style.left = (BORDER + 32) + 'px';
  panel.style.right = (BORDER + 32) + 'px';
  panel.style.boxSizing = 'border-box';
  panel.style.padding = '32px';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.gap = '24px';
  panel.style.overflow = 'hidden';
  panel.style.zIndex = '2';

  // Price
  if (data.price) {
    const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
    price.style.fontSize = '72px';
    price.style.fontWeight = '700';
    price.style.lineHeight = '72px';
    price.style.color = '#ffffff';
    price.style.whiteSpace = 'nowrap';
    price.style.marginTop = '16px';
    panel.appendChild(price);
  }

  // Title
  const title = document.createElement('h2');
  title.className = 'tpl-title';
  title.textContent = data.title;
  title.style.fontFamily = FONT;
  title.style.fontSize = '48px';
  title.style.fontWeight = '600';
  title.style.lineHeight = '60px';
  title.style.color = '#ffffff';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '2';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  title.style.margin = '0';
  panel.appendChild(title);

  // Address
  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'white',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 28,
    });
    addr.style.whiteSpace = 'nowrap';
    panel.appendChild(addr);
  }

  // Metric cards
  const metrics = createMetricCards(data, {
    variant: 'glass',
    fontFamily: FONT,
    gap: 12,
    iconSize: 32,
    valueSize: 36,
    radius: 14,
    innerGap: 24,
    showLabels: false,
    iconOnTop: false,
  });
  metrics.querySelectorAll('.tpl-metric-card').forEach(card => {
    card.style.border = '1px solid rgba(255,255,255,0.3)';
    card.style.minHeight = '110px';
    card.style.height = 'auto';
  });
  panel.appendChild(metrics);

  container.appendChild(panel);
  return container;
}
