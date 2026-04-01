let cachedProducts = null;
let lastFetchTime = 0;
let lastRequestTime = 0;
const CACHE_TTL = 1000 * 60 * 60; // 1 час

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
  try {
    // if (Date.now() - lastRequestTime < 1000) {
    //   return res.status(429).json({ error: 'Too many requests' });
    // }

    // lastRequestTime = Date.now();

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

    if (!productId || typeof productId !== 'string') {
      return res.status(400).json({ error: 'Invalid productId' });
    }

    // fetch товаров (с кэшем)
    const products = await getProducts();

    const product = products.find(p => String(p.id) === String(productId));

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (!product.price || isNaN(Number(product.price))) {
      return res.status(400).json({ error: 'Invalid product price' });
    }

    if (!product.title || !product.image) {
      return res.status(400).json({ error: 'Invalid product data' });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'payment',

      metadata: {
        productId: product.id,
        title: product.title,
        price: product.price,
        image: product.image,
      },
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

    try {
      await fetch('https://api.emailjs.com/api/v1.0/email/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          service_id: 'service_sywru66',
          template_id: 'template_grw3wfq',
          user_id: 'pkMEalN8-JDvhkW-4',
          template_params: {
            product_title: product.title,
            product_price: product.price,
            product_id: product.id,
            product_image: product.image,
          },
        }),
      });
    } catch (err) {
      console.error('Email error:', err);
      // ❗ НИЧЕГО НЕ ВОЗВРАЩАЕМ
    }

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
