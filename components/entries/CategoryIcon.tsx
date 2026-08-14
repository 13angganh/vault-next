'use client';

/**
 * Vault Next — CategoryIcon
 * Sesi D: custom categories pakai Lucide icon (iconKey), bukan emoji.
 * Backward-compat: jika iconKey tidak dikenali, fallback ke Tag icon.
 */

import {
  Share2, Mail, Landmark, Gamepad2, Bitcoin, CreditCard,
  Wifi, MoreHorizontal, Tag, LucideIcon, StickyNote,
  Briefcase, Home, Heart, Star, Zap, Shield,
  Globe, Camera, Music, ShoppingCart, Car, Plane,
  GraduationCap, Wrench, BookOpen, Coffee, Palette,
  Users, Phone, Key, Lock, Database, Cloud,
  Smartphone, Monitor, Headphones, Tv, Printer,
  ShieldCheck, Fingerprint, Inbox, Send, FileText,
  DollarSign, PiggyBank, TrendingUp, Receipt, Wallet,
  Trophy, Dice5, Joystick, Puzzle, Sword,
  Leaf, Sun, Moon, Flame, Snowflake, Droplets,
  Box, Package, Archive, Folder, Bookmark,
  Bell, AlertCircle, CheckCircle, Info, HelpCircle,
  MapPin, Navigation, Compass, Map,
} from 'lucide-react';
import type { CustomCategory } from '@/lib/types';

/* ── Icon map per kategori default ──
 * v1.9.1: BUG FIX — 'note' (kategori "Catatan", lihat DEFAULT_CATEGORIES
 * di lib/types.ts dan FIELDS_BY_CAT.note di EntryForm.tsx — kategori
 * aktif dengan field sendiri, bukan sisa kode mati) sebelumnya TIDAK
 * ADA di peta ini sama sekali. Tombol kategorinya tetap muncul di grid
 * (EntryForm me-render allCats tanpa filter), tapi Icon jadi undefined
 * dan jatuh ke fallback <MoreHorizontal> — ikon "titik tiga" yang
 * secara semantik berarti "lainnya", bukan "catatan". Ditambahkan
 * StickyNote sebagai ikon yang tepat maknanya. */
const CAT_ICONS: Record<string, LucideIcon> = {
  sosmed:  Share2,
  email:   Mail,
  bank:    Landmark,
  game:    Gamepad2,
  crypto:  Bitcoin,
  kartu:   CreditCard,
  wifi:    Wifi,
  lainnya: MoreHorizontal,
  note:    StickyNote,
};

/* ── Helper: hex color → rgba dengan alpha ── */
function hexToRgba(hex: string, alpha: number): string {
  const h = hex.replace('#', '');
  const len = h.length;
  if (len !== 3 && len !== 6) return `rgba(156,163,175,${alpha})`;
  const full = len === 3
    ? h.split('').map((c) => c + c).join('')
    : h;
  const r = parseInt(full.slice(0, 2), 16);
  const g = parseInt(full.slice(2, 4), 16);
  const b = parseInt(full.slice(4, 6), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

/* ── v1.9.1: BUG FIX — akar warna per kategori, satu sumber kebenaran ──
 * CAT_COLORS (background kotak) dan CAT_ICON_COLORS (warna icon) dulu
 * dua peta terpisah. CAT_ICON_COLORS memakai string CSS var literal
 * ('var(--cat-sosmed)', dst) yang TIDAK PERNAH didefinisikan di
 * styles/tokens.css maupun lib/design-tokens.ts (dicek: nihil di
 * seluruh proyek) — komentar lama menyebutnya sesi "F2-02" yang
 * rupanya tidak pernah menuntaskan pembuatan token-nya. Prop `color`
 * Lucide meneruskan string itu apa adanya ke atribut SVG `stroke`;
 * custom property yang tidak terdefinisi membuat stroke tidak
 * ternilai — icon jadi 100% tidak terlihat di semua kategori default
 * (kotak background tetap tampil karena itu rgba() konkret, bukan
 * var() yang hilang).
 *
 * Diperbaiki dengan CAT_HEX sebagai satu-satunya sumber warna per
 * kategori (nilai hex sama seperti RGB yang sudah dipakai CAT_COLORS
 * sebelumnya — dikonfirmasi ulang, bukan warna baru). CAT_COLORS
 * (alpha rendah, untuk background) dan warna icon solid (alpha 1,
 * lihat CAT_ICON_COLORS di bawah) SAMA-SAMA diturunkan dari CAT_HEX
 * lewat hexToRgba — tidak mungkin drift lagi karena tidak ada lagi
 * dua peta independen untuk hue yang sama.
 * ─────────────────────────────────────────────────────────────────── */
const CAT_HEX: Record<string, string> = {
  sosmed:  '#6366f1',
  email:   '#3b82f6',
  bank:    '#10b981',
  game:    '#ef4444',
  crypto:  '#f59e0b',
  kartu:   '#0ea5e9',
  wifi:    '#a855f7',
  lainnya: '#9ca3af',
  note:    '#eab308',
};

/* ── Warna background per kategori default (alpha rendah) ──
 * crypto sengaja alpha 0.18, bukan 0.15 seperti lainnya — kontras
 * amber terhadap background gelap butuh sedikit lebih pekat agar
 * tetap cukup terlihat (nilai asli sebelum fix ini, dipertahankan). */
const CAT_COLORS: Record<string, string> = {
  sosmed:  hexToRgba(CAT_HEX.sosmed,  0.15),
  email:   hexToRgba(CAT_HEX.email,   0.15),
  bank:    hexToRgba(CAT_HEX.bank,    0.15),
  game:    hexToRgba(CAT_HEX.game,    0.15),
  crypto:  hexToRgba(CAT_HEX.crypto,  0.18),
  kartu:   hexToRgba(CAT_HEX.kartu,   0.15),
  wifi:    hexToRgba(CAT_HEX.wifi,    0.15),
  lainnya: hexToRgba(CAT_HEX.lainnya, 0.15),
  note:    hexToRgba(CAT_HEX.note,    0.15),
};

/* ── Warna icon per kategori default: hex solid dari CAT_HEX yang sama
 * (BUKAN lagi var(--cat-*) yang tidak pernah terdefinisi) ── */
const CAT_ICON_COLORS: Record<string, string> = { ...CAT_HEX };

/* ── Lucide icon registry untuk custom categories ── */
export const CUSTOM_CAT_ICONS: Record<string, LucideIcon> = {
  Tag, Briefcase, Home, Heart, Star, Zap, Shield,
  Globe, Camera, Music, ShoppingCart, Car, Plane,
  GraduationCap, Wrench, BookOpen, Coffee, Palette,
  Users, Phone, Key, Lock, Database, Cloud,
  Smartphone, Monitor, Headphones, Tv, Printer,
  ShieldCheck, Fingerprint, Inbox, Send, FileText,
  DollarSign, PiggyBank, TrendingUp, Receipt, Wallet,
  Trophy, Dice5, Joystick, Puzzle, Sword,
  Leaf, Sun, Moon, Flame, Snowflake, Droplets,
  Box, Package, Archive, Folder, Bookmark,
  Bell, AlertCircle, CheckCircle, Info, HelpCircle,
  MapPin, Navigation, Compass, Map,
  Wifi, Mail, Share2, Landmark, Gamepad2, Bitcoin, CreditCard, MoreHorizontal,
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

  /* Radius standar */
  const radius = Math.round(box * 0.28);

  if (customCat) {
    /* Resolve icon dari iconKey */
    const iconKey    = customCat.iconKey || customCat.emoji; // backward-compat
    const CustomIcon: LucideIcon = CUSTOM_CAT_ICONS[iconKey] ?? Tag;
    /* Warna custom: jika ada field color, pakai itu; fallback ke abu */
    const customColor = customCat.color ?? '#9ca3af';
    const customBg    = customCat.color
      ? hexToRgba(customCat.color, 0.15)
      : 'rgba(156,163,175,0.15)';

    return (
      <span
        className={`cat-icon cat-icon--${size} ${className}`}
        style={{
          width: box, height: box,
          backgroundColor: customBg,
          borderRadius: radius,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
          lineHeight: 1,
        }}
        aria-hidden="true"
      >
        <CustomIcon size={iconSize} color={customColor} strokeWidth={1.8} />
      </span>
    );
  }

  /* Default kategori dengan Lucide icon */
  const bg        = CAT_COLORS[catId]      ?? 'rgba(156,163,175,0.15)';
  const iconColor = CAT_ICON_COLORS[catId] ?? '#9ca3af';
  const Icon      = CAT_ICONS[catId];

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
        : <MoreHorizontal size={iconSize} color={CAT_HEX.lainnya} />
      }
    </span>
  );
}
