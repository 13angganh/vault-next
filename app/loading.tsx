/* app/loading.tsx — Vault Next */
/* Next.js route-level loading UI */
/* CSS variables tersedia — tidak perlu inline styles dengan nilai hardcoded. */

import { Shield } from 'lucide-react';

export default function Loading() {
  return (
    <div className="app-loading-root" aria-label="Memuat…" aria-live="polite">
      <div className="app-loading-inner">
        <div className="app-loading-icon">
          <Shield size={32} strokeWidth={1.5} />
        </div>
        <div className="app-loading-bars">
          <div className="skeleton app-loading-bar app-loading-bar--wide" />
          <div className="skeleton app-loading-bar app-loading-bar--narrow" />
        </div>
      </div>
    </div>
  );
}
