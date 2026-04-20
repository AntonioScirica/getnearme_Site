import {
  Map,
  File,
  Sparkles,
  Clapperboard,
  Smartphone,
  TrendingUp,
  BarChart3,
  Zap,
  Flame,
  Lock,
  CreditCard,
  Check,
  Rocket,
  Frown,
  Puzzle,
  Search,
  Target,
  Users,
  Trophy,
  Briefcase,
  Home,
  Cookie,
  Circle,
  Star,
  type LucideIcon,
} from 'lucide-react';

export const ICONS: Record<string, LucideIcon> = {
  map: Map,
  'file-text': File,
  sparkles: Sparkles,
  clapperboard: Clapperboard,
  smartphone: Smartphone,
  'trending-up': TrendingUp,
  'bar-chart': BarChart3,
  zap: Zap,
  flame: Flame,
  lock: Lock,
  'credit-card': CreditCard,
  check: Check,
  rocket: Rocket,
  frown: Frown,
  puzzle: Puzzle,
  search: Search,
  target: Target,
  users: Users,
  trophy: Trophy,
  briefcase: Briefcase,
  home: Home,
  cookie: Cookie,
  circle: Circle,
  star: Star,
};

type IconProps = {
  name: string;
  size?: number;
  strokeWidth?: number;
  color?: string;
  className?: string;
  style?: React.CSSProperties;
};

export function Icon({ name, size = 20, strokeWidth = 2.25, color, className, style }: IconProps) {
  const Cmp = ICONS[name];
  if (!Cmp) return null;
  return (
    <Cmp
      size={size}
      strokeWidth={strokeWidth}
      color={color ?? 'currentColor'}
      fill="none"
      className={className}
      style={style}
    />
  );
}
