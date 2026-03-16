const API_URL = 'https://sheetdb.io/api/v1/jqeo93r4g20ic';

async function getProducts(forceUpdate = false) {
  const cached = localStorage.getItem('products');

  // если есть кэш и не требуется обновление
  if (cached && !forceUpdate) {
    return JSON.parse(cached);
  }

  const res = await fetch(API_URL);
  const data = await res.json();

  // сохраняем в localStorage
  localStorage.setItem('products', JSON.stringify(data));

  return data;
}
