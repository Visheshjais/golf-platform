// src/pages/Subscribe.jsx
// Plan selection + Stripe checkout redirect
import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Subscribe.css';

export default function Subscribe() {
  const { user, refreshUser } = useAuth();
  const [params]    = useSearchParams();
  const [plan, setPlan]       = useState('monthly');
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');

  // If user just completed checkout, refresh their subscription status
  useEffect(() => {
    if (params.get('subscribed') === 'true') {
      refreshUser();
    }
  }, []);

  const handleSubscribe = async () => {
    setError('');
    setLoading(true);
    try {
      // Ask server to create a Stripe checkout session
      const res = await api.post('/subscriptions/create-checkout', { plan });
      // Redirect to Stripe-hosted payment page
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to start checkout. Please try again.');
      setLoading(false);
    }
  };

  // If user already has active subscription
  if (user?.subscriptionStatus === 'active') {
    return (
      <div className="subscribe-page">
        <div className="subscribe-card card fade-up">
          <p className="section-label">Subscription</p>
          <h2>You're all set ✓</h2>
          <p>You have an active <strong>{user.subscriptionPlan}</strong> subscription.</p>
          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <Link to="/dashboard" className="btn btn-primary">Go to Dashboard</Link>
            <ManageBillingBtn />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="subscribe-page">
      <div className="subscribe-inner container">
        <div className="subscribe-header fade-up">
          <p className="section-label">Choose your plan</p>
          <h2>Subscribe &amp; Start Playing</h2>
          <p>Your subscription enters you into monthly draws and funds your chosen charity.</p>
        </div>

        {params.get('cancelled') === 'true' && (
          <div className="alert alert-info">Checkout was cancelled — no charge was made.</div>
        )}
        {error && <div className="alert alert-error">{error}</div>}

        {/* Plan toggle */}
        <div className="plan-toggle fade-up">
          <button
            className={`plan-btn ${plan === 'monthly' ? 'plan-btn--active' : ''}`}
            onClick={() => setPlan('monthly')}
          >
            Monthly
          </button>
          <button
            className={`plan-btn ${plan === 'yearly' ? 'plan-btn--active' : ''}`}
            onClick={() => setPlan('yearly')}
          >
            Yearly <span className="plan-save">Save 25%</span>
          </button>
        </div>

        {/* Plan cards */}
        <div className="plan-cards fade-up">
          {/* Monthly */}
          <div
            className={`plan-card card ${plan === 'monthly' ? 'plan-card--selected' : ''}`}
            onClick={() => setPlan('monthly')}
          >
            <h3>Monthly</h3>
            <div className="plan-price">£9.99<span>/month</span></div>
            <ul className="plan-features">
              <li>✓ Monthly draw entry</li>
              <li>✓ 5-score tracking</li>
              <li>✓ Charity contribution</li>
              <li>✓ Cancel anytime</li>
            </ul>
          </div>

          {/* Yearly */}
          <div
            className={`plan-card card ${plan === 'yearly' ? 'plan-card--selected' : ''}`}
            onClick={() => setPlan('yearly')}
          >
            <div className="plan-badge">Best Value</div>
            <h3>Yearly</h3>
            <div className="plan-price">£89.99<span>/year</span></div>
            <p className="plan-equiv">Just £7.50/month</p>
            <ul className="plan-features">
              <li>✓ Monthly draw entry</li>
              <li>✓ 5-score tracking</li>
              <li>✓ Charity contribution</li>
              <li>✓ Priority support</li>
            </ul>
          </div>
        </div>

        <div className="subscribe-action fade-up">
          <button className="btn btn-primary btn-lg" onClick={handleSubscribe} disabled={loading}>
            {loading ? 'Redirecting to payment…' : `Subscribe — ${plan === 'yearly' ? '£89.99/yr' : '£9.99/mo'}`}
          </button>
          <p className="subscribe-note">
            Payments handled securely by Stripe. You'll be redirected to complete your purchase.
          </p>
        </div>
      </div>
    </div>
  );
}

// Small sub-component for managing existing billing
function ManageBillingBtn() {
  const [loading, setLoading] = useState(false);
  const open = async () => {
    setLoading(true);
    try {
      const res = await api.post('/subscriptions/portal');
      window.location.href = res.data.url;
    } catch {
      setLoading(false);
    }
  };
  return (
    <button className="btn btn-ghost" onClick={open} disabled={loading}>
      {loading ? 'Opening…' : 'Manage Billing'}
    </button>
  );
}
