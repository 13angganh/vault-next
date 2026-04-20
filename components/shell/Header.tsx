'use client';

import { useRef } from 'react';
import { useVaultStore, type SortField, type EntryCategory } from '@/lib/store/vaultStore';
import {
  Search,
  Plus,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  X,
} from 'lucide-react';

// ─── Label helpers ────────────────────────────────────────────────────────────

const VIEW_LABELS: Record<string, string> = {
  semua: 'Semua Entri',
  favorit: 'Favorit',
  baru: 'Baru Ditambahkan',
  password: 'Password',
  email: 'Email',
  kartu: 'Kartu',
  wifi: 'Wi-Fi',
  catatan: 'Catatan',
  lainnya: 'Lainnya',
};

const SORT_LABELS: Record<SortField, string> = {
  updatedAt: 'Diperbarui',
  createdAt: 'Dibuat',
  title: 'Nama',
  category: 'Kategori',
};

// ─── Component ────────────────────────────────────────────────────────────────

export function Header() {
  const {
    activeView,
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    setSortField,
    toggleSortOrder,
    startCreating,
    getFilteredEntries,
  } = useVaultStore();

  const searchRef = useRef<HTMLInputElement>(null);

  const filteredCount = getFilteredEntries().length;
  const viewLabel = VIEW_LABELS[activeView] ?? activeView;

  return (
    <header style={{
      height: 'var(--appbar-height)',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-subtle)',
      display: 'flex',
      alignItems: 'center',
      gap: 'var(--space-3)',
      padding: '0 var(--space-5)',
      flexShrink: 0,
    }}>

      {/* ── Title + count ── */}
      <div style={{ marginRight: 'auto', display: 'flex', alignItems: 'baseline', gap: 'var(--space-2)' }}>
        <h1 style={{
          fontSize: 'var(--text-base)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          whiteSpace: 'nowrap',
        }}>
          {viewLabel}
        </h1>
        {filteredCount > 0 && (
          <span style={{
            fontSize: '10px',
            fontFamily: 'var(--font-jetbrains)',
            color: 'var(--text-muted)',
          }}>
            {filteredCount}
          </span>
        )}
      </div>

      {/* ── Search ── */}
      <div style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        background: 'var(--bg-input)',
        border: '1px solid var(--border-subtle)',
        borderRadius: 'var(--radius-md)',
        width: 220,
        transition: 'border-color var(--transition-fast)',
      }}
        onFocusCapture={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--gold-border)';
        }}
        onBlurCapture={(e) => {
          (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-subtle)';
        }}
      >
        <Search
          size={14}
          style={{
            position: 'absolute',
            left: 10,
            color: 'var(--text-muted)',
            pointerEvents: 'none',
          }}
        />
        <input
          ref={searchRef}
          type="text"
          placeholder="Cari entri..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{
            width: '100%',
            padding: '7px 32px 7px 32px',
            background: 'transparent',
            color: 'var(--text-primary)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-outfit)',
            border: 'none',
            outline: 'none',
          }}
        />
        {searchQuery && (
          <button
            onClick={() => { setSearchQuery(''); searchRef.current?.focus(); }}
            style={{
              position: 'absolute',
              right: 8,
              color: 'var(--text-muted)',
              display: 'flex',
              cursor: 'pointer',
              padding: 2,
              borderRadius: 'var(--radius-sm)',
            }}
          >
            <X size={13} />
          </button>
        )}
      </div>

      {/* ── Sort field selector ── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-1)' }}>
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          style={{
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            borderRadius: 'var(--radius-md)',
            color: 'var(--text-secondary)',
            fontSize: 'var(--text-sm)',
            fontFamily: 'var(--font-outfit)',
            padding: '6px var(--space-3)',
            cursor: 'pointer',
            outline: 'none',
          }}
        >
          {(Object.keys(SORT_LABELS) as SortField[]).map((f) => (
            <option key={f} value={f}>{SORT_LABELS[f]}</option>
          ))}
        </select>

        {/* Sort order toggle */}
        <button
          onClick={toggleSortOrder}
          title={sortOrder === 'asc' ? 'Urutan naik' : 'Urutan turun'}
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 32,
            height: 32,
            borderRadius: 'var(--radius-md)',
            background: 'var(--bg-input)',
            border: '1px solid var(--border-subtle)',
            color: 'var(--text-muted)',
            cursor: 'pointer',
            transition: 'all var(--transition-fast)',
            flexShrink: 0,
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--gold-border)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--gold)';
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--border-subtle)';
            (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-muted)';
          }}
        >
          {sortOrder === 'asc'
            ? <ArrowUp size={14} />
            : <ArrowDown size={14} />
          }
        </button>
      </div>

      {/* ── Add button ── */}
      <button
        onClick={() => {
          const cat: EntryCategory | undefined =
            activeView !== 'semua' && activeView !== 'favorit' && activeView !== 'baru'
              ? activeView as EntryCategory
              : undefined;
          startCreating(cat);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-1)',
          padding: '7px var(--space-3)',
          borderRadius: 'var(--radius-md)',
          background: 'var(--gold)',
          border: 'none',
          color: 'var(--bg-root)',
          fontSize: 'var(--text-sm)',
          fontFamily: 'var(--font-outfit)',
          fontWeight: 600,
          cursor: 'pointer',
          transition: 'all var(--transition-fast)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLButtonElement).style.filter = 'brightness(1.1)';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = 'var(--shadow-glow-gold)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLButtonElement).style.filter = '';
          (e.currentTarget as HTMLButtonElement).style.boxShadow = '';
        }}
      >
        <Plus size={14} />
        <span>Tambah</span>
      </button>
    </header>
  );
}
