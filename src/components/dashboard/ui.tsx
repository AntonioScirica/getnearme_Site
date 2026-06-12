'use client';
// Porting helpers for the Claude Design dashboard prototype.
// `s()` parses the prototype's inline CSS strings so markup can be copied near-verbatim.
// `Box` reproduces the prototype's `style-hover`. `Icon` maps lucide names → lucide-react.

import React, { useState } from 'react';
import {
  ArrowRight, ArrowLeft, PanelLeft, ChevronDown, Search, Check, Plus, Layers,
  Coins, Bell, CircleHelp, X, Building2, Sparkles, Film, ImagePlus, Calendar,
  Image as ImageIcon, Download, Pencil, LayoutDashboard, Users, Palette, AtSign,
  CreditCard, Upload, Copy, Trash2, type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  'arrow-right': ArrowRight, 'arrow-left': ArrowLeft, 'panel-left': PanelLeft,
  'chevron-down': ChevronDown, search: Search, check: Check, plus: Plus,
  layers: Layers, coins: Coins, bell: Bell, 'circle-help': CircleHelp, x: X,
  'building-2': Building2, sparkles: Sparkles, film: Film, 'image-plus': ImagePlus,
  calendar: Calendar, image: ImageIcon, download: Download, pencil: Pencil,
  'layout-dashboard': LayoutDashboard, users: Users, palette: Palette,
  'at-sign': AtSign, 'credit-card': CreditCard, upload: Upload, copy: Copy,
  trash: Trash2,
};

/** Parse a CSS declaration string into a React style object. */
export function s(css: string): React.CSSProperties {
  const out: Record<string, string> = {};
  for (const decl of css.split(';')) {
    const i = decl.indexOf(':');
    if (i === -1) continue;
    const rawProp = decl.slice(0, i).trim();
    const val = decl.slice(i + 1).trim();
    if (!rawProp) continue;
    const prop = rawProp.replace(/^-(webkit|moz|ms|o)-/, (_m, p) => p[0].toUpperCase() + p.slice(1) + '-')
      .replace(/-([a-z])/g, (_m, c) => c.toUpperCase());
    out[prop] = val;
  }
  return out as React.CSSProperties;
}

type BoxProps = React.HTMLAttributes<HTMLDivElement> & {
  hover?: React.CSSProperties;
  as?: keyof React.JSX.IntrinsicElements;
};

/** A div (or other tag) that merges `hover` styles on mouse enter, like the prototype's style-hover. */
export function Box({ hover, as = 'div', style, children, onMouseEnter, onMouseLeave, ...rest }: BoxProps) {
  const [h, setH] = useState(false);
  return React.createElement(
    as,
    {
      ...rest,
      style: { ...style, ...(h && hover ? hover : null) },
      onMouseEnter: (e: React.MouseEvent<HTMLDivElement>) => { setH(true); onMouseEnter?.(e); },
      onMouseLeave: (e: React.MouseEvent<HTMLDivElement>) => { setH(false); onMouseLeave?.(e); },
    },
    children,
  );
}

/** Render a lucide icon by kebab name, colored + sized like the prototype's masked spans. */
export function Icon({ name, size = 18, color = '#57534c', style }: { name: string; size?: number; color?: string; style?: React.CSSProperties }) {
  const Cmp = ICONS[name] ?? ImageIcon;
  return <Cmp size={size} color={color} strokeWidth={2} style={{ flex: 'none', ...style }} />;
}
