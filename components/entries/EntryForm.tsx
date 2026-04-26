'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Save, PlusCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAppStore } from '@/lib/store/appStore';
import { saveVault } from '@/lib/vaultService';
import { CategoryIcon } from '@/components/entries/CategoryIcon';
import { DEFAULT_CATEGORIES } from '@/lib/types';
import type { VaultEntry } from '@/lib/types';

export function EntryForm({ entry, onClose, onSaved }: { entry?: VaultEntry, onClose: () => void, onSaved: (e: VaultEntry) => void }) {
  const store = useAppStore();
  const [cat, setCat] = useState(entry?.cat ?? 'sosmed');
  const [name, setName] = useState(entry?.name ?? '');
  const [user, setUser] = useState(entry?.user ?? '');
  const [pass, setPass] = useState(entry?.pass ?? '');
  const [saving, setSaving] = useState(false);

  // Kunci scroll background
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = 'unset'; };
  }, []);

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    const newEntry: VaultEntry = {
      ...entry,
      id: entry?.id ?? Date.now().toString(),
      cat, name, user, pass,
      ts: Date.now(),
    };
    const newVault = entry ? store.vault.map(e => e.id === entry.id ? newEntry : e) : [newEntry, ...store.vault];
    store.setVault(newVault);
    await saveVault(store.masterPw, newVault, store.recycleBin, store.vaultMeta!, store.customCats, store.lockedIds);
    onSaved(newEntry);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm">
      {/* Container Modal: Menggunakan max-h-[85vh] untuk scroll mandiri */}
      <motion.div initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }} className="w-full max-w-lg bg-[#07080f] border-t sm:border border-white/10 rounded-t-[2.5rem] sm:rounded-[2.5rem] flex flex-col overflow-hidden max-h-[85vh] shadow-2xl">
        
        {/* Header Form: Fixed di atas */}
        <div className="flex-none p-6 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-yellow-500/10 text-yellow-500">
              <PlusCircle size={20} />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white leading-none">{entry ? 'Perbarui Entri' : 'Entri Baru'}</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest mt-1 font-bold">Informasi Kredensial</p>
            </div>
          </div>
          <button className="p-2 hover:bg-white/5 rounded-full text-gray-500 transition-colors" onClick={onClose}><X size={20} /></button>
        </div>

        {/* Body Form: Area Scroll Mandiri */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
          <div className="space-y-1.5">
            <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Kategori</label>
            <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
              {DEFAULT_CATEGORIES.map(c => (
                <button key={c.id} onClick={() => setCat(c.id)} className={`flex-none flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all ${cat === c.id ? 'bg-yellow-500 border-yellow-500 text-black' : 'bg-white/5 border-white/5 text-gray-400 hover:border-white/20'}`}>
                  <CategoryIcon catId={c.id} size="sm" />
                  <span className="text-xs font-bold">{c.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Nama Layanan</label>
              <input type="text" className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all" placeholder="Misal: Google, Bank Mandiri..." value={name} onChange={e => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Username / ID</label>
              <input type="text" className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all" value={user} onChange={e => setUser(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-gray-400 uppercase tracking-wider ml-1">Password</label>
              <input type="password" className="w-full bg-white/5 border border-white/5 rounded-2xl px-5 py-4 text-white font-mono focus:border-yellow-500 focus:ring-1 focus:ring-yellow-500 outline-none transition-all" value={pass} onChange={e => setPass(e.target.value)} />
            </div>
          </div>
        </div>

        {/* Footer Form: Fixed di bawah */}
        <div className="flex-none p-6 bg-[#0a0c14] border-t border-white/5 flex gap-3">
          <button className="flex-1 py-4 rounded-2xl font-bold text-gray-400 hover:bg-white/5 transition-colors" onClick={onClose}>Batal</button>
          <button className="flex-2 py-4 rounded-2xl font-bold bg-yellow-500 text-black hover:bg-yellow-400 shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2" onClick={handleSave} disabled={saving}>
            <Save size={18} /> {saving ? 'Menyimpan...' : 'Simpan Entri'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}