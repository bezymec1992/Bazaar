require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const stripe = require('stripe')(process.env.STRIPE_SECRET);

const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));

app.post('/create-checkout-session', async (req, res) => {
  const { productId } = req.body;

  // берём товары из твоего API
  const response = await fetch('https://sheetdb.io/api/v1/jqeo93r4g20ic');
  const products = await response.json();

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
    success_url: 'http://localhost:5500/success.html',
    cancel_url: 'http://localhost:5500/product.html?id=' + productId,
  });

  res.json({ url: session.url });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log('Server running on port ' + PORT));
