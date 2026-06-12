// Template: Minimal
// Nearly no overlay, small floating glass card at bottom-right, badge at top-left
import { createCover, createBadge, createPrice, createAddress, createMetricsInline } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderMinimal(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-minimal';

  // Cover photo (dominates visual)
  container.appendChild(createCover(photoUrl));

  // Very subtle overlay — just enough for text readability at bottom-right
  const overlay = document.createElement('div');
  overlay.className = 'tpl-overlay';
  overlay.style.background = 'linear-gradient(135deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.1) 40%, rgba(0,0,0,0.5) 100%)';
  container.appendChild(overlay);

  // Badge floating top-left
  if (data.contract) {
    const badge = createBadge(data.contract, {
      variant: 'blue',
      fontFamily: FONT,
      fontSize: 31,
      paddingX: 24,
      paddingY: 12,
      radius: 8,
    });
    badge.style.background = AC;
    badge.style.position = 'absolute';
    badge.style.top = '60px';
    badge.style.left = '60px';
    badge.style.zIndex = '3';
    container.appendChild(badge);
  }

  // Floating glass card at bottom-right
  const card = document.createElement('div');
  card.className = 'tpl-glass-panel';
  card.style.position = 'absolute';
  card.style.bottom = '60px';
  card.style.right = '60px';
  card.style.width = '520px';
  card.style.boxSizing = 'border-box';
  card.style.padding = '40px';
  card.style.display = 'flex';
  card.style.flexDirection = 'column';
  card.style.gap = '16px';
  card.style.zIndex = '2';
  card.style.overflow = 'hidden';

  // Price
  if (data.price) {
    const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
    price.style.fontSize = '64px';
    price.style.fontWeight = '700';
    price.style.lineHeight = '64px';
    price.style.color = '#ffffff';
    price.style.whiteSpace = 'nowrap';
    card.appendChild(price);
  }

  // Title
  const title = document.createElement('h2');
  title.className = 'tpl-title';
  title.textContent = data.title;
  title.style.fontFamily = FONT;
  title.style.fontSize = '38px';
  title.style.fontWeight = '600';
  title.style.lineHeight = '48px';
  title.style.color = '#ffffff';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '2';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  title.style.margin = '0';
  card.appendChild(title);

  // Address
  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'white',
      fontFamily: FONT,
      iconSize: 20,
      fontSize: 24,
      maxLines: 1,
    });
    card.appendChild(addr);
  }

  // Thin separator
  const sep = document.createElement('div');
  sep.style.height = '1px';
  sep.style.background = 'rgba(255,255,255,0.3)';
  card.appendChild(sep);

  // Inline metrics
  const inline = createMetricsInline(data, {
    fontFamily: FONT,
    color: 'rgba(255,255,255,0.8)',
    fontSize: 24,
  });
  if (inline) {
    card.appendChild(inline);
  }

  container.appendChild(card);
  return container;
}
