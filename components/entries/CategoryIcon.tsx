'use client';

import {
  KeyRound,
  CreditCard,
  FileText,
  Wifi,
  Mail,
  FolderOpen,
  type LucideIcon,
} from 'lucide-react';
import type { EntryCategory } from '@/lib/store/vaultStore';

// ─── Config ───────────────────────────────────────────────────────────────────

interface CategoryConfig {
  Icon: LucideIcon;
  color: string;        // CSS var or hex
  bg: string;           // CSS var or hex
  label: string;
}

export const CATEGORY_CONFIG: Record<EntryCategory, CategoryConfig> = {
  password: {
    Icon: KeyRound,
    color: '#F0A500',
    bg: 'rgba(240,165,0,0.12)',
    label: 'Password',
  },
  kartu: {
    Icon: CreditCard,
    color: '#60A5FA',
    bg: 'rgba(96,165,250,0.12)',
    label: 'Kartu',
  },
  catatan: {
    Icon: FileText,
    color: '#A78BFA',
    bg: 'rgba(167,139,250,0.12)',
    label: 'Catatan',
  },
  wifi: {
    Icon: Wifi,
    color: '#34D399',
    bg: 'rgba(52,211,153,0.12)',
    label: 'Wi-Fi',
  },
  email: {
    Icon: Mail,
    color: '#FB923C',
    bg: 'rgba(251,146,60,0.12)',
    label: 'Email',
  },
  lainnya: {
    Icon: FolderOpen,
    color: '#9CA3AF',
    bg: 'rgba(156,163,175,0.12)',
    label: 'Lainnya',
  },
};

// ─── Component ────────────────────────────────────────────────────────────────

interface CategoryIconProps {
  category: EntryCategory;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SIZE_MAP = {
  sm: { container: 28, icon: 14, radius: 6 },
  md: { container: 36, icon: 18, radius: 8 },
  lg: { container: 48, icon: 22, radius: 10 },
};

export function CategoryIcon({ category, size = 'md' }: CategoryIconProps) {
  const config = CATEGORY_CONFIG[category];
  const dim = SIZE_MAP[size];
  const { Icon } = config;

  return (
    <div
      style={{
        width: dim.container,
        height: dim.container,
        borderRadius: dim.radius,
        background: config.bg,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      <Icon size={dim.icon} color={config.color} strokeWidth={2} />
    </div>
  );
}
