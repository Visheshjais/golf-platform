// src/pages/admin/AdminWinners.jsx
// Admin reviews submitted proof, approves/rejects, marks payout done
import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminWinners() {
  const [winners,    setWinners]    = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState('under_review'); // default: show items needing action
  const [msg,        setMsg]        = useState('');
  const [processing, setProcessing] = useState(null); // id being actioned

  const fetchWinners = (status = filter) => {
    setLoading(true);
    const qs = status !== 'all' ? `?status=${status}` : '';
    api.get(`/winners${qs}`)
      .then(r => setWinners(r.data.winners))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchWinners(); }, [filter]);

  // ── Approve or reject proof ────────────────────────────────
  const handleVerify = async (id, decision, notes = '') => {
    setProcessing(id);
    try {
      await api.put(`/winners/${id}/verify`, { decision, adminNotes: notes });
      setMsg(`Winner ${decision}.`);
      fetchWinners();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Action failed');
    } finally {
      setProcessing(null);
    }
  };

  // ── Mark as paid ──────────────────────────────────────────
  const handlePayout = async (id) => {
    if (!window.confirm('Mark this prize as paid?')) return;
    setProcessing(id);
    try {
      await api.put(`/winners/${id}/payout`);
      setMsg('Prize marked as paid.');
      fetchWinners();
    } catch (err) {
      setMsg(err.response?.data?.message || 'Payout failed');
    } finally {
      setProcessing(null);
    }
  };

  const statusFilters = [
    { val:'under_review',  label:'Needs Review' },
    { val:'awaiting_proof',label:'Awaiting Proof' },
    { val:'approved',      label:'Approved' },
    { val:'rejected',      label:'Rejected' },
    { val:'all',           label:'All' },
  ];

  return (
    <div>
      <div className="admin-page-title">
        <p className="section-label">Prize verification</p>
        <h2>Winners Management</h2>
      </div>

      {msg && <div className="alert alert-success">{msg}</div>}

      {/* Filter tabs */}
      <div style={{ display:'flex', gap:'0.35rem', marginBottom:'1.5rem', flexWrap:'wrap' }}>
        {statusFilters.map(f => (
          <button
            key={f.val}
            className={`btn btn-sm ${filter === f.val ? 'btn-primary' : 'btn-ghost'}`}
            onClick={() => setFilter(f.val)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {loading ? <div className="spinner" /> : winners.length === 0 ? (
        <div className="empty-state card"><p>No winners in this category.</p></div>
      ) : (
        <div style={{ display:'flex', flexDirection:'column', gap:'1rem' }}>
          {winners.map(w => (
            <div className="card" key={w._id} style={{ padding:'1.5rem' }}>
              <div style={{ display:'flex', justifyContent:'space-between', flexWrap:'wrap', gap:'1rem', marginBottom:'1rem' }}>
                {/* Winner info */}
                <div>
                  <h4 style={{ margin:'0 0 0.25rem' }}>{w.user?.name}</h4>
                  <p style={{ margin:'0', fontSize:'0.85rem', color:'var(--text-muted)' }}>{w.user?.email}</p>
                  <p style={{ margin:'0.4rem 0 0', fontSize:'0.9rem' }}>
                    <span style={{ color:'var(--lime)', fontWeight:'700' }}>£{w.prizeAmount}</span>
                    {' — '}{w.matchCount}-number match
                    {w.draw && ` · Draw ${w.draw.drawMonth}/${w.draw.drawYear}`}
                  </p>
                </div>

                {/* Status badges */}
                <div style={{ display:'flex', gap:'0.5rem', alignItems:'flex-start', flexWrap:'wrap' }}>
                  <span className={`badge badge-${
                    w.verificationStatus === 'approved'     ? 'active'   :
                    w.verificationStatus === 'rejected'     ? 'rejected' :
                    w.verificationStatus === 'under_review' ? 'pending'  : 'inactive'
                  }`}>{w.verificationStatus.replace('_',' ')}</span>
                  <span className={`badge badge-${w.paymentStatus === 'paid' ? 'paid' : 'pending'}`}>
                    {w.paymentStatus}
                  </span>
                </div>
              </div>

              {/* Proof link */}
              {w.proofUrl && (
                <div style={{ marginBottom:'1rem', padding:'0.75rem', background:'var(--bg-surface)', borderRadius:'var(--radius-sm)' }}>
                  <p style={{ fontSize:'0.78rem', textTransform:'uppercase', letterSpacing:'0.08em', color:'var(--text-muted)', marginBottom:'0.3rem' }}>
                    Proof submitted {new Date(w.proofSubmittedAt).toLocaleDateString()}
                  </p>
                  <a href={w.proofUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize:'0.88rem', color:'var(--lime)', wordBreak:'break-all' }}>
                    {w.proofUrl}
                  </a>
                </div>
              )}

              {/* Admin notes if any */}
              {w.adminNotes && (
                <p style={{ fontSize:'0.85rem', color:'var(--text-muted)', marginBottom:'1rem', fontStyle:'italic' }}>
                  Note: {w.adminNotes}
                </p>
              )}

              {/* Action buttons */}
              <div style={{ display:'flex', gap:'0.75rem', flexWrap:'wrap' }}>
                {w.verificationStatus === 'under_review' && (
                  <>
                    <button
                      className="btn btn-primary btn-sm"
                      disabled={processing === w._id}
                      onClick={() => handleVerify(w._id, 'approved')}
                    >
                      ✓ Approve
                    </button>
                    <button
                      className="btn btn-danger btn-sm"
                      disabled={processing === w._id}
                      onClick={() => {
                        const notes = window.prompt('Reason for rejection (optional):') || '';
                        handleVerify(w._id, 'rejected', notes);
                      }}
                    >
                      ✗ Reject
                    </button>
                  </>
                )}

                {w.verificationStatus === 'approved' && w.paymentStatus === 'pending' && (
                  <button
                    className="btn btn-primary btn-sm"
                    disabled={processing === w._id}
                    onClick={() => handlePayout(w._id)}
                  >
                    💳 Mark as Paid
                  </button>
                )}

                {w.verificationStatus === 'awaiting_proof' && (
                  <span style={{ fontSize:'0.82rem', color:'var(--text-muted)', alignSelf:'center' }}>
                    Waiting for user to submit proof
                  </span>
                )}

                {w.paymentStatus === 'paid' && (
                  <span style={{ fontSize:'0.82rem', color:'var(--success)', alignSelf:'center' }}>
                    ✓ Paid on {new Date(w.paidAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
