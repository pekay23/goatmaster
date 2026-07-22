'use client';
import React, { useState, useEffect, useCallback } from 'react';
import {
  Search, Loader2, ChevronDown, Users, Mail, CalendarDays,
  Plus, Trash2, X, AlertTriangle
} from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users || []);
      setTotal(data.total || 0);
      setTotalPages(data.totalPages || 1);
    } catch {}
    setLoading(false);
  }, [page, search]);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  // Debounced search
  const [searchInput, setSearchInput] = useState('');
  useEffect(() => {
    const t = setTimeout(() => { setSearch(searchInput); setPage(1); }, 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function updateUser(id, updates) {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      });
      if (res.ok) {
        const updated = await res.json();
        setUsers(prev => prev.map(u => u.id === id ? { ...u, ...updated } : u));
      }
    } catch {}
    setSaving(null);
  }

  async function deleteUser(id) {
    setSaving(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setUsers(prev => prev.filter(u => u.id !== id));
        setTotal(prev => prev - 1);
        setDeleteConfirm(null);
        if (expanded === id) setExpanded(null);
      } else {
        const data = await res.json();
        alert(data.error || 'Failed to delete user');
      }
    } catch {}
    setSaving(null);
  }

  function handleUserCreated(newUser) {
    setUsers(prev => [newUser, ...prev]);
    setTotal(prev => prev + 1);
    setShowAddModal(false);
  }

  return (
    <>
      {/* Page Title */}
      <div className="admin-page-title">
        <div className="admin-page-title-icon"><Users size={20} /></div>
        <h2>Users</h2>
      </div>

      {/* Search + Add button */}
      <div style={{ display: 'flex', gap: 10, marginBottom: 16 }}>
        <div className="admin-search" style={{ flex: 1, marginBottom: 0 }}>
          <Search size={18} style={{ color: 'var(--text-sub)' }} />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
          />
        </div>
        <button
          className="admin-btn admin-btn-primary"
          onClick={() => setShowAddModal(true)}
          style={{ whiteSpace: 'nowrap', padding: '10px 16px' }}
        >
          <Plus size={16} /> Add User
        </button>
      </div>

      {/* Results count */}
      <div className="admin-results-count">
        {total} user{total !== 1 ? 's' : ''} found
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="admin-empty">
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : users.length === 0 ? (
        <div className="admin-empty">
          <div className="admin-empty-icon"><Users size={24} /></div>
          <p>No users found.</p>
        </div>
      ) : (
        <>
          {/* User Cards */}
          {users.map(u => (
            <UserCard
              key={u.id}
              user={u}
              expanded={expanded === u.id}
              saving={saving === u.id}
              onToggle={() => setExpanded(expanded === u.id ? null : u.id)}
              onUpdate={(updates) => updateUser(u.id, updates)}
              onDelete={() => setDeleteConfirm(u)}
            />
          ))}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination">
              <button
                className="admin-btn admin-btn-ghost admin-btn-sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Prev
              </button>
              <span className="admin-pagination-info">
                {page} / {totalPages}
              </span>
              <button
                className="admin-btn admin-btn-ghost admin-btn-sm"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}

      {/* Add User Modal */}
      {showAddModal && (
        <AddUserModal
          onClose={() => setShowAddModal(false)}
          onCreated={handleUserCreated}
        />
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <AlertTriangle size={20} style={{ color: 'var(--danger)' }} />
              <h3>Delete User</h3>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-sub)', margin: '8px 0 16px' }}>
              Are you sure you want to delete <strong>{deleteConfirm.username}</strong> ({deleteConfirm.email})? This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="admin-btn admin-btn-ghost"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-danger"
                disabled={saving === deleteConfirm.id}
                onClick={() => deleteUser(deleteConfirm.id)}
              >
                {saving === deleteConfirm.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function UserCard({ user, expanded, saving, onToggle, onUpdate, onDelete }) {
  const initial = (user.username || 'U')[0].toUpperCase();

  return (
    <div className={`user-card ${expanded ? 'expanded' : ''}`} onClick={onToggle}>
      <div className="user-card-header">
        <div className="user-card-avatar">{initial}</div>
        <div className="user-card-info">
          <div className="user-card-name">
            {user.username}
            {user.role === 'admin' && <span className="badge badge-admin">Admin</span>}
          </div>
          {user.email && (
            <div className="user-card-email">
              <Mail size={11} style={{ marginRight: 3, verticalAlign: 'middle' }} />
              {user.email}
            </div>
          )}
          <div className="user-card-meta">
            <span className={`badge badge-${user.subscription_tier || 'free'}`}>
              {user.subscription_tier || 'free'}
            </span>
            <span className={`badge ${user.is_active !== false ? 'badge-active' : 'badge-inactive'}`}>
              {user.is_active !== false ? 'Active' : 'Inactive'}
            </span>
            <span className="badge badge-free">{user.goat_count || 0} goats</span>
            <span className="badge badge-free">{user.scan_count || 0} scans</span>
          </div>
        </div>
        <ChevronDown size={18} className="user-card-chevron" />
      </div>

      {expanded && (
        <div className="user-card-actions" onClick={e => e.stopPropagation()}>
          <label>
            Role
            <select
              value={user.role || 'user'}
              disabled={saving === user.id}
              onChange={e => onUpdate({ role: e.target.value })}
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label>
            Tier
            <select
              value={user.subscription_tier || 'free'}
              disabled={saving === user.id}
              onChange={e => onUpdate({ subscription_tier: e.target.value })}
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </label>

          <label>
            Active
            <div className="toggle">
              <input
                type="checkbox"
                checked={user.is_active !== false}
                disabled={saving === user.id}
                onChange={e => onUpdate({ is_active: e.target.checked })}
              />
              <span className="toggle-slider" />
            </div>
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
            {user.created_at && (
              <div className="user-card-joined">
                <CalendarDays size={12} />
                Joined: {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </div>
            )}
            <button
              className="admin-btn admin-btn-danger admin-btn-sm"
              disabled={saving === user.id}
              onClick={onDelete}
            >
              <Trash2 size={14} /> Delete
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function AddUserModal({ onClose, onCreated }) {
  const [form, setForm] = useState({
    email: '',
    password: '',
    username: '',
    role: 'user',
    tier: 'free',
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.ok) {
        onCreated({ ...data.data, is_active: true, goat_count: 0, scan_count: 0 });
      } else {
        setError(data.error || 'Failed to create user');
      }
    } catch {
      setError('Network error');
    }
    setSubmitting(false);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3><Plus size={18} /> Add User</h3>
          <button className="modal-close" onClick={onClose}><X size={18} /></button>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)', color: 'var(--danger)',
            padding: '8px 12px', borderRadius: 8, fontSize: 13, marginBottom: 12
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-form">
            <label>
              Email *
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
              />
            </label>
            <label>
              Password *
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
              />
            </label>
            <label>
              Username *
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="johndoe"
              />
            </label>
            <label>
              Role
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label>
              Tier
              <select
                value={form.tier}
                onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
              </select>
            </label>
          </div>

          <div className="modal-actions" style={{ marginTop: 16 }}>
            <button type="button" className="admin-btn admin-btn-ghost" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn-primary" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}