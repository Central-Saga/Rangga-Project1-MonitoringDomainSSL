import { describe, expect, it } from 'vitest';
import { isSafeHtml, sanitizeHtml } from './sanitize';

describe('sanitizeHtml', () => {
  it('membuang script dan event handler', () => {
    const dirty = '<p>Halo</p><script>alert(1)</script><img src=x onerror="alert(2)">';
    const clean = sanitizeHtml(dirty);

    expect(clean).not.toContain('<script');
    expect(clean).not.toContain('onerror');
    expect(clean).toContain('<p>Halo</p>');
  });

  it('membiarkan tag dan atribut yang diizinkan', () => {
    const safe = '<p>Aset <strong>aktif</strong> <a href="/assets" rel="noopener">lihat</a></p>';

    expect(sanitizeHtml(safe)).toBe(safe);
    expect(isSafeHtml(safe)).toBe(true);
  });
});
