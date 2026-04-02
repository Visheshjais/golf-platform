// src/pages/admin/AdminDraws.jsx
// Admin can: simulate a draw (preview), execute it, then publish it
import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminDraws() {
  const [draws,      setDraws]      = useState([]);
  const [loading,    setLoading]    = useState(true);
  const [simResult,  setSimResult]  = useState(null);
  const [running,    setRunning]    = useState(false);
  const [publishing, setPublishing] = useState(null);
  const [rollover,   setRollover]   = useState(null);  // auto-fetched jackpot rollover
  const [form, setForm] = useState({
    drawType:  'random',
    drawMonth: new Date().getMonth() + 1,
    drawYear:  new Date().getFullYear(),
  });
  const [msg,   setMsg]   = useState('');
  const [error, setError] = useState('');

  const fetchDraws = () => {
    api.get('/draws')
      .then(r => {
        const allDraws = r.data.draws;
        setDraws(allDraws);
        // Auto-calculate pending rollover from the latest published draw
        const lastPublished = allDraws.find(d => d.status === 'published');
        if (lastPublished) {
          const jackpotTier = lastPublished.tierResults?.find(t => t.matchCount === 5 && t.isRollover);
          setRollover(jackpotTier ? jackpotTier.poolAmount : 0);
        } else {
          setRollover(0);
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchDraws(); }, []);

  // ── Simulate (preview only, nothing saved) ────────────────
  const handleSimulate = async () => {
    setError(''); setMsg(''); setSimResult(null); setRunning(true);
    try {
      const res = await api.post('/draws/simulate', { drawType: form.drawType });
      setSimResult(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Simulation failed');
    } finally {
      setRunning(false);
    }
  };

  // ── Execute draw (saves to DB as 'pending') ────────────────
  const handleExecute = async () => {
    if (!window.confirm(`Run REAL draw for ${form.drawMonth}/${form.drawYear}? This will be saved.`)) return;
    setError(''); setMsg(''); setRunning(true);
    try {
      await api.post('/draws/run', form);
      setMsg('Draw executed and saved with status "pending". Review it below, then publish.');
      fetchDraws();
    } catch (err) {
      setError(err.response?.data?.message || 'Draw execution failed');
    } finally {
      setRunning(false);
    }
  };

  // ── Publish a pending draw (creates winners + sends emails) ─
  const handlePublish = async (drawId) => {
    if (!window.confirm('Publish this draw? This will create winner records and send emails to all subscribers.')) return;
    setPublishing(drawId);
    try {
      await api.post(`/draws/${drawId}/publish`);
      setMsg('Draw published! Winner emails sent.');
      fetchDraws();
    } catch (err) {
      setError(err.response?.data?.message || 'Publish failed');
    } finally {
      setPublishing(null);
    }
  };

  return (
    <div>
      <div className="admin-page-title">
        <p className="section-label">Monthly draws</p>
        <h2>Draw Management</h2>
      </div>

      {msg   && <div className="alert alert-success">{msg}</div>}
      {error && <div className="alert alert-error">{error}</div>}

      {/* ── Draw Control Panel ──────────────────────────── */}
      <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
        <h4 style={{ marginBottom: '1.5rem' }}>Run a Draw</h4>

        {/* Pending jackpot rollover notice */}
        {rollover !== null && rollover > 0 && (
          <div style={{
            display: 'flex', alignItems: 'center', gap: '0.75rem',
            padding: '0.85rem 1.25rem', marginBottom: '1.5rem',
            background: 'rgba(196,255,71,0.06)', border: '1px solid rgba(196,255,71,0.25)',
            borderRadius: 'var(--radius-sm)',
          }}>
            <span style={{ fontSize: '1.3rem' }}>🏆</span>
            <div>
              <p style={{ margin: 0, fontWeight: 600, color: 'var(--lime)', fontSize: '0.95rem' }}>
                Jackpot Rollover Active — £{rollover.toFixed(2)} carried forward
              </p>
              <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                This amount will be automatically added to next month's 5-match jackpot pool.
              </p>
            </div>
          </div>
        )}
        {rollover === 0 && (
          <div style={{
            padding: '0.75rem 1.25rem', marginBottom: '1.5rem',
            background: 'var(--bg-surface)', borderRadius: 'var(--radius-sm)',
            fontSize: '0.85rem', color: 'var(--text-muted)',
          }}>
            No jackpot rollover pending — last draw's jackpot was claimed (or no draws yet).
          </div>
        )}

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem', marginBottom: '1.5rem' }}>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Draw Type</label>
            <select value={form.drawType} onChange={e => setForm({...form, drawType: e.target.value})}>
              <option value="random">Random (lottery)</option>
              <option value="algorithmic">Algorithmic (score-weighted)</option>
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Month</label>
            <select value={form.drawMonth} onChange={e => setForm({...form, drawMonth: Number(e.target.value)})}>
              {Array.from({length:12},(_,i)=>i+1).map(m=>(
                <option key={m} value={m}>{new Date(2000,m-1).toLocaleString('default',{month:'long'})}</option>
              ))}
            </select>
          </div>
          <div className="form-group" style={{ margin: 0 }}>
            <label>Year</label>
            <input type="number" value={form.drawYear}
              onChange={e => setForm({...form, drawYear: Number(e.target.value)})} min="2024" />
          </div>
        </div>

        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button className="btn btn-ghost" onClick={handleSimulate} disabled={running}>
            {running ? 'Running…' : '🔮 Simulate (Preview)'}
          </button>
          <button className="btn btn-primary" onClick={handleExecute} disabled={running}>
            {running ? 'Running…' : '▶ Execute Real Draw'}
          </button>
        </div>

        {/* Simulation result preview */}
        {simResult && (
          <div style={{ marginTop: '1.5rem', padding: '1.25rem', background: 'var(--bg-surface)', borderRadius: 'var(--radius-md)', border: '1px solid var(--bg-border)' }}>
            <p className="section-label" style={{ marginBottom: '1rem' }}>Simulation Preview (not saved)</p>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              {simResult.drawnNumbers.map((n,i) => (
                <span key={i} className="draw-num" style={{
                  display:'flex', alignItems:'center', justifyContent:'center',
                  width:'44px', height:'44px', borderRadius:'50%',
                  background:'var(--bg-card)', border:'2px solid var(--lime)',
                  color:'var(--lime)', fontFamily:'Syne,sans-serif', fontSize:'1rem', fontWeight:'800'
                }}>{n}</span>
              ))}
            </div>
            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '0.5rem' }}>
              Total pool: <strong style={{ color: 'var(--lime)' }}>£{simResult.totalPool}</strong> ·{' '}
              Active subscribers: <strong>{simResult.activeSubscribers}</strong>
            </p>
            {simResult.tierResults.map(t => (
              <p key={t.matchCount} style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', margin: '0.2rem 0' }}>
                {t.matchCount}-match: {t.winners.length} winner{t.winners.length !== 1 ? 's' : ''} · £{t.poolAmount.toFixed(2)} pool
                {t.isRollover && <span className="badge badge-pending" style={{ marginLeft: '0.5rem' }}>Jackpot Rollover</span>}
              </p>
            ))}
          </div>
        )}
      </div>

      {/* ── Existing draws list ─────────────────────────── */}
      <h4 style={{ marginBottom: '1.25rem' }}>Draw History</h4>
      {loading ? <div className="spinner" /> : (
        <div className="card admin-table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Period</th>
                  <th>Numbers</th>
                  <th>Pool</th>
                  <th>Subscribers</th>
                  <th>Type</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {draws.length === 0 ? (
                  <tr><td colSpan="7" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>No draws yet</td></tr>
                ) : draws.map(d => (
                  <tr key={d._id}>
                    <td><strong>{d.drawMonth}/{d.drawYear}</strong></td>
                    <td>
                      <div style={{ display:'flex', gap:'4px' }}>
                        {d.drawnNumbers.map((n,i) => (
                          <span key={i} style={{
                            display:'inline-flex', alignItems:'center', justifyContent:'center',
                            width:'26px', height:'26px', borderRadius:'50%',
                            background:'var(--bg-surface)', border:'1px solid var(--lime)',
                            color:'var(--lime)', fontSize:'0.72rem', fontWeight:'700'
                          }}>{n}</span>
                        ))}
                      </div>
                    </td>
                    <td>£{d.totalPool}</td>
                    <td>{d.activeSubscribers}</td>
                    <td><span className="badge badge-lime">{d.drawType}</span></td>
                    <td>
                      <span className={`badge ${d.status === 'published' ? 'badge-active' : 'badge-pending'}`}>
                        {d.status}
                      </span>
                    </td>
                    <td>
                      {d.status === 'pending' && (
                        <button
                          className="btn btn-primary btn-sm"
                          onClick={() => handlePublish(d._id)}
                          disabled={publishing === d._id}
                        >
                          {publishing === d._id ? '…' : 'Publish'}
                        </button>
                      )}
                      {d.status === 'published' && (
                        <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                          {new Date(d.publishedAt).toLocaleDateString()}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
