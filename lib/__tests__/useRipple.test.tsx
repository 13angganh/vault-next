/**
 * lib/__tests__/useRipple.test.tsx — Aurum Vault v2.0.0 (Tahap 3)
 *
 * Regresi butir 6(f): useRipple menarget `.sidebar-item` yang sudah tidak ada (Sidebar v2 memakai
 * `.sbx-item`), sehingga ripple tidak pernah muncul di item sidebar.
 */
import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRipple } from '@/lib/hooks/useRipple';

afterEach(() => { document.body.innerHTML = ''; });

const byId = (id: string) => document.getElementById(id) as HTMLElement;

function press(el: Element) {
  el.dispatchEvent(new Event('pointerdown', { bubbles: true }));
}

describe('useRipple — target', () => {
  it('item sidebar v2 (.sbx-item) mendapat elemen .ripple-effect saat ditekan', () => {
    document.body.innerHTML = '<nav><button class="sbx-item" id="i">Brankas</button></nav>';
    renderHook(() => useRipple());
    const item = byId('i');
    press(item);
    expect(item.querySelector('.ripple-effect')).not.toBeNull();
  });
  it('.btn dan .icon-btn tetap mendapat ripple', () => {
    document.body.innerHTML = '<button class="btn" id="a">A</button><button class="icon-btn" id="b">B</button>';
    renderHook(() => useRipple());
    press(byId('a')); press(byId('b'));
    expect(document.querySelectorAll('.ripple-effect').length).toBe(2);
  });
  it('kelas lama .sidebar-item tidak lagi menjadi target', () => {
    document.body.innerHTML = '<button class="sidebar-item" id="old">Lama</button>';
    renderHook(() => useRipple());
    press(byId('old'));
    expect(document.querySelector('.ripple-effect')).toBeNull();
  });
  it('listener dilepas saat unmount', () => {
    document.body.innerHTML = '<button class="btn" id="a">A</button>';
    const { unmount } = renderHook(() => useRipple());
    unmount();
    press(byId('a'));
    expect(document.querySelector('.ripple-effect')).toBeNull();
  });
});
