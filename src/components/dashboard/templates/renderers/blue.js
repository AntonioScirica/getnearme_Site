// Template: Blue
// Radial blue gradient overlay, vertical flow with metric cards and CTA button
import { createCover, createBadge, createPrice, createAddress, createMetricCards, createDescription, createButton } from '../components.js';
import { createIcon } from '../icons.js';
const i18n = { t: (k) => (k === 'pwContactUs' ? 'Contattaci ora' : k) };

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderBlue(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-blue';

  // Cover photo
  container.appendChild(createCover(photoUrl));

  // Overlay: radial gradient (accent-tinted)
  const overlay = document.createElement('div');
  overlay.className = 'tpl-overlay tpl-overlay--radial';
  // Convert AC hex to rgb for radial gradient
  const _r = parseInt(AC.slice(1,3),16), _g = parseInt(AC.slice(3,5),16), _b = parseInt(AC.slice(5,7),16);
  overlay.style.background = `radial-gradient(ellipse at 86% 9%, rgba(${_r},${_g},${_b},0) 0%, rgba(${_r},${_g},${_b},0.8) 50%, rgba(${_r},${_g},${_b},0.8) 100%)`;
  container.appendChild(overlay);

  // Content
  const content = document.createElement('div');
  content.className = 'tpl-content';
  content.style.boxSizing = 'border-box';
  content.style.paddingTop = '60px';
  content.style.paddingLeft = '64px';
  content.style.paddingRight = '64px';
  content.style.paddingBottom = '64px';

  // Badge - top right (absolute, no layout shift)
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
    badge.style.top = '64px';
    badge.style.right = '64px';
    badge.style.zIndex = '3';
    container.appendChild(badge);
  }

  // Spacer (push content down — grows to fill available space)
  const spacer = document.createElement('div');
  spacer.style.flexGrow = '1';
  content.appendChild(spacer);

  // Price + Address group (gap 18px)
  const priceGroup = document.createElement('div');
  priceGroup.style.display = 'flex';
  priceGroup.style.flexDirection = 'column';
  priceGroup.style.gap = '18px';
  priceGroup.style.maxWidth = '100%';

  const price = createPrice(data.price, { size: 'blue-xl', fontFamily: FONT });
  price.style.fontSize = '106.79px';
  price.style.lineHeight = '106.79px';
  priceGroup.appendChild(price);

  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'white',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 28,
      maxLines: 1,
    });
    priceGroup.appendChild(addr);
  }

  content.appendChild(priceGroup);

  // Metric cards + title + description (gap 42px)
  const bottomGroup = document.createElement('div');
  bottomGroup.style.display = 'flex';
  bottomGroup.style.flexDirection = 'column';
  bottomGroup.style.gap = '42px';
  bottomGroup.style.marginTop = '42px';
  bottomGroup.style.maxWidth = '100%';

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

  // Add white border to metric cards
  metrics.querySelectorAll('.tpl-metric-card').forEach(card => {
    card.style.border = '2px solid rgba(255, 255, 255, 0.3)';
  });

  bottomGroup.appendChild(metrics);

  // Title + Description sub-group (gap 19px)
  const textGroup = document.createElement('div');
  textGroup.style.display = 'flex';
  textGroup.style.flexDirection = 'column';
  textGroup.style.gap = '19px';
  textGroup.style.maxWidth = '100%';
  textGroup.style.overflow = 'hidden';
  textGroup.style.marginBottom = '24px';

  const title = document.createElement('h2');
  title.className = 'tpl-title';
  title.textContent = data.title;
  title.style.fontFamily = FONT;
  title.style.fontSize = '50px';
  title.style.fontWeight = '600';
  title.style.lineHeight = '65px';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '2';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  textGroup.appendChild(title);

  const desc = createDescription(data.description || '', {
    fontFamily: FONT,
    fontSize: 28,
    lineHeight: 40,
    maxLines: 2,
  });
  desc.style.color = '#ffffff';
  textGroup.appendChild(desc);

  bottomGroup.appendChild(textGroup);
  content.appendChild(bottomGroup);

  // Button "Contattaci ora >" with chevron icon
  const btn = createButton('', {
    variant: 'white',
    width: 354,
    height: 96,
    fontSize: 32,
    fontFamily: FONT,
  });
  btn.style.marginTop = '40px';
  btn.style.color = AC;
  btn.style.fontWeight = '600';
  btn.style.paddingTop = '0';
  btn.style.paddingBottom = '0';
  btn.style.display = 'flex';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  const btnText = document.createElement('span');
  btnText.textContent = data.ctaText || i18n.t('pwContactUs');
  btn.appendChild(btnText);

  content.appendChild(btn);

  container.appendChild(content);
  return container;
}
