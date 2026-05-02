'use client';

/**
 * Vault Next — CategoryIcon
 * Sesi D: custom categories pakai Lucide icon (iconKey), bukan emoji.
 * Backward-compat: jika iconKey tidak dikenali, fallback ke Tag icon.
 */

import {
  Share2, Mail, Landmark, Gamepad2, Bitcoin, CreditCard,
  Wifi, MoreHorizontal, Tag, LucideIcon,
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

/* ── Warna background per kategori default ── */
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

/* ── Warna icon per kategori default — pakai CSS variables (F2-02) ── */
const CAT_ICON_COLORS: Record<string, string> = {
  sosmed:  'var(--cat-sosmed)',
  email:   'var(--cat-email)',
  bank:    'var(--cat-bank)',
  game:    'var(--cat-game)',
  crypto:  'var(--cat-crypto)',
  kartu:   'var(--cat-kartu)',
  wifi:    'var(--cat-wifi)',
  lainnya: 'var(--cat-lainnya)',
};

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
    const iconKey = customCat.iconKey || customCat.emoji; // backward-compat
    const CustomIcon: LucideIcon = CUSTOM_CAT_ICONS[iconKey] ?? Tag;

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
        <CustomIcon size={iconSize} color="var(--cat-lainnya)" strokeWidth={1.8} />
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
        : <MoreHorizontal size={iconSize} color="var(--cat-lainnya)" />
      }
    </span>
  );
}
