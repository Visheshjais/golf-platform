// src/pages/admin/AdminUsers.jsx
// Admin can view users, filter by status, and edit individual golf scores
import React, { useEffect, useState } from 'react';
import api from '../../services/api';

// ── Score Edit Modal ───────────────────────────────────────────
function ScoreEditModal({ user, onClose, onSaved }) {
  // Work on a local copy so we can cancel without side-effects
  const [scores, setScores] = useState(
    (user.scores || [])
      .slice()
      .sort((a, b) => new Date(b.date) - new Date(a.date))
      .map(s => ({ ...s, _id: s._id }))
  );
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [msg,    setMsg]    = useState('');

  const updateScore = (idx, field, value) => {
    setScores(prev => prev.map((s, i) => i === idx ? { ...s, [field]: value } : s));
  };

  const removeScore = (idx) => {
    setScores(prev => prev.filter((_, i) => i !== idx));
  };

  const addBlankScore = () => {
    if (scores.length >= 5) return;
    setScores(prev => [...prev, { points: '', date: new Date().toISOString().slice(0, 10), _id: `new-${Date.now()}` }]);
  };

  const handleSave = async () => {
    setError(''); setMsg('');

    // Validate
    for (const s of scores) {
      const pts = Number(s.points);
      if (!s.points || isNaN(pts) || pts < 1 || pts > 45) {
        setError('All scores must be between 1 and 45 (Stableford).');
        return;
      }
      if (!s.date) {
        setError('All scores must have a date.');
        return;
      }
    }

    setSaving(true);
    try {
      const payload = scores.map(s => ({
        _id:    s._id?.startsWith?.('new-') ? undefined : s._id,
        points: Number(s.points),
        date:   new Date(s.date).toISOString(),
      }));

      const res = await api.put(`/admin/users/${user._id}`, { scores: payload });
      setMsg('Scores saved successfully.');
      onSaved(res.data.user);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save scores.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(5,11,24,0.9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.18s ease',
      }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="card"
        style={{ width: '100%', maxWidth: '560px', padding: '2rem', animation: 'slideUp 0.22s ease' }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
          <div>
            <p className="section-label" style={{ margin: 0 }}>Edit Scores</p>
            <h3 style={{ margin: '0.3rem 0 0' }}>{user.name}</h3>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>{user.email}</p>
          </div>
          <button
            onClick={onClose}
            style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '1.4rem', cursor: 'pointer', lineHeight: 1 }}
          >×</button>
        </div>

        {error && <div className="alert alert-error" style={{ marginBottom: '1rem' }}>{error}</div>}
        {msg   && <div className="alert alert-success" style={{ marginBottom: '1rem' }}>{msg}</div>}

        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          Stableford scores (1–45). Up to 5 scores are kept; the oldest is dropped when a 6th is added.
        </p>

        {scores.length === 0 && (
          <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', marginBottom: '1rem' }}>No scores yet.</p>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
          {scores.map((s, idx) => (
            <div
              key={s._id || idx}
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1.6fr auto',
                gap: '0.5rem',
                alignItems: 'center',
                padding: '0.75rem 1rem',
                background: 'var(--bg-surface)',
                borderRadius: 'var(--radius-sm)',
                border: '1px solid var(--bg-border)',
              }}
            >
              <div>
                <label style={{ fontSize: '0.72rem', marginBottom: '0.25rem', display: 'block' }}>Points</label>
                <input
                  type="number"
                  min="1"
                  max="45"
                  value={s.points}
                  onChange={e => updateScore(idx, 'points', e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.72rem', marginBottom: '0.25rem', display: 'block' }}>Date</label>
                <input
                  type="date"
                  value={s.date ? new Date(s.date).toISOString().slice(0, 10) : ''}
                  onChange={e => updateScore(idx, 'date', e.target.value)}
                  style={{ padding: '0.4rem 0.6rem', fontSize: '0.9rem' }}
                />
              </div>
              <button
                className="btn btn-danger btn-sm"
                onClick={() => removeScore(idx)}
                style={{ alignSelf: 'flex-end', marginBottom: '0' }}
                title="Remove score"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        {scores.length < 5 && (
          <button className="btn btn-ghost btn-sm" onClick={addBlankScore} style={{ marginBottom: '1.5rem' }}>
            + Add Score
          </button>
        )}

        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className="btn btn-primary" onClick={handleSave} disabled={saving} style={{ flex: 1 }}>
            {saving ? 'Saving…' : 'Save Scores'}
          </button>
          <button className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function AdminUsers() {
  const [users,      setUsers]      = useState([]);
  const [total,      setTotal]      = useState(0);
  const [search,     setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [page,       setPage]       = useState(1);
  const [loading,    setLoading]    = useState(true);
  const [editUser,   setEditUser]   = useState(null); // user being score-edited

  const fetchUsers = (s = search, p = page, st = statusFilter) => {
    setLoading(true);
    const qs = new URLSearchParams({ page: p, limit: 20 });
    if (s)  qs.set('search', s);
    if (st) qs.set('status', st);
    api.get(`/admin/users?${qs}`)
      .then(r => { setUsers(r.data.users); setTotal(r.data.total); })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchUsers(); }, [page]);

  const handleSearch = e => {
    e.preventDefault();
    setPage(1);
    fetchUsers(search, 1, statusFilter);
  };

  const handleStatusChange = val => {
    setStatusFilter(val);
    setPage(1);
    fetchUsers(search, 1, val);
  };

  // Replace the user in local state after saving scores
  const handleScoreSaved = (updatedUser) => {
    setUsers(prev => prev.map(u => u._id === updatedUser._id ? updatedUser : u));
  };

  return (
    <>
      {editUser && (
        <ScoreEditModal
          user={editUser}
          onClose={() => setEditUser(null)}
          onSaved={(u) => { handleScoreSaved(u); setEditUser(null); }}
        />
      )}

      <div>
        <div className="admin-page-title">
          <p className="section-label">Members</p>
          <h2>User Management</h2>
        </div>

        <div className="admin-toolbar" style={{ flexWrap: 'wrap', gap: '0.75rem' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
            <input
              placeholder="Search name or email…"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <button className="btn btn-ghost btn-sm" type="submit">Search</button>
          </form>

          <select
            value={statusFilter}
            onChange={e => handleStatusChange(e.target.value)}
            style={{ width: 'auto', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
          >
            <option value="">All statuses</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="past_due">Past Due</option>
          </select>

          <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginLeft: 'auto' }}>
            {total} users total
          </span>
        </div>

        <div className="card admin-table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Subscription</th>
                  <th>Plan</th>
                  <th>Scores</th>
                  <th>Charity</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan="8" style={{ textAlign: 'center', padding: '2rem' }}>Loading…</td></tr>
                ) : users.map(u => (
                  <tr key={u._id}>
                    <td>
                      <strong>{u.name}</strong>
                      {u.role === 'admin' && (
                        <span className="badge badge-lime" style={{ marginLeft: '0.5rem' }}>Admin</span>
                      )}
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{u.email}</td>
                    <td>
                      <span className={`badge badge-${u.subscriptionStatus === 'active' ? 'active' : 'inactive'}`}>
                        {u.subscriptionStatus}
                      </span>
                    </td>
                    <td>{u.subscriptionPlan || '—'}</td>
                    <td>
                      <span style={{ fontWeight: 600, color: u.scores?.length === 5 ? 'var(--lime)' : 'var(--text-secondary)' }}>
                        {u.scores?.length || 0}/5
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{u.selectedCharity?.name || '—'}</td>
                    <td style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>
                    <td>
                      <button
                        className="btn btn-ghost btn-sm"
                        onClick={() => setEditUser(u)}
                        title="Edit this user's golf scores"
                        style={{ whiteSpace: 'nowrap' }}
                      >
                        ✏ Edit Scores
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Pagination */}
        {total > 20 && (
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
            <button className="btn btn-ghost btn-sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
            <span style={{ padding: '0.45rem 0.5rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>Page {page}</span>
            <button className="btn btn-ghost btn-sm" disabled={users.length < 20} onClick={() => setPage(p => p + 1)}>Next</button>
          </div>
        )}
      </div>
    </>
  );
}
