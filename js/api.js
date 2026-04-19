/** Public anon key: security = Postgres RLS on `products` (read-only catalog, no writes). */
const SUPABASE_URL = 'https://oicwhdcmfkckprrnzctn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YebYXtFgqG3G0sGJH8VAUA_G-ZrlSL-';
const CACHE_KEY = 'products';
const CACHE_TIME_KEY = 'products_timestamp';
const CACHE_LIFETIME = 1000 * 60 * 5;

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function getProducts() {
  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

  if (cached && cachedTime) {
    const isFresh = Date.now() - Number(cachedTime) < CACHE_LIFETIME;

    if (isFresh) {
      try {
        const parsed = JSON.parse(cached);
        if (Array.isArray(parsed)) return parsed;
        localStorage.removeItem(CACHE_KEY);
        localStorage.removeItem(CACHE_TIME_KEY);
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

  if (!Array.isArray(data)) {
    throw new Error('Failed to fetch products');
  }

  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
    localStorage.setItem(CACHE_TIME_KEY, String(Date.now()));
  } catch (e) {
    console.warn('Product cache write failed (quota or disabled):', e);
  }

  return data;
}

async function getProductById(id) {
  const n = Number(id);
  if (!Number.isFinite(n)) return null;

  const { data, error } = await db.from('products').select('*').eq('id', n).single();

  if (error) {
    if (error.code === 'PGRST116') return null;
    console.error(error);
    throw new Error('Failed to load product');
  }

  return data;
}

function hasFreshCache() {
  const cached = localStorage.getItem(CACHE_KEY);
  const cachedTime = localStorage.getItem(CACHE_TIME_KEY);

  if (!cached || !cachedTime) return false;

  return Date.now() - Number(cachedTime) < CACHE_LIFETIME;
}
