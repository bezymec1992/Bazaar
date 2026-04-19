import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET);

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_KEY);

const DEFAULT_ORIGINS = 'https://bezymec1992.github.io,http://localhost:5500,http://127.0.0.1:5500';

function getAllowedOrigins() {
  const raw = process.env.CHECKOUT_ALLOWED_ORIGINS || DEFAULT_ORIGINS;
  return raw
    .split(',')
    .map(s => s.trim())
    .filter(Boolean);
}

function setCors(req, res) {
  const origin = req.headers.origin;
  const allowed = getAllowedOrigins();
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
}

export default async function handler(req, res) {
  try {
    setCors(req, res);

    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    if (req.method !== 'POST') {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const body = req.body && typeof req.body === 'object' ? req.body : {};
    const { productId } = body;

    const id = Number(productId);

    if (!Number.isFinite(id) || !Number.isInteger(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid productId' });
    }

    const { data: product, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .eq('sold', false)
      .maybeSingle();

    if (error) {
      console.error('Checkout product fetch:', error);
      return res.status(500).json({ error: 'Server error' });
    }

    if (!product) {
      const { data: row, error: err2 } = await supabase.from('products').select('id,sold').eq('id', id).maybeSingle();
      if (err2) {
        console.error('Checkout product lookup:', err2);
        return res.status(500).json({ error: 'Server error' });
      }
      if (!row) {
        return res.status(404).json({ error: 'Product not found' });
      }
      const sold = row.sold === true || row.sold === 'true';
      if (sold) {
        return res.status(409).json({ error: 'Product already sold' });
      }
      return res.status(404).json({ error: 'Product not found' });
    }

    const priceNum = Number(product.price);
    if (!Number.isFinite(priceNum) || priceNum <= 0) {
      return res.status(400).json({ error: 'Invalid product price' });
    }

    const unitAmount = Math.round(priceNum * 100);
    if (!Number.isFinite(unitAmount) || unitAmount <= 0 || unitAmount > 99999999) {
      return res.status(400).json({ error: 'Invalid product price' });
    }

    if (!product.title || !product.image) {
      return res.status(400).json({ error: 'Invalid product data' });
    }

    const session = await stripe.checkout.sessions.create({
      mode: 'payment',

      metadata: {
        productId: String(product.id),
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
            unit_amount: unitAmount,
          },
          quantity: 1,
        },
      ],
      // success_url: 'https://bezymec1992.github.io/Bazaar/success.html',
      success_url: `https://bezymec1992.github.io/Bazaar/success.html?productId=${encodeURIComponent(String(product.id))}`,
      cancel_url:
        'https://bezymec1992.github.io/Bazaar/product.html?id=' + encodeURIComponent(String(product.id)),
    });

    res.status(200).json({ url: session.url });
  } catch (err) {
    console.error('Handler error:', err);
    res.status(500).json({ error: 'Server error' });
  }
}
