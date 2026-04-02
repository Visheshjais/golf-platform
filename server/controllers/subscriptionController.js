// ============================================================
// controllers/subscriptionController.js
// Handles Stripe checkout, portal, and webhook event processing
// ============================================================

const User          = require('../models/User');
const stripeService = require('../services/stripeService');

// ─── POST /api/subscriptions/create-checkout ──────────────────
// Creates a Stripe Checkout Session and returns the redirect URL
const createCheckout = async (req, res) => {
  try {
    const { plan } = req.body; // 'monthly' or 'yearly'
    const user     = await User.findById(req.user._id);

    if (!user) return res.status(404).json({ message: 'User not found' });

    // Choose the correct Stripe Price ID based on selected plan
    const priceId = plan === 'yearly'
      ? process.env.STRIPE_YEARLY_PRICE_ID
      : process.env.STRIPE_MONTHLY_PRICE_ID;

    if (!priceId) {
      return res.status(500).json({ message: 'Stripe price ID not configured' });
    }

    // Create Stripe customer if user doesn't have one yet
    if (!user.stripeCustomerId) {
      const customer = await stripeService.createCustomer(user.email, user.name);
      user.stripeCustomerId = customer.id;
      await user.save();
    }

    // Create the hosted checkout session
    const session = await stripeService.createCheckoutSession(
      user.stripeCustomerId,
      priceId,
      user._id
    );

    res.json({ url: session.url }); // frontend redirects to this URL
  } catch (error) {
    console.error('Create checkout error:', error);
    res.status(500).json({ message: 'Failed to create checkout session' });
  }
};

// ─── POST /api/subscriptions/portal ───────────────────────────
// Opens Stripe Customer Portal for managing subscription
const createPortal = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);

    if (!user.stripeCustomerId) {
      return res.status(400).json({ message: 'No Stripe customer found' });
    }

    const session = await stripeService.createPortalSession(user.stripeCustomerId);
    res.json({ url: session.url });
  } catch (error) {
    console.error('Portal error:', error);
    res.status(500).json({ message: 'Failed to open billing portal' });
  }
};

// ─── GET /api/subscriptions/status ───────────────────────────
// Returns current subscription status for the logged-in user
const getStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select(
      'subscriptionStatus subscriptionPlan subscriptionRenewalDate'
    );
    res.json({
      subscriptionStatus:      user.subscriptionStatus,
      subscriptionPlan:        user.subscriptionPlan,
      subscriptionRenewalDate: user.subscriptionRenewalDate,
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to get subscription status' });
  }
};

// ─── POST /api/subscriptions/webhook ──────────────────────────
// Stripe sends events here (payment success, cancellation, etc.)
// IMPORTANT: This route uses raw body parser (configured in server.js)
const handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    // Verify the event came from Stripe
    event = stripeService.constructWebhookEvent(req.body, sig);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).json({ message: `Webhook Error: ${err.message}` });
  }

  try {
    switch (event.type) {

      // ─ Checkout completed = new subscription created ─────
      case 'checkout.session.completed': {
        const session = event.data.object;

        // ✅ SAFE: check subscription exists
        if (!session.subscription) {
          console.log("⚠️ No subscription found (one-time payment?)");
          return res.sendStatus(200);
        }

        const userId      = session.metadata.userId;
        const stripeSubId = session.subscription;

        // Fetch full subscription details
        const sub = await stripeService.getSubscription(stripeSubId);

        const priceId = sub.items.data[0].price.id;
        const plan = priceId === process.env.STRIPE_YEARLY_PRICE_ID ? 'yearly' : 'monthly';

        await User.findByIdAndUpdate(userId, {
          stripeSubscriptionId: stripeSubId,
          subscriptionStatus:   'active',
          subscriptionPlan:     plan,
          subscriptionRenewalDate: new Date(sub.current_period_end * 1000),
        });

        console.log(`✅ Subscription activated for user ${userId}`);
        break;
      }

      // ─ Subscription renewed successfully ─────────────────
      // FIX: Skip first invoice — already handled by checkout.session.completed
      // Without this guard, the first payment triggers a duplicate DB update
      case 'invoice.payment_succeeded': {
        const invoice = event.data.object;

        // Skip the initial invoice fired when subscription is first created
        if (invoice.billing_reason === 'subscription_create') break;

        if (invoice.subscription) {
          const sub = await stripeService.getSubscription(invoice.subscription);

          await User.findOneAndUpdate(
            { stripeCustomerId: invoice.customer },
            {
              subscriptionStatus:      'active',
              subscriptionRenewalDate: new Date(sub.current_period_end * 1000),
            }
          );
        }
        break;
      }

      // ─ Payment failed ─────
      case 'invoice.payment_failed': {
        const failedInvoice = event.data.object;
        await User.findOneAndUpdate(
          { stripeCustomerId: failedInvoice.customer },
          { subscriptionStatus: 'past_due' }
        );
        console.log(`⚠️ Payment failed for customer ${failedInvoice.customer}`);
        break;
      }

      // ─ Subscription cancelled ─────────────────
      case 'customer.subscription.deleted': {
        const cancelledSub = event.data.object;
        await User.findOneAndUpdate(
          { stripeSubscriptionId: cancelledSub.id },
          {
            subscriptionStatus:       'inactive',
            subscriptionPlan:         null,
            subscriptionRenewalDate:  null,
          }
        );
        console.log(`❌ Subscription cancelled: ${cancelledSub.id}`);
        break;
      }

      // ─ Subscription updated ────────────────
      case 'customer.subscription.updated': {
        const updatedSub = event.data.object;
        const priceId = updatedSub.items.data[0].price.id;
        const plan = priceId === process.env.STRIPE_YEARLY_PRICE_ID ? 'yearly' : 'monthly';

        await User.findOneAndUpdate(
          { stripeSubscriptionId: updatedSub.id },
          {
            subscriptionStatus:      updatedSub.status,
            subscriptionPlan:        plan,
            subscriptionRenewalDate: new Date(updatedSub.current_period_end * 1000),
          }
        );
        break;
      }

      // ─ Intentionally ignored — informational events fired automatically by Stripe ──
      case 'product.created':
      case 'price.created':
      case 'payment_intent.created':
      case 'payment_intent.succeeded':
      case 'charge.succeeded':
      case 'charge.updated':
        break; // acknowledged, no action needed

      default:
        console.log(`Unhandled Stripe event: ${event.type}`);
    }

    // Always acknowledge receipt
    res.json({ received: true });

  } catch (error) {
    console.error('Webhook processing error:', error);
    res.json({ received: true, error: error.message });
  }
};

module.exports = { createCheckout, createPortal, getStatus, handleWebhook };