'use client';
import React, { useState, useEffect } from 'react';
import { LayoutGrid, Dna, Activity, FileText, Settings, Search, Plus, Camera, LogOut, X, AlertTriangle } from 'lucide-react';
import HealthPanel from './HealthPanel';
import BreedingPanel from './BreedingPanel';
import Reports from './Reports';
import AlertsPanel from './AlertsPanel';
import SettingsFooter from './SettingsFooter';
import Login from './Login';

const CLOUD_NAME = "dvjxdxhdr";
const UPLOAD_PRESET = "goat_uploads";

const SplashScreen = () => (
  <div className="splash-screen">
    <div className="splash-content">
      <img src="/splashscreen.png" alt="Goat Master" className="splash-logo" />
    </div>
  </div>
);

const Toast = ({ message, type, onClose }) => (
  <div className={`toast ${type}`}>
    <span>{message}</span>
    <X size={14} style={{ cursor: 'pointer', marginLeft: 10, flexShrink: 0 }} onClick={onClose} />
  </div>
);

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
          <button onClick={onClose} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: 'var(--bg-app)', color: 'var(--text-sub)', cursor: 'pointer', fontWeight: 600, fontSize: 15, fontFamily: 'inherit' }}>{cancelText || 'No, keep it.'}</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: 14, borderRadius: 12, border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: 600, fontSize: 15, fontFamily: 'inherit', boxShadow: '0 4px 12px rgba(239,68,68,0.3)' }}>{confirmText || 'Yes, Delete!'}</button>
        </div>
      </div>
    </div>
  );
};

const AddGoatView = ({ formData, setFormData, isSubmitting, isUploading, handleSubmit, handleImageChange, onCancel, isEditing, onDelete }) => (
  <div className="add-goat-view">
    <div style={{ textAlign: 'center', padding: 24, border: '2px dashed var(--border-color)', borderRadius: 16, cursor: 'pointer', marginBottom: 20 }}>
      <label style={{ cursor: 'pointer' }}>
        <input type="file" hidden onChange={handleImageChange} accept="image/*" />
        {formData.image_url
          ? <img src={formData.image_url} style={{ height: 140, borderRadius: 12, objectFit: 'cover' }} alt="" />
          : <div><Camera size={32} style={{ color: 'var(--text-sub)' }} /><p style={{ color: 'var(--text-sub)', margin: '8px 0 0', fontSize: 14 }}>{isEditing ? 'Change Photo' : 'Add Photo'}</p></div>
        }
      </label>
    </div>
    <form onSubmit={handleSubmit}>
      <div className="form-group"><label className="form-label">Name</label><input className="form-input" name="name" value={formData.name} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} required /></div>
      <div className="form-group"><label className="form-label">Breed</label><input className="form-input" name="breed" value={formData.breed} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} /></div>
      <div className="form-group"><label className="form-label">Sex</label>
        <select className="form-select" name="sex" value={formData.sex} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })}>
          <option value="F">Doe (Female)</option>
          <option value="M">Buck (Male)</option>
          <option value="W">Wether (Castrated)</option>
        </select>
      </div>
      <div className="form-group"><label className="form-label">Date of Birth</label><input className="form-input" type="date" name="dob" value={formData.dob} onChange={e => setFormData({ ...formData, [e.target.name]: e.target.value })} /></div>
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

export default function MainApp() {
  const [loadingSplash, setLoadingSplash] = useState(true);
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', confirmText: '', cancelText: '', onConfirm: () => {} });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  };

  const confirmAction = (title, message, confirmText, cancelText, action) => {
    setModalConfig({ title, message, confirmText, cancelText, onConfirm: () => { action(); setModalOpen(false); } });
    setModalOpen(true);
  };

  useEffect(() => {
    const timer = setTimeout(() => setLoadingSplash(false), 2800);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('goat_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (u) => { setUser(u); localStorage.setItem('goat_user', JSON.stringify(u)); };
  const handleLogout = () => { setUser(null); localStorage.removeItem('goat_user'); };

  // Theme
  const [theme, setTheme] = useState('system');
  useEffect(() => {
    const saved = localStorage.getItem('goat_theme');
    if (saved) setTheme(saved);
  }, []);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      root.setAttribute('data-theme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
    localStorage.setItem('goat_theme', theme);
  }, [theme]);

  const [activeTab, setActiveTab] = useState('profiles');
  const [showAddGoat, setShowAddGoat] = useState(false);
  const [editingGoat, setEditingGoat] = useState(null);
  const [formData, setFormData] = useState({ name: '', breed: '', sex: 'F', dob: '', image_url: '' });
  const [goats, setGoats] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSex, setFilterSex] = useState('All');

  const fetchGoats = async () => {
    setIsFetching(true);
    try {
      const res = await fetch('/api/goats');
      setGoats(await res.json());
    } catch (e) { console.error(e); }
    finally { setIsFetching(false); }
  };

  useEffect(() => { if (user) fetchGoats(); }, [user]);

  const handleAddNew = () => { setEditingGoat(null); setFormData({ name: '', breed: '', sex: 'F', dob: '', image_url: '' }); setShowAddGoat(true); };
  const handleEdit = (goat) => {
    setEditingGoat(goat);
    setFormData({ name: goat.name, breed: goat.breed || '', sex: goat.sex, dob: goat.dob ? goat.dob.split('T')[0] : '', image_url: goat.image_url || '' });
    setShowAddGoat(true);
  };

  const handleDeleteGoat = () => {
    if (!editingGoat) return;
    confirmAction('Delete Goat?', `Permanently remove ${editingGoat.name}?`, 'Yes, Delete!', 'No, keep it.', async () => {
      setIsSubmitting(true);
      try {
        const res = await fetch(`/api/goats/${editingGoat.id}`, { method: 'DELETE' });
        if (res.ok) { showToast('Goat deleted.'); fetchGoats(); setShowAddGoat(false); }
        else showToast('Failed to delete', 'error');
      } catch { showToast('Error deleting', 'error'); }
      finally { setIsSubmitting(false); }
    });
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: 'POST', body: data });
      const fileData = await res.json();
      if (fileData.secure_url) setFormData(prev => ({ ...prev, image_url: fileData.secure_url }));
    } catch { showToast('Image upload failed', 'error'); }
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const res = await fetch(editingGoat ? `/api/goats/${editingGoat.id}` : '/api/goats', {
        method: editingGoat ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editingGoat ? { ...formData } : formData),
      });
      if (res.ok) { showToast(editingGoat ? 'Goat updated!' : 'Goat added!'); fetchGoats(); setShowAddGoat(false); }
      else showToast('Failed to save', 'error');
    } catch { showToast('Network Error', 'error'); }
    finally { setIsSubmitting(false); }
  };

  const filtered = goats.filter(g =>
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterSex === 'All' || g.sex === filterSex)
  );

  if (loadingSplash) return <SplashScreen />;
  if (!user) return <Login onLogin={handleLogin} />;

  return (
    <div className="app-layout">
      <DeleteModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={modalConfig.onConfirm} title={modalConfig.title} message={modalConfig.message} confirmText={modalConfig.confirmText} cancelText={modalConfig.cancelText} />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      <header className="app-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/logo.png" style={{ width: 28, height: 28, borderRadius: 6 }} alt="" />
          <h1 className="app-title">{showAddGoat ? (editingGoat ? 'Edit Goat' : 'New Goat') : activeTab}</h1>
        </div>
        {!showAddGoat && activeTab === 'profiles' && (
          <button className="btn-primary" onClick={handleAddNew}><Plus size={16} /> <span>Add Goat</span></button>
        )}
      </header>

      <main className="main-content">
        {showAddGoat ? (
          <AddGoatView formData={formData} setFormData={setFormData} isSubmitting={isSubmitting} isUploading={isUploading} handleSubmit={handleSubmit} handleImageChange={handleImageChange} onCancel={() => setShowAddGoat(false)} isEditing={!!editingGoat} onDelete={handleDeleteGoat} />
        ) : (
          <div style={{ width: '100%' }}>
            {activeTab === 'profiles' && (
              <>
                <div className="search-bar">
                  <Search size={18} color="var(--text-sub)" />
                  <input className="search-input" placeholder="Search herd…" onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
                  {['All', 'F', 'M', 'W'].map(s => (
                    <button key={s} onClick={() => setFilterSex(s)} className={`btn-filter ${filterSex === s ? 'active' : ''}`}>
                      {s === 'All' ? 'All' : s === 'F' ? 'Does' : s === 'M' ? 'Bucks' : 'Wethers'}
                    </button>
                  ))}
                </div>
                {isFetching ? (
                  <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: 40 }}>Loading herd…</p>
                ) : (
                  <div className="goat-grid">
                    {filtered.map(g => (
                      <div key={g.id} className="goat-card">
                        <button className="edit-btn" onClick={() => handleEdit(g)} aria-label="Edit">
                          <img src="/editlogo.png" alt="Edit" style={{ width: 16, height: 16, opacity: 0.8 }} />
                        </button>
                        {g.image_url
                          ? <img src={g.image_url} className="goat-avatar" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} alt="" />
                          : <div className="goat-avatar">🐐</div>
                        }
                        <div className="goat-info">
                          <h3>{g.name}</h3>
                          <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 4 }}>ID: G{String(g.id).padStart(3, '0')}</div>
                          <span style={{ fontSize: 11, background: 'var(--bg-app)', padding: '2px 8px', borderRadius: 6 }}>{g.breed || 'Unknown'} · {g.sex}</span>
                        </div>
                      </div>
                    ))}
                    {filtered.length === 0 && !isFetching && (
                      <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px 20px', color: 'var(--text-sub)' }}>
                        {searchTerm ? 'No goats match your search.' : 'No goats yet — add your first one!'}
                      </div>
                    )}
                  </div>
                )}
              </>
            )}
            {activeTab === 'lineage' && <BreedingPanel goats={goats} isLoading={isFetching} />}
            {activeTab === 'health' && <><AlertsPanel /><HealthPanel goats={goats} isLoading={isFetching} showToast={showToast} /></>}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15, maxWidth: 600 }}>
                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 18, marginBottom: 10 }}>
                  <div style={{ width: 58, height: 58, borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, flexShrink: 0 }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Logged in as</div>
                    <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>{user.username}</div>
                  </div>
                </div>

                <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: 17 }}>Appearance</h3>
                <div className="theme-selector">
                  {['light', 'dark', 'system'].map(t => (
                    <button key={t} onClick={() => setTheme(t)} style={{ background: theme === t ? 'var(--bg-app)' : 'transparent' }}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <h3 style={{ color: 'var(--text-main)', margin: '20px 0 0', fontSize: 17 }}>Account</h3>
                <div onClick={() => confirmAction('Log Out?', 'Are you sure you want to sign out?', 'Yes, Log Out', 'Cancel', handleLogout)} style={{ padding: 15, background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600 }}>
                  <LogOut size={20} /> Log Out
                </div>
                <div onClick={() => confirmAction('Delete Account?', 'This will permanently delete your account and all data. This cannot be undone.', 'Yes, Delete Everything', 'No, keep it.', async () => {
                  try {
                    const res = await fetch('/api/auth/delete', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: user.username }) });
                    if (res.ok) handleLogout();
                  } catch { showToast('Error deleting account', 'error'); }
                })} style={{ padding: 15, background: '#fee2e2', borderRadius: 14, border: '1px solid #fecaca', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', color: '#dc2626', fontWeight: 600 }}>
                  <LogOut size={20} /> Delete Account
                </div>
                <SettingsFooter />
              </div>
            )}
          </div>
        )}
      </main>

      {!showAddGoat && (
        <nav className="nav-bar">
          <button className={`nav-item ${activeTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveTab('profiles')}><LayoutGrid size={20} /><span>Profiles</span></button>
          <button className={`nav-item ${activeTab === 'lineage' ? 'active' : ''}`} onClick={() => setActiveTab('lineage')}><Dna size={20} /><span>Lineage</span></button>
          <button className={`nav-item ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}><Activity size={20} /><span>Health</span></button>
          <button className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}><FileText size={20} /><span>Reports</span></button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}><Settings size={20} /><span>Settings</span></button>
        </nav>
      )}
    </div>
  );
}
