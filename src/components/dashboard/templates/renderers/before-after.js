// Template: Before After
// Two pill-shaped photos (before/after) on light bg with accent text
import { createAddress } from '../components.js';

const FONT = 'Poppins, sans-serif';
/**
 * @param {Object} data
 * @param {string} photoUrl
 * @param {Object} [opts]
 * @param {string[]} [opts.photos] - Additional photo URLs
 * @returns {HTMLElement}
 */
export function renderBeforeAfter(data, photoUrl, opts = {}) {
  const ACCENT = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-before-after';
  container.style.background = '#EDF2F5';
  container.style.overflow = 'hidden';

  const photos = [photoUrl, ...(opts.photos || [])];

  // ── Photo 1 (Before) — pill-bottom, upper area ──
  const p1 = document.createElement('div');
  p1.className = 'tpl-photo';
  p1.style.position = 'absolute';
  p1.style.left = '185px';
  p1.style.top = '0';
  p1.style.width = '345px';
  p1.style.height = '57%';
  p1.style.borderBottomLeftRadius = '500px';
  p1.style.borderBottomRightRadius = '500px';
  p1.style.overflow = 'hidden';

  const img1 = document.createElement('img');
  img1.src = photos[0];
  img1.alt = '';
  img1.style.width = '100%';
  img1.style.height = '100%';
  img1.style.objectFit = 'cover';
  img1.style.display = 'block';
  p1.appendChild(img1);
  container.appendChild(p1);

  // ── Photo 2 (After) — pill-top, lower-right area ──
  const p2 = document.createElement('div');
  p2.className = 'tpl-photo';
  p2.style.position = 'absolute';
  p2.style.left = '550px';
  p2.style.bottom = '0';
  p2.style.width = '345px';
  p2.style.height = '57%';
  p2.style.borderTopLeftRadius = '500px';
  p2.style.borderTopRightRadius = '500px';
  p2.style.overflow = 'hidden';

  const img2 = document.createElement('img');
  img2.src = photos[1] || photos[0];
  img2.alt = '';
  img2.style.width = '100%';
  img2.style.height = '100%';
  img2.style.objectFit = 'cover';
  img2.style.display = 'block';
  p2.appendChild(img2);
  container.appendChild(p2);

  // ── "BEFORE" rotated label (left side) ──
  const beforeLbl = document.createElement('div');
  beforeLbl.className = 'tpl-label';
  beforeLbl.textContent = 'BEFORE';
  beforeLbl.style.position = 'absolute';
  beforeLbl.style.left = '106px';
  beforeLbl.style.top = '39%';
  beforeLbl.style.transform = 'rotate(-90deg)';
  beforeLbl.style.transformOrigin = 'top left';
  beforeLbl.style.color = ACCENT;
  beforeLbl.style.fontFamily = FONT;
  beforeLbl.style.fontSize = '50px';
  beforeLbl.style.fontWeight = '700';
  beforeLbl.style.textTransform = 'uppercase';
  beforeLbl.style.lineHeight = '79px';
  beforeLbl.style.letterSpacing = '10px';
  beforeLbl.style.whiteSpace = 'nowrap';
  container.appendChild(beforeLbl);

  // ── "AFTER" rotated label (right side) ──
  const afterLbl = document.createElement('div');
  afterLbl.className = 'tpl-label';
  afterLbl.textContent = 'AFTER';
  afterLbl.style.position = 'absolute';
  afterLbl.style.left = '896px';
  afterLbl.style.top = '84%';
  afterLbl.style.transform = 'rotate(-90deg)';
  afterLbl.style.transformOrigin = 'top left';
  afterLbl.style.color = ACCENT;
  afterLbl.style.fontFamily = FONT;
  afterLbl.style.fontSize = '50px';
  afterLbl.style.fontWeight = '700';
  afterLbl.style.textTransform = 'uppercase';
  afterLbl.style.lineHeight = '79px';
  afterLbl.style.letterSpacing = '10px';
  afterLbl.style.whiteSpace = 'nowrap';
  container.appendChild(afterLbl);

  // ── Badge (top-right) ──
  if (data.contract) {
    const badge = document.createElement('div');
    badge.className = 'tpl-badge';
    badge.style.position = 'absolute';
    badge.style.top = '64px';
    badge.style.right = '64px';
    badge.style.background = ACCENT;
    badge.style.borderRadius = '8px';
    badge.style.padding = '12px 24px';
    badge.style.fontFamily = FONT;
    badge.style.fontSize = '31px';
    badge.style.fontWeight = '600';
    badge.style.color = '#ffffff';
    badge.style.zIndex = '3';
    badge.textContent = data.contract.toUpperCase();
    container.appendChild(badge);
  }

  // ── Info section (bottom-left) ──
  const info = document.createElement('div');
  info.className = 'tpl-bottom';
  info.style.position = 'absolute';
  info.style.left = '64px';
  info.style.bottom = '64px';
  info.style.width = '430px';
  info.style.display = 'flex';
  info.style.flexDirection = 'column';
  info.style.gap = '12px';
  info.style.zIndex = '2';

  // Price
  if (data.price) {
    const price = document.createElement('div');
    price.className = 'tpl-price';
    price.style.color = ACCENT;
    price.style.fontFamily = FONT;
    price.style.fontSize = '70px';
    price.style.fontWeight = '700';
    price.style.lineHeight = '79px';
    price.style.whiteSpace = 'nowrap';
    price.textContent = data.price;
    info.appendChild(price);
  }

  // Title
  const title = document.createElement('h2');
  title.className = 'tpl-title';
  title.textContent = data.title;
  title.style.fontFamily = FONT;
  title.style.fontSize = '42px';
  title.style.fontWeight = '600';
  title.style.lineHeight = '52px';
  title.style.color = '#1C1C1C';
  title.style.display = '-webkit-box';
  title.style.webkitLineClamp = '2';
  title.style.webkitBoxOrient = 'vertical';
  title.style.overflow = 'hidden';
  title.style.maxWidth = '100%';
  title.style.minWidth = '0';
  title.style.wordBreak = 'break-word';
  title.style.margin = '0';
  info.appendChild(title);

  // Description
  if (data.description) {
    const desc = document.createElement('p');
    desc.className = 'tpl-desc';
    desc.textContent = data.description;
    desc.style.color = '#1C1C1C';
    desc.style.fontFamily = FONT;
    desc.style.fontSize = '30px';
    desc.style.fontWeight = '400';
    desc.style.lineHeight = '35px';
    desc.style.margin = '0';
    desc.style.display = '-webkit-box';
    desc.style.webkitLineClamp = '3';
    desc.style.webkitBoxOrient = 'vertical';
    desc.style.overflow = 'hidden';
    desc.style.wordBreak = 'break-word';
    info.appendChild(desc);
  }

  // Address
  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'dark',
      fontFamily: FONT,
      iconSize: 22,
      fontSize: 26,
      maxLines: 1,
    });
    addr.style.color = '#666666';
    addr.style.marginTop = '4px';
    info.appendChild(addr);
  }

  container.appendChild(info);
  return container;
}
