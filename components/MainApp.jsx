'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, Dna, Activity, FileText, Settings, Search, Plus, Camera, LogOut, X, AlertTriangle, ScanLine } from 'lucide-react';
import HealthPanel from './HealthPanel';
import BreedingPanel from './BreedingPanel';
import Reports from './Reports';
import AlertsPanel from './AlertsPanel';
import SettingsFooter from './SettingsFooter';
import Login from './Login';
import GoatScanner from './GoatScanner';
import ErrorBoundary from './ErrorBoundary';
import { saveEmbeddings, initDb } from '@/lib/localDb';

// ── SPLASH ──────────────────────────────────────────────────────
const SplashScreen = () => (
  <div className="splash-screen">
    <div className="splash-content">
      <img src="/splashscreen.png" alt="Goat Master" className="splash-logo" />
    </div>
  </div>
);

// ── TOAST ───────────────────────────────────────────────────────
const Toast = ({ message, type, onClose }) => (
  <div className={`toast ${type}`}>
    <span>{message}</span>
    <X size={14} style={{ cursor: 'pointer', marginLeft: 10, flexShrink: 0 }} onClick={onClose} />
  </div>
);

// ── CONFIRM MODAL ────────────────────────────────────────────────
const DeleteModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) => {
  if (!isOpen) return null;
  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000, padding: 20 }}>
      <div style={{ background: 'var(--bg-card)', padding: 30, borderRadius: 24, width: '100%', maxWidth: 340, textAlign: 'center', boxShadow: '0 20px 60px rgba(0,0,0,0.2)', border: '1px solid var(--border-color)', animation: 'scaleIn 0.2s ease-out' }}>
        <div style={{ margin: '0 auto 16px', display: 'flex', justifyContent: 'center' }}>
          <div style={{ background: '#fee2e2', width: 60, height: 60, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AlertTriangle size={32} color="#dc2626" />
          </div>
        </div>
        <h3 style={{ margin: '0 0 10px', color: 'var(--text-main)', fontSize: 20, fontWeight: 700 }}>{title}</h3>
        <p style={{ margin: '0 0 24px', color: 'var(--text-sub)', fontSize: 15, lineHeight: 1.5 }}>{message}</p>
        <div style={{ display: 'flex', gap: 12 }}>
          <button onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: 'var(--bg-app)', color: 'var(--text-sub)', cursor: 'pointer', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }}>{cancelText || 'Cancel'}</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 15, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>{confirmText || 'Delete'}</button>
        </div>
      </div>
    </div>
  );
};

// ── ADD / EDIT FORM ──────────────────────────────────────────────
const AddGoatView = ({ formData, setFormData, isSubmitting, isUploading, handleSubmit, handleImageChange, onCancel, isEditing, onDelete }) => (
  <div className="add-goat-view">
    <div style={{ textAlign: 'center', padding: 24, border: '2px dashed var(--border-color)', borderRadius: 16, cursor: 'pointer', marginBottom: 20 }}>
      <label style={{ cursor: 'pointer' }}>
        <input type="file" hidden onChange={handleImageChange} accept="image/*" />
        {formData.image_url
          ? <img src={formData.image_url} style={{ height: 140, borderRadius: 12, objectFit: 'cover' }} alt="" />
          : <div><Camera size={32} style={{ color: 'var(--text-sub)' }} /><p style={{ color: 'var(--text-sub)', margin: '8px 0 0', fontSize: 14 }}>{isEditing ? 'Change Photo' : 'Add Photo'}</p></div>}
      </label>
    </div>
    <form onSubmit={handleSubmit}>
      {[['Name','name','text',true],['Breed','breed','text',false]].map(([label,name,type,req]) => (
        <div key={name} className="form-group">
          <label className="form-label">{label}</label>
          <input className="form-input" name={name} type={type} value={formData[name]}
            onChange={e => setFormData(p => ({ ...p, [e.target.name]: e.target.value }))} required={req} />
        </div>
      ))}
      <div className="form-group">
        <label className="form-label">Sex</label>
        <select className="form-select" name="sex" value={formData.sex} onChange={e => setFormData(p => ({ ...p, sex: e.target.value }))}>
          <option value="F">Doe (Female)</option>
          <option value="M">Buck (Male)</option>
          <option value="W">Wether (Castrated)</option>
        </select>
      </div>
      <div className="form-group">
        <label className="form-label">Date of Birth</label>
        <input className="form-input" type="date" name="dob" value={formData.dob} onChange={e => setFormData(p => ({ ...p, dob: e.target.value }))} />
      </div>
      <div className="form-group">
        <label className="form-label">Ear Tag #</label>
        <input className="form-input" name="ear_tag" value={formData.ear_tag} onChange={e => setFormData(p => ({ ...p, ear_tag: e.target.value }))} placeholder="e.g. T-0042" />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: 13, border: '1.5px solid var(--border-color)', background: 'transparent', borderRadius: 12, cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
        {isEditing && <button type="button" onClick={onDelete} style={{ flex: 1, padding: 13, border: '1px solid #fecaca', background: '#fee2e2', borderRadius: 12, cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontFamily: 'inherit' }}>Delete</button>}
        <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSubmitting || isUploading}>
          {isUploading ? 'Uploading…' : isEditing ? 'Update' : 'Create'}
        </button>
      </div>
    </form>
  </div>
);

// ── GOAT CARD ────────────────────────────────────────────────────
const GoatCard = ({ goat, onEdit }) => (
  <div className="goat-card">
    <button className="edit-btn" onClick={() => onEdit(goat)} aria-label="Edit">
      <img src="/editlogo.png" alt="Edit" style={{ width: 16, height: 16, opacity: 0.8 }} />
    </button>
    {goat.image_url
      ? <img src={goat.image_url} className="goat-avatar" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} alt="" />
      : <div className="goat-avatar">🐐</div>}
    <div className="goat-info">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
        <h3 style={{ margin: 0 }}>{goat.name}</h3>
        {goat.photo_count > 0 && (
          <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 800, background: 'var(--primary-bg)', padding: '2px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
            <Camera size={10} /> {goat.photo_count}
          </span>
        )}
      </div>
      <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 4 }}>
        ID: G{String(goat.id).padStart(3, '0')}{goat.ear_tag ? ` · ${goat.ear_tag}` : ''}
      </div>
      <span style={{ fontSize: 11, background: 'var(--bg-app)', padding: '2px 8px', borderRadius: 6 }}>
        {goat.breed || 'Unknown'} · {goat.sex}
      </span>
    </div>
  </div>
);

// ── MAIN APP ─────────────────────────────────────────────────────
const EMPTY_FORM = { name: '', breed: '', sex: 'F', dob: '', image_url: '', ear_tag: '' };
const NAV_TABS = [
  { id: 'profiles', label: 'Profiles', icon: LayoutGrid },
  { id: 'scan',     label: 'Scan',     icon: ScanLine },
  { id: 'lineage',  label: 'Lineage',  icon: Dna },
  { id: 'health',   label: 'Health',   icon: Activity },
  { id: 'reports',  label: 'Reports',  icon: FileText },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function MainApp() {
  const [loadingSplash, setLoadingSplash] = useState(true);
  const [user, setUser]         = useState(null);
  const [toast, setToast]       = useState(null);
  const [modalOpen, setModalOpen]     = useState(false);
  const [modalConfig, setModalConfig] = useState({});

  const [activeTab, setActiveTab]   = useState('profiles');
  const [showForm, setShowForm]     = useState(false);
  const [editingGoat, setEditingGoat] = useState(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);

  const [goats, setGoats]         = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading]   = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterSex, setFilterSex]       = useState('All');
  const [theme, setTheme]               = useState('system');

  // Splash
  useEffect(() => { const t = setTimeout(() => setLoadingSplash(false), 2800); return () => clearTimeout(t); }, []);

  // Theme
  useEffect(() => { const saved = localStorage.getItem('goat_theme'); if (saved) setTheme(saved); }, []);
  useEffect(() => {
    const root = document.documentElement;
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('goat_theme', theme);
  }, [theme]);

  // Auth — restore from localStorage (username only, token is httpOnly cookie)
  useEffect(() => {
    const saved = localStorage.getItem('goat_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const confirmAction = useCallback((title, message, confirmText, cancelText, action) => {
    setModalConfig({ title, message, confirmText, cancelText, onConfirm: () => { action(); setModalOpen(false); } });
    setModalOpen(true);
  }, []);

  const syncLocalCache = useCallback(async () => {
    try {
      const res = await fetch('/api/goats/embeddings', { credentials: 'include' });
      if (res.ok) {
        const data = await res.json();
        await saveEmbeddings(data);
        console.log(`[sync] ${data.length} embeddings cached locally.`);
      }
    } catch (e) {
      console.warn('[sync] Failed to refresh local cache:', e);
    }
  }, []);

  const handleLogin = (u) => { 
    setUser(u); 
    localStorage.setItem('goat_user', JSON.stringify(u));
    syncLocalCache(); 
  };
  
  const handleLogout = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    setUser(null);
    localStorage.removeItem('goat_user');
    // Clear IndexedDB on logout for privacy
    try {
      const db = await initDb();
      const tx = db.transaction('embeddings', 'readwrite');
      await tx.objectStore('embeddings').clear();
      await tx.done;
    } catch (e) { console.warn('Failed to clear local cache on logout', e); }
  }, [syncLocalCache]);

  // Goats
  const fetchGoats = useCallback(async () => {
    setIsFetching(true);
    try {
      const res = await fetch('/api/goats', { credentials: 'include' });
      if (res.status === 401) { handleLogout(); return; }
      setGoats(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsFetching(false); }
  }, [handleLogout]);

  useEffect(() => { if (user) fetchGoats(); }, [user, fetchGoats]);

  const handleAddNew = () => { setEditingGoat(null); setFormData(EMPTY_FORM); setShowForm(true); };
  const handleEdit   = (goat) => {
    setEditingGoat(goat);
    setFormData({ name: goat.name, breed: goat.breed || '', sex: goat.sex, dob: goat.dob ? goat.dob.split('T')[0] : '', image_url: goat.image_url || '', ear_tag: goat.ear_tag || '' });
    setShowForm(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', process.env.NEXT_PUBLIC_CLOUDINARY_PRESET || 'goat_uploads');
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${process.env.NEXT_PUBLIC_CLOUDINARY_NAME || 'dvjxdxhdr'}/image/upload`, { method: 'POST', body: data });
      const json = await res.json();
      if (json.secure_url) setFormData(p => ({ ...p, image_url: json.secure_url }));
    } catch { showToast('Image upload failed', 'error'); }
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const url    = editingGoat ? `/api/goats/${editingGoat.id}` : '/api/goats';
      const method = editingGoat ? 'PUT' : 'POST';
      const res    = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(formData), credentials: 'include' });
      if (res.ok) { showToast(editingGoat ? 'Goat updated!' : 'Goat added!'); fetchGoats(); setShowForm(false); }
      else { const d = await res.json(); showToast(d.error || 'Failed to save', 'error'); }
    } catch { showToast('Network error', 'error'); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteGoat = () => {
    if (!editingGoat) return;
    confirmAction('Delete Goat?', `Permanently remove ${editingGoat.name} and all their records?`, 'Yes, Delete', 'Cancel', async () => {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/goats/${editingGoat.id}`, { method: 'DELETE', credentials: 'include' });
        if (res.ok) { showToast('Goat deleted'); fetchGoats(); setShowForm(false); }
        else showToast('Failed to delete', 'error');
      } finally { setIsSubmitting(false); }
    });
  };

  const filtered = goats.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterSex === 'All' || g.sex === filterSex)
  );

  if (loadingSplash) return <SplashScreen />;
  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="app-layout">
      <DeleteModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={modalConfig.onConfirm}
        title={modalConfig.title} message={modalConfig.message} confirmText={modalConfig.confirmText} cancelText={modalConfig.cancelText} />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── HEADER ── */}
      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" style={{ width: 28, height: 28, borderRadius: 6 }} alt="" />
          <h1 className="app-title">{showForm ? (editingGoat ? 'Edit Goat' : 'New Goat') : NAV_TABS.find(t => t.id === activeTab)?.label}</h1>
        </div>
        {!showForm && activeTab === 'profiles' && (
          <button className="btn-primary" onClick={handleAddNew}><Plus size={16} /><span>Add Goat</span></button>
        )}
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        {showForm ? (
          <AddGoatView formData={formData} setFormData={setFormData} isSubmitting={isSubmitting}
            isUploading={isUploading} handleSubmit={handleSubmit} handleImageChange={handleImageChange}
            onCancel={() => setShowForm(false)} isEditing={!!editingGoat} onDelete={handleDeleteGoat} />
        ) : (
          <>
            {/* PROFILES */}
            {activeTab === 'profiles' && (
              <>
                <div className="search-bar">
                  <Search size={18} color="var(--text-sub)" />
                  <input className="search-input" placeholder="Search herd…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
                  {[['All','All'],['F','Does'],['M','Bucks'],['W','Wethers']].map(([val,label]) => (
                    <button key={val} onClick={() => setFilterSex(val)} className={`btn-filter ${filterSex === val ? 'active' : ''}`}>{label}</button>
                  ))}
                </div>
                {isFetching ? (
                  <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: 40 }}>Loading herd…</p>
                ) : (
                  <div className="goat-grid">
                    {filtered.map(g => <GoatCard key={g.id} goat={g} onEdit={handleEdit} />)}
                    {!filtered.length && (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-sub)' }}>
                        {searchTerm ? 'No goats match your search.' : 'No goats yet — add your first one!'}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {/* SCAN */}
            {activeTab === 'scan' && (
              <ErrorBoundary>
                <GoatScanner goats={goats} onScanComplete={(res) => {
                  if (res?.goat) showToast(`Matched: ${res.goat.name} (${Math.round((res.confidence ?? 0) * 100)}%)`, 'success');
                }} />
              </ErrorBoundary>
            )}

            {/* LINEAGE */}
            {activeTab === 'lineage' && <BreedingPanel goats={goats} isLoading={isFetching} />}

            {/* HEALTH */}
            {activeTab === 'health' && <><AlertsPanel /><HealthPanel goats={goats} isLoading={isFetching} showToast={showToast} /></>}

            {/* REPORTS */}
            {activeTab === 'reports' && <Reports />}

            {/* SETTINGS */}
            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15, maxWidth: 600 }}>
                {/* Profile card */}
                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 18 }}>
                  <div style={{ width: 58, height: 58, borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, flexShrink: 0 }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Logged in as</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>{user.username}</div>
                  </div>
                </div>

                {/* Herd stats */}
                <div className="glass-panel" style={{ padding: 20, borderRadius: 18, display: 'flex', gap: 16 }}>
                  {[['Total',goats.length,'🐐'],['Does',goats.filter(g=>g.sex==='F').length,'♀'],['Bucks',goats.filter(g=>g.sex==='M').length,'♂'],['Wethers',goats.filter(g=>g.sex==='W').length,'⚥']].map(([l,v,e]) => (
                    <div key={l} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{v}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2 }}>{e} {l}</div>
                    </div>
                  ))}
                </div>

                {/* Theme */}
                <h3 style={{ color: 'var(--text-main)', margin: '8px 0 0', fontSize: 16 }}>Appearance</h3>
                <div className="theme-selector">
                  {['light','dark','system'].map(t => (
                    <button key={t} onClick={() => setTheme(t)} style={{ background: theme === t ? 'var(--bg-app)' : 'transparent', fontWeight: theme === t ? 700 : 400 }}>
                      {t === 'light' ? '☀️ Light' : t === 'dark' ? '🌙 Dark' : '⚙️ System'}
                    </button>
                  ))}
                </div>

                {/* Account actions */}
                <h3 style={{ color: 'var(--text-main)', margin: '8px 0 0', fontSize: 16 }}>Account</h3>
                <button onClick={() => confirmAction('Log Out?', 'Are you sure you want to sign out?', 'Yes, Log Out', 'Cancel', handleLogout)}
                  style={{ padding: 15, background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit', width: '100%' }}>
                  <LogOut size={20} /> Log Out
                </button>
                <button onClick={() => confirmAction('Delete Account?', 'This permanently deletes your account and all goat records. Cannot be undone.', 'Yes, Delete Everything', 'Cancel', async () => {
                  const res = await fetch('/api/auth/delete', { method: 'DELETE', credentials: 'include' });
                  if (res.ok) handleLogout();
                  else showToast('Failed to delete account', 'error');
                })} style={{ padding: 15, background: '#fee2e2', borderRadius: 14, border: '1px solid #fecaca', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', color: '#dc2626', fontWeight: 600, fontSize: 15, fontFamily: 'inherit', width: '100%' }}>
                  <LogOut size={20} /> Delete Account
                </button>
                <SettingsFooter />
              </div>
            )}
          </>
        )}
      </main>

      {/* ── BOTTOM / SIDEBAR NAV ── */}
      {!showForm && (
        <nav className="nav-bar">
          {NAV_TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${activeTab === id ? 'active' : ''}`} onClick={() => setActiveTab(id)}>
              <Icon size={20} /><span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
