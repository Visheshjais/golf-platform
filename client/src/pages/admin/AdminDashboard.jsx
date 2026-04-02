// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from 'react';
import api from '../../services/api';

export default function AdminDashboard() {
  const [stats,   setStats]   = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/admin/stats')
      .then(r => setStats(r.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="spinner" />;

  const cards = [
    { label: 'Total Users',           val: stats?.totalUsers            },
    { label: 'Active Subscribers',    val: stats?.activeSubscribers     },
    { label: 'Active Charities',      val: stats?.totalCharities        },
    { label: 'Draws Run',             val: stats?.totalDraws            },
    { label: 'Prize Pool Distributed',val: `£${stats?.totalPoolDistributed}` },
    { label: 'Avg Charity %',         val: `${stats?.avgCharityContribution}%` },
    { label: 'Pending Verifications', val: stats?.pendingVerifications  },
  ];

  return (
    <div>
      <div className="admin-page-title">
        <p className="section-label">Overview</p>
        <h2>Admin Dashboard</h2>
      </div>

      <div className="admin-stats">
        {cards.map(c => (
          <div className="admin-stat-card card" key={c.label}>
            <span className="stat-card-label">{c.label}</span>
            <span className="stat-card-val">{c.val ?? '—'}</span>
          </div>
        ))}
      </div>

      <div className="card" style={{ padding: '1.5rem' }}>
        <h4>Quick links</h4>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '1rem' }}>
          {[
            { href: '/admin/draws',     label: 'Run a Draw'         },
            { href: '/admin/winners',   label: 'Review Proofs'      },
            { href: '/admin/charities', label: 'Add Charity'        },
            { href: '/admin/users',     label: 'Manage Users'       },
          ].map(l => (
            <a key={l.label} href={l.href} className="btn btn-ghost btn-sm">{l.label}</a>
          ))}
        </div>
      </div>
    </div>
  );
}
