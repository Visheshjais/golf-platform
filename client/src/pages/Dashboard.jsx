// src/pages/Dashboard.jsx
// User dashboard — tabbed layout:
// Tabs: Overview | My Scores | Winnings | Charity
import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import './Dashboard.css';

export default function Dashboard() {
  const { user, refreshUser } = useAuth();
  const [params, setParams]   = useSearchParams();
  const activeTab = params.get('tab') || 'overview';

  const setTab = (t) => setParams({ tab: t });

  return (
    <div className="dashboard-page">
      <div className="container">
        {/* Header */}
        <div className="dash-header">
          <div>
            <p className="section-label">Member Dashboard</p>
            <h2>Hey, {user?.name?.split(' ')[0]} 👋</h2>
          </div>
          <div className="dash-sub-status">
            <span className={`badge badge-${user?.subscriptionStatus === 'active' ? 'active' : 'inactive'}`}>
              {user?.subscriptionStatus || 'inactive'}
            </span>
            {user?.subscriptionStatus !== 'active' && (
              <Link to="/subscribe" className="btn btn-primary btn-sm">Subscribe Now</Link>
            )}
          </div>
        </div>

        {/* Tab navigation */}
        <div className="dash-tabs">
          {[
            { key: 'overview',  label: 'Overview' },
            { key: 'scores',    label: 'My Scores' },
            { key: 'winnings',  label: 'Winnings'  },
            { key: 'charity',   label: 'My Charity' },
          ].map(t => (
            <button
              key={t.key}
              className={`dash-tab ${activeTab === t.key ? 'dash-tab--active' : ''}`}
              onClick={() => setTab(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>

        {/* Tab content */}
        <div className="dash-content">
          {activeTab === 'overview'  && <OverviewTab  user={user} />}
          {activeTab === 'scores'    && <ScoresTab />}
          {activeTab === 'winnings'  && <WinningsTab />}
          {activeTab === 'charity'   && <CharityTab user={user} refreshUser={refreshUser} />}
        </div>
      </div>
    </div>
  );
}

/* ── Overview Tab ─────────────────────────────────────────── */
function OverviewTab({ user }) {
  return (
    <div className="fade-up">
      <div className="grid-4 overview-stats">
        <div className="stat-card card">
          <p className="stat-card-label">Subscription</p>
          <p className="stat-card-val">{user?.subscriptionPlan || '—'}</p>
          <p className="stat-card-sub">
            {user?.subscriptionRenewalDate
              ? `Renews ${new Date(user.subscriptionRenewalDate).toLocaleDateString()}`
              : 'No active plan'}
          </p>
        </div>
        <div className="stat-card card">
          <p className="stat-card-label">Scores Entered</p>
          <p className="stat-card-val">{user?.scores?.length || 0}/5</p>
          <p className="stat-card-sub">Stableford scores</p>
        </div>
        <div className="stat-card card">
          <p className="stat-card-label">Draws Entered</p>
          <p className="stat-card-val">{user?.drawsEntered?.length || 0}</p>
          <p className="stat-card-sub">Total participations</p>
        </div>
        <div className="stat-card card">
          <p className="stat-card-label">Charity %</p>
          <p className="stat-card-val">{user?.charityContributionPercent || 10}%</p>
          <p className="stat-card-sub">Of your subscription</p>
        </div>
      </div>

      {user?.subscriptionStatus !== 'active' && (
        <div className="alert alert-info" style={{ marginTop: '2rem' }}>
          <strong>Subscribe to unlock draws and score tracking.</strong>{' '}
          <Link to="/subscribe">Choose a plan →</Link>
        </div>
      )}
    </div>
  );
}

/* ── Scores Tab ───────────────────────────────────────────── */
function ScoresTab() {
  const [scores, setScores]   = useState([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm]       = useState({ points: '', date: '' });
  const [msg, setMsg]         = useState('');
  const [error, setError]     = useState('');

  const fetchScores = () => {
    api.get('/scores').then(r => setScores(r.data.scores)).catch(() => {}).finally(() => setLoading(false));
  };

  useEffect(() => { fetchScores(); }, []);

  const addScore = async e => {
    e.preventDefault();
    setMsg(''); setError('');
    try {
      const res = await api.post('/scores', form);
      setScores(res.data.scores);
      setForm({ points: '', date: '' });
      setMsg('Score added!');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add score');
    }
  };

  const deleteScore = async (id) => {
    try {
      const res = await api.delete(`/scores/${id}`);
      setScores(res.data.scores);
    } catch { }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-up">
      <div className="scores-layout">
        {/* Score entry form */}
        <div className="score-form-card card">
          <h4>Add Score</h4>
          <p>Stableford format · Range: 1–45</p>
          {msg   && <div className="alert alert-success">{msg}</div>}
          {error && <div className="alert alert-error">{error}</div>}
          <form onSubmit={addScore}>
            <div className="form-group">
              <label>Stableford Points</label>
              <input type="number" min="1" max="45" placeholder="e.g. 36"
                value={form.points} onChange={e => setForm({...form, points: e.target.value})} required />
            </div>
            <div className="form-group">
              <label>Date Played</label>
              <input type="date" value={form.date}
                onChange={e => setForm({...form, date: e.target.value})} required />
            </div>
            <button className="btn btn-primary w-full" type="submit">Add Score</button>
          </form>
          <p className="score-note">
            Only your last 5 scores are kept. A new score replaces the oldest automatically.
          </p>
        </div>

        {/* Score list */}
        <div className="score-list">
          <h4>My Last 5 Scores</h4>
          {scores.length === 0 ? (
            <div className="empty-state card">
              <p>No scores yet — add your first one!</p>
            </div>
          ) : (
            <div className="score-items">
              {scores.map((s, i) => (
                <div className="score-item card" key={s._id}>
                  <div className="score-item-left">
                    <span className="score-rank">#{i + 1}</span>
                    <div>
                      <span className="score-pts">{s.points} pts</span>
                      <span className="score-date">{new Date(s.date).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <button className="btn btn-danger btn-sm" onClick={() => deleteScore(s._id)}>Remove</button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Winnings Tab ─────────────────────────────────────────── */
function WinningsTab() {
  const [winners, setWinners] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/winners/my').then(r => setWinners(r.data.winners)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  const submitProof = async (winnerId, proofUrl) => {
    try {
      await api.post(`/winners/${winnerId}/proof`, { proofUrl });
      const res = await api.get('/winners/my');
      setWinners(res.data.winners);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to submit proof');
    }
  };

  if (loading) return <div className="spinner" />;

  return (
    <div className="fade-up">
      <h4 style={{ marginBottom: '1.5rem' }}>My Winnings</h4>
      {winners.length === 0 ? (
        <div className="empty-state card">
          <p>No winnings yet. Keep entering draws!</p>
        </div>
      ) : (
        <div className="winner-items">
          {winners.map(w => (
            <div className="winner-item card" key={w._id}>
              <div className="winner-header">
                <div>
                  <h4>£{w.prizeAmount} — {w.matchCount}-Number Match</h4>
                  <p>Draw: {w.draw?.drawMonth}/{w.draw?.drawYear}</p>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span className={`badge badge-${w.verificationStatus === 'approved' ? 'active' : w.verificationStatus === 'rejected' ? 'rejected' : 'pending'}`}>
                    {w.verificationStatus.replace('_', ' ')}
                  </span>
                  <span className={`badge badge-${w.paymentStatus}`}>{w.paymentStatus}</span>
                </div>
              </div>

              {/* Show proof upload form if awaiting */}
              {w.verificationStatus === 'awaiting_proof' && (
                <ProofUpload winnerId={w._id} onSubmit={submitProof} />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ProofUpload({ winnerId, onSubmit }) {
  const [url, setUrl] = useState('');
  return (
    <div className="proof-upload">
      <p className="proof-label">Upload proof to claim your prize:</p>
      <div className="proof-row">
        <input type="url" placeholder="Paste screenshot URL"
          value={url} onChange={e => setUrl(e.target.value)} />
        <button className="btn btn-primary btn-sm" onClick={() => onSubmit(winnerId, url)} disabled={!url}>
          Submit
        </button>
      </div>
    </div>
  );
}

/* ── Charity Tab ──────────────────────────────────────────── */
function CharityTab({ user, refreshUser }) {
  const [charities, setCharities]   = useState([]);
  const [selected, setSelected]     = useState(user?.selectedCharity?._id || '');
  const [pct, setPct]               = useState(user?.charityContributionPercent || 10);
  const [msg, setMsg]               = useState('');
  const [loading, setLoading]       = useState(false);

  useEffect(() => {
    api.get('/charities').then(r => setCharities(r.data.charities)).catch(() => {});
  }, []);

  const save = async () => {
    setMsg(''); setLoading(true);
    try {
      await api.put('/auth/me', {
        selectedCharity:            selected || null,
        charityContributionPercent: Number(pct),
      });
      await refreshUser();
      setMsg('Saved successfully!');
    } catch (err) {
      setMsg(err.response?.data?.message || 'Save failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fade-up">
      <div className="charity-tab-card card">
        <h4>Charity Contribution</h4>
        <p>Choose which charity receives a portion of your subscription every month.</p>

        {msg && <div className={`alert ${msg.includes('uccess') ? 'alert-success' : 'alert-error'}`}>{msg}</div>}

        <div className="form-group">
          <label>Select Charity</label>
          <select value={selected} onChange={e => setSelected(e.target.value)}>
            <option value="">— No charity selected —</option>
            {charities.map(c => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </div>

        <div className="form-group">
          <label>Contribution % (min 10%)</label>
          <input type="number" min="10" max="100" value={pct}
            onChange={e => setPct(e.target.value)} />
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            {pct}% of your monthly subscription goes to this charity
          </span>
        </div>

        <button className="btn btn-primary" onClick={save} disabled={loading}>
          {loading ? 'Saving…' : 'Save Preferences'}
        </button>
      </div>
    </div>
  );
}
