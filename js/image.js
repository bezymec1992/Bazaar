function optimizeImage(url, width = 600) {
  return url.replace('/upload/', `/upload/f_auto,q_auto,w_${width}/`);
}
