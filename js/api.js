const SUPABASE_URL = 'https://oicwhdcmfkckprrnzctn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YebYXtFgqG3G0sGJH8VAUA_G-ZrlSL-';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function getProducts() {
  const CACHE_KEY = 'products';
  const CACHE_TIME_KEY = 'products_timestamp';
  const CACHE_LIFETIME = 1000 * 60 * 5; // 5 минут

  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

  // ✅ если есть кэш и он свежий
  if (cached && cachedTime) {
    const isFresh = Date.now() - Number(cachedTime) < CACHE_LIFETIME;

    if (isFresh) {
      try {
        return JSON.parse(cached);
      } catch (e) {
        console.error('Cache parse error:', e);
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
      }
    }
  }

  const { data, error } = await db.from('products').select('*').order('id', { ascending: false });

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch products');
  }

  // 💾 сохраняем в кэш
  localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  localStorage.setItem(CACHE_TIME_KEY, Date.now());

  return data;
}

async function getProductById(id) {
  const { data, error } = await db.from('products').select('*').eq('id', id).single();

  if (error) {
    console.error(error);
    throw new Error('Product not found');
  }

  return data;
}
