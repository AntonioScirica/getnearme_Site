// Template: Elegant
// Subtle gradient overlay, bottom-positioned content with inline metrics
import { createCover, createBadge, createPrice, createTitle, createMetricsInline } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderElegant(data, photoUrl) {
  const container = document.createElement('div');
  container.className = 'tpl tpl-elegant';

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
  content.style.top = '60px';
  content.style.left = '64px';
  content.style.right = '64px';
  content.style.bottom = '60px';
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.justifyContent = 'space-between';

  // Badge at top (white outline only)
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
    badge.style.border = '1px solid #ffffff';
    content.appendChild(badge);
  } else {
    // Empty spacer to maintain layout
    const spacer = document.createElement('div');
    spacer.style.height = '55px'; // Approximate badge height
    content.appendChild(spacer);
  }

  // Bottom section
  const bottom = document.createElement('div');
  bottom.style.display = 'flex';
  bottom.style.flexDirection = 'column';
  bottom.style.maxWidth = '100%';
  bottom.style.overflow = 'hidden';

  // Title
  const title = createTitle(data.title, {
    fontFamily: FONT,
    fontSize: 42,
    fontWeight: '400',
    lineHeight: 54,
  });
  title.style.color = '#ffffff';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '2';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  bottom.appendChild(title);

  // Price
  const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
  price.style.fontSize = '91px';
  price.style.fontWeight = '600';
  price.style.lineHeight = '91px';
  price.style.color = '#ffffff';
  price.style.whiteSpace = 'nowrap';
  price.style.marginTop = '32px';
  bottom.appendChild(price);

  // Divider
  const divider = document.createElement('div');
  divider.style.marginTop = '40px';
  divider.style.height = '1px';
  divider.style.background = 'rgba(255,255,255,0.3)';
  bottom.appendChild(divider);

  // Inline metrics (e.g. "4 camere | 2 bagni | 85 m²")
  const inline = createMetricsInline(data, {
    fontFamily: FONT,
    color: '#ffffff',
    fontSize: 32,
    fontWeight: '400',
  });
  if (inline) {
    inline.style.marginTop = '40px';
    bottom.appendChild(inline);
  }

  content.appendChild(bottom);
  container.appendChild(content);
  return container;
}
