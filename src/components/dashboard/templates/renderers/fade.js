// Template: Fade
// Horizontal left-to-right gradient overlay (solid accent → transparent), content on left
import { createCover, createBadge, createPrice, createAddress, createMetricsInline, createDescription } from '../components.js';

const FONT = 'Poppins, sans-serif';
/**
 * @param {Object} data
 * @param {string} photoUrl
 * @returns {HTMLElement}
 */
export function renderFade(data, photoUrl) {
  const ACCENT = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-fade';

  // Cover photo
  container.appendChild(createCover(photoUrl));

  // Left-to-right gradient overlay
  const overlay = document.createElement('div');
  overlay.className = 'tpl-overlay';
  overlay.style.background = `linear-gradient(90deg, ${ACCENT} 0%, ${ACCENT}CC 35%, ${ACCENT}00 70%)`;
  container.appendChild(overlay);

  // Content — positioned left side
  const content = document.createElement('div');
  content.className = 'tpl-content';
  content.style.boxSizing = 'border-box';
  content.style.paddingTop = '64px';
  content.style.paddingLeft = '64px';
  content.style.paddingRight = '64px';
  content.style.paddingBottom = '64px';
  content.style.justifyContent = 'flex-end';
  content.style.maxWidth = '620px';

  // Badge at top-left (absolute)
  if (data.contract) {
    const badge = createBadge(data.contract, {
      variant: 'white',
      fontFamily: FONT,
      fontSize: 31,
      paddingX: 24,
      paddingY: 12,
      radius: 8,
    });
    badge.style.color = ACCENT;
    badge.style.position = 'absolute';
    badge.style.top = '64px';
    badge.style.left = '64px';
    badge.style.zIndex = '3';
    container.appendChild(badge);
  }

  // Price
  if (data.price) {
    const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
    price.style.fontSize = '80px';
    price.style.fontWeight = '700';
    price.style.lineHeight = '88px';
    price.style.color = '#ffffff';
    price.style.whiteSpace = 'nowrap';
    content.appendChild(price);
  }

  // Title
  const title = document.createElement('h2');
  title.className = 'tpl-title';
  title.textContent = data.title;
  title.style.fontFamily = FONT;
  title.style.fontSize = '62px';
  title.style.fontWeight = '700';
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
  title.style.marginTop = '16px';
  content.appendChild(title);

  // Address
  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'white',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 28,
      maxLines: 1,
    });
    addr.style.marginTop = '16px';
    content.appendChild(addr);
  }

  // Description
  if (data.description) {
    const desc = createDescription(data.description, {
      fontFamily: FONT,
      fontSize: 28,
      lineHeight: 38,
      maxLines: 2,
    });
    desc.style.color = 'rgba(255,255,255,0.85)';
    desc.style.margin = '0';
    desc.style.marginTop = '20px';
    content.appendChild(desc);
  }

  // Inline metrics in pill
  const inline = createMetricsInline(data, {
    fontFamily: FONT,
    color: '#ffffff',
    fontSize: 25,
  });
  if (inline) {
    const pill = document.createElement('div');
    pill.style.display = 'flex';
    pill.style.alignItems = 'center';
    pill.style.justifyContent = 'center';
    pill.style.marginTop = '24px';
    pill.style.border = '1px solid rgba(255,255,255,0.7)';
    pill.style.borderRadius = '50px';
    pill.style.padding = '14px 28px';
    pill.style.width = '100%';
    pill.style.boxSizing = 'border-box';

    inline.style.width = '100%';
    inline.style.textAlign = 'center';
    inline.style.letterSpacing = '1px';
    pill.appendChild(inline);

    content.appendChild(pill);
  }

  container.appendChild(content);
  return container;
}
