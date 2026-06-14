// Template: Split
// Vertical 50/50 split: left dark panel with info, right shows photo
import { createBadge, createPrice, createAddress, createMetricCards, createDescription } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderSplit(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-split';

  // Right half: photo
  const photoSide = document.createElement('div');
  photoSide.style.position = 'absolute';
  photoSide.style.top = '0';
  photoSide.style.right = '0';
  photoSide.style.width = '540px';
  photoSide.style.height = '100%';
  photoSide.style.overflow = 'hidden';

  const img = document.createElement('img');
  img.src = photoUrl;
  img.alt = '';
  img.style.width = '100%';
  img.style.height = '100%';
  img.style.objectFit = 'cover';
  img.style.display = 'block';
  img.style.transform = 'scale(1.02)';
  photoSide.appendChild(img);

  container.appendChild(photoSide);

  // Left half: dark panel
  const infoSide = document.createElement('div');
  infoSide.style.position = 'absolute';
  infoSide.style.top = '0';
  infoSide.style.left = '0';
  infoSide.style.width = '540px';
  infoSide.style.height = '100%';
  infoSide.style.background = AC;
  infoSide.style.boxSizing = 'border-box';
  infoSide.style.padding = '64px 60px';
  infoSide.style.display = 'flex';
  infoSide.style.flexDirection = 'column';
  infoSide.style.justifyContent = 'space-between';
  infoSide.style.overflow = 'hidden';

  // Top section: badge + price
  const topSection = document.createElement('div');
  topSection.style.display = 'flex';
  topSection.style.flexDirection = 'column';
  topSection.style.gap = '24px';

  if (data.contract) {
    const badge = createBadge(data.contract, {
      variant: 'white',
      fontFamily: FONT,
      fontSize: 31,
      paddingX: 24,
      paddingY: 12,
      radius: 8,
    });
    badge.style.background = '#ffffff';
    badge.style.color = AC;
    badge.style.alignSelf = 'flex-start';
    topSection.appendChild(badge);
  }

  if (data.price) {
    const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
    price.style.fontSize = '64px';
    price.style.fontWeight = '700';
    price.style.lineHeight = '72px';
    price.style.color = '#ffffff';
    price.style.wordBreak = 'break-word';
    price.style.marginTop = '16px';
    topSection.appendChild(price);
  }

  infoSide.appendChild(topSection);

  // Middle section: title + address + description
  const midSection = document.createElement('div');
  midSection.style.display = 'flex';
  midSection.style.flexDirection = 'column';
  midSection.style.gap = '16px';
  midSection.style.maxWidth = '100%';
  midSection.style.overflow = 'hidden';

  const title = document.createElement('h2');
  title.className = 'tpl-title';
  title.textContent = data.title;
  title.style.fontFamily = FONT;
  title.style.fontSize = '42px';
  title.style.fontWeight = '600';
  title.style.lineHeight = '54px';
  title.style.color = '#ffffff';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '2';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  title.style.margin = '0';
  midSection.appendChild(title);

  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'white',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 24,
    });
    addr.style.lineHeight = '32px';
    addr.style.whiteSpace = 'nowrap';
    midSection.appendChild(addr);
  }

  // Divider
  const divider = document.createElement('div');
  divider.style.height = '1px';
  divider.style.background = 'rgba(255,255,255,0.2)';
  divider.style.marginTop = '8px';
  divider.style.marginBottom = '8px';
  midSection.appendChild(divider);

  const desc = createDescription(data.description || '', {
    fontFamily: FONT,
    fontSize: 24,
    lineHeight: 36,
    maxLines: 3,
  });
  desc.style.color = 'rgba(255,255,255,0.7)';
  desc.style.margin = '0';
  midSection.appendChild(desc);

  infoSide.appendChild(midSection);

  // Bottom section: metric cards
  const metrics = createMetricCards(data, {
    variant: 'glass',
    fontFamily: FONT,
    gap: 8,
    iconSize: 28,
    valueSize: 32,
    radius: 12,
    innerGap: 16,
    showLabels: false,
    iconOnTop: false,
  });
  metrics.querySelectorAll('.tpl-metric-card').forEach(card => {
    card.style.border = '1px solid rgba(255,255,255,0.2)';
    card.style.minHeight = '100px';
  });
  infoSide.appendChild(metrics);

  container.appendChild(infoSide);

  // Accent line between panels
  const accent = document.createElement('div');
  accent.style.position = 'absolute';
  accent.style.top = '0';
  accent.style.left = '540px';
  accent.style.width = '3px';
  accent.style.height = '100%';
  accent.style.background = AC;
  accent.style.zIndex = '2';
  container.appendChild(accent);

  return container;
}
