// Template: Centered
// Dark overlay, center-aligned content
import { createCover, createBadge, createPrice, createAddress, createMetricCards, createDescription } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderCentered(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-centered';

  // Cover photo
  container.appendChild(createCover(photoUrl));

  // Dark overlay
  const overlay = document.createElement('div');
  overlay.className = 'tpl-overlay tpl-overlay--dark';
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

  // Badge (at top, centered) - or spacer to maintain layout
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
    badge.style.alignSelf = 'center';
    content.appendChild(badge);
  } else {
    // Empty spacer to maintain vertical centering when no badge
    const spacer = document.createElement('div');
    spacer.style.height = '55px'; // Approximate badge height (31px + 2*12px padding)
    content.appendChild(spacer);
  }

  // Middle group (price, title, metrics, description)
  const middle = document.createElement('div');
  middle.style.display = 'flex';
  middle.style.flexDirection = 'column';
  middle.style.alignItems = 'center';
  middle.style.maxWidth = '100%';
  middle.style.overflow = 'hidden';

  // Price
  const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
  price.style.fontSize = '91px';
  price.style.lineHeight = '91px';
  price.style.color = '#ffffff';
  price.style.whiteSpace = 'nowrap';
  middle.appendChild(price);

  // Title
  const title = document.createElement('h2');
  title.className = 'tpl-title';
  title.textContent = data.title;
  title.style.fontFamily = FONT;
  title.style.fontSize = '42px';
  title.style.fontWeight = '600';
  title.style.lineHeight = '54px';
  title.style.textAlign = 'center';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '2';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.marginTop = '16px';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  middle.appendChild(title);

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
  metrics.style.marginTop = '32px';
  metrics.style.justifyContent = 'center';

  // Add white border to metric cards and set width
  metrics.querySelectorAll('.tpl-metric-card').forEach(card => {
    card.style.border = '2px solid rgba(255, 255, 255, 0.3)';
    card.style.minWidth = '250px';
  });

  middle.appendChild(metrics);

  // Description
  const desc = createDescription(data.description || '', {
    fontFamily: FONT,
    fontSize: 28,
    lineHeight: 40,
    maxLines: 3,
  });
  desc.style.color = '#ffffff';
  desc.style.marginTop = '32px';
  desc.style.maxWidth = '100%';
  desc.style.overflow = 'hidden';
  desc.style.textAlign = 'center';
  middle.appendChild(desc);

  content.appendChild(middle);

  // Address at bottom
  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'white',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 28,
      maxLines: 1,
    });
    addr.style.justifyContent = 'center';
    addr.style.lineHeight = '36px';
    addr.style.textAlign = 'center';
    content.appendChild(addr);
  }

  container.appendChild(content);
  return container;
}
