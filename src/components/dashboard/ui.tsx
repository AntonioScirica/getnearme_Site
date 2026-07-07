'use client';
// Porting helpers for the Claude Design dashboard prototype.
// `s()` parses the prototype's inline CSS strings so markup can be copied near-verbatim.
// `Box` reproduces the prototype's `style-hover`. `Icon` maps lucide names → lucide-react.

import React, { useState } from 'react';
import {
  ArrowRight, ArrowLeft, ArrowUpDown, PanelLeft, ChevronDown, ChevronUp, Search, Check, Plus, Layers,
  Coins, Bell, CircleHelp, X, Building2, Sparkles, Film, ImagePlus, Calendar,
  Image as ImageIcon, Download, Pencil, LayoutDashboard, Users, Palette, AtSign,
  CreditCard, Upload, Copy, Trash2, Gift, Crown, Zap, Settings, LogOut, LifeBuoy,
  PlayCircle, MapPin, Maximize2, LayoutGrid, Tag, Scissors, LoaderCircle, Inbox,
  Euro, Bed, Bath, Instagram, Type, Home, Megaphone, Images, MessageSquare,
  TriangleAlert, Lock, MoreVertical, FileSpreadsheet, FileText, RefreshCw, Minus,
  CircleCheck, Table as TableIcon, Scale, Car, Sofa, Fence, Sun, Trees, Warehouse, Snowflake,
  Info, TrainFront, ShoppingBag, Cross, Activity, School, Coffee, Dog, Music, Navigation, Crosshair,
  TreePine, Link2, Menu, Moon,
  type LucideIcon,
} from 'lucide-react';

const ICONS: Record<string, LucideIcon> = {
  'arrow-right': ArrowRight, 'arrow-left': ArrowLeft, 'arrow-up-down': ArrowUpDown, 'panel-left': PanelLeft,
  'chevron-down': ChevronDown, 'chevron-up': ChevronUp, search: Search, check: Check, plus: Plus,
  layers: Layers, coins: Coins, bell: Bell, 'circle-help': CircleHelp, x: X,
  'building-2': Building2, sparkles: Sparkles, film: Film, 'image-plus': ImagePlus,
  calendar: Calendar, image: ImageIcon, download: Download, pencil: Pencil,
  'layout-dashboard': LayoutDashboard, users: Users, palette: Palette,
  'at-sign': AtSign, 'credit-card': CreditCard, upload: Upload, copy: Copy,
  trash: Trash2, 'trash-2': Trash2, 'more-vertical': MoreVertical, gift: Gift, crown: Crown, zap: Zap, settings: Settings,
  'log-out': LogOut, 'life-buoy': LifeBuoy, 'play-circle': PlayCircle,
  'map-pin': MapPin, 'maximize-2': Maximize2, 'layout-grid': LayoutGrid,
  tag: Tag, scissors: Scissors, 'loader-circle': LoaderCircle, inbox: Inbox,
  euro: Euro, bed: Bed, bath: Bath, instagram: Instagram, type: Type, home: Home,
  megaphone: Megaphone, images: Images, 'message-square': MessageSquare,
  'alert-triangle': TriangleAlert, alert: TriangleAlert, lock: Lock,
  'file-spreadsheet': FileSpreadsheet, 'file-text': FileText, 'refresh-cw': RefreshCw,
  minus: Minus, 'circle-check': CircleCheck, table: TableIcon, scale: Scale,
  car: Car, sofa: Sofa, fence: Fence, sun: Sun, trees: Trees, warehouse: Warehouse, snowflake: Snowflake,
  info: Info, 'train-front': TrainFront, 'shopping-bag': ShoppingBag, cross: Cross, activity: Activity,
  school: School, coffee: Coffee, dog: Dog, music: Music, navigation: Navigation, crosshair: Crosshair,
  'tree-pine': TreePine, link: Link2, menu: Menu, moon: Moon,
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

type BoxProps = React.HTMLAttributes<HTMLElement> & {
  hover?: React.CSSProperties;
  as?: keyof React.JSX.IntrinsicElements;
  disabled?: boolean;
  type?: string;
};

// Split `border` shorthand into separate properties to avoid React warnings
// when hover styles use `borderColor` (shorthand vs non-shorthand conflict)
function splitBorderShorthand(s: React.CSSProperties): React.CSSProperties {
  const b = (s as Record<string, unknown>).border;
  if (typeof b !== 'string') return s;
  const { border: _, ...rest } = s as Record<string, unknown>;
  const m = b.match(/^(\S+)\s+(\S+)\s+(.+)$/);
  if (!m) return s;
  return { ...rest, borderWidth: m[1], borderStyle: m[2], borderColor: m[3] } as React.CSSProperties;
}

/** A div (or other tag) that merges `hover` styles on mouse enter, like the prototype's style-hover. */
export function Box({ hover, as = 'div', style, children, onMouseEnter, onMouseLeave, ...rest }: BoxProps) {
  const [h, setH] = useState(false);
  const needsBorderSplit = hover && ('borderColor' in hover || 'borderWidth' in hover || 'borderStyle' in hover);
  let baseStyle = needsBorderSplit && style ? splitBorderShorthand(style) : style;
  if (hover && baseStyle && 'background' in hover && 'backgroundColor' in (baseStyle as Record<string, unknown>)) {
    const { backgroundColor: _, ...rest2 } = baseStyle as Record<string, unknown>;
    baseStyle = rest2 as React.CSSProperties;
  }
  if (hover && baseStyle && 'backgroundColor' in hover && 'background' in (baseStyle as Record<string, unknown>)) {
    const { background: _, ...rest2 } = baseStyle as Record<string, unknown>;
    baseStyle = { ...rest2, backgroundColor: (baseStyle as Record<string, unknown>).background } as React.CSSProperties;
  }
  return React.createElement(
    as,
    {
      ...rest,
      style: { outline: 'none', ...baseStyle, ...(h && hover ? hover : null) },
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
