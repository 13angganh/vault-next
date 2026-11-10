'use client';

/**
 * AttributionPanel v1.0 — Aurum Vault v2.0.0 (Tahap 5)
 * Isi sheet "Atribusi & lisensi": versi + lisensi aplikasi, lalu sumber/lisensi logo brand.
 * Murni statis (data dari lib/attribution.ts): tanpa kunci penyimpanan, tanpa jaringan, tanpa
 * tombol selain tautan keluar. Tautan keluar memakai rel="noopener noreferrer" dan target 44px.
 */
import { ExternalLink } from 'lucide-react';
import { APP_NAME, APP_VERSION } from '@/lib/constants';
import {
  APP_LICENSE_TEXT, ATTRIBUTION_SOURCES, LOGO_CHANGES_NOTE, logosOfSource, type AttributionSource,
} from '@/lib/attribution';

function SourceCard({ source }: { source: AttributionSource }) {
  const logos = logosOfSource(source);
  const headId = `attr-src-${source.id}`;
  return (
    <section className="attr-src" aria-labelledby={headId}>
      <div className="attr-src__head">
        <h5 className="attr-src__name" id={headId}>{source.name}</h5>
        <span className={`attr-badge attr-badge--${source.tone}`}>{source.license}</span>
      </div>
      <p className="attr-src__meta">
        {source.slugs === null ? `${logos.length} logo (semua yang tidak tercantum di sumber lain)` : `${logos.length} logo`}
        {' · oleh '}{source.creator}
      </p>
      {source.slugs !== null && <p className="attr-src__names">{logos.map((l) => l.title).join(', ')}</p>}
      <p className="attr-src__meta">{source.note}</p>
      <div className="attr-src__links">
        <a className="attr-link" href={source.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Situs sumber ${source.name}`}>
          Situs sumber<ExternalLink size={15} />
        </a>
        <a className="attr-link" href={source.licenseUrl} target="_blank" rel="noopener noreferrer" aria-label={`Teks lisensi ${source.name}`}>
          Teks lisensi<ExternalLink size={15} />
        </a>
      </div>
    </section>
  );
}

export function AttributionPanel() {
  return (
    <div className="attr-panel">
      <section className="attr-app" aria-label="Aplikasi">
        <div className="attr-app__name">{APP_NAME}</div>
        <div className="attr-app__meta">Versi {APP_VERSION}</div>
        <div className="attr-app__license">{APP_LICENSE_TEXT}</div>
      </section>

      <h4 className="attr-h">Logo brand</h4>
      <p className="attr-note">
        Logo di pemilih logo dikurasi dari pustaka terbuka di bawah ini. Merek dan logo tetap milik
        pemegang merek masing-masing; {APP_NAME} tidak berafiliasi dengan dan tidak didukung oleh mereka.
      </p>
      <p className="attr-note">{LOGO_CHANGES_NOTE}</p>

      {ATTRIBUTION_SOURCES.map((s) => <SourceCard key={s.id} source={s} />)}
    </div>
  );
}
