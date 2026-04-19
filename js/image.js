function optimizeImage(url, width = 600) {
  if (!url || typeof url !== 'string') return '';

  const trimmed = url.trim();
  if (!/^https?:\/\//i.test(trimmed)) return '';

  if (!trimmed.includes('/upload/')) return trimmed;

  return trimmed.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}
