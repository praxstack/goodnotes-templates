/**
 * SVG sticker generator — SELF-CONTAINED palettes, no external theme dependency.
 *
 * Each sticker type uses a baked-in color palette. The warm-neutral aesthetic
 * is the default; CBT stickers use their own palette.
 *
 * Generates resolution-independent SVG markup for stickers, which gets
 * rasterized to PNG at 300 DPI by Sharp (see png-renderer.ts).
 */

import type { StickerPalette } from '../types/index.js';

// ─── Baked-In Palettes ──────────────────────────────────────────

/** Default palette — warm-neutral aesthetic (most commonly used) */
const DEFAULT_PALETTE: StickerPalette = {
  primary: '#C4A882',
  secondary: '#E8DDD0',
  accent: '#9B7E5E',
  text: '#3D3229',
  background: '#FAF7F4',
  muted: '#D5C9B8',
};

/** CBT stickers — warm terracotta + sage green */
const CBT_PALETTE: StickerPalette = {
  primary: '#C45D3E',
  secondary: '#F3F0EB',
  accent: '#5E8B6A',
  text: '#1A1A1A',
  background: '#FAF8F5',
  muted: '#8A8580',
};

/** Default fonts and border radius for stickers */
const STICKER_FONTS = {
  header: { family: 'DM Serif Display', weight: 700 },
  body: { family: 'DM Sans', weight: 400 },
};
const STICKER_BORDER_RADIUS = 8;

// ─── Sticker Dimensions (in pixels at 300 DPI) ─────────────────

export const STICKER_SIZES = {
  'date-tab': { width: 300, height: 100 },
  'month-tab': { width: 400, height: 120 },
  'day-tab': { width: 200, height: 80 },
  'number-circle': { width: 120, height: 120 },
  'priority-marker': { width: 200, height: 80 },
  'checkbox': { width: 100, height: 100 },
  'progress-bar': { width: 400, height: 60 },
  'sticky-note': { width: 400, height: 400 },
  'washi-tape': { width: 600, height: 100 },
  'banner': { width: 500, height: 120 },
  'divider': { width: 600, height: 40 },
  'frame': { width: 500, height: 500 },
  'weather-icon': { width: 150, height: 150 },
  'star-rating': { width: 350, height: 80 },
  'arrow': { width: 120, height: 120 },
  'cbt-thought-check': { width: 944, height: 590 },
  'cbt-reframe': { width: 944, height: 236 },
  'self-compassion-card': { width: 944, height: 295 },
  'permission-card': { width: 944, height: 236 },
} as const;

export type StickerType = keyof typeof STICKER_SIZES;

// ─── Helpers ────────────────────────────────────────────────────

/** Check if a sticker type is a CBT type */
function isCBTType(type: StickerType): boolean {
  return type === 'cbt-thought-check' || type === 'cbt-reframe' ||
    type === 'self-compassion-card' || type === 'permission-card';
}

/** Resolve the palette for a sticker type */
function resolvePalette(type: StickerType, override?: Partial<StickerPalette>): StickerPalette {
  const base = isCBTType(type) ? CBT_PALETTE : DEFAULT_PALETTE;
  return override ? { ...base, ...override } : base;
}

// ─── SVG Generation ─────────────────────────────────────────────

/**
 * Generate SVG markup for a sticker. Returns raw SVG string.
 * Self-contained: uses baked-in palettes. Optional palette override.
 */
export function generateStickerSVG(
  type: StickerType,
  options: { text?: string; variant?: number; palette?: Partial<StickerPalette> } = {}
): string {
  const size = STICKER_SIZES[type];
  const { text, variant = 0 } = options;
  const p = resolvePalette(type, options.palette);

  switch (type) {
    case 'date-tab': return generateDateTab(size.width, size.height, p, text || 'Jan');
    case 'month-tab': return generateMonthTab(size.width, size.height, p, text || 'January');
    case 'day-tab': return generateDayTab(size.width, size.height, p, text || 'Mon');
    case 'number-circle': return generateNumberCircle(size.width, size.height, p, text || '1');
    case 'priority-marker': return generatePriorityMarker(size.width, size.height, p, text || 'P1');
    case 'checkbox': return generateCheckbox(size.width, size.height, p, variant);
    case 'progress-bar': return generateProgressBar(size.width, size.height, p, variant);
    case 'sticky-note': return generateStickyNote(size.width, size.height, p, variant);
    case 'washi-tape': return generateWashiTape(size.width, size.height, p, variant);
    case 'banner': return generateBanner(size.width, size.height, p, text || 'Notes');
    case 'divider': return generateDivider(size.width, size.height, p, variant);
    case 'frame': return generateFrame(size.width, size.height, p, variant);
    case 'weather-icon': return generateWeatherIcon(size.width, size.height, p, variant);
    case 'star-rating': return generateStarRating(size.width, size.height, p, variant);
    case 'arrow': return generateArrow(size.width, size.height, p, variant);
    case 'cbt-thought-check': return generateCBTThoughtCheck(size.width, size.height, p);
    case 'cbt-reframe': return generateCBTReframe(size.width, size.height, p);
    case 'self-compassion-card': return generateSelfCompassionCard(size.width, size.height, p);
    case 'permission-card': return generatePermissionCard(size.width, size.height, p);
  }
}

// ─── Individual Sticker Generators ──────────────────────────────

function svgWrap(w: number, h: number, content: string): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">${content}</svg>`;
}

/**
 * XML-escape a user-supplied string before interpolating into SVG markup.
 * Every sticker generator that takes a `text` argument MUST pass it through
 * this helper before dropping it inside `<text>…</text>`. See FIND-0027 — a
 * future caller that pipes `--text` through the CLI would otherwise ship a
 * live XSS primitive to any downstream consumer that renders the SVG in a
 * web context. (Today all callers pass enum literals; this is defense for
 * the next change.)
 */
function escXml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' }[c] ?? c),
  );
}

function generateDateTab(w: number, h: number, p: StickerPalette, text: string): string {
  const r = STICKER_BORDER_RADIUS;
  return svgWrap(w, h, `
    <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="${r}" ry="${r}" fill="${p.primary}" />
    <text x="${w / 2}" y="${h / 2 + 6}" text-anchor="middle" font-family="${STICKER_FONTS.header.family}, sans-serif" font-weight="${STICKER_FONTS.header.weight}" font-size="36" fill="#FFFFFF">${escXml(text)}</text>
  `);
}

function generateMonthTab(w: number, h: number, p: StickerPalette, text: string): string {
  const r = STICKER_BORDER_RADIUS;
  return svgWrap(w, h, `
    <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="${r}" ry="${r}" fill="${p.accent}" />
    <text x="${w / 2}" y="${h / 2 + 8}" text-anchor="middle" font-family="${STICKER_FONTS.header.family}, sans-serif" font-weight="${STICKER_FONTS.header.weight}" font-size="32" fill="#FFFFFF">${escXml(text)}</text>
  `);
}

function generateDayTab(w: number, h: number, p: StickerPalette, text: string): string {
  const r = STICKER_BORDER_RADIUS;
  return svgWrap(w, h, `
    <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="${r}" ry="${r}" fill="${p.secondary}" />
    <text x="${w / 2}" y="${h / 2 + 6}" text-anchor="middle" font-family="${STICKER_FONTS.body.family}, sans-serif" font-weight="${STICKER_FONTS.body.weight}" font-size="28" fill="${p.text}">${escXml(text)}</text>
  `);
}

function generateNumberCircle(w: number, h: number, p: StickerPalette, text: string): string {
  const cx = w / 2, cy = h / 2, r = w / 2 - 4;
  return svgWrap(w, h, `
    <circle cx="${cx}" cy="${cy}" r="${r}" fill="${p.primary}" />
    <text x="${cx}" y="${cy + 8}" text-anchor="middle" font-family="${STICKER_FONTS.body.family}, sans-serif" font-weight="600" font-size="40" fill="#FFFFFF">${escXml(text)}</text>
  `);
}

function generatePriorityMarker(w: number, h: number, p: StickerPalette, text: string): string {
  const colors: Record<string, string> = { P1: '#EF4444', P2: '#F59E0B', P3: '#10B981' };
  const color = colors[text] || p.accent;
  return svgWrap(w, h, `
    <rect x="2" y="2" width="${w - 4}" height="${h - 4}" rx="20" ry="20" fill="${color}" />
    <text x="${w / 2}" y="${h / 2 + 7}" text-anchor="middle" font-family="${STICKER_FONTS.header.family}, sans-serif" font-weight="700" font-size="28" fill="#FFFFFF">${escXml(text)}</text>
  `);
}

function generateCheckbox(w: number, h: number, p: StickerPalette, variant: number): string {
  const size = w - 16;
  const r = STICKER_BORDER_RADIUS / 2;
  const stroke = p.primary;

  const states = [
    // 0: empty
    `<rect x="8" y="8" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="none" stroke="${stroke}" stroke-width="3" />`,
    // 1: checked
    `<rect x="8" y="8" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${p.primary}" stroke="${stroke}" stroke-width="3" />
     <polyline points="${w * 0.25},${h * 0.5} ${w * 0.42},${h * 0.68} ${w * 0.75},${h * 0.32}" fill="none" stroke="#FFFFFF" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />`,
    // 2: partial
    `<rect x="8" y="8" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="${p.secondary}" stroke="${stroke}" stroke-width="3" />
     <line x1="${w * 0.3}" y1="${h * 0.5}" x2="${w * 0.7}" y2="${h * 0.5}" stroke="${p.accent}" stroke-width="5" stroke-linecap="round" />`,
    // 3: crossed
    `<rect x="8" y="8" width="${size}" height="${size}" rx="${r}" ry="${r}" fill="none" stroke="${stroke}" stroke-width="3" />
     <line x1="${w * 0.28}" y1="${h * 0.28}" x2="${w * 0.72}" y2="${h * 0.72}" stroke="${p.accent}" stroke-width="4" stroke-linecap="round" />
     <line x1="${w * 0.72}" y1="${h * 0.28}" x2="${w * 0.28}" y2="${h * 0.72}" stroke="${p.accent}" stroke-width="4" stroke-linecap="round" />`,
  ];

  return svgWrap(w, h, states[variant % states.length]);
}

function generateProgressBar(w: number, h: number, p: StickerPalette, variant: number): string {
  const pct = variant * 25; // 0, 25, 50, 75, 100
  const barW = w - 20;
  const barH = h - 30;
  const fillW = (barW * pct) / 100;
  const r = barH / 2;

  return svgWrap(w, h, `
    <rect x="10" y="10" width="${barW}" height="${barH}" rx="${r}" ry="${r}" fill="${p.secondary}" />
    ${fillW > 0 ? `<rect x="10" y="10" width="${fillW}" height="${barH}" rx="${r}" ry="${r}" fill="${p.primary}" />` : ''}
    <text x="${w / 2}" y="${h - 4}" text-anchor="middle" font-family="${STICKER_FONTS.body.family}, sans-serif" font-size="14" fill="${p.muted}">${pct}%</text>
  `);
}

function generateStickyNote(w: number, h: number, p: StickerPalette, variant: number): string {
  const colors = [p.primary, p.secondary, p.accent, p.muted];
  const bg = colors[variant % colors.length];
  const fold = 30;

  return svgWrap(w, h, `
    <defs><filter id="shadow"><feDropShadow dx="2" dy="3" stdDeviation="4" flood-opacity="0.15" /></filter></defs>
    <path d="M10,10 L${w - 10},10 L${w - 10},${h - fold - 10} L${w - fold - 10},${h - 10} L10,${h - 10} Z" fill="${bg}" filter="url(#shadow)" />
    <path d="M${w - fold - 10},${h - 10} L${w - fold - 10},${h - fold - 10} L${w - 10},${h - fold - 10}" fill="none" stroke="${p.text}" stroke-opacity="0.15" stroke-width="1" />
    ${Array.from({ length: 6 }, (_, i) => {
      const y = 60 + i * 48;
      return y < h - fold - 30 ? `<line x1="35" y1="${y}" x2="${w - 35}" y2="${y}" stroke="${p.text}" stroke-opacity="0.1" stroke-width="1" />` : '';
    }).join('')}
  `);
}

function generateWashiTape(w: number, h: number, p: StickerPalette, variant: number): string {
  const patterns = [
    // 0: stripes
    Array.from({ length: Math.ceil(w / 20) }, (_, i) =>
      `<rect x="${i * 20}" y="0" width="10" height="${h}" fill="${p.primary}" opacity="0.5" />`
    ).join(''),
    // 1: dots
    Array.from({ length: Math.ceil(w / 30) }, (_, i) =>
      Array.from({ length: Math.ceil(h / 30) }, (_, j) =>
        `<circle cx="${i * 30 + 15}" cy="${j * 30 + 15}" r="5" fill="${p.accent}" opacity="0.4" />`
      ).join('')
    ).join(''),
    // 2: grid
    Array.from({ length: Math.ceil(w / 25) }, (_, i) =>
      `<line x1="${i * 25}" y1="0" x2="${i * 25}" y2="${h}" stroke="${p.accent}" stroke-width="0.5" opacity="0.3" />`
    ).join('') + Array.from({ length: Math.ceil(h / 25) }, (_, i) =>
      `<line x1="0" y1="${i * 25}" x2="${w}" y2="${i * 25}" stroke="${p.accent}" stroke-width="0.5" opacity="0.3" />`
    ).join(''),
    // 3: chevron
    Array.from({ length: Math.ceil(w / 40) }, (_, i) =>
      `<polyline points="${i * 40},${h} ${i * 40 + 20},0 ${i * 40 + 40},${h}" fill="none" stroke="${p.primary}" stroke-width="2" opacity="0.3" />`
    ).join(''),
    // 4: solid with torn edges
    '',
  ];

  const bg = p.secondary;
  return svgWrap(w, h, `
    <rect x="0" y="0" width="${w}" height="${h}" fill="${bg}" opacity="0.85" />
    ${patterns[variant % patterns.length]}
  `);
}

function generateBanner(w: number, h: number, p: StickerPalette, text: string): string {
  const ribbonH = h - 20;
  const fold = 15;
  return svgWrap(w, h, `
    <path d="M${fold},10 L${w - fold},10 L${w},${10 + ribbonH / 2} L${w - fold},${10 + ribbonH} L${fold},${10 + ribbonH} L0,${10 + ribbonH / 2} Z" fill="${p.primary}" />
    <text x="${w / 2}" y="${h / 2 + 6}" text-anchor="middle" font-family="${STICKER_FONTS.header.family}, sans-serif" font-weight="${STICKER_FONTS.header.weight}" font-size="30" fill="#FFFFFF">${escXml(text)}</text>
  `);
}

function generateDivider(w: number, h: number, p: StickerPalette, variant: number): string {
  const mid = h / 2;
  const dividers = [
    // 0: simple line
    `<line x1="20" y1="${mid}" x2="${w - 20}" y2="${mid}" stroke="${p.primary}" stroke-width="2" />`,
    // 1: double line
    `<line x1="20" y1="${mid - 3}" x2="${w - 20}" y2="${mid - 3}" stroke="${p.primary}" stroke-width="1" />
     <line x1="20" y1="${mid + 3}" x2="${w - 20}" y2="${mid + 3}" stroke="${p.primary}" stroke-width="1" />`,
    // 2: dotted
    `<line x1="20" y1="${mid}" x2="${w - 20}" y2="${mid}" stroke="${p.primary}" stroke-width="2" stroke-dasharray="6,6" />`,
  ];
  return svgWrap(w, h, dividers[variant % dividers.length]);
}

function generateFrame(w: number, h: number, p: StickerPalette, variant: number): string {
  const r = STICKER_BORDER_RADIUS;
  const borders = [
    // 0: simple
    `<rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="${r}" ry="${r}" fill="none" stroke="${p.primary}" stroke-width="3" />`,
    // 1: double
    `<rect x="8" y="8" width="${w - 16}" height="${h - 16}" rx="${r}" ry="${r}" fill="none" stroke="${p.primary}" stroke-width="2" />
     <rect x="16" y="16" width="${w - 32}" height="${h - 32}" rx="${r}" ry="${r}" fill="none" stroke="${p.secondary}" stroke-width="1.5" />`,
    // 2: dashed
    `<rect x="10" y="10" width="${w - 20}" height="${h - 20}" rx="${r}" ry="${r}" fill="none" stroke="${p.primary}" stroke-width="2" stroke-dasharray="10,5" />`,
  ];
  return svgWrap(w, h, borders[variant % borders.length]);
}

function generateWeatherIcon(w: number, h: number, p: StickerPalette, variant: number): string {
  const cx = w / 2, cy = h / 2;
  const icons = [
    // 0: sun
    `<circle cx="${cx}" cy="${cy}" r="25" fill="${p.primary}" />
     ${Array.from({ length: 8 }, (_, i) => {
       const angle = (i * 45 * Math.PI) / 180;
       const x1 = cx + 35 * Math.cos(angle), y1 = cy + 35 * Math.sin(angle);
       const x2 = cx + 45 * Math.cos(angle), y2 = cy + 45 * Math.sin(angle);
       return `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${p.primary}" stroke-width="4" stroke-linecap="round" />`;
     }).join('')}`,
    // 1: cloud
    `<ellipse cx="${cx - 10}" cy="${cy + 10}" rx="35" ry="25" fill="${p.secondary}" />
     <ellipse cx="${cx + 15}" cy="${cy}" rx="30" ry="28" fill="${p.primary}" />
     <ellipse cx="${cx - 25}" cy="${cy + 5}" rx="25" ry="22" fill="${p.muted}" />`,
    // 2: rain
    `<ellipse cx="${cx}" cy="${cy - 10}" rx="35" ry="22" fill="${p.secondary}" />
     ${Array.from({ length: 3 }, (_, i) =>
       `<line x1="${cx - 20 + i * 20}" y1="${cy + 20}" x2="${cx - 25 + i * 20}" y2="${cy + 40}" stroke="${p.accent}" stroke-width="3" stroke-linecap="round" />`
     ).join('')}`,
    // 3: snow
    `<ellipse cx="${cx}" cy="${cy - 10}" rx="35" ry="22" fill="${p.secondary}" />
     ${Array.from({ length: 3 }, (_, i) =>
       `<circle cx="${cx - 20 + i * 20}" cy="${cy + 30}" r="4" fill="${p.accent}" />`
     ).join('')}`,
    // 4: storm
    `<ellipse cx="${cx}" cy="${cy - 10}" rx="35" ry="22" fill="${p.muted}" />
     <polygon points="${cx - 5},${cy + 10} ${cx + 10},${cy + 10} ${cx},${cy + 35} ${cx + 15},${cy + 35} ${cx - 10},${cy + 60} ${cx - 2},${cy + 35} ${cx - 12},${cy + 35}" fill="${p.primary}" />`,
  ];
  return svgWrap(w, h, icons[variant % icons.length]);
}

function generateStarRating(w: number, h: number, p: StickerPalette, variant: number): string {
  const starCount = 5;
  const filledCount = variant + 1; // 1-5 stars
  const starSize = 50;
  const gap = (w - starCount * starSize) / (starCount + 1);

  const starPath = (cx: number, cy: number) => {
    const points: string[] = [];
    for (let i = 0; i < 10; i++) {
      const angle = (i * 36 - 90) * (Math.PI / 180);
      const r = i % 2 === 0 ? 22 : 10;
      points.push(`${cx + r * Math.cos(angle)},${cy + r * Math.sin(angle)}`);
    }
    return points.join(' ');
  };

  const stars = Array.from({ length: starCount }, (_, i) => {
    const cx = gap + starSize / 2 + i * (starSize + gap);
    const cy = h / 2;
    const fill = i < filledCount ? p.primary : p.secondary;
    return `<polygon points="${starPath(cx, cy)}" fill="${fill}" />`;
  }).join('');

  return svgWrap(w, h, stars);
}

function generateArrow(w: number, h: number, p: StickerPalette, variant: number): string {
  const cx = w / 2, cy = h / 2;
  // 0=up, 1=right, 2=down, 3=left
  const rotations = [0, 90, 180, 270];
  const rotation = rotations[variant % 4];
  return svgWrap(w, h, `
    <g transform="rotate(${rotation}, ${cx}, ${cy})">
      <line x1="${cx}" y1="${cy + 30}" x2="${cx}" y2="${cy - 30}" stroke="${p.primary}" stroke-width="6" stroke-linecap="round" />
      <polyline points="${cx - 18},${cy - 12} ${cx},${cy - 35} ${cx + 18},${cy - 12}" fill="none" stroke="${p.primary}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round" />
    </g>
  `);
}

// ─── CBT / Self-Compassion Sticker Generators ───────────────────

function generateCBTThoughtCheck(w: number, h: number, p: StickerPalette): string {
  const r = STICKER_BORDER_RADIUS;
  const pad = 40;
  const bodyFont = STICKER_FONTS.body.family;
  const bodyWeight = STICKER_FONTS.body.weight;
  const titleBarH = 72;
  const rowStartY = titleBarH + pad + 10;
  const rowHeight = 130;
  const lineInset = 260;
  const lineEnd = w - pad - 10;

  const prompts = [
    { label: 'My brain says:' },
    { label: 'Is that true?' },
    { label: 'A kinder take:' },
  ];

  const rows = prompts.map((pr, i) => {
    const y = rowStartY + i * rowHeight;
    const textY = y + 32;
    const lineY = y + 48;
    return `
      <text x="${pad + 10}" y="${textY}" font-family="${bodyFont}, sans-serif" font-weight="${bodyWeight}" font-size="28" fill="${p.text}" opacity="0.85">${pr.label}</text>
      <line x1="${lineInset}" y1="${lineY}" x2="${lineEnd}" y2="${lineY}" stroke="${p.muted}" stroke-width="2" stroke-dasharray="6,5" opacity="0.5" />
    `;
  }).join('');

  return svgWrap(w, h, `
    <defs>
      <filter id="cbt-shadow">
        <feDropShadow dx="0" dy="3" stdDeviation="6" flood-opacity="0.1" />
      </filter>
    </defs>
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="${r}" ry="${r}" fill="${p.secondary}" filter="url(#cbt-shadow)" />
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="${r}" ry="${r}" fill="none" stroke="${p.muted}" stroke-width="1.5" opacity="0.35" />
    <rect x="6" y="6" width="${w - 12}" height="${titleBarH}" rx="${r}" ry="0" fill="${p.accent}" opacity="0.15" />
    <text x="${w / 2}" y="${titleBarH / 2 + 12}" text-anchor="middle" font-family="${bodyFont}, sans-serif" font-weight="700" font-size="34" fill="${p.accent}">\u{1F9E0} Thought Check</text>
    ${rows}
  `);
}

function generateCBTReframe(w: number, h: number, p: StickerPalette): string {
  const r = Math.max(STICKER_BORDER_RADIUS, h / 2);
  const pad = 32;
  const bodyFont = STICKER_FONTS.body.family;
  const bodyWeight = STICKER_FONTS.body.weight;
  const midX = w / 2;
  const cy = h / 2;
  const lineLen = 200;

  const thoughtLabelX = pad + 10;
  const thoughtLineX1 = thoughtLabelX + 170;
  const thoughtLineX2 = thoughtLineX1 + lineLen;

  const arrowX = midX;

  const reframeLabelX = midX + 40;
  const reframeLineX1 = reframeLabelX + 180;
  const reframeLineX2 = reframeLineX1 + lineLen;

  return svgWrap(w, h, `
    <defs>
      <filter id="reframe-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.08" />
      </filter>
    </defs>
    <rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="${r}" ry="${r}" fill="${p.secondary}" filter="url(#reframe-shadow)" />
    <rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="${r}" ry="${r}" fill="none" stroke="${p.muted}" stroke-width="1.5" opacity="0.3" />
    <text x="${thoughtLabelX}" y="${cy + 8}" font-family="${bodyFont}, sans-serif" font-weight="${bodyWeight}" font-size="26" fill="${p.text}">\u{1F4AD} Thought:</text>
    <line x1="${thoughtLineX1}" y1="${cy + 10}" x2="${thoughtLineX2}" y2="${cy + 10}" stroke="${p.muted}" stroke-width="2" stroke-dasharray="6,5" opacity="0.5" />
    <text x="${arrowX}" y="${cy + 10}" text-anchor="middle" font-family="${bodyFont}, sans-serif" font-weight="700" font-size="30" fill="${p.accent}">\u2192</text>
    <text x="${reframeLabelX}" y="${cy + 8}" font-family="${bodyFont}, sans-serif" font-weight="${bodyWeight}" font-size="26" fill="${p.text}">\u{1F331} Reframe:</text>
    <line x1="${reframeLineX1}" y1="${cy + 10}" x2="${reframeLineX2}" y2="${cy + 10}" stroke="${p.muted}" stroke-width="2" stroke-dasharray="6,5" opacity="0.5" />
  `);
}

function generateSelfCompassionCard(w: number, h: number, p: StickerPalette): string {
  const r = STICKER_BORDER_RADIUS;
  const pad = 40;
  const bodyFont = STICKER_FONTS.body.family;
  const bodyWeight = STICKER_FONTS.body.weight;
  const cy = h / 2;
  const lineY = cy + 52;

  const heartCx = pad + 39;
  const heartCy = cy - 8;

  return svgWrap(w, h, `
    <defs>
      <filter id="compassion-shadow">
        <feDropShadow dx="0" dy="3" stdDeviation="6" flood-opacity="0.1" />
      </filter>
    </defs>
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="${r}" ry="${r}" fill="${p.secondary}" filter="url(#compassion-shadow)" />
    <rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="${r}" ry="${r}" fill="none" stroke="${p.muted}" stroke-width="1.5" opacity="0.3" />
    <path d="M${heartCx},${heartCy + 18} C${heartCx - 20},${heartCy + 4} ${heartCx - 20},${heartCy - 14} ${heartCx - 10},${heartCy - 18} C${heartCx - 4},${heartCy - 22} ${heartCx},${heartCy - 16} ${heartCx},${heartCy - 10} C${heartCx},${heartCy - 16} ${heartCx + 4},${heartCy - 22} ${heartCx + 10},${heartCy - 18} C${heartCx + 20},${heartCy - 14} ${heartCx + 20},${heartCy + 4} ${heartCx},${heartCy + 18} Z" fill="${p.accent}" opacity="0.55" />
    <text x="${pad + 80}" y="${cy + 4}" font-family="${bodyFont}, sans-serif" font-weight="${bodyWeight}" font-size="26" fill="${p.text}" opacity="0.85">I&#x2019;m being too hard on myself about:</text>
    <line x1="${pad + 20}" y1="${lineY}" x2="${w - pad - 10}" y2="${lineY}" stroke="${p.muted}" stroke-width="2" stroke-dasharray="6,5" opacity="0.45" />
  `);
}

function generatePermissionCard(w: number, h: number, p: StickerPalette): string {
  const r = STICKER_BORDER_RADIUS;
  const bodyFont = STICKER_FONTS.body.family;
  const cy = h / 2;

  return svgWrap(w, h, `
    <defs>
      <filter id="permission-shadow">
        <feDropShadow dx="0" dy="2" stdDeviation="4" flood-opacity="0.08" />
      </filter>
    </defs>
    <rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="${r}" ry="${r}" fill="${p.secondary}" filter="url(#permission-shadow)" />
    <rect x="4" y="4" width="${w - 8}" height="${h - 8}" rx="${r}" ry="${r}" fill="none" stroke="${p.muted}" stroke-width="1.5" opacity="0.25" />
    <text x="48" y="${cy + 8}" font-family="${bodyFont}, sans-serif" font-size="28" fill="${p.muted}" opacity="0.7">\u2726</text>
    <text x="${w / 2}" y="${cy + 8}" text-anchor="middle" font-family="${bodyFont}, sans-serif" font-weight="500" font-size="26" fill="${p.muted}" opacity="0.8">It\u2019s okay to leave parts blank. Showing up is the win.</text>
    <text x="${w - 48}" y="${cy + 8}" text-anchor="end" font-family="${bodyFont}, sans-serif" font-size="28" fill="${p.muted}" opacity="0.7">\u2726</text>
  `);
}
