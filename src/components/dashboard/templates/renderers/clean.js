// Template: Clean
// Glass top bar (address + badge), metric cards + title at bottom
import { createCover, createTitle } from '../components.js';
import { createIcon } from '../icons.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderClean(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-clean';

  // Cover photo
  container.appendChild(createCover(photoUrl));

  // Dark overlay
  const overlay = document.createElement('div');
  overlay.className = 'tpl-overlay';
  overlay.style.background = 'linear-gradient(180deg, rgba(0, 0, 0, 0.80) 0%, rgba(0, 0, 0, 0.50) 53%, rgba(0, 0, 0, 0.80) 100%)';
  container.appendChild(overlay);

  // ─── Top glass bar (address + badge) ───
  const bar = document.createElement('div');
  bar.className = 'tpl-bar';
  bar.style.position = 'absolute';
  bar.style.left = '64px';
  bar.style.right = '64px';
  bar.style.top = '64px';
  bar.style.height = '93px';
  bar.style.background = 'rgba(255, 255, 255, 0.20)';
  bar.style.borderRadius = '18px';
  bar.style.border = '1px solid white';
  bar.style.backdropFilter = 'blur(15.4px)';
  bar.style.webkitBackdropFilter = 'blur(15.4px)';
  bar.style.zIndex = '2';
  bar.style.display = 'flex';
  bar.style.alignItems = 'center';
  bar.style.justifyContent = 'space-between';
  bar.style.boxSizing = 'border-box';
  bar.style.padding = '0 12px 0 24px';

  // Address with pin icon
  if (data.address) {
    const addrRow = document.createElement('div');
    addrRow.style.display = 'flex';
    addrRow.style.alignItems = 'center';
    addrRow.style.gap = '12px';
    addrRow.style.overflow = 'hidden';
    addrRow.style.flex = '1';
    addrRow.style.minWidth = '0';

    const pin = createIcon('mapPin', 24);
    pin.style.color = '#ffffff';
    pin.style.flexShrink = '0';
    addrRow.appendChild(pin);

    const addrText = document.createElement('span');
    addrText.textContent = data.address;
    addrText.style.color = '#ffffff';
    addrText.style.fontFamily = FONT;
    addrText.style.fontSize = '28px';
    addrText.style.fontWeight = '500';
    addrText.style.lineHeight = '36px';
    addrText.style.whiteSpace = 'nowrap';
    addrText.style.overflow = 'hidden';
    addrText.style.textOverflow = 'ellipsis';
    addrRow.appendChild(addrText);

    bar.appendChild(addrRow);
  }

  // Badge (white bg, blue text)
  if (data.contract) {
    const badgeBox = document.createElement('div');
    badgeBox.className = 'tpl-badge';
    badgeBox.style.background = '#ffffff';
    badgeBox.style.borderRadius = '12px';
    badgeBox.style.padding = '12px 24px';
    badgeBox.style.flexShrink = '0';
    badgeBox.style.marginLeft = '8px';
    badgeBox.style.alignSelf = 'center';

    const badgeText = document.createElement('div');
    badgeText.textContent = data.contract.toUpperCase();
    badgeText.style.fontFamily = FONT;
    badgeText.style.fontSize = '31px';
    badgeText.style.fontWeight = '600';
    badgeText.style.lineHeight = '1';
    badgeText.style.color = AC;
    badgeBox.appendChild(badgeText);

    bar.appendChild(badgeBox);
  }

  container.appendChild(bar);

  // ─── Bottom section (metrics + title) ───
  const bottomSection = document.createElement('div');
  bottomSection.className = 'tpl-bottom';
  bottomSection.style.position = 'absolute';
  bottomSection.style.left = '64px';
  bottomSection.style.right = '64px';
  bottomSection.style.bottom = '64px';
  bottomSection.style.zIndex = '2';
  bottomSection.style.display = 'flex';
  bottomSection.style.flexDirection = 'column';

  // Metric cards row
  const metricsRow = document.createElement('div');
  metricsRow.className = 'tpl-metrics';
  metricsRow.style.display = 'flex';
  metricsRow.style.gap = '18px';

  const cIcons = data._icons || {};
  const metricItems = [
    { icon: cIcons.bedrooms || 'bed', value: data.bedrooms || data.rooms || '-' },
    { icon: cIcons.bathrooms || 'bath', value: data.bathrooms || '-' },
    { icon: cIcons.surface || 'area', value: (data.surfaceNum || (data.surface ? data.surface.replace(/[^\d.,]+/g, '') : '-')) + ' m\u00B2' },
  ];

  metricItems.forEach(m => {
    const card = document.createElement('div');
    card.className = 'tpl-metric-card';
    card.style.height = '84px';
    card.style.background = 'rgba(255, 255, 255, 0.20)';
    card.style.borderRadius = '19.44px';
    card.style.border = '1px solid white';
    card.style.backdropFilter = 'blur(15.4px)';
    card.style.webkitBackdropFilter = 'blur(15.4px)';
    card.style.display = 'flex';
    card.style.flexDirection = 'row';
    card.style.alignItems = 'center';
    card.style.gap = '12px';
    card.style.boxSizing = 'border-box';
    card.style.paddingLeft = '24px';
    card.style.paddingRight = '24px';

    const icon = createIcon(m.icon, 30);
    icon.style.color = '#ffffff';
    icon.style.flexShrink = '0';
    card.appendChild(icon);

    const val = document.createElement('div');
    val.textContent = m.value;
    val.style.color = '#ffffff';
    val.style.fontFamily = FONT;
    val.style.fontSize = '36px';
    val.style.fontWeight = '400';
    val.style.lineHeight = '36px';
    val.style.whiteSpace = 'nowrap';
    card.appendChild(val);

    metricsRow.appendChild(card);
  });

  bottomSection.appendChild(metricsRow);

  // Title (24px below metrics)
  const title = createTitle(data.title, {
    color: '#ffffff',
    fontFamily: FONT,
    fontSize: 61.77,
    fontWeight: '600',
    lineHeight: 77.21,
  });
  title.style.marginTop = '24px';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '2';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  bottomSection.appendChild(title);

  container.appendChild(bottomSection);

  return container;
}
