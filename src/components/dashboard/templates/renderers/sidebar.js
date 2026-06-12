// Template: Sidebar
// Narrow vertical accent bar on left, photo fills right area, bottom glass panel
import { createCover, createPrice, createAddress, createMetricCards } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderSidebar(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-sidebar';

  // Cover photo (fills entire container)
  container.appendChild(createCover(photoUrl));

  // Dark overlay
  const overlay = document.createElement('div');
  overlay.className = 'tpl-overlay';
  overlay.style.background = 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.15) 50%, rgba(0,0,0,0.7) 100%)';
  container.appendChild(overlay);

  // Left accent bar
  const bar = document.createElement('div');
  bar.style.position = 'absolute';
  bar.style.top = '0';
  bar.style.left = '0';
  bar.style.width = '110px';
  bar.style.height = '100%';
  bar.style.background = AC;
  bar.style.zIndex = '2';
  bar.style.display = 'flex';
  bar.style.alignItems = 'center';
  bar.style.justifyContent = 'center';

  // Rotated badge text on accent bar
  if (data.contract) {
    const rotatedText = document.createElement('div');
    rotatedText.textContent = data.contract.toUpperCase();
    rotatedText.style.fontFamily = FONT;
    rotatedText.style.fontSize = '36px';
    rotatedText.style.fontWeight = '700';
    rotatedText.style.color = '#ffffff';
    rotatedText.style.letterSpacing = '8px';
    rotatedText.style.transform = 'rotate(-90deg)';
    rotatedText.style.whiteSpace = 'nowrap';
    bar.appendChild(rotatedText);
  }

  container.appendChild(bar);

  // Bottom glass panel (full width)
  const panel = document.createElement('div');
  panel.style.position = 'absolute';
  panel.style.left = '0';
  panel.style.right = '0';
  panel.style.bottom = '0';
  panel.style.background = 'rgba(0,0,0,0.6)';
  panel.style.backdropFilter = 'blur(20px)';
  panel.style.webkitBackdropFilter = 'blur(20px)';
  panel.style.zIndex = '2';
  panel.style.boxSizing = 'border-box';
  panel.style.padding = '48px 64px 64px 140px'; // Extra left for sidebar clearance
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.gap = '20px';
  panel.style.overflow = 'hidden';

  // Price
  if (data.price) {
    const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
    price.style.fontSize = '80px';
    price.style.fontWeight = '700';
    price.style.lineHeight = '80px';
    price.style.color = '#ffffff';
    price.style.whiteSpace = 'nowrap';
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
  title.style.webkitLineClamp = '1';
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
      maxLines: 1,
    });
    addr.style.opacity = '0.8';
    panel.appendChild(addr);
  }

  // Metric cards (glass variant)
  const metrics = createMetricCards(data, {
    variant: 'glass',
    fontFamily: FONT,
    gap: 12,
    iconSize: 36,
    valueSize: 40,
    radius: 16,
    innerGap: 32,
    showLabels: false,
    iconOnTop: false,
  });
  metrics.querySelectorAll('.tpl-metric-card').forEach(card => {
    card.style.border = '1px solid rgba(255,255,255,0.2)';
  });
  panel.appendChild(metrics);

  container.appendChild(panel);
  return container;
}
