// Shared DOM component builders for post templates
import { createIcon } from './icons.js';

const METRIC_LABELS = {
  bed:             ['Camera',      'Camere'],
  bath:            ['Bagno',       'Bagni'],
  area:            ['m²',          'm²'],
  rooms:           ['Locale',      'Locali'],
  sofa:            ['Soggiorno',   'Soggiorni'],
  cookingPot:      ['Cucina',      'Cucine'],
  elevator:        ['Ascensore',   'Ascensori'],
  balcony:         ['Balcone',     'Balconi'],
  terrace:         ['Terrazzo',    'Terrazzi'],
  garden:          ['Giardino',    'Giardini'],
  parking:         ['Posto auto',  'Posti auto'],
  floor:           ['Piano',       'Piani'],
  heating:         ['Riscaldamento','Riscaldamento'],
  airConditioning: ['Climatizzazione','Climatizzazione'],
};

export function metricLabel(iconKey, value) {
  const pair = METRIC_LABELS[iconKey];
  if (!pair) return '';
  const n = parseInt(value, 10);
  return (!isNaN(n) && n === 1) ? pair[0] : pair[1];
}

/**
 * Creates a two-layer cover: blurred full-screen background + contained foreground.
 * @param {string} photoUrl - Data URL or blob URL of the media
 * @returns {HTMLElement}
 */
export function createCover(photoUrl) {
  const wrapper = document.createElement('div');
  wrapper.className = 'tpl-cover';

  const bg = document.createElement('img');
  bg.className = 'tpl-cover-bg';
  bg.src = photoUrl;
  bg.alt = '';
  wrapper.appendChild(bg);

  const fg = document.createElement('img');
  fg.className = 'tpl-cover-fg';
  fg.src = photoUrl;
  fg.alt = '';
  wrapper.appendChild(fg);

  return wrapper;
}

/**
 * Creates a badge element.
 * @param {string} text - Badge text (e.g. "NUOVO")
 * @param {Object} opts
 * @param {'white'|'blue'|'dark'} opts.variant
 * @param {string} opts.fontFamily
 * @param {number} opts.fontSize
 * @param {number} opts.paddingX
 * @param {number} opts.paddingY
 * @param {number} opts.radius
 * @returns {HTMLElement}
 */
export function createBadge(text, opts = {}) {
  const {
    variant = 'blue',
    fontFamily,
    fontSize,
    fontWeight,
    paddingX,
    paddingY,
    radius,
  } = opts;

  const el = document.createElement('div');
  el.className = `tpl-badge tpl-badge--${variant}`;
  el.textContent = text.toUpperCase();

  if (fontFamily) el.style.fontFamily = fontFamily;
  if (fontSize) el.style.fontSize = fontSize + 'px';
  if (fontWeight) el.style.fontWeight = fontWeight;
  if (paddingX != null || paddingY != null) {
    el.style.padding = `${paddingY ?? 14}px ${paddingX ?? 24}px`;
  }
  if (radius) el.style.borderRadius = radius + 'px';

  return el;
}

/**
 * Creates a price display element.
 * @param {string} price - Formatted price string
 * @param {Object} opts
 * @param {'xl'|'lg'|'md'} opts.size
 * @param {string} opts.color
 * @param {string} opts.fontFamily
 * @returns {HTMLElement}
 */
export function createPrice(price, opts = {}) {
  const { size = 'xl', color, fontFamily } = opts;
  const el = document.createElement('div');
  el.className = `tpl-price tpl-price--${size}`;
  el.textContent = price;
  if (color) el.style.color = color;
  if (fontFamily) el.style.fontFamily = fontFamily;
  return el;
}

/**
 * Creates an address row with pin icon.
 * @param {string} address
 * @param {Object} opts
 * @param {'light'|'dark'} opts.color
 * @param {string} opts.fontFamily
 * @param {number} opts.iconSize
 * @param {number} opts.fontSize
 * @returns {HTMLElement}
 */
export function createAddress(address, opts = {}) {
  const { color = 'light', fontFamily, iconSize = 26, fontSize, maxLines } = opts;
  const row = document.createElement('div');
  row.className = `tpl-address tpl-address--${color}`;
  if (fontFamily) row.style.fontFamily = fontFamily;
  if (fontSize) row.style.fontSize = fontSize + 'px';

  const icon = createIcon('mapPin', iconSize);
  row.appendChild(icon);

  const span = document.createElement('span');
  span.textContent = address;
  // Add text truncation with ellipsis if maxLines specified
  if (maxLines) {
    row.style.width = '100%';
    row.style.maxWidth = '100%';
    row.style.minWidth = '0'; // Critical: allows flex container to shrink for text truncation
    row.style.overflow = 'hidden';
    span.style.display = '-webkit-box';
    span.style.webkitLineClamp = maxLines;
    span.style.webkitBoxOrient = 'vertical';
    span.style.overflow = 'hidden';
    span.style.maxWidth = '100%';
    span.style.wordBreak = 'break-word';
  }
  row.appendChild(span);

  return row;
}

/**
 * Creates an empty-photo placeholder: grey box with a Lucide "image" icon.
 * Used for multi-photo templates when a photo slot is not filled.
 * @param {Object} [opts]
 * @param {number} [opts.iconSize=64]
 * @returns {HTMLElement}
 */
export function createPhotoPlaceholder(opts = {}) {
  const { iconSize = 64 } = opts;
  const box = document.createElement('div');
  box.style.cssText = 'width:100%;height:100%;display:flex;align-items:center;justify-content:center;background:#e0e0e0;color:rgba(0,0,0,0.25)';
  box.innerHTML = `<svg width="${iconSize}" height="${iconSize}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="3" rx="2" ry="2"/><circle cx="9" cy="9" r="2"/><path d="m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21"/></svg>`;
  return box;
}

/**
 * Creates metric cards row (bedrooms, bathrooms, surface).
 * @param {Object} data - { bedrooms, rooms, bathrooms, surface, surfaceNum }
 * @param {Object} opts
 * @param {'glass'|'solid-light'|'solid-dark'|'pill'} opts.variant
 * @param {string} opts.fontFamily
 * @param {number} opts.gap
 * @param {number} opts.cardW
 * @param {number} opts.cardH
 * @param {number} opts.iconSize
 * @param {number} opts.valueSize
 * @param {number} opts.labelSize
 * @param {number} opts.radius
 * @param {boolean} opts.showLabels - Whether to show labels (default true)
 * @param {boolean} opts.iconOnTop - Icon on top, value below (default false = value top, icon bottom)
 * @returns {HTMLElement}
 */
export function createMetricCards(data, opts = {}) {
  const {
    variant = 'glass',
    fontFamily,
    gap,
    cardW,
    cardH,
    iconSize = 40,
    valueSize,
    labelSize,
    radius,
    innerGap,
    showLabels = true,
    iconOnTop = true,
  } = opts;

  const row = document.createElement('div');
  row.className = `tpl-metrics tpl-metrics--${variant}`;
  if (gap != null) row.style.gap = gap + 'px';
  if (fontFamily) row.style.fontFamily = fontFamily;

  const icons = data._icons || {};
  // Append "m²" to any field whose icon is 'area'
  const withUnit = (val, icon) => icon === 'area' && val && val !== '-' && !String(val).includes('m')
    ? (String(val).replace(/\s*m²?\s*$/, '') + ' m\u00B2') : (val || '-');
  const bedroomsIcon = icons.bedrooms || 'bed';
  const bathroomsIcon = icons.bathrooms || 'bath';
  const surfaceIcon = icons.surface || 'area';
  const bedroomsVal = data.bedrooms || data.rooms;
  const bathroomsVal = data.bathrooms;
  const surfaceVal = data.surfaceNum || data.surface;
  const metrics = [
    { icon: bedroomsIcon, value: withUnit(bedroomsVal, bedroomsIcon), label: metricLabel(bedroomsIcon, bedroomsVal) },
    { icon: bathroomsIcon, value: withUnit(bathroomsVal, bathroomsIcon), label: metricLabel(bathroomsIcon, bathroomsVal) },
    { icon: surfaceIcon, value: withUnit(surfaceVal, surfaceIcon), label: metricLabel(surfaceIcon, surfaceVal) },
  ];

  metrics.forEach(m => {
    const card = document.createElement('div');
    card.className = 'tpl-metric-card';
    if (cardW) card.style.width = cardW + 'px';
    if (cardH) card.style.height = cardH + 'px';
    if (radius != null) card.style.borderRadius = radius + 'px';
    if (innerGap != null) card.style.gap = innerGap + 'px';

    const icon = createIcon(m.icon, iconSize);
    icon.className = 'tpl-metric-card__icon';

    const value = document.createElement('div');
    value.className = 'tpl-metric-card__value';
    value.textContent = m.value;
    value.style.whiteSpace = 'nowrap';
    if (valueSize) value.style.fontSize = valueSize + 'px';

    if (iconOnTop) {
      card.appendChild(icon);
      card.appendChild(value);
    } else {
      card.appendChild(value);
      card.appendChild(icon);
    }

    if (showLabels) {
      const label = document.createElement('div');
      label.className = 'tpl-metric-card__label';
      label.textContent = m.label;
      if (labelSize) label.style.fontSize = labelSize + 'px';
      card.appendChild(label);
    }

    row.appendChild(card);
  });

  return row;
}

/**
 * Creates metric pills row (compact version for clean template).
 * @param {Object} data
 * @param {Object} opts
 * @param {number} opts.gap
 * @param {number} opts.radius
 * @param {number} opts.iconSize
 * @param {boolean} opts.showIcons - Show icons in pills (default true)
 * @returns {HTMLElement}
 */
export function createMetricPills(data, opts = {}) {
  const { gap = 15, radius = 26, iconSize = 22, showIcons = true } = opts;

  const row = document.createElement('div');
  row.className = 'tpl-metric-pills';
  row.style.gap = gap + 'px';

  const icons2 = data._icons || {};
  const withUnit2 = (val, icon) => icon === 'area' && val && val !== '-' && !String(val).includes('m')
    ? (String(val).replace(/\s*m²?\s*$/, '') + ' m\u00B2') : (val || '-');
  const bedroomsIcon2 = icons2.bedrooms || 'bed';
  const bathroomsIcon2 = icons2.bathrooms || 'bath';
  const surfaceIcon2 = icons2.surface || 'area';
  const bedroomsVal2 = data.bedrooms || data.rooms;
  const bathroomsVal2 = data.bathrooms;
  const surfaceVal2 = data.surfaceNum || data.surface;
  const pillLabel = (icon, val) => {
    const pair = METRIC_LABELS[icon];
    if (!pair) return '';
    if (icon === 'area') return '';
    const n = parseInt(val, 10);
    const full = (!isNaN(n) && n === 1) ? pair[0] : pair[1];
    return full.length > 5 ? full.slice(0, 4) + '.' : full;
  };
  const metrics = [
    { icon: bedroomsIcon2, value: withUnit2(bedroomsVal2, bedroomsIcon2), label: pillLabel(bedroomsIcon2, bedroomsVal2) },
    { icon: bathroomsIcon2, value: withUnit2(bathroomsVal2, bathroomsIcon2), label: pillLabel(bathroomsIcon2, bathroomsVal2) },
    { icon: surfaceIcon2, value: withUnit2(surfaceVal2, surfaceIcon2), label: '' },
  ];

  metrics.forEach(m => {
    const pill = document.createElement('div');
    pill.className = 'tpl-metric-pill';
    pill.style.borderRadius = radius + 'px';

    if (showIcons) {
      const icon = createIcon(m.icon, iconSize);
      pill.appendChild(icon);
    }

    const span = document.createElement('span');
    const txt = m.label ? (m.value + ' ' + m.label) : m.value;
    span.textContent = txt;
    pill.appendChild(span);

    row.appendChild(pill);
  });

  return row;
}

/**
 * Creates description text element.
 * @param {string} text
 * @param {Object} opts
 * @param {'light'|'dark'} opts.color
 * @param {string} opts.fontFamily
 * @param {number} opts.fontSize
 * @param {number} opts.lineHeight
 * @returns {HTMLElement}
 */
export function createDescription(text, opts = {}) {
  const { color = 'light', fontFamily, fontSize, lineHeight, maxLines } = opts;
  const el = document.createElement('p');
  el.className = `tpl-desc tpl-desc--${color}`;
  el.textContent = text;
  if (fontFamily) el.style.fontFamily = fontFamily;
  if (fontSize) el.style.fontSize = fontSize + 'px';
  if (lineHeight) el.style.lineHeight = lineHeight + 'px';
  // Add text truncation with ellipsis if maxLines specified
  if (maxLines) {
    el.style.display = '-webkit-box';
    el.style.webkitLineClamp = maxLines;
    el.style.webkitBoxOrient = 'vertical';
    el.style.overflow = 'hidden';
    el.style.maxWidth = '100%';
    el.style.minWidth = '0';
    el.style.wordBreak = 'break-word';
  }
  return el;
}

/**
 * Creates title element.
 * @param {string} text
 * @param {Object} opts
 * @param {string} opts.color
 * @param {string} opts.fontFamily
 * @param {number} opts.fontSize
 * @param {number} opts.fontWeight
 * @param {number} opts.lineHeight
 * @returns {HTMLElement}
 */
export function createTitle(text, opts = {}) {
  const { color, fontFamily, fontSize, fontWeight, lineHeight, maxLines } = opts;
  const el = document.createElement('h2');
  el.className = 'tpl-title';
  el.textContent = text;
  if (color) el.style.color = color;
  if (fontFamily) el.style.fontFamily = fontFamily;
  if (fontSize) el.style.fontSize = fontSize + 'px';
  if (fontWeight) el.style.fontWeight = fontWeight;
  if (lineHeight) el.style.lineHeight = lineHeight + 'px';
  // Add text truncation with ellipsis if maxLines specified
  if (maxLines) {
    el.style.display = '-webkit-box';
    el.style.webkitLineClamp = maxLines;
    el.style.webkitBoxOrient = 'vertical';
    el.style.overflow = 'hidden';
    el.style.maxWidth = '100%';
    el.style.minWidth = '0';
  }
  return el;
}


/**
 * Creates a button element.
 * @param {string} text
 * @param {Object} opts
 * @param {'white'|'blue'} opts.variant
 * @param {number} opts.width
 * @param {number} opts.height
 * @param {number} opts.fontSize
 * @param {string} opts.fontFamily
 * @returns {HTMLElement}
 */
export function createButton(text, opts = {}) {
  const { variant = 'white', width, height, fontSize, fontFamily } = opts;
  const el = document.createElement('div');
  el.className = `tpl-btn tpl-btn--${variant}`;
  el.textContent = text;
  if (width) el.style.width = width + 'px';
  if (height) el.style.height = height + 'px';
  if (fontSize) el.style.fontSize = fontSize + 'px';
  if (fontFamily) el.style.fontFamily = fontFamily;
  return el;
}

/**
 * Creates an inline metrics text (e.g. "4 camere | 2 bagni | 85 m²")
 * @param {Object} data
 * @param {Object} opts
 * @param {string} opts.color
 * @param {number} opts.fontSize
 * @param {string} opts.fontFamily
 * @returns {HTMLElement|null}
 */
export function createMetricsInline(data, opts = {}) {
  const { color, fontSize, fontFamily } = opts;
  const parts = [];
  const icons = data._icons || {};
  const bedroomsVal = data.bedrooms || data.rooms;
  const bathroomsVal = data.bathrooms;
  const bedroomsIcon = icons.bedrooms || 'bed';
  const bathroomsIcon = icons.bathrooms || 'bath';
  const roomsLabel = metricLabel(bedroomsIcon, bedroomsVal).toLowerCase() || 'camere';
  const bathroomsLbl = metricLabel(bathroomsIcon, bathroomsVal).toLowerCase() || 'bagni';
  const surfaceLabel = data.surfaceLabel || 'm\u00B2';

  if (bedroomsVal) parts.push(bedroomsVal + ' ' + roomsLabel);
  if (bathroomsVal) parts.push(bathroomsVal + ' ' + bathroomsLbl);
  if (data.surfaceNum) parts.push(data.surfaceNum + ' ' + surfaceLabel);
  else if (data.surface) parts.push(data.surface + ' ' + surfaceLabel);
  if (!parts.length) return null;

  const el = document.createElement('div');
  el.className = 'tpl-metrics-inline';
  el.textContent = parts.join('                        |                        ');
  if (color) el.style.color = color;
  if (fontSize) el.style.fontSize = fontSize + 'px';
  if (fontFamily) el.style.fontFamily = fontFamily;
  return el;
}

/**
 * Creates a logo element for template overlay.
 * @param {string} logoUrl - Data URL of the logo image
 * @param {Object} opts
 * @param {boolean} opts.inline - If true, returns plain image for content-flow placement
 * @returns {HTMLElement}
 */
export function createLogoOverlay(logoUrl, opts = {}) {
  const { inline = false, orientation = 'horizontal' } = opts;
  const isVert = orientation === 'vertical';

  // Inline mode: plain image for content-flow placement
  if (inline) {
    const img = document.createElement('img');
    img.className = 'tpl-logo-overlay';
    img.src = logoUrl;
    img.alt = '';
    Object.assign(img.style, {
      width: isVert ? '60px' : '220px',
      height: '60px',
      objectFit: 'contain',
      flexShrink: '0',
      pointerEvents: 'none',
    });
    return img;
  }

  // Glass-pill mode: for absolute overlays on photo
  const wrapper = document.createElement('div');
  wrapper.className = 'tpl-logo-overlay';
  Object.assign(wrapper.style, {
    position: 'absolute',
    zIndex: '10',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '96px',
    minWidth: '96px',
    padding: '16px',
    borderRadius: '22px',
    background: 'rgba(255,255,255,0.12)',
    border: '1px solid rgba(255,255,255,0.25)',
    backdropFilter: 'blur(16px)',
    WebkitBackdropFilter: 'blur(16px)',
    boxSizing: 'border-box',
    pointerEvents: 'none',
  });

  const img = document.createElement('img');
  img.src = logoUrl;
  img.alt = '';
  Object.assign(img.style, {
    height: '100%',
    width: 'auto',
    maxWidth: '260px',
    objectFit: 'contain',
  });
  wrapper.appendChild(img);

  return wrapper;
}
