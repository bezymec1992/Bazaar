/**
 * Escape text for safe insertion into HTML (mitigates XSS from untrusted strings).
 */
function escapeHtml(value) {
  if (value == null) return '';
  return String(value).replace(/[&<>"']/g, ch => {
    switch (ch) {
      case '&':
        return '&amp;';
      case '<':
        return '&lt;';
      case '>':
        return '&gt;';
      case '"':
        return '&quot;';
      case "'":
        return '&#39;';
      default:
        return ch;
    }
  });
}
