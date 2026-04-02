// src/main.jsx — React app entry point
import React from 'react';
import ReactDOM from 'react-dom/client';\nimport { BrowserRouter } from 'react-router-dom';
import App from './App';
import './styles/global.css';

// ── Scroll-reveal via IntersectionObserver ────────────────────
// Watches elements with class="reveal" and adds "visible" when they
// enter the viewport, triggering the CSS transition in global.css.
const setupReveal = () => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('visible');
          observer.unobserve(entry.target); // fire once
        }
      });
    },
    { threshold: 0.12 }
  );

  // Observe existing elements and any added later via MutationObserver
  const observe = () => {
    document.querySelectorAll('.reveal:not(.visible)').forEach(el => observer.observe(el));
  };

  observe();
  new MutationObserver(observe).observe(document.body, { childList: true, subtree: true });
};

// Run after first paint
if (typeof window !== 'undefined') {
  window.addEventListener('DOMContentLoaded', setupReveal);
  // Fallback if DOMContentLoaded already fired
  if (document.readyState !== 'loading') setTimeout(setupReveal, 0);
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);
