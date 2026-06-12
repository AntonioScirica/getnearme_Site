// Template: Polaroid
// White thick frame like a Polaroid photo, info text on wide white bottom area
import { createPrice, createAddress, createMetricsInline } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderPolaroid(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-polaroid';
  container.style.background = '#ffffff';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.boxSizing = 'border-box';
  container.style.padding = '60px';
  container.style.gap = '24px';
  container.style.overflow = 'hidden';

  // ── Photo area (fills ~65% of space) ──
  const photoFrame = document.createElement('div');
  photoFrame.style.flex = '1.8';
  photoFrame.style.minHeight = '0';
  photoFrame.style.borderRadius = '12px';
  photoFrame.style.overflow = 'hidden';
  photoFrame.style.position = 'relative';

  const img = document.createElement('img');
  img.src = photoUrl;
  img.alt = '';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  img.style.display = 'block';
  photoFrame.appendChild(img);

  // Subtle gradient at bottom of photo for contrast
  const photoGrad = document.createElement('div');
  photoGrad.style.position = 'absolute';
  photoGrad.style.bottom = '0';
  photoGrad.style.left = '0';
  photoGrad.style.right = '0';
  photoGrad.style.height = '200px';
  photoGrad.style.background = 'linear-gradient(to top, rgba(0,0,0,0.3) 0%, transparent 100%)';
  photoFrame.appendChild(photoGrad);

  // Badge on photo (top-left)
  if (data.contract) {
    const badge = document.createElement('div');
    badge.style.position = 'absolute';
    badge.style.top = '24px';
    badge.style.left = '24px';
    badge.style.background = AC;
    badge.style.borderRadius = '8px';
    badge.style.padding = '12px 24px';
    badge.style.fontFamily = FONT;
    badge.style.fontSize = '31px';
    badge.style.fontWeight = '600';
    badge.style.color = '#ffffff';
    badge.textContent = data.contract.toUpperCase();
    photoFrame.appendChild(badge);
  }

  container.appendChild(photoFrame);

  // ── Bottom white area with text info ──
  const info = document.createElement('div');
  info.style.flex = '1';
  info.style.display = 'flex';
  info.style.flexDirection = 'column';
  info.style.justifyContent = 'center';
  info.style.gap = '16px';
  info.style.overflow = 'hidden';
  info.style.flexShrink = '0';
  info.style.minHeight = '0';

  // Price
  if (data.price) {
    const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
    price.style.fontSize = '72px';
    price.style.fontWeight = '700';
    price.style.lineHeight = '72px';
    price.style.color = '#1a1a1a';
    price.style.whiteSpace = 'nowrap';
    info.appendChild(price);
  }

  // Title
  const title = document.createElement('h2');
  title.className = 'tpl-title';
  title.textContent = data.title;
  title.style.fontFamily = FONT;
  title.style.fontSize = '48px';
  title.style.fontWeight = '600';
  title.style.lineHeight = '60px';
  title.style.color = '#1a1a1a';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '1';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  title.style.margin = '0';
  info.appendChild(title);

  // Address
  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'dark',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 28,
      maxLines: 1,
    });
    addr.style.color = '#666666';
    info.appendChild(addr);
  }

  // Inline metrics
  const inline = createMetricsInline(data, {
    fontFamily: FONT,
    color: '#888888',
    fontSize: 28,
  });
  if (inline) {
    info.appendChild(inline);
  }

  container.appendChild(info);
  return container;
}
