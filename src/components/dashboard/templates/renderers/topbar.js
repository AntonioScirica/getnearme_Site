// Template: Top Bar
// White centered panel with badge on top, price/title/metrics/description/address inside
import { createCover, createBadge, createPrice, createAddress, createMetricCards, createTitle, createDescription } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderTopbar(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-topbar';

  // Cover photo
  container.appendChild(createCover(photoUrl));

  // Dark overlay on photo
  const overlay = document.createElement('div');
  overlay.className = 'tpl-overlay';
  overlay.style.background = 'linear-gradient(180deg, rgba(0, 0, 0, 0.80) 0%, rgba(0, 0, 0, 0.50) 53%, rgba(0, 0, 0, 0.80) 100%)';
  container.appendChild(overlay);

  // White panel (centered horizontally, vertically adaptive)
  const panel = document.createElement('div');
  panel.className = 'tpl-panel';
  panel.style.position = 'absolute';
  panel.style.left = '50%';
  panel.style.top = '50%';
  panel.style.transform = 'translate(-50%, -50%)';
  panel.style.width = 'calc(100% - 148px)';
  panel.style.height = '71.2%';
  panel.style.background = '#ffffff';
  panel.style.borderRadius = '18px';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.alignItems = 'center';
  panel.style.boxSizing = 'border-box';
  panel.style.padding = data.contract ? '64px 64px 48px' : '40px 64px 48px';
  panel.style.zIndex = '2';
  panel.style.overflow = 'hidden';

  // Price (pushed down a bit more)
  if (data.price) {
    const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
    price.style.fontSize = '106.79px';
    price.style.fontWeight = '600';
    price.style.lineHeight = '106.79px';
    price.style.color = '#000000';
    price.style.whiteSpace = 'nowrap';
    price.style.marginTop = data.contract ? '32px' : '16px';
    panel.appendChild(price);
  }

  // Title
  const title = createTitle(data.title, {
    color: '#000000',
    fontFamily: FONT,
    fontSize: 40,
    fontWeight: '600',
    lineHeight: 50,
  });
  title.style.textAlign = 'center';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '2';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  title.style.marginTop = '16px';
  panel.appendChild(title);

  // Center group (metrics + description) - uses flex spacers to center between title and address
  const centerGroup = document.createElement('div');
  centerGroup.style.display = 'flex';
  centerGroup.style.flexDirection = 'column';
  centerGroup.style.alignItems = 'center';
  centerGroup.style.flex = '1';
  centerGroup.style.justifyContent = 'center';

  // Metric cards (3 outlined cards, standard layout)
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
  metrics.style.justifyContent = 'center';

  // Style metric cards: outlined, no glass effect, 250px wide
  metrics.querySelectorAll('.tpl-metric-card').forEach(card => {
    card.style.border = '1.62px solid #CACACA';
    card.style.background = 'rgba(255, 255, 255, 0.20)';
    card.style.width = '250px';
    card.style.height = '155px';
    card.style.backdropFilter = 'none';
    card.style.webkitBackdropFilter = 'none';
    card.style.minHeight = 'auto';

    const value = card.querySelector('.tpl-metric-card__value');
    if (value) {
      value.style.color = '#000000';
      value.style.fontWeight = '400';
    }

    const icon = card.querySelector('.tpl-metric-card__icon');
    if (icon) icon.style.color = '#000000';
  });

  centerGroup.appendChild(metrics);

  // Description (centered, max-width 774px)
  const desc = createDescription(data.description || '', {
    fontFamily: FONT,
    fontSize: 28,
    lineHeight: 40,
    maxLines: 3,
  });
  desc.style.color = '#6E6E6E';
  desc.style.textAlign = 'center';
  desc.style.maxWidth = '774px';
  desc.style.overflow = 'hidden';
  desc.style.marginTop = '32px';
  centerGroup.appendChild(desc);

  panel.appendChild(centerGroup);

  // Address (at bottom with pin icon)
  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'dark',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 28,
      maxLines: 1,
    });
    addr.style.justifyContent = 'center';
    addr.style.fontWeight = '500';
    addr.style.color = '#000000';
    panel.appendChild(addr);
  }

  container.appendChild(panel);

  // Badge (centered on top edge of panel, overlapping)
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
    badge.style.top = 'calc(14.4% - 24px)';
    badge.style.left = '50%';
    badge.style.transform = 'translateX(-50%)';
    badge.style.zIndex = '3';
    container.appendChild(badge);
  }

  return container;
}
