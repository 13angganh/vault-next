'use client';

/**
 * Vault Next — PasswordStrengthMeter
 * Bar visual 7 level kekuatan password.
 * Dipakai di EntryForm, PasswordGenerator, SetupFlow.
 *
 * Levels:
 *   0 — kosong
 *   1 — sangat lemah  (< 6 char)
 *   2 — lemah         (< 8 char, hanya 1 tipe)
 *   3 — cukup         (>= 8 char, 2 tipe)
 *   4 — sedang        (>= 8 char, 3 tipe)
 *   5 — kuat          (>= 10 char, 3 tipe)
 *   6 — sangat kuat   (>= 12 char, 4 tipe)
 *   7 — luar biasa    (>= 16 char, 4 tipe + entropy tinggi)
 */

interface StrengthResult {
  level:  number;   // 0–7
  label:  string;
  color:  string;
}

export function calcStrength(pw: string): StrengthResult {
  if (!pw) return { level: 0, label: '', color: 'transparent' };

  const len  = pw.length;
  const hasLower  = /[a-z]/.test(pw);
  const hasUpper  = /[A-Z]/.test(pw);
  const hasDigit  = /\d/.test(pw)  ;
  const hasSymbol = /[^a-zA-Z0-9]/.test(pw);
  const types = [hasLower, hasUpper, hasDigit, hasSymbol].filter(Boolean).length;

  let level: number;

  if (len < 6)                              level = 1;
  else if (len < 8 || types < 2)           level = 2;
  else if (len < 8 && types >= 2)          level = 3;
  else if (len >= 8  && types === 2)       level = 3;
  else if (len >= 8  && types === 3)       level = 4;
  else if (len >= 10 && types === 3)       level = 5;
  else if (len >= 12 && types === 4)       level = 6;
  else                                     level = 4;

  // Bump to 7 for very long passwords with all types
  if (len >= 16 && types === 4)            level = 7;

  const LABELS = ['', 'Sangat Lemah', 'Lemah', 'Cukup', 'Sedang', 'Kuat', 'Sangat Kuat', 'Luar Biasa'];
  const COLORS = [
    'transparent',
    '#ef4444', // red
    '#f97316', // orange
    '#eab308', // yellow
    '#84cc16', // lime
    '#22c55e', // green
    '#10b981', // emerald
    '#f0a500', // gold — brand color
  ];

  return { level, label: LABELS[level], color: COLORS[level] };
}

interface PasswordStrengthMeterProps {
  password: string;
  showLabel?: boolean;
  className?: string;
}

export function PasswordStrengthMeter({
  password,
  showLabel = true,
  className = '',
}: PasswordStrengthMeterProps) {
  const { level, label, color } = calcStrength(password);

  if (!password) return null;

  return (
    <div className={`strength-meter ${className}`}>
      <div className="strength-meter__bars">
        {Array.from({ length: 7 }, (_, i) => (
          <div
            key={i}
            className="strength-meter__bar"
            style={{
              backgroundColor: i < level ? color : undefined,
              opacity: i < level ? 1 : undefined,
            }}
          />
        ))}
      </div>
      {showLabel && (
        <span className="strength-meter__label" style={{ color }}>
          {label}
        </span>
      )}
    </div>
  );
}
