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

  // Fetch users on mount / when pagination or search changes.
  // eslint-disable-next-line react-hooks/set-state-in-effect
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
      <div className="admin-page-title flex items-center gap-2.5 mb-5">
        <div className="admin-page-title-icon w-9 h-9 rounded-lg flex items-center justify-center bg-primary-bg text-primary">
          <Users size={20} />
        </div>
        <h2 className="text-lg font-bold m-0">Users</h2>
      </div>

      {/* Search + Add button */}
      <div className="flex flex-col sm:flex-row gap-2 sm:gap-0 mb-4">
        <div className="admin-search flex items-center gap-2.5 bg-bg-card border border-border rounded-lg p-2.5 mb-4 sm:mb-0 transition-colors duration-150 focus-within:border-primary focus-within:ring-1 focus-within:ring-primary-bg w-full sm:w-auto">
          <Search size={16} className="shrink-0 text-text-sub" />
          <input
            type="text"
            placeholder="Search by name or email..."
            value={searchInput}
            onChange={e => setSearchInput(e.target.value)}
            className="flex-1 border-none bg-transparent text-text-main outline-none text-sm"
          />
        </div>
        <button
          className="admin-btn admin-btn-primary px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary-hover active:scale-[0.97] transition-colors duration-150 whitespace-nowrap"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} className="shrink-0" /> Add User
        </button>
      </div>

      {/* Results count */}
      <div className="admin-results-count text-sm text-text-sub mb-3 font-medium">
        {total} user{total !== 1 ? 's' : ''} found
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="admin-empty flex flex-col items-center justify-center p-3">
          <Loader2 size={24} className="animate-[spin_1s_linear_infinite]" />
        </div>
      ) : users.length === 0 ? (
        <div className="admin-empty flex flex-col items-center justify-center p-3 text-text-sub text-sm">
          <div className="admin-empty-icon w-12 h-12 rounded-full bg-bg-elevated flex items-center justify-center mb-1 text-text-muted">
            <Users size={24} />
          </div>
          <p>No users found.</p>
        </div>
      ) : (
        <>
          {/* User Cards */}
          <div className="space-y-2">
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
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="admin-pagination flex items-center justify-center gap-2 mt-5">
              <button
                className="admin-btn admin-btn-ghost admin-btn-sm disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded text-xs font-medium bg-bg-app text-text-main border border-border hover:bg-bg-elevated hover:border-border-strong transition-colors duration-150"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Prev
              </button>
              <span className="admin-pagination-info text-xs text-text-sub px-2 font-medium">
                {page} / {totalPages}
              </span>
              <button
                className="admin-btn admin-btn-ghost admin-btn-sm disabled:opacity-50 disabled:cursor-not-allowed px-3 py-1 rounded text-xs font-medium bg-bg-app text-text-main border border-border hover:bg-bg-elevated hover:border-border-strong transition-colors duration-150"
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
        <div className="modalOverlay fixed inset-0 z-1000 bg-black/50 flex items-center justify-center p-4 animate-[modalFadeIn_0.2s_ease]" onClick={() => setDeleteConfirm(null)}>
          <div className="modalContent bg-bg-card border border-border rounded-xl p-6 w-full max-w-[28.75rem] max-h-[90dvh] overflow-y-auto shadow-lg animate-[modalSlideUp_0.2s_ease]" onClick={e => e.stopPropagation()}>
            <div className="modal-header flex items-center justify-between gap-3 mb-4">
              <AlertTriangle size={20} className="text-danger" />
              <h3 className="text-sm font-bold m-0 flex items-center gap-2">Delete User</h3>
            </div>
            <p className="text-xs text-text-sub mb-4 font-medium">
              Are you sure you want to delete <strong>{deleteConfirm.username}</strong> ({deleteConfirm.email})? This action cannot be undone.
            </p>
            <div className="modal-actions flex gap-2 justify-end">
              <button
                className="admin-btn admin-btn-ghost px-4 py-2 rounded-lg text-sm font-bold bg-bg-app text-text-main border border-border hover:bg-bg-elevated hover:border-border-strong transition-colors duration-150"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </button>
              <button
                className="admin-btn admin-btn-danger px-4 py-2 rounded-lg text-sm font-bold bg-danger text-white hover:bg-hsl([var(--barn-600)]) active:scale-[0.97] transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed"
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
    <div
      className={`userCard ${expanded ? 'userCardExpanded' : ''} cursor-pointer`}
      onClick={onToggle}
    >
      <div className="user-card-header flex items-center justify-between gap-3">
        <div className="user-card-avatar w-10 h-10 rounded-full flex items-center justify-center text-[16px] font-bold flex-shrink-0 bg-primary-bg text-primary">
          {initial}
        </div>
        <div className="user-card-info flex-1 min-w-0">
          <div className="user-card-name font-semibold text-sm flex items-center gap-1.5">
            {user.username}
            {user.role === 'admin' && <span className="badge bg-primary-bg text-primary px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase tracking-[0.3px]">Admin</span>}
          </div>
          {user.email && (
            <div className="user-card-email text-xs text-text-sub mt-0.5">
              <Mail size={10} className="shrink-0 mr-0.5 align-middle" />
              {user.email}
            </div>
          )}
          <div className="user-card-meta flex gap-1.5 mt-1.5 flex-wrap">
            <span className={`badge px-1.5 py-0.5 rounded text-[11px] font-semibold uppercase tracking-[0.3px] badge-${user.subscription_tier || 'free'}`}>
              {user.subscription_tier || 'free'}
            </span>
            <span className={`badge px-1.5 py-0.5 rounded text-[11px] font-semibold ${user.is_active !== false ? 'badge-active' : 'badge-inactive'}`}>
              {user.is_active !== false ? 'Active' : 'Inactive'}
            </span>
            <span className="badge px-1.5 py-0.5 rounded text-[11px] font-semibold badge-free">{user.goat_count || 0} goats</span>
            <span className="badge px-1.5 py-0.5 rounded text-[11px] font-semibold badge-free">{user.scan_count || 0} scans</span>
          </div>
        </div>
        <ChevronDown size={18} className="user-card-chevron text-text-muted shrink-0 transition-transform duration-150 ${expanded ? 'rotate-180' : ''}" />
      </div>

      {expanded && (
        <div className="user-card-actions pt-3.5 mt-3.5 border-t border-border flex flex-col gap-3 animate-[slideDown_0.2s_ease]">
          <label className="flex items-center justify-between text-xs text-text-sub gap-3">
            Role
            <select
              value={user.role || 'user'}
              disabled={saving === user.id}
              onChange={e => onUpdate({ role: e.target.value })}
              className="px-2.5 py-1 rounded border border-border bg-bg-app text-text-main text-sm cursor-pointer transition-colors duration-75 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-bg min-w-[3rem]"
            >
              <option value="user">User</option>
              <option value="admin">Admin</option>
            </select>
          </label>

          <label className="flex items-center justify-between text-xs text-text-sub gap-3">
            Tier
            <select
              value={user.subscription_tier || 'free'}
              disabled={saving === user.id}
              onChange={e => onUpdate({ subscription_tier: e.target.value })}
              className="px-2.5 py-1 rounded border border-border bg-bg-app text-text-main text-sm cursor-pointer transition-colors duration-75 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-bg min-w-[3rem]"
            >
              <option value="free">Free</option>
              <option value="basic">Basic</option>
              <option value="pro">Pro</option>
            </select>
          </label>

          <label className="flex items-center justify-between text-xs text-text-sub gap-3">
            Active
            <div className="toggle relative w-11 h-6 shrink-0">
              <input
                type="checkbox"
                checked={user.is_active !== false}
                disabled={saving === user.id}
                onChange={e => onUpdate({ is_active: e.target.checked })}
                className="sr-only peer"
              />
              <span className="toggle-slider relative w-11 h-6 rounded-full bg-border-strong cursor-pointer transition-colors duration-150 peer-checked:bg-primary after:absolute after:inset-[3px] after:w-4 after:h-4 after:rounded-full after:bg-white after:transition-transform after:translate-x-0 peer-checked:after:translate-x-[20px] after:bg-white after:shadow-sm" />
            </div>
          </label>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 1 }}>
            {user.created_at && (
              <div className="user-card-joined flex items-center gap-1 text-xs text-text-muted">
                <CalendarDays size={12} className="shrink-0" />
                Joined: {new Date(user.created_at).toLocaleDateString('en-US', {
                  year: 'numeric', month: 'short', day: 'numeric'
                })}
              </div>
            )}
            <button
              className="admin-btn admin-btn-danger admin-btn-sm px-3 py-1 rounded text-xs font-bold bg-danger text-white hover:bg-hsl([var(--barn-600)]) active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150"
              disabled={saving === user.id}
              onClick={onDelete}
            >
              <Trash2 size={14} className="shrink-0" /> Delete
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
    <div className="modalOverlay fixed inset-0 z-1000 bg-black/50 flex items-center justify-center p-4 animate-[modalFadeIn_0.2s_ease]" onClick={onClose}>
      <div className="modalContent bg-bg-card border border-border rounded-xl p-6 w-full max-w-[28.75rem] max-h-[90dvh] overflow-y-auto shadow-lg animate-[modalSlideUp_0.2s_ease]" onClick={e => e.stopPropagation()}>
        <div className="modal-header flex items-center justify-between gap-3 mb-4">
          <h3 className="text-sm font-bold flex items-center gap-2"><Plus size={18} className="shrink-0" /> Add User</h3>
          <button className="modal-close w-8 h-8 rounded-lg bg-bg-app text-text-sub flex items-center justify-center cursor-pointer transition-colors duration-150 hover:bg-bg-elevated hover:text-text-main" onClick={onClose}>
            <X size={18} className="shrink-0" />
          </button>
        </div>

        {error && (
          <div style={{
            background: 'var(--danger-bg)', color: 'var(--danger)',
            padding: '0.5rem 0.75rem', borderRadius: '0.5rem', fontSize: '0.8125rem', marginBottom: '0.75rem'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="modal-form flex flex-col gap-3.5">
            <label className="flex flex-col gap-1 text-xs font-medium text-text-sub">
              Email *
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                placeholder="user@example.com"
                className="px-2.5 py-2.5 rounded border border-border bg-bg-app text-text-main text-sm transition-colors duration-75 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-bg"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-text-sub">
              Password *
              <input
                type="password"
                required
                minLength={6}
                value={form.password}
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                placeholder="Min 6 characters"
                className="px-2.5 py-2.5 rounded border border-border bg-bg-app text-text-main text-sm transition-colors duration-75 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-bg"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-text-sub">
              Username *
              <input
                type="text"
                required
                value={form.username}
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                placeholder="johndoe"
                className="px-2.5 py-2.5 rounded border border-border bg-bg-app text-text-main text-sm transition-colors duration-75 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-bg"
              />
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-text-sub">
              Role
              <select
                value={form.role}
                onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                className="px-2.5 py-2.5 rounded border border-border bg-bg-app text-text-main text-sm cursor-pointer transition-colors duration-75 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-bg"
              >
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-xs font-medium text-text-sub">
              Tier
              <select
                value={form.tier}
                onChange={e => setForm(f => ({ ...f, tier: e.target.value }))}
                className="px-2.5 py-2.5 rounded border border-border bg-bg-app text-text-main text-sm cursor-pointer transition-colors duration-75 focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary-bg"
              >
                <option value="free">Free</option>
                <option value="basic">Basic</option>
                <option value="pro">Pro</option>
              </select>
            </label>
          </div>

          <div className="modal-actions flex gap-2 justify-end mt-4">
            <button type="button" className="admin-btn admin-btn-ghost px-4 py-2 rounded-lg text-sm font-bold bg-bg-app text-text-main border border-border hover:bg-bg-elevated hover:border-border-strong transition-colors duration-150" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="admin-btn admin-btn-primary px-4 py-2 rounded-lg text-sm font-bold bg-primary text-white hover:bg-primary-hover active:scale-[0.97] disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-150" disabled={submitting}>
              {submitting ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
