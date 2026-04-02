// src/pages/admin/AdminLayout.jsx
// Persistent sidebar + outlet for all /admin/* routes
import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import './Admin.css';

const links = [
  { to: '/admin',            label: 'Dashboard', exact: true },
  { to: '/admin/users',      label: 'Users'                  },
  { to: '/admin/draws',      label: 'Draws'                  },
  { to: '/admin/charities',  label: 'Charities'              },
  { to: '/admin/winners',    label: 'Winners'                 },
];

export default function AdminLayout() {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className={`admin-layout ${collapsed ? 'admin-layout--collapsed' : ''}`}>
      {/* Sidebar */}
      <aside className="admin-sidebar">
        <div className="admin-sidebar-header">
          <span className="admin-title">{collapsed ? 'A' : 'Admin'}</span>
          <button className="collapse-btn" onClick={() => setCollapsed(!collapsed)}>
            {collapsed ? '→' : '←'}
          </button>
        </div>

        <nav className="admin-nav">
          {links.map(l => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.exact}
              className={({ isActive }) => `admin-nav-link ${isActive ? 'admin-nav-link--active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <main className="admin-main">
        <Outlet />
      </main>
    </div>
  );
}
