// Template: Gradient
// Glass panels over photo: top panel (badge, title, address, price),
// photo visible in middle, glass metric cards, glass description panel at bottom
import { createCover, createBadge, createPrice, createAddress, createMetricCards, createDescription } from '../components.js';

const FONT = 'Poppins, sans-serif';
const DESC_TEXT = 'Informazioni organizzate per aiutarti a confrontare immobili e contesto in modo strutturato. Informazioni organizzate per aiutarti a confrontare.';

/**
 * @param {Object} data - Extracted post data
 * @param {string} photoUrl - Data URL of cover photo
 * @returns {HTMLElement}
 */
export function renderGradient(data, photoUrl) {
  const AC = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-gradient';

  // Cover photo
  container.appendChild(createCover(photoUrl));

  // Graduated black overlay: 80% top/bottom, 50% center
  const overlay = document.createElement('div');
  overlay.className = 'tpl-overlay';
  overlay.style.background = 'linear-gradient(to bottom, rgba(0,0,0,0.8) 0%, rgba(0,0,0,0.5) 50%, rgba(0,0,0,0.8) 100%)';
  container.appendChild(overlay);

  // Content
  const content = document.createElement('div');
  content.className = 'tpl-content';
  content.style.boxSizing = 'border-box';
  content.style.paddingTop = '60px';
  content.style.paddingLeft = '64px';
  content.style.paddingRight = '64px';
  content.style.paddingBottom = '64px';

  // ── Top glass panel: badge, title, address, price ──
  const topPanel = document.createElement('div');
  topPanel.className = 'gradient-top-panel tpl-glass-panel';
  topPanel.style.display = 'flex';
  topPanel.style.flexDirection = 'column';
  topPanel.style.gap = '16px';
  topPanel.style.position = 'relative';
  topPanel.style.paddingTop = '40px';
  topPanel.style.maxWidth = '100%';
  topPanel.style.overflow = 'hidden';

  // Badge (absolute within panel, no layout shift)
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
    badge.style.position = 'absolute';
    badge.style.top = '32px';
    badge.style.left = '32px';
    topPanel.appendChild(badge);
  }

  // Title (max 2 lines)
  const title = document.createElement('h2');
  title.className = 'tpl-title';
  title.textContent = data.title;
  title.style.fontFamily = FONT;
  title.style.fontSize = '62px';
  title.style.fontWeight = '600';
  title.style.lineHeight = '77px';
  title.style.color = '#ffffff';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '2';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  // If no badge, position at 32px from top; if badge exists, maintain 40px gap below it
  title.style.marginTop = data.contract ? '120px' : '32px';
  topPanel.appendChild(title);

  // Address (max 1 line)
  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'white',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 28,
      maxLines: 1,
    });
    addr.style.lineHeight = '36px';
    topPanel.appendChild(addr);
  }

  // Price
  const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
  price.style.fontSize = '91px';
  price.style.lineHeight = '91px';
  price.style.color = '#ffffff';
  price.style.marginTop = '24px';
  price.style.whiteSpace = 'nowrap';
  topPanel.appendChild(price);

  content.appendChild(topPanel);

  // ── Bottom section: metric cards + description panel ──
  const bottomSection = document.createElement('div');
  bottomSection.className = 'gradient-bottom-section';
  bottomSection.style.display = 'flex';
  bottomSection.style.flexDirection = 'column';
  bottomSection.style.gap = '12px';
  bottomSection.style.maxWidth = '100%';
  bottomSection.style.overflow = 'hidden';

  // Metric cards (glass variant, value on top, icon below, no labels)
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
  bottomSection.appendChild(metrics);

  // Glass description panel
  const descPanel = document.createElement('div');
  descPanel.className = 'gradient-desc-panel tpl-glass-panel';
  descPanel.style.maxWidth = '100%';
  descPanel.style.overflow = 'hidden';

  const descText = data.description || DESC_TEXT;
  const desc = createDescription(descText, {
    fontFamily: FONT,
    fontSize: 28,
    lineHeight: 40,
    maxLines: 3,
  });
  desc.style.color = '#ffffff';
  desc.style.margin = '0';
  descPanel.appendChild(desc);

  bottomSection.appendChild(descPanel);

  content.appendChild(bottomSection);
  container.appendChild(content);
  return container;
}
