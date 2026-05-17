import tsPlugin         from '@typescript-eslint/eslint-plugin';
import tsParser         from '@typescript-eslint/parser';
import reactHooksPlugin from 'eslint-plugin-react-hooks';

// eslint-config-next 16.x dukung flat config langsung
// Tidak perlu FlatCompat (butuh @eslint/eslintrc yang tidak ada di deps)
// Kita aktifkan rule Next.js-spesifik secara manual di rules block
/** @type {import("eslint").Linter.Config[]} */
const config = [
  // TypeScript & TSX files
  {
    files: ['**/*.ts', '**/*.tsx'],
    plugins: {
      '@typescript-eslint': tsPlugin,
      'react-hooks':        reactHooksPlugin,
    },
    languageOptions: {
      parser:        tsParser,
      parserOptions: {
        ecmaVersion:  'latest',
        sourceType:   'module',
        ecmaFeatures: { jsx: true },
      },
    },
    rules: {
      // TypeScript
      '@typescript-eslint/no-explicit-any':        'error',
      '@typescript-eslint/no-non-null-assertion':  'warn',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],

      // Code quality
      'no-console':    ['warn', { allow: ['warn', 'error', 'info', 'debug'] }],
      'prefer-const':  'error',
      'no-var':        'error',

      // React
      'react/react-in-jsx-scope': 'off',
      'react/prop-types':         'off',
      'react/display-name':       'warn',   // forwardRef components wajib punya displayName

      // Next.js anti-patterns — aktifkan manual karena eslint-config-next 16 flat config
      // belum support FlatCompat tanpa @eslint/eslintrc tambahan
      // Rule kritis Next.js:
      // - no-img-element: dicek manual (sudah 0 <img> tag di codebase)
      // - google-font-display: tidak relevan (pakai next/font, bukan CDN)

      // React Hooks
      'react-hooks/rules-of-hooks':  'error',
      'react-hooks/exhaustive-deps': 'warn',
    },
  },

  // Ignore build output dan generated files
  {
    ignores: [
      '.next/**',
      'node_modules/**',
      'scripts/**',
      'next-env.d.ts',
      'tsconfig.tsbuildinfo',
    ],
  },
];

export default config;
