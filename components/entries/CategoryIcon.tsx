'use client';

/**
 * Vault Next — CategoryIcon
 * Emoji + background color per kategori.
 * Ukuran: sm (24px) | md (32px) | lg (44px)
 */

import { DEFAULT_CATEGORIES } from '@/lib/types';
import type { CustomCategory } from '@/lib/types';

// Warna background per kategori default
const CAT_COLORS: Record<string, string> = {
  sosmed:  'rgba(99,102,241,0.18)',  // indigo
  email:   'rgba(59,130,246,0.18)',  // blue
  bank:    'rgba(16,185,129,0.18)',  // emerald
  game:    'rgba(239,68,68,0.18)',   // red
  crypto:  'rgba(245,158,11,0.20)',  // amber/gold
  kartu:   'rgba(14,165,233,0.18)',  // sky
  wifi:    'rgba(168,85,247,0.18)',  // purple
  lainnya: 'rgba(156,163,175,0.18)', // gray
};

const SIZE_MAP = {
  sm: { box: 28, font: 14 },
  md: { box: 36, font: 18 },
  lg: { box: 48, font: 24 },
};

interface CategoryIconProps {
  catId:      string;
  customCats?: CustomCategory[];
  size?:      'sm' | 'md' | 'lg';
  className?: string;
}

export function CategoryIcon({
  catId,
  customCats = [],
  size = 'md',
  className = '',
}: CategoryIconProps) {
  const allCats = [
    ...DEFAULT_CATEGORIES,
    ...customCats,
  ];

  const cat = allCats.find((c) => c.id === catId);
  const emoji = cat?.emoji ?? '🔑';
  const bg = CAT_COLORS[catId] ?? 'rgba(156,163,175,0.18)';
  const { box, font } = SIZE_MAP[size];

  return (
    <span
      className={`cat-icon cat-icon--${size} ${className}`}
      style={{
        width:            box,
        height:           box,
        fontSize:         font,
        backgroundColor:  bg,
        borderRadius:     box * 0.28,
        display:          'inline-flex',
        alignItems:       'center',
        justifyContent:   'center',
        flexShrink:       0,
        userSelect:       'none',
        lineHeight:       1,
      }}
      aria-hidden="true"
    >
      {emoji}
    </span>
  );
}
