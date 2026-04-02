// src/pages/Landing.jsx — Charity-first homepage
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api';
import './Landing.css';

export default function Landing() {
  const [charities, setCharities] = useState([]);
  const [latestDraw, setLatestDraw] = useState(null);

  useEffect(() => {
    api.get('/charities?featured=true').then(r => setCharities(r.data.charities.slice(0,3))).catch(()=>{});
    api.get('/draws').then(r => setLatestDraw(r.data.draws?.[0] || null)).catch(()=>{});
  }, []);

  return (
    <div className="landing">

      {/* HERO */}
      <section className="hero">
        <div className="hero-bg-grid" />
        <div className="container hero-inner">
          <div className="fade-up"><span className="badge badge-lime">Monthly Draws · Charity Impact</span></div>
          <h1 className="hero-title fade-up">
            Play Golf.<br /><span className="lime-text">Win Prizes.</span><br />Change Lives.
          </h1>
          <p className="hero-sub fade-up">
            Submit your Stableford scores, enter the monthly draw, and a portion of every subscription goes directly to a charity you choose.
          </p>
          <div className="hero-cta fade-up">
            <Link to="/register" className="btn btn-primary btn-lg">Start for Free</Link>
            <Link to="/charities" className="btn btn-ghost btn-lg">Browse Charities</Link>
          </div>
          <div className="hero-stats fade-up">
            <div className="hero-stat"><span className="stat-num">£10K+</span><span className="stat-label">Donated to charity</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><span className="stat-num">500+</span><span className="stat-label">Active members</span></div>
            <div className="hero-stat-divider" />
            <div className="hero-stat"><span className="stat-num">Monthly</span><span className="stat-label">Prize draws</span></div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="section how-it-works reveal">
        <div className="container">
          <p className="section-label">How it works</p>
          <h2>Three steps to make a difference</h2>
          <div className="steps-grid">
            {[
              { num:'01', title:'Subscribe', color:'lime', desc:'Choose a monthly or yearly plan. A portion funds the prize pool; another goes to your chosen charity.' },
              { num:'02', title:'Enter Your Scores', color:'charity', desc:'Log your last 5 Stableford scores each month. Your scores become your draw entries.' },
              { num:'03', title:'Win & Give', color:'info', desc:'Monthly draws pay cash prizes across three tiers. Whether you win or not, your charity benefits every month.' },
            ].map(s => (
              <div className="step-card card" key={s.num}>
                <span className={`step-num step-num--${s.color}`}>{s.num}</span>
                <h3>{s.title}</h3>
                <p>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PRIZE TIERS */}
      <section className="section prizes-section reveal">
        <div className="container">
          <p className="section-label">Prize structure</p>
          <h2>How prizes are split</h2>
          <div className="prize-tiers">
            {[
              { match:'5 Numbers', pct:'40%', label:'Jackpot',      sub:'Rolls over if unclaimed', hi:true  },
              { match:'4 Numbers', pct:'35%', label:'Major Prize',  sub:'Split between winners',   hi:false },
              { match:'3 Numbers', pct:'25%', label:'Prize',        sub:'Split between winners',   hi:false },
            ].map(t => (
              <div className={`prize-tier card ${t.hi ? 'prize-tier--highlight' : ''}`} key={t.match}>
                {t.hi && <span className="prize-jackpot-tag">Jackpot</span>}
                <div className="prize-pct">{t.pct}</div>
                <div className="prize-match">{t.match}</div>
                <div className="prize-tier-label">{t.label}</div>
                <p>{t.sub}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CHARITY SPOTLIGHT */}
      {charities.length > 0 && (
        <section className="section charity-spotlight reveal">
          <div className="container">
            <p className="section-label">Charity spotlight</p>
            <h2>Causes you're supporting</h2>
            <div className="charity-cards grid-3">
              {charities.map(c => (
                <Link to={`/charities/${c._id}`} className="charity-card card card-hover" key={c._id}>
                  {c.logoUrl && <img src={c.logoUrl} alt={c.name} className="charity-logo" />}
                  <h4>{c.name}</h4>
                  <p>{c.shortDescription || c.description?.slice(0,100) + '…'}</p>
                  <span className="charity-link">Learn more →</span>
                </Link>
              ))}
            </div>
            <div className="charity-cta">
              <Link to="/charities" className="btn btn-outline">View all charities</Link>
            </div>
          </div>
        </section>
      )}

      {/* LATEST DRAW */}
      {latestDraw && (
        <section className="section draw-teaser reveal">
          <div className="container">
            <p className="section-label">Latest draw</p>
            <h2>{latestDraw.drawMonth}/{latestDraw.drawYear} Winning Numbers</h2>
            <div className="draw-balls">
              {latestDraw.drawnNumbers.map((n,i) => <span className="draw-ball draw-num" key={i}>{n}</span>)}
            </div>
            <Link to="/draws" className="btn btn-ghost">View full results →</Link>
          </div>
        </section>
      )}

      {/* BOTTOM CTA */}
      <section className="section final-cta">
        <div className="container">
          <div className="cta-card card">
            <p className="section-label">Ready to play?</p>
            <h2>Join the community.<br />Support a cause.</h2>
            <p>From £9.99/month. Cancel anytime. Your charity gets funded from day one.</p>
            <div className="cta-btns">
              <Link to="/register" className="btn btn-primary btn-lg">Get Started</Link>
              <Link to="/charities" className="btn btn-ghost btn-lg">Browse Charities</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
