const SUPABASE_URL = 'https://oicwhdcmfkckprrnzctn.supabase.co';
const SUPABASE_KEY = 'sb_publishable_YebYXtFgqG3G0sGJH8VAUA_G-ZrlSL-';

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

async function getProducts() {
  const { data, error } = await db.from('products').select('*');

  if (error) {
    console.error('Supabase error:', error);
    throw new Error('Failed to fetch products');
  }

  return data;
}
