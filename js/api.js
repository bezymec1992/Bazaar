const SUPABASE_URL = 'https://oicwhdcmfkckprrnzctn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YebYXtFgqG3G0sGJH8VAUA_G-ZrlSL-';

const db = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

// const API_URL = 'https://sheetdb.io/api/v1/jqeo93r4g20ic';

// 👉 меняешь ЭТУ строку когда добавляешь товары
const CACHE_VERSION = 'v2';

const CACHE_TIME = 1000 * 60 * 20; // 20 минут

async function getProducts() {
  const { data, error } = await db.from('products').select('*');

  if (error) {
    console.error('Supabase error:', error);
    return [];
  }

  return data;
}
