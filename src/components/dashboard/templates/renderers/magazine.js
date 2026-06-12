// Template: Magazine
// Editorial style: oversized price hero, thin separators, asymmetric layout
import { createCover, createBadge, createPrice, createAddress, createMetricCards, createDescription } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderMagazine(data, photoUrl) {
  const container = document.createElement('div');
  container.className = 'tpl tpl-magazine';

  // Cover photo
  container.appendChild(createCover(photoUrl));

  // Dark overlay
  const overlay = document.createElement('div');
  overlay.className = 'tpl-overlay';
  overlay.style.background = 'linear-gradient(180deg, rgba(0,0,0,0.75) 0%, rgba(0,0,0,0.35) 40%, rgba(0,0,0,0.75) 100%)';
  container.appendChild(overlay);

  // Content
  const content = document.createElement('div');
  content.className = 'tpl-content';
  content.style.boxSizing = 'border-box';
  content.style.paddingTop = '60px';
  content.style.paddingLeft = '64px';
  content.style.paddingRight = '64px';
  content.style.paddingBottom = '64px';

  // ── Top: Badge + Price (oversized hero) ──
  const topSection = document.createElement('div');
  topSection.style.display = 'flex';
  topSection.style.flexDirection = 'column';
  topSection.style.gap = '40px';

  if (data.contract) {
    const badge = createBadge(data.contract, {
      variant: 'white-outline',
      fontFamily: FONT,
      fontSize: 31,
      fontWeight: '400',
      paddingX: 24,
      paddingY: 12,
      radius: 8,
    });
    badge.style.color = '#ffffff';
    badge.style.background = 'transparent';
    badge.style.border = '1px solid rgba(255,255,255,0.5)';
    badge.style.alignSelf = 'flex-start';
    badge.style.letterSpacing = '4px';
    topSection.appendChild(badge);
  }

  // Oversized price
  if (data.price) {
    const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
    price.style.fontSize = '96px';
    price.style.fontWeight = '300';
    price.style.lineHeight = '96px';
    price.style.color = '#ffffff';
    price.style.whiteSpace = 'nowrap';
    price.style.letterSpacing = '-2px';
    price.style.marginTop = '16px';
    topSection.appendChild(price);
  }

  content.appendChild(topSection);

  // ── Spacer ──
  const spacer = document.createElement('div');
  spacer.style.flexGrow = '1';
  content.appendChild(spacer);

  // ── Bottom: two-column asymmetric layout ──
  const bottomSection = document.createElement('div');
  bottomSection.style.display = 'flex';
  bottomSection.style.gap = '32px';
  bottomSection.style.alignItems = 'flex-end';
  bottomSection.style.maxWidth = '100%';

  // Left column (60%): title + description
  const leftCol = document.createElement('div');
  leftCol.style.flex = '1.4';
  leftCol.style.display = 'flex';
  leftCol.style.flexDirection = 'column';
  leftCol.style.gap = '16px';
  leftCol.style.minWidth = '0';
  leftCol.style.overflow = 'hidden';

  const title = document.createElement('h2');
  title.className = 'tpl-title';
  title.textContent = data.title;
  title.style.fontFamily = FONT;
  title.style.fontSize = '52px';
  title.style.fontWeight = '600';
  title.style.lineHeight = '64px';
  title.style.color = '#ffffff';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '2';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  title.style.margin = '0';
  leftCol.appendChild(title);

  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'white',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 26,
      maxLines: 1,
    });
    addr.style.opacity = '0.8';
    leftCol.appendChild(addr);
  }

  const desc = createDescription(data.description || '', {
    fontFamily: FONT,
    fontSize: 24,
    lineHeight: 36,
    maxLines: 3,
  });
  desc.style.color = 'rgba(255,255,255,0.6)';
  desc.style.margin = '0';
  leftCol.appendChild(desc);

  bottomSection.appendChild(leftCol);

  // Right column (40%): metrics stacked vertically
  const rightCol = document.createElement('div');
  rightCol.style.flex = '1';
  rightCol.style.display = 'flex';
  rightCol.style.flexDirection = 'column';
  rightCol.style.gap = '12px';
  rightCol.style.minWidth = '0';

  const metrics = createMetricCards(data, {
    variant: 'glass',
    fontFamily: FONT,
    gap: 12,
    iconSize: 32,
    valueSize: 36,
    radius: 12,
    innerGap: 24,
    showLabels: false,
    iconOnTop: false,
  });
  metrics.style.flexDirection = 'column';
  metrics.querySelectorAll('.tpl-metric-card').forEach(card => {
    card.style.flexDirection = 'row';
    card.style.minHeight = '80px';
    card.style.height = 'auto';
    card.style.padding = '16px 24px';
    card.style.border = '1px solid rgba(255,255,255,0.2)';
  });
  rightCol.appendChild(metrics);

  bottomSection.appendChild(rightCol);

  // Thin separator above bottom
  const sep2 = document.createElement('div');
  sep2.style.height = '1px';
  sep2.style.background = 'rgba(255,255,255,0.3)';
  sep2.style.marginBottom = '24px';
  content.appendChild(sep2);

  content.appendChild(bottomSection);
  container.appendChild(content);
  return container;
}
