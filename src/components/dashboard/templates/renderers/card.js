// Template: Card
// Top bar with price/badge, white bottom panel with centered content
import { createCover, createBadge, createPrice, createAddress, createMetricCards, createTitle, createDescription } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderCard(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-card';

  // Cover photo
  container.appendChild(createCover(photoUrl));

  // Gradient overlay
  const overlay = document.createElement('div');
  overlay.className = 'tpl-overlay';
  overlay.style.background = 'linear-gradient(180deg, rgba(0, 0, 0, 0.80) 0%, rgba(0, 0, 0, 0.50) 53%, rgba(0, 0, 0, 0.80) 100%)';
  container.appendChild(overlay);

  // Content wrapper
  const content = document.createElement('div');
  content.style.position = 'absolute';
  content.style.zIndex = '2';
  content.style.top = '64px';
  content.style.left = '64px';
  content.style.right = '64px';
  content.style.bottom = '64px';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.justifyContent = 'space-between';

  // Top bar: price (left) + badge (right)
  const topBar = document.createElement('div');
  topBar.style.display = 'flex';
  topBar.style.alignItems = 'stretch';
  topBar.style.alignSelf = 'stretch';

  // Set justifyContent based on whether badge exists
  if (data.contract) {
    topBar.style.justifyContent = 'space-between';
  } else {
    topBar.style.justifyContent = 'center';
  }

  // Price box (white background)
  if (data.price) {
    const priceBox = document.createElement('div');
    priceBox.style.background = '#ffffff';
    priceBox.style.borderRadius = '11.64px';
    priceBox.style.padding = '20px 32px';
    priceBox.style.display = 'flex';
    priceBox.style.alignItems = 'center';
    priceBox.style.justifyContent = 'center';
    priceBox.style.height = '86px';
    priceBox.style.boxSizing = 'border-box';

    const priceText = createPrice(data.price, { size: 'xl', fontFamily: FONT });
    priceText.style.fontSize = '55.44px';
    priceText.style.fontWeight = '600';
    priceText.style.lineHeight = '55.44px';
    priceText.style.color = '#000000';
    priceText.style.whiteSpace = 'nowrap';
    priceBox.appendChild(priceText);

    topBar.appendChild(priceBox);
  }

  // Badge box (blue background)
  if (data.contract) {
    const badgeBox = document.createElement('div');
    badgeBox.style.background = AC;
    badgeBox.style.borderRadius = '15.41px';
    badgeBox.style.padding = '20px 40px';
    badgeBox.style.display = 'flex';
    badgeBox.style.alignItems = 'center';
    badgeBox.style.justifyContent = 'center';
    badgeBox.style.height = '86px';
    badgeBox.style.boxSizing = 'border-box';

    const badgeText = document.createElement('div');
    badgeText.textContent = data.contract.toUpperCase();
    badgeText.style.fontFamily = FONT;
    badgeText.style.fontSize = '43.46px';
    badgeText.style.fontWeight = '600';
    badgeText.style.lineHeight = '43.46px';
    badgeText.style.color = '#ffffff';
    badgeBox.appendChild(badgeText);

    topBar.appendChild(badgeBox);
  }

  content.appendChild(topBar);

  // Bottom white panel
  const panel = document.createElement('div');
  panel.className = 'tpl-panel';
  panel.style.background = '#ffffff';
  panel.style.borderRadius = '11.64px';
  panel.style.padding = '32px 89px';
  panel.style.display = 'flex';
  panel.style.flexDirection = 'column';
  panel.style.alignItems = 'center';
  panel.style.alignSelf = 'stretch';

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
  panel.appendChild(title);

  // Address
  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'dark',
      fontFamily: FONT,
      iconSize: 21,
      fontSize: 25.38,
      maxLines: 1,
    });
    addr.style.justifyContent = 'center';
    addr.style.fontWeight = '500';
    addr.style.lineHeight = '33.85px';
    addr.style.marginTop = '12px';
    panel.appendChild(addr);
  }

  // Metric cards (glass variant with gray border)
  const metrics = createMetricCards(data, {
    variant: 'glass',
    fontFamily: FONT,
    gap: 29,
    iconSize: 30,
    valueSize: 38.58,
    radius: 14.47,
    innerGap: 24,
    showLabels: false,
    iconOnTop: false,
  });
  metrics.style.justifyContent = 'center';
  metrics.style.marginTop = '42px';

  // Add gray border to metric cards and set colors
  metrics.querySelectorAll('.tpl-metric-card').forEach(card => {
    card.style.border = '1.21px solid #CACACA';
    card.style.background = 'rgba(255, 255, 255, 0.20)';
    card.style.width = '250px';
    card.style.height = '129px';

    // Set text color to black for visibility on white background
    const value = card.querySelector('.tpl-metric-card__value');
    if (value) value.style.color = '#000000';

    // Set icon color to black (SVG uses currentColor)
    const icon = card.querySelector('.tpl-metric-card__icon');
    if (icon) icon.style.color = '#000000';
  });

  panel.appendChild(metrics);

  // Description
  const desc = createDescription(data.description || '', {
    fontFamily: FONT,
    fontSize: 28,
    lineHeight: 40,
    maxLines: 3,
  });
  desc.style.color = '#6E6E6E';
  desc.style.textAlign = 'center';
  desc.style.maxWidth = '100%';
  desc.style.overflow = 'hidden';
  desc.style.marginTop = '42px';
  panel.appendChild(desc);

  content.appendChild(panel);
  container.appendChild(content);
  return container;
}
