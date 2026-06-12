// Template: Gallery
// Primary-blue background, white text at top, 3 photos flush at bottom
import { createPrice, createAddress, createMetricsInline } from '../components.js';

const FONT = 'Poppins, sans-serif';
/**
 * @param {Object} data
 * @param {string} photoUrl - Primary photo
 * @param {Object} [opts]
 * @param {string[]} [opts.photos] - Additional photo URLs
 * @returns {HTMLElement}
 */
export function renderGallery(data, photoUrl, opts = {}) {
  const PRIMARY = data.accentColor || '#2967EC';
  const container = document.createElement('div');
  container.className = 'tpl tpl-gallery';
  container.style.background = PRIMARY;
  container.style.display = 'flex';
  container.style.flexDirection = 'column';

  // Collect all photos (primary + extras)
  const photos = [photoUrl, ...(opts.photos || [])];
  const isTall = opts.size && opts.size.h >= 1920;

  // ── Top section: badge + price + title + description + address + metrics ──
  const topSection = document.createElement('div');
  topSection.style.padding = '64px 64px 24px';
  topSection.style.display = 'flex';
  topSection.style.flexDirection = 'column';
  topSection.style.gap = '16px';
  topSection.style.overflow = 'hidden';
  topSection.style.flexShrink = '0';
  topSection.style.position = 'relative';
  topSection.style.zIndex = '1';

  // Badge
  if (data.contract) {
    const badge = document.createElement('div');
    badge.className = 'tpl-badge';
    badge.style.background = 'rgba(255,255,255,0.2)';
    badge.style.borderRadius = '8px';
    badge.style.padding = '12px 24px';
    badge.style.fontFamily = FONT;
    badge.style.fontSize = '28px';
    badge.style.fontWeight = '600';
    badge.style.color = '#ffffff';
    badge.style.alignSelf = 'flex-start';
    badge.textContent = data.contract.toUpperCase();
    topSection.appendChild(badge);
  }

  // Price
  if (data.price) {
    const price = createPrice(data.price, { size: 'xl', fontFamily: FONT });
    price.style.fontSize = '72px';
    price.style.fontWeight = '700';
    price.style.lineHeight = '80px';
    price.style.color = '#ffffff';
    price.style.whiteSpace = 'nowrap';
    price.style.marginTop = '40px';
    topSection.appendChild(price);
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
  topSection.appendChild(title);

  // Description
  if (data.description) {
    const desc = document.createElement('p');
    desc.className = 'tpl-desc';
    desc.textContent = data.description;
    desc.style.fontFamily = FONT;
    desc.style.fontSize = '28px';
    desc.style.fontWeight = '400';
    desc.style.lineHeight = '38px';
    desc.style.color = 'rgba(255,255,255,0.8)';
    desc.style.margin = '0';
    desc.style.display = '-webkit-box';
    desc.style.webkitLineClamp = '2';
    desc.style.webkitBoxOrient = 'vertical';
    desc.style.overflow = 'hidden';
    desc.style.maxWidth = '100%';
    desc.style.minWidth = '0';
    desc.style.wordBreak = 'break-word';
    desc.style.marginTop = '8px';
    topSection.appendChild(desc);
  }

  // Address
  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'light',
      fontFamily: FONT,
      iconSize: 24,
      fontSize: 26,
      maxLines: 1,
    });
    addr.style.color = 'rgba(255,255,255,0.7)';
    addr.style.marginTop = '8px';
    topSection.appendChild(addr);
  }

  // Inline metrics
  const inline = createMetricsInline(data, {
    fontFamily: FONT,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 26,
  });
  if (inline) {
    inline.style.marginTop = '8px';
    topSection.appendChild(inline);
  }

  container.appendChild(topSection);

  // ── White shape from bottom up — SVG polygon (clip-path unsupported by html2canvas) ──
  const shapeTopL = isTall ? 50 : 62;
  const shapeTopR = isTall ? 40 : 55;
  const svgNS = 'http://www.w3.org/2000/svg';
  const shapeSvg = document.createElementNS(svgNS, 'svg');
  shapeSvg.setAttribute('width', '100%');
  shapeSvg.setAttribute('height', '100%');
  shapeSvg.setAttribute('viewBox', '0 0 100 100');
  shapeSvg.setAttribute('preserveAspectRatio', 'none');
  shapeSvg.style.cssText = 'position:absolute;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0';
  const shapePoly = document.createElementNS(svgNS, 'polygon');
  shapePoly.setAttribute('points', `0,${shapeTopL} 100,${shapeTopR} 100,100 0,100`);
  shapePoly.setAttribute('fill', '#ffffff');
  shapeSvg.appendChild(shapePoly);
  container.appendChild(shapeSvg);

  // ── Bottom section: photos ──
  const photoBox = document.createElement('div');
  photoBox.style.marginTop = 'auto';
  photoBox.style.display = 'flex';
  photoBox.style.gap = isTall ? '12px' : '16px';
  photoBox.style.padding = '0 60px 60px';
  photoBox.style.flexShrink = '0';
  photoBox.style.position = 'relative';
  photoBox.style.zIndex = '1';

  if (isTall) {
    // Vertical stack — fills ~55% of container height
    photoBox.style.flexDirection = 'column';
    photoBox.style.flex = '1';
    photoBox.style.maxHeight = '55%';
    photoBox.style.minHeight = '0';
  } else {
    // Horizontal row
    photoBox.style.flexDirection = 'row';
    photoBox.style.height = '35%';
  }

  for (let i = 0; i < 3; i++) {
    const cell = document.createElement('div');
    cell.className = 'tpl-photo';
    cell.style.borderRadius = '16px';
    cell.style.overflow = 'hidden';
    cell.style.background = '#e0e0e0';

    if (isTall) {
      cell.style.width = '100%';
      cell.style.flex = '1';
      cell.style.minHeight = '0';
      cell.style.flexShrink = '0';
    } else {
      cell.style.flex = '1';
      cell.style.minHeight = '0';
    }

    if (photos[i]) {
      const img = document.createElement('img');
      img.src = photos[i];
      img.alt = '';
      img.style.width = '100%';
      img.style.height = '100%';
      img.style.objectFit = 'cover';
      img.style.display = 'block';
      cell.appendChild(img);
    } else {
      const placeholder = document.createElement('div');
      placeholder.style.width = '100%';
      placeholder.style.height = '100%';
      placeholder.style.display = 'flex';
      placeholder.style.alignItems = 'center';
      placeholder.style.justifyContent = 'center';
      placeholder.style.color = 'rgba(0,0,0,0.2)';
      placeholder.innerHTML = '<svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="12" cy="13" r="3"/><path d="M5 3v2M19 3v2"/></svg>';
      cell.appendChild(placeholder);
    }

    photoBox.appendChild(cell);
  }

  container.appendChild(photoBox);
  return container;
}
