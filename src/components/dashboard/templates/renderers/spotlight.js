// Template: Spotlight
// Photo inside a rounded-rectangle inset, dark bg around it, info below
import { createPrice, createAddress, createMetricsInline } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderSpotlight(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-spotlight';
  container.style.background = AC;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.boxSizing = 'border-box';
  container.style.padding = '60px';
  container.style.gap = '24px';
  container.style.overflow = 'hidden';

  // ── Photo inset area (fills available space) ──
  const photoFrame = document.createElement('div');
  photoFrame.className = 'tpl-photo-frame';
  photoFrame.style.flex = '1';
  photoFrame.style.minHeight = '0';
  photoFrame.style.borderRadius = '32px';
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

  // Badge inside photo with padding from edges
  if (data.contract) {
    const badge = document.createElement('div');
    badge.className = 'tpl-badge';
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
    badge.style.zIndex = '1';
    badge.textContent = data.contract.toUpperCase();
    photoFrame.appendChild(badge);
  }

  container.appendChild(photoFrame);

  // ── Info section below photo ──
  const info = document.createElement('div');
  info.style.display = 'flex';
  info.style.flexDirection = 'column';
  info.style.gap = '20px';
  info.style.flexShrink = '0';
  info.style.overflow = 'hidden';

  // Price
  if (data.price) {
    const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
    price.style.fontSize = '80px';
    price.style.fontWeight = '700';
    price.style.lineHeight = '80px';
    price.style.color = '#ffffff';
    price.style.whiteSpace = 'nowrap';
    price.style.marginTop = '16px';
    info.appendChild(price);
  }

  // Title + Address
  const textRow = document.createElement('div');
  textRow.style.display = 'flex';
  textRow.style.flexDirection = 'column';
  textRow.style.gap = '16px';
  textRow.style.maxWidth = '100%';
  textRow.style.overflow = 'hidden';

  const title = document.createElement('h2');
  title.className = 'tpl-title';
  title.textContent = data.title;
  title.style.fontFamily = FONT;
  title.style.fontSize = '42px';
  title.style.fontWeight = '600';
  title.style.lineHeight = '52px';
  title.style.color = '#ffffff';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '1';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  title.style.margin = '0';
  textRow.appendChild(title);

  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'white',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 28,
      maxLines: 1,
    });
    addr.style.opacity = '0.7';
    textRow.appendChild(addr);
  }

  info.appendChild(textRow);

  // Inline metrics
  const inline = createMetricsInline(data, {
    fontFamily: FONT,
    color: 'rgba(255,255,255,0.6)',
    fontSize: 28,
  });
  if (inline) {
    info.appendChild(inline);
  }

  container.appendChild(info);
  return container;
}
