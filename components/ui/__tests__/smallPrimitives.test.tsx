/**
 * components/ui/__tests__/smallPrimitives.test.tsx — Aurum Vault v2.0.0 (Tahap 4C)
 *
 * Maksud: menjaga primitif kecil yang dipakai di banyak layar:
 *  - Badge: varian (bawaan "muted", semua varian token), ikon opsional, className/atribut tambahan;
 *  - ErrorState: role=alert, judul bawaan, pesan, wadah aksi hanya bila ada aksi;
 *  - IconButton: kelas per warna hover/ukuran, ref diteruskan, atribut/aksi diteruskan, nonaktif;
 *  - Input & Textarea: label terhubung ke kontrol (id turunan dari label: huruf kecil, spasi → "-";
 *    id eksplisit menang), pesan galat + kelas galat, prefiks/sufiks (Input), kelas pada tempat
 *    yang benar (className → kontrol, wrapperClassName → pembungkus), ref, atribut diteruskan;
 *  - Skeleton: aria-hidden, ukuran angka → px, circle → radius 50%, style pemakai menimpa.
 *
 * Tidak dikunci (diamati, belum diputuskan; lihat USULAN U28 di laporan): Input/Textarea tidak
 * memasang aria-invalid/aria-describedby pada galat, id turunan label bisa bentrok bila dua kontrol
 * berlabel sama, IconButton tanpa type bawaan (submit di dalam form), atribut `...rest` Skeleton bisa
 * menimpa aria-hidden.
 *
 * Konvensi: role/label/teks; pengecualian terdokumentasi (tak ada alternatif a11y): kelas gaya
 * (.badge--x, .skeleton--circle, .field__*), wadah prefiks/sufiks (.field__prefix/.field__suffix).
 * Modal diuji di Modal.test.tsx.
 *
 * Riwayat:
 *  - v2.0.0 (Tahap 4C): file dibuat.
 */
import { describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Badge } from '../primitives/Badge';
import { ErrorState } from '../primitives/ErrorState';
import { IconButton } from '../primitives/IconButton';
import { Input } from '../primitives/Input';
import { Textarea } from '../primitives/Textarea';
import { Skeleton } from '../primitives/Skeleton';
import { badgeVariant } from '@/lib/design-tokens';

/* ───────────────────────── Badge ───────────────────────── */
describe('Badge', () => {
  it('bawaan: <span class="badge badge--muted"> berisi teks anak', () => {
    render(<Badge>Baru</Badge>);
    const el = screen.getByText('Baru');
    expect(el.tagName).toBe('SPAN');
    expect(el).toHaveClass('badge', 'badge--muted');
  });

  it.each(badgeVariant)('varian "%s" → kelas badge--%s (dan tidak ada varian lain)', (v) => {
    render(<Badge variant={v}>x</Badge>);
    const el = screen.getByText('x');
    expect(el).toHaveClass(`badge--${v}`);
    for (const lain of badgeVariant.filter((o) => o !== v)) expect(el).not.toHaveClass(`badge--${lain}`);
  });

  it('ikon: dibungkus .badge__icon sebelum teks; tanpa ikon tidak ada pembungkus', () => {
    const a = render(<Badge icon={<svg data-testid="ik" />}>Label</Badge>);
    const ikon = screen.getByTestId('ik');
    expect(ikon.parentElement).toHaveClass('badge__icon');
    expect(a.container.firstElementChild?.firstElementChild).toBe(ikon.parentElement);
    a.unmount();
    const b = render(<Badge>Label</Badge>);
    expect(b.container.querySelector('.badge__icon')).toBeNull();
  });

  it('className tambahan ditambahkan (kelas dasar tetap) dan atribut lain diteruskan', () => {
    render(<Badge className="ekstra" title="judul" data-x="1">T</Badge>);
    const el = screen.getByText('T');
    expect(el).toHaveClass('badge', 'badge--muted', 'ekstra');
    expect(el).toHaveAttribute('title', 'judul');
    expect(el).toHaveAttribute('data-x', '1');
  });
});

/* ───────────────────────── ErrorState ───────────────────────── */
describe('ErrorState', () => {
  it('role=alert; judul bawaan "Terjadi Kesalahan"; pesan tampil; judul sebelum pesan', () => {
    render(<ErrorState message="Gagal memuat data" />);
    const alert = screen.getByRole('alert');
    expect(alert).toHaveTextContent('Terjadi Kesalahan');
    expect(alert).toHaveTextContent('Gagal memuat data');
    const ps = Array.from(alert.querySelectorAll('p')).map((p) => p.textContent);
    expect(ps).toEqual(['Terjadi Kesalahan', 'Gagal memuat data']);
  });

  it('judul kustom menggantikan judul bawaan', () => {
    render(<ErrorState title="Backup gagal" message="m" />);
    expect(screen.getByText('Backup gagal')).toBeInTheDocument();
    expect(screen.queryByText('Terjadi Kesalahan')).not.toBeInTheDocument();
  });

  it('aksi: dirender di dalam wadah .error-state__action hanya bila diberikan', () => {
    const a = render(<ErrorState message="m" action={<button>Coba lagi</button>} />);
    expect(screen.getByRole('button', { name: 'Coba lagi' }).parentElement).toHaveClass('error-state__action');
    a.unmount();
    const b = render(<ErrorState message="m" />);
    expect(b.container.querySelector('.error-state__action')).toBeNull();
  });

  it('className tambahan ditambahkan di akar; ikon peringatan ada', () => {
    const { container } = render(<ErrorState message="m" className="ekstra" />);
    expect(screen.getByRole('alert')).toHaveClass('error-state', 'ekstra');
    expect(container.querySelector('.error-state__icon svg')).not.toBeNull();
  });
});

/* ───────────────────────── IconButton ───────────────────────── */
describe('IconButton', () => {
  it('bawaan: <button class="ibtn ripple-container"> berisi ikon; tanpa kelas warna/ukuran', () => {
    render(<IconButton aria-label="Aksi" icon={<svg data-testid="ik" />} />);
    const b = screen.getByRole('button', { name: 'Aksi' });
    expect(b).toHaveClass('ibtn', 'ripple-container');
    expect(b).not.toHaveClass('del', 'lock-active', 'ibtn--sm');
    expect(b).toContainElement(screen.getByTestId('ik'));
  });

  it.each([
    ['default', [], ['del', 'lock-active']],
    ['del', ['del'], ['lock-active']],
    ['lock', ['lock-active'], ['del']],
  ] as const)('colorHover="%s" → kelas %j', (warna, ada, tidak) => {
    render(<IconButton aria-label="A" icon={<i />} colorHover={warna} />);
    const b = screen.getByRole('button', { name: 'A' });
    for (const k of ada) expect(b).toHaveClass(k);
    for (const k of tidak) expect(b).not.toHaveClass(k);
  });

  it('size="sm" → ibtn--sm; size="md" (bawaan) → tidak', () => {
    const a = render(<IconButton aria-label="S" icon={<i />} size="sm" />);
    expect(screen.getByRole('button', { name: 'S' })).toHaveClass('ibtn--sm');
    a.unmount();
    render(<IconButton aria-label="M" icon={<i />} size="md" />);
    expect(screen.getByRole('button', { name: 'M' })).not.toHaveClass('ibtn--sm');
  });

  it('className tambahan; ref mengarah ke <button>; atribut (type, title) diteruskan', () => {
    const ref = createRef<HTMLButtonElement>();
    render(<IconButton ref={ref} aria-label="R" icon={<i />} className="ekstra" type="button" title="tip" />);
    const b = screen.getByRole('button', { name: 'R' });
    expect(b).toHaveClass('ibtn', 'ekstra');
    expect(ref.current).toBe(b);
    expect(b).toHaveAttribute('type', 'button');
    expect(b).toHaveAttribute('title', 'tip');
  });

  it('klik memanggil onClick; disabled menahan klik', () => {
    const onClick = vi.fn();
    const a = render(<IconButton aria-label="K" icon={<i />} onClick={onClick} />);
    fireEvent.click(screen.getByRole('button', { name: 'K' }));
    expect(onClick).toHaveBeenCalledTimes(1);
    a.unmount();
    const onClick2 = vi.fn();
    render(<IconButton aria-label="D" icon={<i />} onClick={onClick2} disabled />);
    expect(screen.getByRole('button', { name: 'D' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'D' }));
    expect(onClick2).not.toHaveBeenCalled();
  });
});

/* ───────────────────────── Input ───────────────────────── */
describe('Input', () => {
  it('label terhubung ke input: id turunan = label huruf kecil, spasi (berderet) → satu "-"', () => {
    render(<Input label="Nama  Lengkap Anda" />);
    const input = screen.getByLabelText('Nama Lengkap Anda'); // pencocokan teks menormalkan spasi ganda
    expect(input.tagName).toBe('INPUT');
    expect(input).toHaveAttribute('id', 'nama-lengkap-anda');
  });

  it('id eksplisit menang atas id turunan; label tetap terhubung', () => {
    render(<Input label="Email" id="kolom-email" />);
    expect(screen.getByLabelText('Email')).toHaveAttribute('id', 'kolom-email');
  });

  it('tanpa label: tidak ada <label> dan tidak ada id otomatis', () => {
    const { container } = render(<Input placeholder="x" />);
    expect(container.querySelector('label')).toBeNull();
    expect(screen.getByPlaceholderText('x')).not.toHaveAttribute('id');
  });

  it('tanpa label tetapi dengan id eksplisit: id dipakai', () => {
    render(<Input id="abc" placeholder="x" />);
    expect(screen.getByPlaceholderText('x')).toHaveAttribute('id', 'abc');
  });

  it('galat: pesan tampil dan input diberi kelas field__input--error; tanpa galat keduanya tidak ada', () => {
    const a = render(<Input label="Email" error="Format salah" />);
    expect(screen.getByText('Format salah')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toHaveClass('field__input--error');
    a.unmount();
    const b = render(<Input label="Email" />);
    expect(screen.getByLabelText('Email')).not.toHaveClass('field__input--error');
    expect(b.container.querySelector('.field__error')).toBeNull();
  });

  it('galat berupa string kosong dianggap tanpa galat', () => {
    const { container } = render(<Input label="E" error="" />);
    expect(screen.getByLabelText('E')).not.toHaveClass('field__input--error');
    expect(container.querySelector('.field__error')).toBeNull();
  });

  it('prefiks/sufiks: dirender di sisi masing-masing dengan kelas pembungkus has-*; tanpa keduanya tidak ada', () => {
    const a = render(<Input label="U" prefix={<i data-testid="pre" />} suffix={<i data-testid="suf" />} />);
    expect(screen.getByTestId('pre').parentElement).toHaveClass('field__prefix');
    expect(screen.getByTestId('suf').parentElement).toHaveClass('field__suffix');
    const wrap = a.container.querySelector('.field__wrap');
    expect(wrap).toHaveClass('field__wrap--has-prefix', 'field__wrap--has-suffix');
    expect(wrap?.firstElementChild).toBe(screen.getByTestId('pre').parentElement);
    expect(wrap?.lastElementChild).toBe(screen.getByTestId('suf').parentElement);
    a.unmount();
    const b = render(<Input label="U" />);
    expect(b.container.querySelector('.field__wrap')).not.toHaveClass('field__wrap--has-prefix');
    expect(b.container.querySelector('.field__wrap')).not.toHaveClass('field__wrap--has-suffix');
    expect(b.container.querySelector('.field__prefix, .field__suffix')).toBeNull();
  });

  it('hanya prefiks → hanya has-prefix; hanya sufiks → hanya has-suffix', () => {
    const a = render(<Input prefix={<i />} />);
    expect(a.container.querySelector('.field__wrap')).toHaveClass('field__wrap--has-prefix');
    expect(a.container.querySelector('.field__wrap')).not.toHaveClass('field__wrap--has-suffix');
    a.unmount();
    const b = render(<Input suffix={<i />} />);
    expect(b.container.querySelector('.field__wrap')).toHaveClass('field__wrap--has-suffix');
    expect(b.container.querySelector('.field__wrap')).not.toHaveClass('field__wrap--has-prefix');
  });

  it('className → input; wrapperClassName → pembungkus .field (bukan sebaliknya)', () => {
    const { container } = render(<Input label="L" className="kelas-input" wrapperClassName="kelas-wrap" />);
    expect(screen.getByLabelText('L')).toHaveClass('kelas-input');
    expect(screen.getByLabelText('L')).not.toHaveClass('kelas-wrap');
    expect(container.firstElementChild).toHaveClass('field', 'kelas-wrap');
    expect(container.firstElementChild).not.toHaveClass('kelas-input');
  });

  it('ref mengarah ke <input>; atribut native (type, value, placeholder, disabled, onChange) diteruskan', () => {
    const ref = createRef<HTMLInputElement>();
    const onChange = vi.fn();
    render(<Input ref={ref} label="P" type="password" placeholder="ph" value="abc" onChange={onChange} disabled />);
    const input = screen.getByLabelText('P');
    expect(ref.current).toBe(input);
    expect(input).toHaveAttribute('type', 'password');
    expect(input).toHaveAttribute('placeholder', 'ph');
    expect(input).toBeDisabled();
    expect((input as HTMLInputElement).value).toBe('abc');
  });

  it('mengetik memanggil onChange', () => {
    const onChange = vi.fn();
    render(<Input label="N" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('N'), { target: { value: 'x' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

/* ───────────────────────── Textarea ───────────────────────── */
describe('Textarea', () => {
  it('label terhubung: id turunan dari label', () => {
    render(<Textarea label="Catatan Rahasia" />);
    const ta = screen.getByLabelText('Catatan Rahasia');
    expect(ta.tagName).toBe('TEXTAREA');
    expect(ta).toHaveAttribute('id', 'catatan-rahasia');
  });

  it('spasi berderet di label menjadi satu "-" pada id turunan', () => {
    render(<Textarea label="Catatan  Rahasia  Dua" />);
    expect(screen.getByLabelText('Catatan Rahasia Dua')).toHaveAttribute('id', 'catatan-rahasia-dua');
  });

  it('id eksplisit menang; tanpa label tidak ada id otomatis', () => {
    const a = render(<Textarea label="Catatan" id="kolom" />);
    expect(screen.getByLabelText('Catatan')).toHaveAttribute('id', 'kolom');
    a.unmount();
    const b = render(<Textarea placeholder="p" />);
    expect(screen.getByPlaceholderText('p')).not.toHaveAttribute('id');
    expect(b.container.querySelector('label')).toBeNull();
  });

  it('galat: pesan + kelas field__input--error; tanpa galat keduanya tidak ada', () => {
    const a = render(<Textarea label="C" error="Terlalu panjang" />);
    expect(screen.getByText('Terlalu panjang')).toBeInTheDocument();
    expect(screen.getByLabelText('C')).toHaveClass('field__input--error');
    a.unmount();
    const b = render(<Textarea label="C" />);
    expect(screen.getByLabelText('C')).not.toHaveClass('field__input--error');
    expect(b.container.querySelector('.field__error')).toBeNull();
  });

  it('className → textarea; wrapperClassName → .field; ref → <textarea>; atribut diteruskan', () => {
    const ref = createRef<HTMLTextAreaElement>();
    const { container } = render(<Textarea ref={ref} label="T" className="k-ta" wrapperClassName="k-wrap" rows={4} placeholder="ph" />);
    const ta = screen.getByLabelText('T');
    expect(ta).toHaveClass('k-ta');
    expect(ta).not.toHaveClass('k-wrap');
    expect(container.firstElementChild).toHaveClass('field', 'k-wrap');
    expect(ref.current).toBe(ta);
    expect(ta).toHaveAttribute('rows', '4');
    expect(ta).toHaveAttribute('placeholder', 'ph');
  });

  it('mengetik memanggil onChange', () => {
    const onChange = vi.fn();
    render(<Textarea label="N" onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('N'), { target: { value: 'baris' } });
    expect(onChange).toHaveBeenCalledTimes(1);
  });
});

/* ───────────────────────── Skeleton ───────────────────────── */
describe('Skeleton', () => {
  const el = (c: HTMLElement) => c.firstElementChild as HTMLElement;

  it('bawaan: .skeleton, aria-hidden, tanpa ukuran dan tanpa radius', () => {
    const { container } = render(<Skeleton />);
    expect(el(container)).toHaveClass('skeleton');
    expect(el(container)).not.toHaveClass('skeleton--circle');
    expect(el(container)).toHaveAttribute('aria-hidden', 'true');
    expect(el(container).style.width).toBe('');
    expect(el(container).style.height).toBe('');
    expect(el(container).style.borderRadius).toBe('');
  });

  it('width/height angka → px; string diteruskan apa adanya', () => {
    const a = render(<Skeleton width={40} height={12} />);
    expect(el(a.container).style.width).toBe('40px');
    expect(el(a.container).style.height).toBe('12px');
    a.unmount();
    const b = render(<Skeleton width="50%" height="2rem" />);
    expect(el(b.container).style.width).toBe('50%');
    expect(el(b.container).style.height).toBe('2rem');
  });

  it('circle → kelas skeleton--circle dan radius 50%', () => {
    const { container } = render(<Skeleton circle width={32} height={32} />);
    expect(el(container)).toHaveClass('skeleton', 'skeleton--circle');
    expect(el(container).style.borderRadius).toBe('50%');
  });

  it('style pemakai digabung dan MENIMPA nilai bawaan (width, borderRadius)', () => {
    const { container } = render(<Skeleton circle width={32} style={{ width: 99, borderRadius: 4, opacity: 0.5 }} />);
    expect(el(container).style.width).toBe('99px');
    expect(el(container).style.borderRadius).toBe('4px');
    expect(el(container).style.opacity).toBe('0.5');
  });

  it('className tambahan ditambahkan; atribut lain (data-*) diteruskan', () => {
    const { container } = render(<Skeleton className="ekstra" data-x="1" />);
    expect(el(container)).toHaveClass('skeleton', 'ekstra');
    expect(el(container)).toHaveAttribute('data-x', '1');
  });
});
