/* app/loading.tsx — Vault Next — Sesi C final */
/* Next.js route-level loading UI */

import { Shield } from 'lucide-react';

export default function Loading() {
  return (
    <div className="app-loading-root" aria-label="Memuat…" aria-live="polite">
      <div className="app-loading-inner">
        <div className="app-loading-icon">
          <Shield size={32} strokeWidth={1.5} />
        </div>
        <div className="app-loading-bars">
          <div className="skeleton app-loading-bar" style={{ width: '140px', height: '14px' }} />
          <div className="skeleton app-loading-bar" style={{ width: '96px', height: '10px' }} />
        </div>
      </div>
    </div>
  );
}
