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

/* ── Background CSS variable per kategori default (ikut tema) ── */
const CAT_BG_VAR: Record<string, string> = {
  sosmed:  'var(--cat-sosmed-bg)',
  email:   'var(--cat-email-bg)',
  bank:    'var(--cat-bank-bg)',
  game:    'var(--cat-game-bg)',
  crypto:  'var(--cat-crypto-bg)',
  kartu:   'var(--cat-kartu-bg)',
  wifi:    'var(--cat-wifi-bg)',
  lainnya: 'var(--cat-lainnya-bg)',
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
          backgroundColor: 'var(--cat-lainnya-bg)',
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
  const bg        = CAT_BG_VAR[catId]      ?? 'var(--cat-lainnya-bg)';
  const iconColor = CAT_ICON_COLORS[catId] ?? 'var(--muted)';
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
