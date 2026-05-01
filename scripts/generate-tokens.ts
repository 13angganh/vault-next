/**
 * scripts/generate-tokens.ts — Vault Next
 * Generate styles/tokens.css dari lib/design-tokens.ts.
 * Jalankan: npm run tokens
 *
 * Berguna sebagai source-of-truth check: jika CSS dan TS tidak sinkron,
 * jalankan script ini lalu commit hasilnya.
 *
 * M-16 — Sesi B
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import {
  fontSize, fontFamily, lineHeight, letterSpacing,
  spacing, radius, ease, transition, layout,
} from '../lib/design-tokens.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(__dirname, '../styles/tokens.css');

function px(obj: Record<string, string>, prefix: string): string {
  return Object.entries(obj)
    .map(([k, v]) => `  --${prefix}-${k}: ${v};`)
    .join('\n');
}

const css = `/* styles/tokens.css — Vault Next */
/* AUTO-GENERATED oleh scripts/generate-tokens.ts */
/* Edit lib/design-tokens.ts lalu jalankan: npm run tokens */

:root {
  /* Type Scale (8 level) */
${px(fontSize, 'text')}

  /* Line Height */
  --lh-tight:  ${lineHeight.tight};
  --lh-normal: ${lineHeight.normal};
  --lh-loose:  ${lineHeight.loose};

  /* Letter Spacing */
  --ls-label:  ${letterSpacing.label};
  --ls-tight:  ${letterSpacing.tight};

  /* Font Families */
  --font-sans: ${fontFamily.sans};
  --font-mono: ${fontFamily.mono};

  /* Spacing Scale (4px base) */
${px(Object.fromEntries(Object.entries(spacing).map(([k, v]) => [k, v])), 'space')}

  /* Border Radius Scale */
${px(radius, 'radius')}

  /* Transition Easing */
  --ease-default: ${ease.default};
  --ease-spring:  ${ease.spring};
  --ease-out:     ${ease.out};

  /* Transitions */
  --transition-fast:   ${transition.fast};
  --transition-normal: ${transition.normal};
  --transition-slow:   ${transition.slow};
  --transition-spring: ${transition.spring};

  /* Layout */
  --sidebar-width:   ${layout.sidebarWidth};
  --appbar-height:   ${layout.appbarHeight};
  --content-max:     ${layout.contentMax};
  --modal-width:     ${layout.modalWidth};
  --modal-width-sm:  ${layout.modalWidthSm};
}
`;

fs.writeFileSync(OUT, css, 'utf8');
console.log(`✅ tokens.css digenerate → ${OUT}`);
