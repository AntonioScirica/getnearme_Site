// Template: Diagonal
// Blue diagonal triangle shape, left-aligned content, glass metric cards
import { createCover, createBadge, createPrice, createAddress, createMetricCards, createDescription } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderDiagonal(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-diagonal';

  // Cover photo
  container.appendChild(createCover(photoUrl));

  // Overlay: accent triangle
  const triangle = document.createElement('div');
  triangle.className = 'tpl-overlay tpl-overlay--triangle';
  triangle.style.background = AC;
  container.appendChild(triangle);

  // Overlay: bottom gradient for description
  const bottomGrad = document.createElement('div');
  bottomGrad.className = 'tpl-overlay tpl-overlay--bottom-grad';
  container.appendChild(bottomGrad);

  // Content
  const content = document.createElement('div');
  content.className = 'tpl-content';
  content.style.boxSizing = 'border-box';
  content.style.paddingTop = '60px';
  content.style.paddingLeft = '64px';
  content.style.paddingRight = '64px';
  content.style.paddingBottom = '64px';

  // Top section (over the blue triangle)
  const top = document.createElement('div');
  top.style.display = 'flex';
  top.style.flexDirection = 'column';
  top.style.alignItems = 'flex-start';
  top.style.gap = '32px';

  // Badge (inside price container)
  if (data.contract) {
    const badge = createBadge(data.contract, {
      variant: 'white',
      fontFamily: FONT,
      fontSize: 31,
      paddingX: 24,
      paddingY: 12,
      radius: 8,
    });
    badge.style.color = AC;
    badge.style.marginBottom = '16px';
    top.appendChild(badge);
  }

  // Price
  const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
  price.style.fontSize = '91px';
  price.style.lineHeight = '91px';
  price.style.color = '#ffffff';
  price.style.whiteSpace = 'nowrap';
  if (!data.contract) {
    price.style.marginTop = '48px';
  }
  top.appendChild(price);

  // Title
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
  title.style.marginTop = '16px';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  top.appendChild(title);

  // Address
  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'white',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 24,
    });
    addr.style.marginTop = '8px';
    addr.style.whiteSpace = 'nowrap';
    top.appendChild(addr);
  }

  content.appendChild(top);

  // Bottom section: metrics + description (same container with 32px gap)
  const bottom = document.createElement('div');
  bottom.style.marginTop = 'auto';
  bottom.style.display = 'flex';
  bottom.style.flexDirection = 'column';
  bottom.style.gap = '32px';
  bottom.style.maxWidth = '100%';
  bottom.style.overflow = 'hidden';

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
  bottom.appendChild(metrics);

  // Description
  const desc = createDescription(data.description || '', {
    fontFamily: FONT,
    fontSize: 28,
    lineHeight: 40,
    maxLines: 3,
  });
  desc.style.color = '#ffffff';
  bottom.appendChild(desc);

  content.appendChild(bottom);
  container.appendChild(content);
  return container;
}
