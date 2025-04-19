/*
  # Add trial period tracking

  1. Changes
    - Add trial_end field to stripe_subscriptions table
    - Update subscription view to include trial information
*/

-- Add trial_end field to stripe_subscriptions if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'stripe_subscriptions' 
        AND column_name = 'trial_end'
    ) THEN
        ALTER TABLE stripe_subscriptions
        ADD COLUMN trial_end bigint DEFAULT NULL;
    END IF;
END $$;

-- Drop the existing view
DROP VIEW IF EXISTS stripe_user_subscriptions;

-- Recreate the view with trial information
CREATE VIEW stripe_user_subscriptions WITH (security_invoker = true) AS
SELECT
    c.customer_id,
    s.subscription_id,
    s.status as subscription_status,
    s.price_id,
    s.current_period_start,
    s.current_period_end,
    s.trial_end,
    s.cancel_at_period_end,
    s.payment_method_brand,
    s.payment_method_last4
FROM stripe_customers c
LEFT JOIN stripe_subscriptions s ON c.customer_id = s.customer_id
WHERE c.user_id = auth.uid()
AND c.deleted_at IS NULL
AND s.deleted_at IS NULL;