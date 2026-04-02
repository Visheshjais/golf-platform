// src/main.jsx — React app entry point
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

// ── Scroll-reveal via IntersectionObserver ────────────────────
const setupReveal = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target);
        }
      });
    },
    { threshold: 0.12 }
  );

  const observe = () => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
  };

  observe();
  new MutationObserver(observe).observe(document.body, { childList: true, subtree: true });
};

if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', setupReveal);
  if (document.readyState !== 'loading') setTimeout(setupReveal, 0);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);