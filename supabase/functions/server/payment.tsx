import { Context } from "npm:hono";

export async function createPaymentIntent(c: Context) {
  try {
    const { amount, currency, description } = await c.req.json();

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return c.json({ error: 'Stripe API key not configured' }, 500);
    }

    const response = await fetch('https://api.stripe.com/v1/payment_intents', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        amount: amount.toString(),
        currency: currency || 'usd',
        description: description || 'MarketSecure Purchase',
        'automatic_payment_methods[enabled]': 'true',
      }),
    });

    const paymentIntent = await response.json();

    if (!response.ok) {
      console.log('Stripe error creating payment intent:', paymentIntent);
      return c.json({ error: paymentIntent.error?.message || 'Payment failed' }, 400);
    }

    return c.json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
    });
  } catch (error) {
    console.log('Error creating payment intent:', error);
    return c.json({ error: 'Failed to create payment intent' }, 500);
  }
}

export async function confirmPayment(c: Context) {
  try {
    const { paymentIntentId } = await c.req.json();

    const stripeKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeKey) {
      return c.json({ error: 'Stripe API key not configured' }, 500);
    }

    const response = await fetch(`https://api.stripe.com/v1/payment_intents/${paymentIntentId}`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${stripeKey}`,
      },
    });

    const paymentIntent = await response.json();

    if (!response.ok) {
      console.log('Stripe error confirming payment:', paymentIntent);
      return c.json({ error: 'Payment confirmation failed' }, 400);
    }

    return c.json({
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
    });
  } catch (error) {
    console.log('Error confirming payment:', error);
    return c.json({ error: 'Failed to confirm payment' }, 500);
  }
}
