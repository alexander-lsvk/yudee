import { PRODUCTS } from '@/stripe-config';
import { supabase } from '@/lib/supabase';

export async function createCheckoutSession(priceId: string, mode: 'payment' | 'subscription') {
  try {
    console.log('Creating checkout session...', { priceId, mode });
    
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    if (sessionError) {
      console.error('Auth session error:', sessionError);
      throw sessionError;
    }
    
    if (!session) {
      console.error('No authenticated session found');
      throw new Error('No authenticated user');
    }

    console.log('Making request to checkout endpoint...');
    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/stripe-checkout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({
        price_id: priceId,
        mode,
        success_url: `${window.location.origin}/`,
        cancel_url: `${window.location.origin}/`
      }),
    });

    console.log('Checkout response status:', response.status);
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Checkout error response:', errorData);
      throw new Error(errorData.error || 'Failed to create checkout session');
    }

    const data = await response.json();
    console.log('Checkout response data:', data);

    if (!data.url) {
      console.error('No checkout URL in response');
      throw new Error('No checkout URL returned');
    }

    return data.url;
  } catch (error) {
    console.error('Error in createCheckoutSession:', error);
    throw error;
  }
}

export async function createCustomerPortalSession() {
  return 'https://billing.stripe.com/p/login/aEUcP91FMd8u75K7ss';
}

export async function startPremiumSubscription() {
  try {
    console.log('Starting premium subscription...');
    console.log('Using product config:', PRODUCTS.PREMIUM);
    
    const checkoutUrl = await createCheckoutSession(
      PRODUCTS.PREMIUM.priceId,
      PRODUCTS.PREMIUM.mode
    );
    
    console.log('Redirecting to checkout URL:', checkoutUrl);
    window.location.href = checkoutUrl;
  } catch (error) {
    console.error('Error in startPremiumSubscription:', error);
    throw error;
  }
}