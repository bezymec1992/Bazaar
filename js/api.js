const API_URL = 'https://sheetdb.io/api/v1/jqeo93r4g20ic';

// 👉 меняешь ЭТУ строку когда добавляешь товары
const CACHE_VERSION = 'v1';

const CACHE_TIME = 1000 * 60 * 10; // 10 минут

async function getProducts() {
  const cached = localStorage.getItem('products');
  const timestamp = localStorage.getItem('products_timestamp');

  // 👉 если есть кэш и он свежий — используем его
  if (cached && timestamp && Date.now() - timestamp < CACHE_TIME) {
    return JSON.parse(cached);
  }

  // 👉 иначе — делаем запрос
  const res = await fetch(API_URL);
  const data = await res.json();

  // 👉 сохраняем
  localStorage.setItem('products', JSON.stringify(data));
  localStorage.setItem('products_timestamp', Date.now());

  return data;
}
