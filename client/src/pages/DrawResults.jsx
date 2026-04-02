// src/pages/DrawResults.jsx
import React, { useEffect, useState } from 'react';
import api from '../services/api';

export default function DrawResults() {
  const [draws,   setDraws]   = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/draws').then(r => setDraws(r.data.draws)).catch(() => {}).finally(() => setLoading(false));
  }, []);

  return (
    <div style={{ padding: '3rem 0 6rem' }}>
      <div className="container">
        <div style={{ marginBottom: '3rem' }}>
          <p className="section-label">Monthly draws</p>
          <h2>Draw Results</h2>
          <p>All published monthly draw results. Check your scores against the winning numbers.</p>
        </div>

        {loading ? (
          <div className="spinner" />
        ) : draws.length === 0 ? (
          <div className="empty-state card"><p>No draw results published yet.</p></div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            {draws.map(draw => (
              <div className="card" key={draw._id}>
                {/* Draw header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div>
                    <h3 style={{ margin: 0 }}>
                      {new Date(draw.drawYear, draw.drawMonth - 1).toLocaleString('default', { month: 'long', year: 'numeric' })} Draw
                    </h3>
                    <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem' }}>
                      {draw.activeSubscribers} participants · £{draw.totalPool} pool
                    </p>
                  </div>
                  <span className="badge badge-lime">{draw.drawType}</span>
                </div>

                {/* Drawn numbers */}
                <p className="section-label" style={{ marginBottom: '0.75rem' }}>Winning Numbers</p>
                <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginBottom: '1.75rem' }}>
                  {draw.drawnNumbers.map((n, i) => (
                    <span key={i} style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      width: '48px', height: '48px', borderRadius: '50%',
                      background: 'var(--bg-surface)', border: '2px solid var(--lime)',
                      color: 'var(--lime)', fontFamily: 'Syne,sans-serif', fontSize: '1rem', fontWeight: '800'
                    }}>{n}</span>
                  ))}
                </div>

                {/* Tier results */}
                <p className="section-label" style={{ marginBottom: '0.75rem' }}>Prize Tiers</p>
                <div className="table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Match</th>
                        <th>Pool</th>
                        <th>Amount</th>
                        <th>Winners</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {draw.tierResults?.map(tier => (
                        <tr key={tier.matchCount}>
                          <td><strong>{tier.matchCount} Numbers</strong></td>
                          <td>{tier.poolPercent}%</td>
                          <td>£{tier.poolAmount?.toFixed(2)}</td>
                          <td>{tier.winners?.length || 0}</td>
                          <td>
                            {tier.isRollover
                              ? <span className="badge badge-pending">Jackpot Rollover</span>
                              : <span className="badge badge-active">{tier.winners?.length > 0 ? 'Won' : 'No winner'}</span>
                            }
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
