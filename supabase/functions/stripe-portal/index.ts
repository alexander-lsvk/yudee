import 'jsr:@supabase/functions-js/edge-runtime.d.ts';
import Stripe from 'npm:stripe@17.7.0';
import { createClient } from 'npm:@supabase/supabase-js@2.49.1';

const supabase = createClient(Deno.env.get('SUPABASE_URL') ?? '', Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '');
const stripeSecret = Deno.env.get('STRIPE_SECRET_KEY')!;
const stripe = new Stripe(stripeSecret, {
  appInfo: {
    name: 'Bolt Integration',
    version: '1.0.0',
  },
});

function corsResponse(body: string | object | null, status = 200) {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': '*',
  };

  if (status === 204) {
    return new Response(null, { status, headers });
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });
}

Deno.serve(async (req) => {
  try {
    if (req.method === 'OPTIONS') {
      return corsResponse({}, 204);
    }

    if (req.method !== 'POST') {
      return corsResponse({ error: 'Method not allowed' }, 405);
    }

    // Get origin for return URL
    const origin = req.headers.get('Origin');
    if (!origin) {
      return corsResponse({ error: 'Missing Origin header' }, 400);
    }

    // Validate auth header exists
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return corsResponse({ error: 'Missing authorization header' }, 401);
    }

    const token = authHeader.replace('Bearer ', '');
    const {
      data: { user },
      error: getUserError,
    } = await supabase.auth.getUser(token);

    if (getUserError) {
      console.error('Auth error:', getUserError);
      return corsResponse({ error: 'Failed to authenticate user' }, 401);
    }

    if (!user) {
      return corsResponse({ error: 'User not found' }, 404);
    }

    // First, get the customer ID from stripe_customers
    const { data: customerData, error: getCustomerError } = await supabase
      .from('stripe_customers')
      .select('customer_id')
      .eq('user_id', user.id)
      .is('deleted_at', null)
      .single();

    if (getCustomerError) {
      console.error('Database error (customer):', getCustomerError);
      return corsResponse({ 
        error: 'Customer record not found. Please ensure you have an active subscription.' 
      }, 400);
    }

    if (!customerData?.customer_id) {
      return corsResponse({ 
        error: 'Invalid customer ID. Please contact support.' 
      }, 400);
    }

    // Then, get the subscription information from stripe_user_subscriptions view
    const { data: subscriptionData, error: getSubscriptionError } = await supabase
      .from('stripe_user_subscriptions')
      .select('subscription_id, subscription_status')
      .eq('customer_id', customerData.customer_id)
      .single();

    if (getSubscriptionError) {
      console.error('Database error (subscription):', getSubscriptionError);
      return corsResponse({ 
        error: 'Failed to retrieve subscription information. Please try again later.' 
      }, 400);
    }

    if (!subscriptionData?.subscription_id) {
      return corsResponse({ 
        error: 'No active subscription found. Please subscribe to access premium features.' 
      }, 400);
    }

    // Allow both active and trialing subscriptions to access the portal
    if (!['active', 'trialing'].includes(subscriptionData.subscription_status)) {
      return corsResponse({ 
        error: `Your subscription status is ${subscriptionData.subscription_status}. Only active or trialing subscriptions can access the portal.` 
      }, 400);
    }

    try {
      // Verify the customer exists in Stripe
      const stripeCustomer = await stripe.customers.retrieve(customerData.customer_id);
      
      if (!stripeCustomer || stripeCustomer.deleted) {
        console.error('Stripe customer not found or deleted:', customerData.customer_id);
        return corsResponse({ 
          error: 'Your customer record could not be found. Please contact support.' 
        }, 400);
      }

      // Create portal session with proper return URL
      const session = await stripe.billingPortal.sessions.create({
        customer: customerData.customer_id,
        return_url: `${origin}/`,
        configuration: 'bpc_1RF8ZrGIpkTIMtQTXXXXXXXX' // Replace with your portal configuration ID
      });

      if (!session?.url) {
        console.error('Portal session created without URL');
        return corsResponse({
          error: 'Failed to create portal session. Please try again later.'
        }, 500);
      }

      return corsResponse({ url: session.url });
    } catch (stripeError: any) {
      console.error('Stripe error:', stripeError);
      
      // Handle specific Stripe errors
      if (stripeError.type === 'StripeInvalidRequestError') {
        return corsResponse({ 
          error: 'Invalid subscription information. Please contact support.' 
        }, 400);
      }

      // Handle rate limiting
      if (stripeError.type === 'StripeRateLimitError') {
        return corsResponse({
          error: 'Too many requests. Please try again in a few minutes.'
        }, 429);
      }

      // Handle authentication errors
      if (stripeError.type === 'StripeAuthenticationError') {
        return corsResponse({
          error: 'Authentication failed. Please contact support.'
        }, 401);
      }

      // Handle API errors
      if (stripeError.type === 'StripeAPIError') {
        return corsResponse({
          error: 'Stripe service is temporarily unavailable. Please try again later.'
        }, 503);
      }

      // Handle connection errors
      if (stripeError.type === 'StripeConnectionError') {
        return corsResponse({
          error: 'Could not connect to Stripe. Please try again later.'
        }, 503);
      }

      // Handle portal session creation errors
      if (stripeError.message.includes('portal session')) {
        return corsResponse({ 
          error: 'Unable to create customer portal session. Please try again later.' 
        }, 500);
      }
      
      return corsResponse({ 
        error: 'An unexpected error occurred. Please try again later.' 
      }, 500);
    }
  } catch (error: any) {
    console.error('Portal error:', error);
    return corsResponse({ 
      error: 'Failed to create customer portal session. Please try again later.'
    }, 500);
  }
});