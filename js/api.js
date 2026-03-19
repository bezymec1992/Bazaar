const API_URL = 'https://sheetdb.io/api/v1/jqeo93r4g20ic';

// 👉 меняешь ЭТУ строку когда добавляешь товары
const CACHE_VERSION = 'v1';

async function getProducts(forceUpdate = false) {
  const cached = localStorage.getItem('products');
  const version = localStorage.getItem('products_version');

  // ✅ если есть кэш и версия совпадает — используем кэш
  if (cached && version === CACHE_VERSION && !forceUpdate) {
    return JSON.parse(cached);
  }

  // ❗ иначе идём в API
  const res = await fetch(API_URL);
  const data = await res.json();

  // сохраняем данные + версию
  localStorage.setItem('products', JSON.stringify(data));
  localStorage.setItem('products_version', CACHE_VERSION);

  return data;
}
