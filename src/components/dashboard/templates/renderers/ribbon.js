// Template: Ribbon
// Horizontal colored ribbon band across center with price+badge, info above/below
import { createCover, createPrice, createAddress, createMetricCards, createDescription } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderRibbon(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-ribbon';

  // Cover photo
  container.appendChild(createCover(photoUrl));

  // Subtle overlay for readability
  const overlay = document.createElement('div');
  overlay.className = 'tpl-overlay';
  overlay.style.background = 'linear-gradient(180deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.2) 35%, rgba(0,0,0,0.0) 45%, rgba(0,0,0,0.0) 55%, rgba(0,0,0,0.2) 65%, rgba(0,0,0,0.6) 100%)';
  container.appendChild(overlay);

  // Content
  const content = document.createElement('div');
  content.className = 'tpl-content';
  content.style.boxSizing = 'border-box';
  content.style.paddingTop = '60px';
  content.style.paddingLeft = '64px';
  content.style.paddingRight = '64px';
  content.style.paddingBottom = '64px';
  content.style.justifyContent = 'space-between';

  // ── Top section: title + address ──
  const topSection = document.createElement('div');
  topSection.style.display = 'flex';
  topSection.style.flexDirection = 'column';
  topSection.style.gap = '12px';
  topSection.style.maxWidth = '100%';
  topSection.style.overflow = 'hidden';

  const title = document.createElement('h2');
  title.className = 'tpl-title';
  title.textContent = data.title;
  title.style.fontFamily = FONT;
  title.style.fontSize = '62px';
  title.style.fontWeight = '600';
  title.style.lineHeight = '77px';
  title.style.color = '#ffffff';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '2';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  title.style.margin = '0';
  topSection.appendChild(title);

  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'white',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 28,
      maxLines: 1,
    });
    addr.style.lineHeight = '36px';
    topSection.appendChild(addr);
  }

  content.appendChild(topSection);

  // ── Center ribbon band ──
  const ribbon = document.createElement('div');
  ribbon.style.background = AC;
  ribbon.style.borderRadius = '20px';
  ribbon.style.padding = '32px 48px';
  ribbon.style.display = 'flex';
  ribbon.style.alignItems = 'center';
  ribbon.style.justifyContent = 'space-between';
  ribbon.style.maxWidth = '100%';
  ribbon.style.overflow = 'hidden';

  // Price in ribbon
  if (data.price) {
    const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
    price.style.fontSize = '72px';
    price.style.fontWeight = '700';
    price.style.lineHeight = '72px';
    price.style.color = '#ffffff';
    price.style.whiteSpace = 'nowrap';
    ribbon.appendChild(price);
  }

  // Badge in ribbon
  if (data.contract) {
    const badge = document.createElement('div');
    badge.style.background = 'rgba(255,255,255,0.2)';
    badge.style.borderRadius = '12px';
    badge.style.padding = '16px 32px';
    badge.style.fontFamily = FONT;
    badge.style.fontSize = '31px';
    badge.style.fontWeight = '600';
    badge.style.color = '#ffffff';
    badge.style.whiteSpace = 'nowrap';
    badge.textContent = data.contract.toUpperCase();
    ribbon.appendChild(badge);
  }

  content.appendChild(ribbon);

  // ── Bottom section: metrics + description ──
  const bottomSection = document.createElement('div');
  bottomSection.style.display = 'flex';
  bottomSection.style.flexDirection = 'column';
  bottomSection.style.gap = '24px';
  bottomSection.style.maxWidth = '100%';
  bottomSection.style.overflow = 'hidden';

  // Metric cards
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
    card.style.border = '1px solid rgba(255,255,255,0.3)';
  });
  bottomSection.appendChild(metrics);

  // Description
  const desc = createDescription(data.description || '', {
    fontFamily: FONT,
    fontSize: 28,
    lineHeight: 40,
    maxLines: 2,
  });
  desc.style.color = '#ffffff';
  desc.style.margin = '0';
  bottomSection.appendChild(desc);

  content.appendChild(bottomSection);
  container.appendChild(content);
  return container;
}
