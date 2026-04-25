'use client';

/**
 * Vault Next — CategoryIcon
 * Lucide icons per kategori (tidak ada emoji).
 * Ukuran: sm (28px box) | md (36px box) | lg (48px box)
 */

import {
  Share2, Mail, Landmark, Gamepad2, Bitcoin, CreditCard,
  Wifi, MoreHorizontal, Tag, LucideIcon,
} from 'lucide-react';
import type { CustomCategory } from '@/lib/types';

/* ── Icon map per kategori default ── */
const CAT_ICONS: Record<string, LucideIcon> = {
  sosmed:  Share2,
  email:   Mail,
  bank:    Landmark,
  game:    Gamepad2,
  crypto:  Bitcoin,
  kartu:   CreditCard,
  wifi:    Wifi,
  lainnya: MoreHorizontal,
};

/* ── Warna background per kategori ── */
const CAT_COLORS: Record<string, string> = {
  sosmed:  'rgba(99,102,241,0.15)',
  email:   'rgba(59,130,246,0.15)',
  bank:    'rgba(16,185,129,0.15)',
  game:    'rgba(239,68,68,0.15)',
  crypto:  'rgba(245,158,11,0.18)',
  kartu:   'rgba(14,165,233,0.15)',
  wifi:    'rgba(168,85,247,0.15)',
  lainnya: 'rgba(156,163,175,0.15)',
};

/* ── Warna icon per kategori ── */
const CAT_ICON_COLORS: Record<string, string> = {
  sosmed:  '#818cf8',
  email:   '#60a5fa',
  bank:    '#34d399',
  game:    '#f87171',
  crypto:  '#f0a500',
  kartu:   '#38bdf8',
  wifi:    '#c084fc',
  lainnya: '#9ca3af',
};

const SIZE_MAP = {
  sm: { box: 28, icon: 13 },
  md: { box: 36, icon: 17 },
  lg: { box: 48, icon: 22 },
};

interface CategoryIconProps {
  catId:       string;
  customCats?: CustomCategory[];
  size?:       'sm' | 'md' | 'lg';
  className?:  string;
}

export function CategoryIcon({
  catId,
  customCats = [],
  size = 'md',
  className = '',
}: CategoryIconProps) {
  const { box, icon: iconSize } = SIZE_MAP[size];

  /* Cek apakah kategori custom */
  const customCat = customCats.find((c) => c.id === catId);

  /* Warna */
  const bg        = CAT_COLORS[catId]      ?? 'rgba(156,163,175,0.15)';
  const iconColor = CAT_ICON_COLORS[catId] ?? '#9ca3af';
  const radius    = Math.round(box * 0.28);

  /* Kategori default → Lucide icon */
  const Icon = CAT_ICONS[catId];

  /* Kategori custom → tampilkan emoji jika masih ada, atau fallback Tag */
  if (customCat) {
    if (customCat.emoji) {
      return (
        <span
          className={`cat-icon cat-icon--${size} ${className}`}
          style={{
            width: box, height: box,
            fontSize: iconSize + 2,
            backgroundColor: 'rgba(156,163,175,0.15)',
            borderRadius: radius,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
            userSelect: 'none',
            lineHeight: 1,
          }}
          aria-hidden="true"
        >
          {customCat.emoji}
        </span>
      );
    }
    /* Custom tanpa emoji → Tag icon */
    return (
      <span
        className={`cat-icon cat-icon--${size} ${className}`}
        style={{
          width: box, height: box,
          backgroundColor: 'rgba(156,163,175,0.15)',
          borderRadius: radius,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        <Tag size={iconSize} color="#9ca3af" />
      </span>
    );
  }

  /* Default kategori dengan Lucide icon */
  return (
    <span
      className={`cat-icon cat-icon--${size} ${className}`}
      style={{
        width: box, height: box,
        backgroundColor: bg,
        borderRadius: radius,
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        lineHeight: 1,
      }}
      aria-hidden="true"
    >
      {Icon
        ? <Icon size={iconSize} color={iconColor} strokeWidth={1.8} />
        : <MoreHorizontal size={iconSize} color="#9ca3af" />
      }
    </span>
  );
}
