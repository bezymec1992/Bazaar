import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

export default async function handler(req, res) {
  try {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
      return res.status(200).end();
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const { productId } = req.body;

    const id = Number(productId);

    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid productId' });
    }

    // fetch товаров (с кэшем)
    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.sold === true) {
      return res.status(400).json({ error: 'Product already sold' });
    }

    if (!product.price || isNaN(Number(product.price))) {
      return res.status(400).json({ error: 'Invalid product price' });
    }

    if (!product.title || !product.image) {
      return res.status(400).json({ error: 'Invalid product data' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',

      metadata: {
        productId: String(product.id),
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

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
