require('dotenv').config();

const express = require('express');
const cors = require('cors');
const stripe = require('stripe')(process.env.STRIPE_SECRET);

const app = express();
app.use(cors());
app.use(express.json());

// 👇 для fetch в Node
const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

// =====================
// 🔥 КЭШ
// =====================
let cachedProducts = null;
let lastFetchTime = 0;

async function getProducts() {
  const now = Date.now();

  // ⏱ кэш на 10 минут
  if (cachedProducts && now - lastFetchTime < 10 * 60 * 1000) {
    console.log('📦 using cache');
    return cachedProducts;
  }

  console.log('🌐 fetching from API');

  const response = await fetch('https://sheetdb.io/api/v1/jqeo93r4g20ic');
  const data = await response.json();

  cachedProducts = data;
  lastFetchTime = now;

  return data;
}

// =====================
// 💳 STRIPE
// =====================
app.post('/create-checkout-session', async (req, res) => {
  try {
    const { productId } = req.body;

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
            },
            unit_amount: Math.round(Number(product.price) * 100),
          },
          quantity: 1,
        },
      ],
      success_url: 'https://bezymec1992.github.io/Bazaar/success.html',
      cancel_url: 'https://твой-username.github.io/Bazaar/product.html?id=' + productId,
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

// =====================
// 🚀 START SERVER
// =====================
const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log('Server running on port ' + PORT);
});
