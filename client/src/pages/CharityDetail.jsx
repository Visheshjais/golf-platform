// src/pages/CharityDetail.jsx
import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';

// ── Donate Modal ───────────────────────────────────────────────
function DonateModal({ charity, onClose }) {
  const [amount,     setAmount]     = useState('');
  const [donorName,  setDonorName]  = useState('');
  const [donorEmail, setDonorEmail] = useState('');
  const [message,    setMessage]    = useState('');
  const [loading,    setLoading]    = useState(false);
  const [success,    setSuccess]    = useState(null);
  const [error,      setError]      = useState('');

  const presets = [5, 10, 25, 50];

  const handleDonate = async () => {
    if (!amount || isNaN(amount) || Number(amount) <= 0) {
      setError('Please enter a valid donation amount.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      const res = await api.post(`/charities/${charity._id}/donate`, {
        amount: Number(amount),
        donorName:  donorName  || 'Anonymous',
        donorEmail: donorEmail || undefined,
        message:    message    || undefined,
      });
      setSuccess(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Donation failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(5,11,24,0.88)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card"
        style={{
          width: '100%', maxWidth: '480px',
          padding: '2rem',
          animation: 'slideUp 0.22s ease',
          border: '1px solid var(--bg-border)',
        }}
      >
        {success ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🎉</div>
            <h3 style={{ marginBottom: '0.5rem', color: 'var(--lime)' }}>Thank you!</h3>
            <p style={{ marginBottom: '0.25rem' }}>
              Your £{Number(success.amount).toFixed(2)} donation to{' '}
              <strong style={{ color: 'var(--text-primary)' }}>{success.charity}</strong> has been recorded.
            </p>
            {success.note && (
              <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', fontStyle: 'italic', marginTop: '0.5rem' }}>
                "{success.note}"
              </p>
            )}
            <button className="btn btn-primary" style={{ marginTop: '1.5rem' }} onClick={onClose}>
              Close
            </button>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
              <div>
                <p className="section-label" style={{ margin: 0 }}>Independent Donation</p>
                <h3 style={{ margin: '0.3rem 0 0' }}>Support {charity.name}</h3>
              </div>
              <button
                onClick={onClose}
                style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1, padding: '0.25rem' }}
              >×</button>
            </div>

            <p style={{ fontSize: '0.88rem', marginBottom: '1.5rem' }}>
              This donation goes directly to the charity — independent of any subscription or draw entry.
            </p>

            {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}

            <div className="form-group">
              <label>Donation Amount (£)</label>
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                {presets.map(p => (
                  <button
                    key={p}
                    className={`btn btn-sm ${Number(amount) === p ? 'btn-primary' : 'btn-ghost'}`}
                    onClick={() => setAmount(String(p))}
                    style={{ minWidth: '56px' }}
                  >
                    £{p}
                  </button>
                ))}
              </div>
              <input
                type="number"
                min="1"
                step="0.01"
                placeholder="Or enter a custom amount…"
                value={amount}
                onChange={e => setAmount(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Your Name <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
              <input
                type="text"
                placeholder="Anonymous"
                value={donorName}
                onChange={e => setDonorName(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Email <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional — for receipt)</span></label>
              <input
                type="email"
                placeholder="you@example.com"
                value={donorEmail}
                onChange={e => setDonorEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label>Message <span style={{ color: 'var(--text-muted)', fontWeight: 400, textTransform: 'none' }}>(optional)</span></label>
              <textarea
                rows={3}
                placeholder="Leave a message for the charity…"
                value={message}
                onChange={e => setMessage(e.target.value)}
                style={{ resize: 'vertical' }}
              />
            </div>

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                onClick={handleDonate}
                disabled={loading}
              >
                {loading ? 'Processing…' : `Donate${amount ? ` £${Number(amount || 0).toFixed(2)}` : ''}`}
              </button>
              <button className="btn btn-ghost" onClick={onClose} disabled={loading}>Cancel</button>
            </div>

            <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '1rem', textAlign: 'center' }}>
              🔒 Payments handled securely via Stripe
            </p>
          </>
        )}
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────
export default function CharityDetail() {
  const { id }     = useParams();
  const [charity,    setCharity]    = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [showDonate, setShowDonate] = useState(false);

  useEffect(() => {
    api.get(`/charities/${id}`)
      .then(r => setCharity(r.data.charity))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="spinner" style={{ marginTop: '4rem' }} />;
  if (!charity) return (
    <div className="container" style={{ padding: '4rem 1.5rem' }}>
      <h3>Charity not found.</h3>
      <Link to="/charities" className="btn btn-ghost" style={{ marginTop: '1rem' }}>← Back</Link>
    </div>
  );

  return (
    <>
      {showDonate && <DonateModal charity={charity} onClose={() => setShowDonate(false)} />}

      <div style={{ padding: '3rem 0 6rem' }}>
        <div className="container" style={{ maxWidth: '760px' }}>
          <Link to="/charities" style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>← All Charities</Link>

          {charity.bannerUrl && (
            <img
              src={charity.bannerUrl}
              alt={charity.name}
              style={{ width: '100%', height: '220px', objectFit: 'cover', borderRadius: 'var(--radius-lg)', margin: '1.5rem 0' }}
            />
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', margin: '2rem 0' }}>
            {charity.logoUrl && (
              <img src={charity.logoUrl} alt="" style={{ width: '64px', height: '64px', borderRadius: 'var(--radius-sm)', objectFit: 'cover' }} />
            )}
            <div>
              {charity.isFeatured && <span className="badge badge-lime" style={{ marginBottom: '0.5rem', display: 'inline-block' }}>Featured</span>}
              <h2 style={{ margin: 0 }}>{charity.name}</h2>
            </div>
          </div>

          <p style={{ fontSize: '1rem', lineHeight: '1.8', marginBottom: '2rem' }}>{charity.description}</p>

          <div style={{ display: 'flex', gap: '2rem', marginBottom: '2.5rem', flexWrap: 'wrap' }}>
            {[
              { label: 'Supporters',    val: charity.subscriberCount },
              { label: 'Total donated', val: `£${charity.totalDonated?.toFixed(2) || '0.00'}` },
            ].map(s => (
              <div key={s.label} className="card" style={{ padding: '1rem 1.5rem', minWidth: '160px' }}>
                <p style={{ fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', color: 'var(--text-muted)', margin: '0 0 0.25rem' }}>{s.label}</p>
                <p style={{ fontFamily: 'Syne,sans-serif', fontSize: '1.5rem', fontWeight: '800', color: 'var(--lime)', margin: 0 }}>{s.val}</p>
              </div>
            ))}
          </div>

          {charity.events?.length > 0 && (
            <>
              <h3 style={{ marginBottom: '1.25rem' }}>Upcoming Events</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2.5rem' }}>
                {charity.events.map(ev => (
                  <div className="card" key={ev._id} style={{ padding: '1.25rem' }}>
                    <h4 style={{ margin: '0 0 0.4rem' }}>{ev.title}</h4>
                    <p style={{ fontSize: '0.85rem', margin: '0 0 0.25rem' }}>{ev.description}</p>
                    <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                      {new Date(ev.date).toLocaleDateString()} · {ev.location}
                    </span>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* CTAs */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            <button
              className="btn btn-primary btn-lg"
              onClick={() => setShowDonate(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
            >
              💛 Donate Directly
            </button>
            <Link to="/subscribe" className="btn btn-outline">
              Support via Subscription →
            </Link>
          </div>

          <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
            Direct donations go 100% to this charity. Subscribers also enter the monthly prize draw.
          </p>
        </div>
      </div>
    </>
  );
}
