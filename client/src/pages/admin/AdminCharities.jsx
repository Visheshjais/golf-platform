// src/pages/admin/AdminCharities.jsx
// Full CRUD for charities — add, edit, toggle active, delete
import React, { useEffect, useState } from 'react';
import api from '../../services/api';

const EMPTY_FORM = { name:'', description:'', shortDescription:'', logoUrl:'', bannerUrl:'', website:'', email:'', isFeatured: false };

export default function AdminCharities() {
  const [charities,   setCharities]   = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [showForm,    setShowForm]    = useState(false);
  const [editingId,   setEditingId]   = useState(null); // null = creating new
  const [form,        setForm]        = useState(EMPTY_FORM);
  const [saving,      setSaving]      = useState(false);
  const [msg,         setMsg]         = useState('');
  const [error,       setError]       = useState('');

  const fetchCharities = () => {
    // Admin sees all including inactive — use empty search
    api.get('/charities')
      .then(r => setCharities(r.data.charities))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchCharities(); }, []);

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setEditingId(null);
    setShowForm(true);
    setError('');
  };

  const openEdit = (c) => {
    setForm({
      name:             c.name,
      description:      c.description,
      shortDescription: c.shortDescription || '',
      logoUrl:          c.logoUrl || '',
      bannerUrl:        c.bannerUrl || '',
      website:          c.website || '',
      email:            c.email || '',
      isFeatured:       c.isFeatured,
    });
    setEditingId(c._id);
    setShowForm(true);
    setError('');
  };

  const handleSave = async e => {
    e.preventDefault();
    setError(''); setSaving(true);
    try {
      if (editingId) {
        await api.put(`/charities/${editingId}`, form);
        setMsg('Charity updated.');
      } else {
        await api.post('/charities', form);
        setMsg('Charity created.');
      }
      setShowForm(false);
      fetchCharities();
    } catch (err) {
      setError(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Deactivate this charity? It will be hidden from users.')) return;
    try {
      await api.delete(`/charities/${id}`);
      setMsg('Charity deactivated.');
      fetchCharities();
    } catch { }
  };

  const handleChange = e => {
    const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setForm({ ...form, [e.target.name]: val });
  };

  return (
    <div>
      <div className="admin-page-title">
        <p className="section-label">Giving</p>
        <h2>Charity Management</h2>
      </div>

      {msg   && <div className="alert alert-success">{msg}</div>}

      <div className="admin-toolbar">
        <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem' }}>{charities.length} charities</p>
        <button className="btn btn-primary btn-sm" onClick={openCreate}>+ Add Charity</button>
      </div>

      {/* ── Add / Edit Form ─────────────────────────────── */}
      {showForm && (
        <div className="card" style={{ marginBottom: '2rem', padding: '2rem' }}>
          <h4 style={{ marginBottom: '1.5rem' }}>{editingId ? 'Edit Charity' : 'Add New Charity'}</h4>
          {error && <div className="alert alert-error">{error}</div>}

          <form onSubmit={handleSave}>
            <div className="grid-2">
              <div className="form-group">
                <label>Name *</label>
                <input name="name" value={form.name} onChange={handleChange} required />
              </div>
              <div className="form-group">
                <label>Short Description (max 160 chars)</label>
                <input name="shortDescription" value={form.shortDescription} onChange={handleChange} maxLength={160} />
              </div>
            </div>

            <div className="form-group">
              <label>Full Description *</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows={4} required />
            </div>

            <div className="grid-2">
              <div className="form-group">
                <label>Logo URL</label>
                <input name="logoUrl" type="url" value={form.logoUrl} onChange={handleChange} placeholder="https://…" />
              </div>
              <div className="form-group">
                <label>Banner URL</label>
                <input name="bannerUrl" type="url" value={form.bannerUrl} onChange={handleChange} placeholder="https://…" />
              </div>
              <div className="form-group">
                <label>Website</label>
                <input name="website" type="url" value={form.website} onChange={handleChange} placeholder="https://…" />
              </div>
              <div className="form-group">
                <label>Contact Email</label>
                <input name="email" type="email" value={form.email} onChange={handleChange} />
              </div>
            </div>

            <div className="form-group" style={{ flexDirection:'row', alignItems:'center', gap:'0.75rem' }}>
              <input type="checkbox" name="isFeatured" id="featured"
                checked={form.isFeatured} onChange={handleChange} style={{ width:'auto' }} />
              <label htmlFor="featured" style={{ textTransform:'none', letterSpacing:'normal', fontSize:'0.9rem' }}>
                Feature this charity on homepage
              </label>
            </div>

            <div style={{ display:'flex', gap:'0.75rem' }}>
              <button className="btn btn-primary" type="submit" disabled={saving}>
                {saving ? 'Saving…' : editingId ? 'Save Changes' : 'Create Charity'}
              </button>
              <button className="btn btn-ghost" type="button" onClick={() => setShowForm(false)}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* ── Charity list ────────────────────────────────── */}
      {loading ? <div className="spinner" /> : (
        <div className="card admin-table-card">
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Supporters</th>
                  <th>Featured</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {charities.length === 0 ? (
                  <tr><td colSpan="5" style={{ textAlign:'center', padding:'2rem', color:'var(--text-muted)' }}>No charities yet</td></tr>
                ) : charities.map(c => (
                  <tr key={c._id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:'0.75rem' }}>
                        {c.logoUrl && <img src={c.logoUrl} alt="" style={{ width:'32px', height:'32px', borderRadius:'6px', objectFit:'cover' }} />}
                        <strong>{c.name}</strong>
                      </div>
                    </td>
                    <td>{c.subscriberCount}</td>
                    <td>{c.isFeatured ? <span className="badge badge-lime">Yes</span> : '—'}</td>
                    <td><span className={`badge ${c.isActive !== false ? 'badge-active' : 'badge-inactive'}`}>{c.isActive !== false ? 'Active' : 'Inactive'}</span></td>
                    <td>
                      <div style={{ display:'flex', gap:'0.5rem' }}>
                        <button className="btn btn-ghost btn-sm" onClick={() => openEdit(c)}>Edit</button>
                        <button className="btn btn-danger btn-sm" onClick={() => handleDelete(c._id)}>Remove</button>
                      </div>
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
