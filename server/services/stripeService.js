// ============================================================
// services/stripeService.js
// All Stripe API interactions live here — keeps controllers clean
// ============================================================

const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

/**
 * createCustomer — creates a Stripe customer for a new subscriber
 * @param {string} email
 * @param {string} name
 * @returns {Stripe.Customer}
 */
const createCustomer = async (email, name) => {
  return stripe.customers.create({ email, name });
};

/**
 * createCheckoutSession — builds a Stripe-hosted checkout page
 * The user is redirected here to enter card details.
 * On success, Stripe redirects back to successUrl.
 *
 * @param {string} customerId      - Stripe customer ID
 * @param {string} priceId         - Stripe Price ID (monthly or yearly)
 * @param {string} userId          - our MongoDB user _id (stored in metadata)
 * @returns {Stripe.Checkout.Session}
 */
const createCheckoutSession = async (customerId, priceId, userId) => {
  return stripe.checkout.sessions.create({
    customer:   customerId,
    mode:       'subscription',             // recurring payment
    line_items: [{ price: priceId, quantity: 1 }],
    metadata:   { userId: userId.toString() }, // so webhook can find our user
    success_url: `${process.env.CLIENT_URL}/dashboard?subscribed=true`,
    cancel_url:  `${process.env.CLIENT_URL}/subscribe?cancelled=true`,
    // Allow promotion codes (discount codes)
    allow_promotion_codes: true,
  });
};

/**
 * createPortalSession — Stripe Customer Portal for managing subscriptions
 * Users can update card details, cancel, etc. without us building that UI.
 *
 * @param {string} customerId
 * @returns {Stripe.BillingPortal.Session}
 */
const createPortalSession = async (customerId) => {
  return stripe.billingPortal.sessions.create({
    customer:   customerId,
    return_url: `${process.env.CLIENT_URL}/dashboard`,
  });
};

/**
 * cancelSubscription — immediately cancels at period end
 * @param {string} subscriptionId
 */
const cancelSubscription = async (subscriptionId) => {
  return stripe.subscriptions.update(subscriptionId, {
    cancel_at_period_end: true, // cancels at end of current billing cycle
  });
};

/**
 * constructWebhookEvent — verifies Stripe's webhook signature
 * This is critical for security — without this, anyone could fake webhook calls
 *
 * @param {Buffer} rawBody     - raw request body (must be Buffer, not parsed JSON)
 * @param {string} signature   - stripe-signature header
 * @returns {Stripe.Event}
 */
const constructWebhookEvent = (rawBody, signature) => {
  return stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );
};

/**
 * getSubscription — fetch full subscription details from Stripe
 * @param {string} subscriptionId
 */
const getSubscription = async (subscriptionId) => {
  return stripe.subscriptions.retrieve(subscriptionId);
};

module.exports = {
  createCustomer,
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
  constructWebhookEvent,
  getSubscription,
};
