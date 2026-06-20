// Illustrated, brand-accurate SVG mockups of the GetNearMe platform for the
// "Feature" carousel cover. Used instead of real screenshots (the product is
// behind auth). Keyed by feature; picked via slide_data.coverArt.
//
// Mirrors the REAL web dashboard (src/components/dashboard): warm palette
// (bg #f4f2ee, cards #fff, border #e4e1da, text #211f1c/#57534c/#8c867d),
// blue #3B83F6, Lucide line icons, sectioned sidebar, real screen labels.
// viewBox 936×500 (matches .cf-visual).

import { LOGO_SVG_PATH } from "./shared";

// ── Lucide-style nav icons (24-box) ──
const I = {
  layout: `<rect x="3" y="3" width="7" height="8" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="11" width="7" height="8" rx="1"/><rect x="3" y="14" width="7" height="5" rx="1"/>`,
  sparkles: `<path d="M12 3l1.8 5L19 9.8l-5.2 1.7L12 17l-1.8-5.5L5 9.8 10.2 8z"/><path d="M19 14.5l.7 2 2 .7-2 .7-.7 2-.7-2-2-.7 2-.7z"/>`,
  film: `<rect x="3" y="4" width="18" height="16" rx="2"/><path d="M7 4v16M17 4v16M3 12h18"/>`,
  megaphone: `<path d="M3 11l15-5v12L3 13z"/><path d="M11.5 16.5a3 3 0 0 1-5.7-1.3"/>`,
  images: `<rect x="3" y="3" width="14" height="14" rx="2"/><circle cx="8" cy="8" r="1.6"/><path d="M4.5 15l3.5-3.5 2.5 2 3-3.5 3.5 4"/><path d="M8 21h11a2 2 0 0 0 2-2V9"/>`,
  palette: `<path d="M12 3a9 9 0 1 0 0 18c1.1 0 1.5-.9 1.5-1.7 0-1.6 1-2.3 2.5-2.3H18a3 3 0 0 0 3-3 9 9 0 0 0-9-9z"/><circle cx="7.5" cy="10.5" r="1.1"/><circle cx="12" cy="8" r="1.1"/><circle cx="16" cy="10.5" r="1.1"/>`,
  users: `<circle cx="9" cy="8" r="3.2"/><path d="M2.5 19c0-3.6 2.9-6 6.5-6s6.5 2.4 6.5 6"/><path d="M16 6.5a3 3 0 0 1 0 6M17 13c3 .3 5 2.4 5 5.5"/>`,
  card: `<rect x="2.5" y="5" width="19" height="14" rx="2.5"/><path d="M2.5 10h19"/>`,
};

const NAV_IMM = [
  { label: "Scheda", icon: I.layout },
  { label: "Homestaging AI", icon: I.sparkles },
  { label: "Video AI", icon: I.film },
  { label: "Post Social", icon: I.megaphone },
  { label: "Galleria", icon: I.images },
];
const NAV_AG = [
  { label: "Brand", icon: I.palette },
  { label: "Team", icon: I.users },
  { label: "Piano", icon: I.card },
];

function appShell(items: { label: string; icon: string }[], section: string, active: number, inner: string): string {
  const baseY = 104;
  const nav = items.map((n, i) => {
    const y = baseY + i * 44;
    const on = i === active;
    const c = on ? "#1d5fd0" : "#57534c";
    const bg = on ? `<rect x="14" y="${y - 20}" width="184" height="40" rx="10" fill="#eff6ff"/>` : "";
    return `${bg}<g transform="translate(28,${y - 10}) scale(0.83)" fill="none" stroke="${c}" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${n.icon}</g><text x="58" y="${y + 5}" font-family="Satoshi,sans-serif" font-size="15" font-weight="${on ? 700 : 600}" fill="${c}">${n.label}</text>`;
  }).join("");
  return `<svg class="cf-art" viewBox="0 0 936 500" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid slice">
    <rect width="936" height="500" fill="#f4f2ee"/>
    <rect width="212" height="500" fill="#ffffff"/>
    <line x1="212" y1="0" x2="212" y2="500" stroke="#e4e1da" stroke-width="1.5"/>
    <circle cx="40" cy="36" r="12" fill="#3B82F6"/>
    <g transform="translate(33.96,28.4) scale(0.0285)"><path fill="#fff" d="${LOGO_SVG_PATH}"/></g>
    <text x="60" y="41" font-family="Satoshi,sans-serif" font-size="15.5" font-weight="800" fill="#211f1c" letter-spacing="-0.3">GetNearMe</text>
    <text x="28" y="84" font-family="Satoshi,sans-serif" font-size="11" font-weight="700" fill="#a39c91" letter-spacing="1.2">${section}</text>
    ${nav}
    ${inner}
  </svg>`;
}

function head(title: string, sub: string): string {
  return `<text x="240" y="52" font-family="Satoshi,sans-serif" font-size="25" font-weight="800" fill="#211f1c" letter-spacing="-0.4">${title}</text>
    <text x="240" y="76" font-family="Satoshi,sans-serif" font-size="14" font-weight="500" fill="#8c867d">${sub}</text>`;
}
function genBtn(x: number, label: string): string {
  return `<rect x="${x}" y="344" width="156" height="46" rx="12" fill="#3B82F6"/>
    <g transform="translate(${x + 30},358) scale(0.78)" fill="none" stroke="#fff" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l1.8 5L19 9.8l-5.2 1.7L12 17l-1.8-5.5L5 9.8 10.2 8z"/></g>
    <text x="${x + 86}" y="373" font-family="Satoshi,sans-serif" font-size="16" font-weight="700" fill="#fff" text-anchor="middle">${label}</text>`;
}
// Pill option row (icon + label), active = blue
function optRow(x: number, y: number, w: number, label: string, icon: string, active: boolean): string {
  const fill = active ? "#3B82F6" : "#fff";
  const stroke = active ? "#3B82F6" : "#e4e1da";
  const col = active ? "#fff" : "#57534c";
  return `<rect x="${x}" y="${y}" width="${w}" height="42" rx="11" fill="${fill}" stroke="${stroke}" stroke-width="1.5"/>
    <g transform="translate(${x + 14},${y + 11}) scale(0.83)" fill="none" stroke="${col}" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${icon}</g>
    <text x="${x + 42}" y="${y + 27}" font-family="Satoshi,sans-serif" font-size="15" font-weight="${active ? 700 : 600}" fill="${col}">${label}</text>`;
}

// ── STAGING ──────────────────────────────────────────────────────────
const STAGING = appShell(NAV_IMM, "IMMOBILE ATTIVO", 1, `
  ${head("Homestaging AI", "Arreda, svuota o trasforma le foto dei tuoi immobili.")}
  <defs>
    <clipPath id="rc"><rect x="240" y="96" width="668" height="228" rx="14"/></clipPath>
    <linearGradient id="flB" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3ddd2"/><stop offset="1" stop-color="#d9d2c4"/></linearGradient>
    <linearGradient id="flA" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e3d4bd"/><stop offset="1" stop-color="#d8c6a9"/></linearGradient>
    <linearGradient id="glass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#eef3f7"/><stop offset="1" stop-color="#e2eaf1"/></linearGradient>
  </defs>
  <g clip-path="url(#rc)">
    <rect x="240" y="96" width="334" height="228" fill="#ece9e3"/>
    <rect x="240" y="252" width="334" height="72" fill="url(#flB)"/>
    <line x1="240" y1="252" x2="574" y2="252" stroke="#cfc8bb" stroke-width="1.5"/>
    <rect x="312" y="138" width="128" height="96" rx="3" fill="#fff" stroke="#dcd6ca" stroke-width="3"/>
    <rect x="320" y="146" width="112" height="80" fill="url(#glass)"/>
    <line x1="376" y1="146" x2="376" y2="226" stroke="#dcd6ca" stroke-width="3"/>
    <line x1="320" y1="186" x2="432" y2="186" stroke="#dcd6ca" stroke-width="3"/>
    <rect x="574" y="96" width="334" height="228" fill="#f1ece3"/>
    <rect x="574" y="252" width="334" height="72" fill="url(#flA)"/>
    <line x1="574" y1="252" x2="908" y2="252" stroke="#cdbb9e" stroke-width="1.5"/>
    <rect x="700" y="134" width="74" height="56" rx="2" fill="#faf7f1" stroke="#c9bda4" stroke-width="2.5"/>
    <path d="M708 182l14-18 10 11 8-7 12 14z" fill="#cfd6cb"/>
    <line x1="616" y1="252" x2="616" y2="176" stroke="#b3a892" stroke-width="3"/>
    <path d="M600 176 q16 -22 32 0 z" fill="#e7dcc6"/>
    <ellipse cx="744" cy="306" rx="150" ry="18" fill="#000" opacity="0.04"/>
    <ellipse cx="744" cy="302" rx="146" ry="20" fill="#e9dfcb"/>
    <rect x="650" y="284" width="22" height="18" rx="3" fill="#8f8473"/>
    <rect x="816" y="284" width="22" height="18" rx="3" fill="#8f8473"/>
    <rect x="644" y="230" width="200" height="38" rx="13" fill="#c3b69c"/>
    <rect x="644" y="256" width="200" height="34" rx="11" fill="#cdc0a6"/>
    <rect x="644" y="244" width="32" height="46" rx="11" fill="#bdb094"/>
    <rect x="812" y="244" width="32" height="46" rx="11" fill="#bdb094"/>
    <rect x="684" y="250" width="56" height="32" rx="8" fill="#d6cab1"/>
    <rect x="748" y="250" width="56" height="32" rx="8" fill="#d6cab1"/>
  </g>
  <rect x="240" y="96" width="668" height="228" rx="14" fill="none" stroke="#e4e1da" stroke-width="1.5"/>
  <rect x="254" y="110" width="74" height="27" rx="13.5" fill="#fff" stroke="#e4e1da" stroke-width="1.5"/>
  <text x="291" y="128" font-family="Satoshi,sans-serif" font-size="13" font-weight="700" fill="#57534c" text-anchor="middle">Prima</text>
  <rect x="820" y="110" width="74" height="27" rx="13.5" fill="#3B82F6"/>
  <text x="857" y="128" font-family="Satoshi,sans-serif" font-size="13" font-weight="700" fill="#fff" text-anchor="middle">Dopo</text>
  <line x1="574" y1="96" x2="574" y2="324" stroke="#ffffff" stroke-width="3.5"/>
  <circle cx="574" cy="210" r="19" fill="#fff"/><circle cx="574" cy="210" r="19" fill="none" stroke="#3B82F6" stroke-width="2.5"/>
  <path d="M569 205l-5 5 5 5M579 205l5 5-5 5" fill="none" stroke="#3B82F6" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
  ${optRow(240, 346, 124, "Moderno", I.sparkles, true)}
  ${optRow(372, 346, 116, "Nordico", I.sparkles, false)}
  ${optRow(496, 346, 110, "Luxury", I.sparkles, false)}
  ${genBtn(752, "Genera")}
`);

// ── VIDEO AI ─────────────────────────────────────────────────────────
const playIcon = (x: number, y: number) => `<circle cx="${x}" cy="${y}" r="26" fill="#fff" opacity="0.92"/><path d="M${x - 8} ${y - 13}l20 13-20 13z" fill="#3B82F6"/>`;
const VIDEO = appShell(NAV_IMM, "IMMOBILE ATTIVO", 2, `
  ${head("Video AI", "Trasforma le foto dei tuoi immobili in un video tour.")}
  <defs><linearGradient id="vid" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#cdbfa6"/><stop offset="1" stop-color="#b6a98f"/></linearGradient></defs>
  <!-- vertical video preview -->
  <rect x="240" y="96" width="172" height="294" rx="14" fill="url(#vid)"/>
  <rect x="240" y="96" width="172" height="294" rx="14" fill="none" stroke="#e4e1da" stroke-width="1.5"/>
  <rect x="256" y="120" width="140" height="40" rx="8" fill="#000" opacity="0.06"/>
  <rect x="256" y="330" width="140" height="44" rx="8" fill="#000" opacity="0.10"/>
  <rect x="266" y="342" width="84" height="9" rx="4.5" fill="#fff" opacity="0.85"/>
  <rect x="266" y="357" width="56" height="8" rx="4" fill="#fff" opacity="0.6"/>
  ${playIcon(326, 230)}
  <rect x="256" y="110" width="58" height="22" rx="11" fill="#3B82F6"/>
  <text x="285" y="125" font-family="Satoshi,sans-serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">9:16</text>
  <!-- template options -->
  <text x="436" y="118" font-family="Satoshi,sans-serif" font-size="13" font-weight="700" fill="#8c867d" letter-spacing="0.4">FORMATO</text>
  ${optRow(436, 128, 220, "Prima / Dopo", I.sparkles, true)}
  ${optRow(436, 178, 220, "Timelapse", I.film, false)}
  ${optRow(436, 228, 220, "Tour della casa", I.images, false)}
  ${optRow(672, 128, 232, "Giorno / Notte", I.sparkles, false)}
  ${optRow(672, 178, 232, "Avatar", I.users, false)}
  ${genBtn(748, "Genera")}
`);

// ── POST SOCIAL ──────────────────────────────────────────────────────
function postThumb(x: number, y: number, accent: string, sel: boolean): string {
  return `<rect x="${x}" y="${y}" width="132" height="118" rx="10" fill="#fff" stroke="${sel ? "#3B82F6" : "#e4e1da"}" stroke-width="${sel ? 2.5 : 1.5}"/>
    <rect x="${x + 10}" y="${y + 10}" width="112" height="58" rx="6" fill="${accent}"/>
    <circle cx="${x + 30}" cy="${y + 34}" r="9" fill="#fff" opacity="0.65"/>
    <rect x="${x + 10}" y="${y + 78}" width="78" height="9" rx="4.5" fill="#d8d3ca"/>
    <rect x="${x + 10}" y="${y + 94}" width="104" height="8" rx="4" fill="#e6e2da"/>
    ${sel ? `<circle cx="${x + 116}" cy="${y + 16}" r="9" fill="#3B82F6"/><path d="M${x + 112} ${y + 16}l3 3 5-5" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` : ""}`;
}
const POST = appShell(NAV_IMM, "IMMOBILE ATTIVO", 3, `
  ${head("Post Social", "Template pronti per pubblicare ogni immobile.")}
  ${postThumb(240, 100, "#dbe6f6", true)}
  ${postThumb(388, 100, "#e7ded0", false)}
  ${postThumb(536, 100, "#dce9e1", false)}
  ${postThumb(684, 100, "#efe0e6", false)}
  ${postThumb(240, 232, "#e6e2da", false)}
  ${postThumb(388, 232, "#dde6f3", false)}
  ${postThumb(536, 232, "#ece3d2", false)}
  ${postThumb(684, 232, "#e1e8df", false)}
  ${genBtn(748, "Pubblica")}
`);

// ── AVATAR (under Video AI) ──────────────────────────────────────────
const AVATAR = appShell(NAV_IMM, "IMMOBILE ATTIVO", 2, `
  ${head("Avatar AI", "Presenta gli immobili in video, senza telecamera.")}
  <defs><linearGradient id="av" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e7ecf3"/><stop offset="1" stop-color="#dde4ee"/></linearGradient></defs>
  <!-- avatar video frame -->
  <rect x="240" y="96" width="220" height="294" rx="14" fill="url(#av)"/>
  <rect x="240" y="96" width="220" height="294" rx="14" fill="none" stroke="#e4e1da" stroke-width="1.5"/>
  <ellipse cx="350" cy="392" rx="120" ry="60" fill="#cdd6e4"/>
  <rect x="320" y="232" width="60" height="80" rx="26" fill="#b7c1d3"/>
  <circle cx="350" cy="206" r="40" fill="#c5cedd"/>
  <circle cx="350" cy="206" r="40" fill="none" stroke="#aeb9cc" stroke-width="2"/>
  <rect x="256" y="346" width="120" height="34" rx="8" fill="#fff" opacity="0.8"/>
  <rect x="266" y="356" width="70" height="8" rx="4" fill="#9aa6b8"/>
  <rect x="266" y="368" width="44" height="7" rx="3.5" fill="#b6bfcd"/>
  <rect x="256" y="110" width="92" height="24" rx="12" fill="#211f1c" opacity="0.55"/>
  <circle cx="270" cy="122" r="4" fill="#ef4444"/>
  <text x="312" y="126" font-family="Satoshi,sans-serif" font-size="12" font-weight="700" fill="#fff" text-anchor="middle">REC AI</text>
  <!-- script box -->
  <text x="484" y="118" font-family="Satoshi,sans-serif" font-size="13" font-weight="700" fill="#8c867d" letter-spacing="0.4">COPIONE</text>
  <rect x="484" y="128" width="420" height="150" rx="12" fill="#fff" stroke="#e4e1da" stroke-width="1.5"/>
  <rect x="504" y="150" width="380" height="9" rx="4.5" fill="#d8d3ca"/>
  <rect x="504" y="170" width="356" height="9" rx="4.5" fill="#e0dbd2"/>
  <rect x="504" y="190" width="384" height="9" rx="4.5" fill="#e0dbd2"/>
  <rect x="504" y="210" width="300" height="9" rx="4.5" fill="#e0dbd2"/>
  <!-- waveform -->
  <g fill="#3B82F6" opacity="0.85">
    <rect x="504" y="242" width="4" height="14" rx="2"/><rect x="512" y="236" width="4" height="26" rx="2"/><rect x="520" y="246" width="4" height="8" rx="2"/><rect x="528" y="232" width="4" height="34" rx="2"/><rect x="536" y="240" width="4" height="18" rx="2"/><rect x="544" y="246" width="4" height="8" rx="2"/><rect x="552" y="234" width="4" height="30" rx="2"/><rect x="560" y="242" width="4" height="14" rx="2"/><rect x="568" y="238" width="4" height="22" rx="2"/><rect x="576" y="246" width="4" height="8" rx="2"/>
  </g>
  ${genBtn(748, "Genera")}
`);

// ── TEAM (multi-seat) ────────────────────────────────────────────────
function memberRow(y: number, color: string, ini: string, nameW: number, role: string, roleBlue: boolean): string {
  return `<circle cx="266" cy="${y + 21}" r="19" fill="${color}"/>
    <text x="266" y="${y + 27}" font-family="Satoshi,sans-serif" font-size="15" font-weight="700" fill="#fff" text-anchor="middle">${ini}</text>
    <rect x="300" y="${y + 8}" width="${nameW}" height="11" rx="5.5" fill="#3a362f"/>
    <rect x="300" y="${y + 26}" width="${nameW + 40}" height="8" rx="4" fill="#cfc9bf"/>
    <rect x="${800 - role.length * 8}" y="${y + 9}" width="${role.length * 8 + 24}" height="26" rx="13" fill="${roleBlue ? "#eff6ff" : "#f1efe9"}"/>
    <text x="${812}" y="${y + 26}" font-family="Satoshi,sans-serif" font-size="13" font-weight="700" fill="${roleBlue ? "#1d5fd0" : "#8c867d"}" text-anchor="middle">${role}</text>`;
}
const TEAM = appShell(NAV_AG, "AGENZIA", 1, `
  ${head("Team", "Tutta l'agenzia crea contenuti con lo stesso brand.")}
  <rect x="240" y="96" width="668" height="234" rx="14" fill="#fff" stroke="#e4e1da" stroke-width="1.5"/>
  ${memberRow(118, "#3B82F6", "MR", 150, "Titolare", true)}
  <line x1="256" y1="166" x2="892" y2="166" stroke="#f0ede7" stroke-width="1.5"/>
  ${memberRow(176, "#e08a3c", "GB", 130, "Agente", false)}
  <line x1="256" y1="224" x2="892" y2="224" stroke="#f0ede7" stroke-width="1.5"/>
  ${memberRow(234, "#5aa06e", "LF", 168, "Agente", false)}
  ${optRow(240, 346, 200, "Invita un membro", I.users, false)}
  <rect x="700" y="346" width="208" height="42" rx="11" fill="#f1efe9" stroke="#e4e1da" stroke-width="1.5"/>
  <text x="716" y="367" font-family="Satoshi,sans-serif" font-size="12" font-weight="600" fill="#8c867d">Codice invito</text>
  <text x="716" y="382" font-family="Satoshi,sans-serif" font-size="14" font-weight="800" fill="#211f1c" letter-spacing="1.5">GNM-7K2P</text>
`);

export const FEATURE_ART: Record<string, string> = {
  staging: STAGING,
  video: VIDEO,
  post: POST,
  social: POST,
  avatar: AVATAR,
  team: TEAM,
};
