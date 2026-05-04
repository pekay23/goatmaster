'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { Search, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);
  const [saving, setSaving] = useState(null);

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

  return (
    <>
      <div className="admin-search">
        <Search size={18} style={{ color: 'var(--text-sub)' }} />
        <input
          type="text"
          placeholder="Search users..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
        />
      </div>

      <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 12 }}>
        {total} user{total !== 1 ? 's' : ''} found
      </div>

      {loading ? (
        <div className="admin-empty">
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : users.length === 0 ? (
        <div className="admin-empty">No users found.</div>
      ) : (
        <>
          {users.map(u => (
            <UserCard
              key={u.id}
              user={u}
              expanded={expanded === u.id}
              saving={saving === u.id}
              onToggle={() => setExpanded(expanded === u.id ? null : u.id)}
              onUpdate={(updates) => updateUser(u.id, updates)}
            />
          ))}

          {totalPages > 1 && (
            <div style={{ display: 'flex', justifyContent: 'center', gap: 12, marginTop: 16 }}>
              <button
                className="admin-btn admin-btn-primary"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                Prev
              </button>
              <span style={{ fontSize: 13, color: 'var(--text-sub)', alignSelf: 'center' }}>
                {page} / {totalPages}
              </span>
              <button
                className="admin-btn admin-btn-primary"
                disabled={page >= totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </>
  );
}

function UserCard({ user, expanded, saving, onToggle, onUpdate }) {
  return (
    <div className={`user-card ${expanded ? 'expanded' : ''}`} onClick={onToggle}>
      <div className="user-card-header">
        <div>
          <div className="user-card-name">
            {user.username}
            {user.role === 'admin' && <span className="badge badge-admin" style={{ marginLeft: 8 }}>Admin</span>}
          </div>
          <div className="user-card-meta">
            <span className={`badge badge-${user.subscription_tier || 'free'}`}>
              {user.subscription_tier || 'free'}
            </span>
            <span className={`badge ${user.is_active !== false ? 'badge-active' : 'badge-inactive'}`}>
              {user.is_active !== false ? 'Active' : 'Inactive'}
            </span>
            <span>{user.goat_count} goats</span>
            <span>{user.scan_count} scans</span>
          </div>
        </div>
        {expanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
      </div>

      {expanded && (
        <div className="user-card-actions" onClick={e => e.stopPropagation()}>
          <label>
            Role
            <select
              value={user.role || 'user'}
              disabled={saving}
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
              disabled={saving}
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
                disabled={saving}
                onChange={e => onUpdate({ is_active: e.target.checked })}
              />
              <span className="toggle-slider" />
            </div>
          </label>

          {user.created_at && (
            <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
              Joined: {new Date(user.created_at).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
