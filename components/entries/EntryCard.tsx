'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Star, MoreVertical, Pencil, Trash2 } from 'lucide-react';
import { useVaultStore, type VaultEntry } from '@/lib/store/vaultStore';
import { CategoryIcon, CATEGORY_CONFIG } from './CategoryIcon';

// ─── Context Menu ─────────────────────────────────────────────────────────────

interface ContextMenuProps {
  x: number;
  y: number;
  onEdit: () => void;
  onDelete: () => void;
  onClose: () => void;
}

function ContextMenu({ x, y, onEdit, onDelete, onClose }: ContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }
    document.addEventListener('mousedown', handleClick);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handleClick);
      document.removeEventListener('keydown', handleKey);
    };
  }, [onClose]);

  // Adjust position so menu doesn't go off-screen
  const menuWidth = 160;
  const adjustedX = x + menuWidth > window.innerWidth ? x - menuWidth : x;

  return (
    <div
      ref={ref}
      role="menu"
      style={{
        position: 'fixed',
        top: y,
        left: adjustedX,
        width: menuWidth,
        background: 'var(--bg-overlay)',
        border: '1px solid var(--border-default)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-modal)',
        zIndex: 1000,
        overflow: 'hidden',
        animation: 'fadeScaleIn 150ms ease both',
      }}
    >
      <button
        role="menuitem"
        onClick={() => { onEdit(); onClose(); }}
        style={menuItemStyle}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--bg-hover)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Pencil size={13} />
        Edit
      </button>
      <div style={{ height: 1, background: 'var(--border-subtle)' }} />
      <button
        role="menuitem"
        onClick={() => { onDelete(); onClose(); }}
        style={{ ...menuItemStyle, color: '#EF4444' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(239,68,68,0.1)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <Trash2 size={13} />
        Hapus
      </button>
    </div>
  );
}

const menuItemStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '8px 12px',
  width: '100%',
  background: 'transparent',
  border: 'none',
  color: 'var(--text-primary)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-outfit)',
  cursor: 'pointer',
  textAlign: 'left',
  transition: 'background var(--transition-fast)',
};

// ─── Delete Confirm ───────────────────────────────────────────────────────────

interface DeleteConfirmProps {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}

function DeleteConfirm({ title, onConfirm, onCancel }: DeleteConfirmProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.6)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 2000,
        animation: 'fadeIn 150ms ease both',
      }}
      onClick={onCancel}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: 'var(--bg-surface)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-6)',
          width: 320,
          boxShadow: 'var(--shadow-modal)',
          animation: 'fadeScaleIn 200ms var(--transition-spring) both',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-3)' }}>
          <div style={{
            width: 36, height: 36, borderRadius: 'var(--radius-md)',
            background: 'rgba(239,68,68,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Trash2 size={16} color="#EF4444" />
          </div>
          <h3 style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: 'var(--text-primary)' }}>
            Hapus Entri
          </h3>
        </div>
        <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)' }}>
          Yakin hapus <strong style={{ color: 'var(--text-primary)' }}>{title}</strong>? Tindakan ini tidak dapat dibatalkan.
        </p>
        <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
          <button onClick={onCancel} style={cancelBtnStyle}>Batal</button>
          <button onClick={onConfirm} style={deleteBtnStyle}>Hapus</button>
        </div>
      </div>
    </div>
  );
}

const cancelBtnStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: 'var(--radius-md)',
  border: '1px solid var(--border-default)',
  background: 'transparent',
  color: 'var(--text-secondary)',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-outfit)',
  cursor: 'pointer',
  fontWeight: 500,
};

const deleteBtnStyle: React.CSSProperties = {
  padding: '6px 16px',
  borderRadius: 'var(--radius-md)',
  border: 'none',
  background: '#EF4444',
  color: '#fff',
  fontSize: 'var(--text-sm)',
  fontFamily: 'var(--font-outfit)',
  cursor: 'pointer',
  fontWeight: 600,
};

// ─── EntryCard ────────────────────────────────────────────────────────────────

interface EntryCardProps {
  entry: VaultEntry;
}

export function EntryCard({ entry }: EntryCardProps) {
  const { selectedId, setSelectedId, toggleFavorite, startEditing, deleteEntry } = useVaultStore();
  const isSelected = selectedId === entry.id;

  const [menu, setMenu] = useState<{ x: number; y: number } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [favAnim, setFavAnim] = useState(false);

  const config = CATEGORY_CONFIG[entry.category];

  // Sub-label: show username / email / SSID / card holder
  const subLabel =
    entry.username ||
    entry.email ||
    entry.wifiSSID ||
    entry.cardHolder ||
    null;

  const handleFavorite = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      setFavAnim(true);
      toggleFavorite(entry.id);
      setTimeout(() => setFavAnim(false), 400);
    },
    [entry.id, toggleFavorite]
  );

  const handleMore = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenu({ x: rect.left, y: rect.bottom + 4 });
  }, []);

  const handleDelete = useCallback(async () => {
    await deleteEntry(entry.id);
    setShowDeleteConfirm(false);
  }, [entry.id, deleteEntry]);

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setSelectedId(entry.id)}
        onKeyDown={(e) => e.key === 'Enter' && setSelectedId(entry.id)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 'var(--space-3)',
          padding: 'var(--space-3) var(--space-3)',
          borderRadius: 'var(--radius-md)',
          background: isSelected ? 'var(--bg-active)' : 'var(--bg-card)',
          border: isSelected
            ? '1px solid var(--gold-border)'
            : '1px solid var(--border-subtle)',
          cursor: 'pointer',
          position: 'relative',
          transition: 'all var(--transition-fast)',
          outline: 'none',
          userSelect: 'none',
        }}
        onMouseEnter={(e) => {
          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-hover)';
        }}
        onMouseLeave={(e) => {
          if (!isSelected) (e.currentTarget as HTMLElement).style.background = 'var(--bg-card)';
        }}
      >
        {/* Category icon */}
        <CategoryIcon category={entry.category} size="sm" />

        {/* Text */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontWeight: 500,
            fontSize: 'var(--text-sm)',
            color: isSelected ? 'var(--gold-text)' : 'var(--text-primary)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            lineHeight: 1.3,
          }}>
            {entry.title}
          </p>
          {subLabel && (
            <p style={{
              fontSize: 'var(--text-xs)',
              color: 'var(--text-muted)',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              marginTop: 2,
            }}>
              {subLabel}
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, flexShrink: 0 }}>
          {/* Favorite */}
          <button
            onClick={handleFavorite}
            title={entry.isFavorite ? 'Hapus dari favorit' : 'Tambah ke favorit'}
            style={{
              width: 26,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: entry.isFavorite ? 'var(--gold)' : 'var(--text-muted)',
              transform: favAnim ? 'scale(1.4)' : 'scale(1)',
              transition: 'transform 200ms var(--transition-spring), color var(--transition-fast)',
            }}
          >
            <Star size={13} fill={entry.isFavorite ? 'currentColor' : 'none'} />
          </button>

          {/* More */}
          <button
            onClick={handleMore}
            title="Opsi"
            style={{
              width: 26,
              height: 26,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 'var(--radius-sm)',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              color: 'var(--text-muted)',
              transition: 'color var(--transition-fast)',
            }}
            onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--text-primary)')}
            onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--text-muted)')}
          >
            <MoreVertical size={13} />
          </button>
        </div>

        {/* Selected accent bar */}
        {isSelected && (
          <div style={{
            position: 'absolute',
            left: 0,
            top: '20%',
            bottom: '20%',
            width: 3,
            borderRadius: '0 3px 3px 0',
            background: 'var(--gold)',
          }} />
        )}
      </div>

      {/* Context menu */}
      {menu && (
        <ContextMenu
          x={menu.x}
          y={menu.y}
          onEdit={() => startEditing(entry.id)}
          onDelete={() => setShowDeleteConfirm(true)}
          onClose={() => setMenu(null)}
        />
      )}

      {/* Delete confirm */}
      {showDeleteConfirm && (
        <DeleteConfirm
          title={entry.title}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />
      )}
    </>
  );
}
