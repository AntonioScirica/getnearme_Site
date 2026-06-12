// Template: Arch
// White top with centered text, accent band bottom, arch-shaped photo — 1080×1350
import { createAddress, metricLabel } from '../components.js';

const FONT = 'Poppins, sans-serif';

/**
 * @param {Object} data
 * @param {string} photoUrl
 * @param {Object} [opts]
 * @returns {HTMLElement}
 */
export function renderArch(data, photoUrl, opts = {}) {
  const AC = data.accentColor || '#2563EB';
  const container = document.createElement('div');
  container.className = 'tpl tpl-arch';
  container.style.background = '#ffffff';
  container.style.overflow = 'hidden';

  const h = (opts.size && opts.size.h) || 1350;
  const isSquare = h <= 1080;
  const isTall = h >= 1920;

  // ── Accent band (bottom portion) ──
  const bandHeight = isTall ? '55%' : isSquare ? '35%' : '50%';
  const band = document.createElement('div');
  band.style.cssText = `position:absolute;left:0;right:0;bottom:0;height:${bandHeight};background:${AC}`;
  container.appendChild(band);

  // ── Top text section (centered) ──
  const top = document.createElement('div');
  top.className = 'tpl-arch-top';
  top.style.cssText = 'position:absolute;top:64px;left:64px;right:64px;display:flex;flex-direction:column;align-items:center;text-align:center;z-index:2';

  // Badge (centered)
  if (data.contract) {
    const badge = document.createElement('div');
    badge.className = 'tpl-badge';
    badge.style.cssText = `display:inline-block;align-self:center;background:${AC};border-radius:8px;padding:12px 24px;font-family:${FONT};font-size:28px;font-weight:600;color:#ffffff;margin-bottom:16px`;
    badge.textContent = data.contract.toUpperCase();
    top.appendChild(badge);
  }

  // Title (centered)
  if (data.title) {
    const title = document.createElement('h2');
    title.className = 'tpl-title';
    title.textContent = data.title;
    title.style.cssText = `margin:0;color:#1C1C1C;font-family:${FONT};font-size:62px;font-weight:700;line-height:72px;text-align:center;white-space:nowrap;overflow:hidden;max-width:100%;min-width:0`;
    top.appendChild(title);
  }

  // Price (centered, accent color)
  if (data.price) {
    const price = document.createElement('div');
    price.className = 'tpl-price';
    price.style.cssText = `margin-top:16px;color:${AC};font-family:${FONT};font-size:52px;font-weight:700;line-height:60px;text-align:center;white-space:nowrap`;
    price.textContent = data.price;
    top.appendChild(price);
  }

  // Metrics as individual tags (flex-wrap centered)
  const features = [];
  const _icons = data._icons || {};
  const _bdrVal = data.bedrooms || data.rooms;
  const _bthVal = data.bathrooms;
  const _bdrIcon = _icons.bedrooms || 'bed';
  const _bthIcon = _icons.bathrooms || 'bath';
  const roomsLabel = metricLabel(_bdrIcon, _bdrVal).toLowerCase() || 'camere';
  const bathroomsLabel = metricLabel(_bthIcon, _bthVal).toLowerCase() || 'bagni';
  const surfaceLabel = data.surfaceLabel || 'm\u00B2';
  if (_bdrVal) features.push(_bdrVal + ' ' + roomsLabel);
  if (_bthVal) features.push(_bthVal + ' ' + bathroomsLabel);
  if (data.surfaceNum || data.surface) features.push((data.surfaceNum || data.surface) + ' ' + surfaceLabel);

  if (features.length) {
    const tagsRow = document.createElement('div');
    tagsRow.className = 'tpl-metrics-inline';
    tagsRow.style.cssText = 'display:flex;flex-wrap:wrap;justify-content:center;gap:12px 0;margin-top:24px';
    features.forEach((f, i) => {
      if (i > 0) {
        const sep = document.createElement('div');
        sep.style.cssText = 'width:1px;height:28px;background:#ccc;margin:0 24px;align-self:center';
        tagsRow.appendChild(sep);
      }
      const tag = document.createElement('div');
      tag.textContent = f;
      tag.style.cssText = `font-family:${FONT};font-size:30px;color:#444;font-weight:500`;
      tagsRow.appendChild(tag);
    });
    top.appendChild(tagsRow);
  }

  // Description
  if (data.description) {
    const desc = document.createElement('p');
    desc.className = 'tpl-desc';
    desc.textContent = data.description;
    desc.style.cssText = `margin:16px 0 0;color:#666;font-family:${FONT};font-size:28px;font-weight:400;line-height:38px;text-align:center;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;word-break:break-word;max-width:80%;min-width:0`;
    top.appendChild(desc);
  }

  // Address (centered)
  if (data.address) {
    const addr = createAddress(data.address, {
      color: 'dark',
      fontFamily: FONT,
      iconSize: 22,
      fontSize: 24,
      maxLines: 1,
    });
    addr.style.marginTop = '12px';
    addr.style.color = '#999';
    addr.style.justifyContent = 'center';
    top.appendChild(addr);
  }

  container.appendChild(top);

  // ── Arch photo ──
  const archW = isSquare ? 820 : isTall ? 860 : 800;
  const archH = isSquare ? '50%' : isTall ? '60%' : '58%';
  const archR = Math.round(archW / 2);
  const arch = document.createElement('div');
  arch.className = 'tpl-arch-photo';
  arch.style.cssText = `position:absolute;left:calc(50% - ${archW / 2}px);bottom:0;width:${archW}px;height:${archH};border-radius:${archR}px ${archR}px 0 0;overflow:hidden;z-index:1`;

  const img = document.createElement('img');
  img.src = photoUrl;
  img.alt = '';
  img.style.cssText = 'width:100%;height:100%;object-fit:cover;display:block';
  arch.appendChild(img);

  // Dark gradient at bottom of photo
  const grad = document.createElement('div');
  grad.style.cssText = 'position:absolute;left:0;right:0;bottom:0;height:60%;background:linear-gradient(to top,rgba(0,0,0,0.6),transparent);pointer-events:none';
  arch.appendChild(grad);

  container.appendChild(arch);

  return container;
}
