'use client';

import { useState, useEffect, useRef, memo } from 'react';
import { createPortal } from 'react-dom';
import { Pencil, Lock, Unlock, Star, RotateCcw, Trash2, Copy, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore }      from '@/lib/store/appStore';
import { saveVault }         from '@/lib/vaultService';
import { CategoryIcon }      from '@/components/entries/CategoryIcon';
import type { VaultEntry }   from '@/lib/types';

interface EntryCardProps {
  entry:         VaultEntry;
  isRecycleBin?: boolean;
  onEdit?:       (entry: VaultEntry) => void;
  onDetail?:     (entry: VaultEntry) => void;
  onCopy?:       (text: string, label: string) => void;
}

export function EntryCard({ entry, isRecycleBin = false, onEdit, onCopy }: EntryCardProps) {
  const store = useAppStore();
  const { customCats, lockedIds, expandedIds, pwVisible, seedVisible, masterPw, autoSaveEnabled } = store;

  const isLocked   = lockedIds.includes(entry.id);
  const isExpanded = expandedIds.includes(entry.id);

  const [showUnlockPrompt, setShowUnlockPrompt] = useState(false);
  const [unlockInput,      setUnlockInput]      = useState('');
  const [unlockError,      setUnlockError]      = useState('');
  const [unlockLoading,    setUnlockLoading]    = useState(false);
  const [mounted,          setMounted]          = useState(false);
  const unlockRef = useRef<HTMLInputElement>(null);

  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { if (showUnlockPrompt) unlockRef.current?.focus(); }, [showUnlockPrompt]);

  // UX: Klik langsung minta PIN jika terkunci, lalu otomatis buka & expand
  const handleToggleExpand = () => {
    if (isLocked && !isExpanded) {
      setShowUnlockPrompt(true);
      return;
    }
    store.toggleExpanded(entry.id);
  };

  const handleUnlockAndOpen = async () => {
    if (!unlockInput.trim()) return;
    setUnlockLoading(true);
    setUnlockError('');

    try {
      const { verifyPin, hasPinSetup } = await import('@/lib/vaultService');
      let isValid = false;

      if (hasPinSetup()) {
        isValid = await verifyPin(unlockInput);
      }
      if (!isValid && unlockInput === masterPw) {
        isValid = true;
      }

      if (isValid) {
        // Otomatis lepas kunci & expand
        store.toggleLockedId(entry.id);
        store.toggleExpanded(entry.id);
        
        if (autoSaveEnabled) {
          const newLocked = lockedIds.filter(id => id !== entry.id);
          await saveVault(masterPw, store.vault, store.recycleBin, store.vaultMeta!, customCats, newLocked);
        }

        setShowUnlockPrompt(false);
        setUnlockInput('');
      } else {
        setUnlockError('PIN atau Password salah');
      }
    } catch {
      setUnlockError('Kesalahan sistem');
    } finally {
      setUnlockLoading(false);
    }
  };

  const copy = (text: string | undefined, label: string) => {
    if (!text) return;
    navigator.clipboard.writeText(text).then(() => onCopy?.(text, label));
  };

  const Field = ({ label, value, sensitive, isVisible, onToggleVisible, mono }: any) => {
    if (!value) return null;
    return (
      <div className="flex flex-col gap-1 p-2 rounded-lg bg-white/5 border border-white/5">
        <span className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">{label}</span>
        <div className="flex justify-between items-center gap-2">
          <span className={`text-sm text-gray-200 truncate ${mono ? 'font-mono' : ''}`}>
            {sensitive && !isVisible ? '••••••••••••' : value}
          </span>
          <div className="flex gap-1">
            {sensitive && (
              <button className="p-1.5 hover:bg-white/10 rounded-md text-gray-400" onClick={onToggleVisible}>
                {isVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            )}
            <button className="p-1.5 hover:bg-white/10 rounded-md text-gray-400" onClick={() => copy(value, label)}>
              <Copy size={14} />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`group relative mb-3 rounded-2xl border transition-all duration-300 ${isExpanded ? 'bg-[#0f121d] border-yellow-500/30 shadow-lg' : 'bg-[#0d1017] border-white/5 hover:border-white/20'}`}>
        <div className="flex items-center gap-4 p-4 cursor-pointer" onClick={handleToggleExpand}>
          <CategoryIcon catId={entry.cat} customCats={customCats} size="md" />
          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-semibold text-white truncate">{entry.name}</h3>
            <p className="text-xs text-gray-500 truncate">{entry.user || entry.emailAddr || entry.url || 'No detail'}</p>
          </div>
          <div className="flex items-center gap-2">
            {entry.fav && <Star size={14} className="text-yellow-500 fill-yellow-500" />}
            {isLocked && <Lock size={14} className="text-red-400" />}
            <span className={`text-gray-600 transition-transform duration-300 ${isExpanded ? 'rotate-90' : ''}`}>›</span>
          </div>
        </div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden border-t border-white/5">
              <div className="p-4 space-y-3">
                <div className="grid grid-cols-1 gap-2">
                  {/* Field render logic shortened for brevity in display, keep your existing fields here */}
                  <Field label="Username" value={entry.user} />
                  <Field label="Password" value={entry.pass} sensitive isVisible={pwVisible[entry.id]} onToggleVisible={() => store.togglePwVisible(entry.id)} mono />
                  {entry.note && <Field label="Catatan" value={entry.note} />}
                </div>
                <div className="flex gap-2 pt-2">
                  <button className="flex-1 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-xs font-medium text-gray-300 flex items-center justify-center gap-2" onClick={() => onEdit?.(entry)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button className="flex-1 py-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-xs font-medium text-red-400 flex items-center justify-center gap-2" onClick={async () => { /* delete logic */ }}>
                    <Trash2 size={14} /> Hapus
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* PORTAL UNLOCK: Diletakkan di Body untuk Center Mutlak */}
      {showUnlockPrompt && mounted && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="w-full max-w-[340px] bg-[#0d1017] border border-white/10 rounded-[2rem] p-8 shadow-2xl">
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 mb-2">
                <ShieldCheck size={32} />
              </div>
              <h2 className="text-xl font-bold text-white">Verifikasi Keamanan</h2>
              <p className="text-xs text-gray-400 leading-relaxed">Masukkan PIN atau Password Vault untuk membuka entri ini secara permanen.</p>
              
              <input
                ref={unlockRef}
                type="password"
                className="w-full mt-4 bg-white/5 border border-white/10 rounded-xl px-4 py-4 text-center text-lg tracking-[0.5em] text-yellow-500 focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all"
                placeholder="••••"
                value={unlockInput}
                onChange={(e) => { setUnlockInput(e.target.value); setUnlockError(''); }}
                onKeyDown={(e) => e.key === 'Enter' && handleUnlockAndOpen()}
              />
              
              {unlockError && <p className="text-xs text-red-400 font-medium">{unlockError}</p>}

              <div className="flex w-full gap-3 mt-4">
                <button className="flex-1 py-3.5 rounded-xl font-semibold text-gray-400 hover:bg-white/5 transition-colors" onClick={() => setShowUnlockPrompt(false)}>Batal</button>
                <button className="flex-1 py-3.5 rounded-xl font-semibold bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/20" onClick={handleUnlockAndOpen}>
                  {unlockLoading ? '...' : 'Buka'}
                </button>
              </div>
            </div>
          </motion.div>
        </div>,
        document.body
      )}
    </>
  );
}

export const EntryCardMemo = memo(EntryCard);