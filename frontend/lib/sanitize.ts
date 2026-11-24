import DOMPurify from 'dompurify';

/**
 * Sanitizer untuk rich text sebelum dirender ke DOM.
 *
 * Projekt sengaja tidak memakai `dangerouslySetInnerHTML`, tetapi utility ini
 * disediakan untuk konten HTML tepercaya (mis. deskripsi dari editor) yang
 * harus dibersihkan dari script/event handler sebelum dipakai.
 */
export function sanitizeHtml(input: string): string {
  if (typeof window === 'undefined') {
    // DOMPurify membutuhkan DOM. Di server, kembalikan teks polos.
    return input.replace(/<[^>]*>/g, '');
  }

  return DOMPurify.sanitize(input, {
    ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 'ul', 'ol', 'li', 'a', 'code', 'pre', 'blockquote'],
    ALLOWED_ATTR: ['href', 'title', 'target', 'rel'],
    ALLOW_DATA_ATTR: false,
  });
}

export function isSafeHtml(input: string): boolean {
  return sanitizeHtml(input) === input;
}
