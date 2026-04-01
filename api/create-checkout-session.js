let cachedProducts = null;
let lastFetchTime = 0;
const CACHE_TTL = 1000 * 60 * 5; // 5 минут

async function getProducts() {
  try {
    const now = Date.now();

    // если кэш есть и не устарел
    if (cachedProducts && now - lastFetchTime < CACHE_TTL) {
      return cachedProducts;
    }

    const response = await fetch('https://sheetdb.io/api/v1/jqeo93r4g20ic');

    if (!response.ok) {
      throw new Error('SheetDB error');
    }

    const products = await response.json();

    cachedProducts = products;
    lastFetchTime = now;

    return products;
  } catch (err) {
    console.error('Fetch products error:', err);

    // fallback — если есть старый кэш
    if (cachedProducts) return cachedProducts;

    throw err;
  }
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const stripe = require('stripe')(process.env.STRIPE_SECRET);

  const { productId } = req.body;

  // fetch товаров (с кэшем)
  const products = await getProducts();

  const product = products.find(p => p.id == productId);

  if (!product) {
    return res.status(404).json({ error: 'Product not found' });
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: product.title,
            images: [product.image],
          },
          unit_amount: Math.round(Number(product.price) * 100),
        },
        quantity: 1,
      },
    ],
    success_url: 'https://bezymec1992.github.io/Bazaar/success.html',
    cancel_url: 'https://bezymec1992.github.io/Bazaar/product.html?id=' + productId,
  });

  res.status(200).json({ url: session.url });
}
