// src/pages/CharityDirectory.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './CharityDirectory.css';

export default function CharityDirectory() {
  const [charities, setCharities] = useState([]);
  const [search,    setSearch]    = useState('');
  const [loading,   setLoading]   = useState(true);

  const fetchCharities = (q = '') => {
    setLoading(true);
    api.get(`/charities${q ? `?search=${q}` : ''}`)
      .then(r => setCharities(r.data.charities))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCharities(); }, []);

  const handleSearch = e => {
    e.preventDefault();
    fetchCharities(search);
  };

  return (
    <div className="charity-dir-page">
      <div className="container">
        <div className="charity-dir-header fade-up">
          <p className="section-label">Giving back</p>
          <h2>Charities We Support</h2>
          <p>Every subscription funds the cause you care about. Browse and find yours.</p>
        </div>

        {/* Search bar */}
        <form className="charity-search fade-up" onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search charities…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <button className="btn btn-primary" type="submit">Search</button>
        </form>

        {loading ? (
          <div className="spinner" />
        ) : charities.length === 0 ? (
          <div className="empty-state card">
            <p>No charities found.</p>
          </div>
        ) : (
          <div className="charity-grid grid-3 fade-up">
            {charities.map(c => (
              <Link to={`/charities/${c._id}`} className="charity-dir-card card card-hover" key={c._id}>
                <div className="charity-dir-top">
                  {c.logoUrl
                    ? <img src={c.logoUrl} alt={c.name} className="charity-dir-logo" />
                    : <div className="charity-dir-placeholder">{c.name.charAt(0)}</div>
                  }
                  {c.isFeatured && <span className="badge badge-lime">Featured</span>}
                </div>
                <h4>{c.name}</h4>
                <p>{c.shortDescription || c.description?.slice(0, 120) + '…'}</p>
                <div className="charity-dir-stats">
                  <span>{c.subscriberCount} supporters</span>
                  <span className="charity-dir-arrow">View →</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
