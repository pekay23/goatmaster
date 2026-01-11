import React, { useState, useEffect } from 'react';
import './App.css';
import { LayoutGrid, Dna, Activity, FileText, Settings, Search, Plus, Camera, LogOut, Sun, Moon, Monitor, X, Edit2, AlertTriangle } from 'lucide-react';
import HealthPanel from './HealthPanel';
import BreedingPanel from './BreedingPanel';
import Reports from './Reports';
import AlertsPanel from './AlertsPanel';
import SettingsFooter from './SettingsFooter';
import Login from './Login';

// ☁️ CLOUDINARY CONFIGURATION
const CLOUD_NAME = "dvjxdxhdr"; 
const UPLOAD_PRESET = "goat_uploads";

// --- SPLASH SCREEN COMPONENT ---
const SplashScreen = () => (
  <div className="splash-screen">
    <div className="splash-content">
      {/* Uses your custom image */}
      <img src="/splashscreen.png" alt="Goat Master" className="splash-logo" />
    </div>
  </div>
);

// --- TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => (
  <div className={`toast ${type} glass-panel`}>
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      <span>{message}</span>
      <X size={14} style={{cursor:'pointer', marginLeft: 10}} onClick={onClose}/>
    </div>
  </div>
);

// --- DELETE CONFIRMATION MODAL ---
const DeleteModal = ({ isOpen, onClose, onConfirm, title, message, confirmText, cancelText }) => {
  if (!isOpen) return null;
  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
      background: 'rgba(0,0,0,0.5)', 
      backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 3000
    }}>
      <div style={{
        background: 'var(--bg-card)', 
        padding: '30px', 
        borderRadius: '24px', 
        width: '85%', maxWidth: '320px', 
        textAlign: 'center',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        border: '1px solid var(--border-color)',
        animation: 'scaleIn 0.2s ease-out'
      }}>
        <div style={{ margin: '0 auto 15px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ background: '#fee2e2', width: '60px', height: '60px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
             <AlertTriangle size={32} color="#dc2626" strokeWidth={2} />
          </div>
        </div>
        
        <h3 style={{ margin: '0 0 10px', color: 'var(--text-main)', fontSize: '20px', fontWeight: '700' }}>{title}</h3>
        <p style={{ margin: '0 0 25px', color: 'var(--text-sub)', fontSize: '15px', lineHeight: '1.5' }}>{message}</p>
        
        <div style={{display: 'flex', gap: '12px'}}>
          <button onClick={onClose} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: 'var(--bg-app)', color: 'var(--text-sub)', cursor: 'pointer', fontWeight: '600', fontSize: '15px' }}>{cancelText || "No, keep it."}</button>
          <button onClick={onConfirm} style={{ flex: 1, padding: '14px', borderRadius: '12px', border: 'none', background: '#ef4444', color: 'white', cursor: 'pointer', fontWeight: '600', fontSize: '15px', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' }}>{confirmText || "Yes, Delete!"}</button>
        </div>
      </div>
    </div>
  );
};

// --- ADD/EDIT FORM COMPONENT ---
const AddGoatView = ({ formData, setFormData, isSubmitting, isUploading, handleSubmit, handleImageChange, onCancel, isEditing, onDelete }) => {
  return (
    <div className="add-goat-view">
      <div style={{textAlign:'center', padding:30, border:'2px dashed var(--border-color)', borderRadius:12, cursor:'pointer', marginBottom:20}}>
        <label style={{cursor:'pointer'}}>
          <input type="file" hidden onChange={handleImageChange} />
          {formData.image_url ? <img src={formData.image_url} style={{height:150, borderRadius:8}} alt=""/> : <div><Camera size={30} style={{color:'var(--text-sub)'}}/><p>{isEditing ? 'Change Photo' : 'Add Photo'}</p></div>}
        </label>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group"><label className="form-label">Name</label><input className="form-input" name="name" value={formData.name} onChange={e=>setFormData({...formData, [e.target.name]:e.target.value})} required /></div>
        <div className="form-group"><label className="form-label">Breed</label><input className="form-input" name="breed" value={formData.breed} onChange={e=>setFormData({...formData, [e.target.name]:e.target.value})} /></div>
        <div className="form-group"><label className="form-label">Sex</label><select className="form-select" name="sex" value={formData.sex} onChange={e=>setFormData({...formData, [e.target.name]:e.target.value})}><option value="F">Doe</option><option value="M">Buck</option><option value="W">Wether</option></select></div>
        <div className="form-group"><label className="form-label">Date of Birth</label><input className="form-input" type="date" name="dob" value={formData.dob} onChange={e=>setFormData({...formData, [e.target.name]:e.target.value})} /></div>
        <div style={{display:'flex', gap:10, marginTop:20}}>
          <button type="button" onClick={onCancel} style={{flex:1, padding:12, border:'1px solid var(--border-color)', background:'transparent', borderRadius:8, cursor:'pointer', color:'var(--text-main)'}}>Cancel</button>
          {isEditing && <button type="button" onClick={onDelete} style={{flex:1, padding:12, border:'1px solid #fecaca', background:'#fee2e2', borderRadius:8, cursor:'pointer', color:'#dc2626', fontWeight:'bold'}}>Delete</button>}
          <button type="submit" className="btn-primary" style={{flex:1, justifyContent:'center'}} disabled={isSubmitting || isUploading}>{isUploading ? 'Uploading...' : (isEditing ? 'Update' : 'Create')}</button>
        </div>
      </form>
    </div>
  );
};

function App() {
  const [loadingSplash, setLoadingSplash] = useState(true); // SPLASH STATE
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalConfig, setModalConfig] = useState({ title: '', message: '', confirmText: '', cancelText: '', onConfirm: () => {} });

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000); 
  };

  const confirmAction = (title, message, confirmText, cancelText, action) => {
    setModalConfig({ title, message, confirmText, cancelText, onConfirm: () => { action(); setModalOpen(false); } });
    setModalOpen(true);
  };

  // --- SPLASH LOGIC ---
  useEffect(() => {
    const timer = setTimeout(() => {
      setLoadingSplash(false);
    }, 2800); // 2.8 seconds total splash time
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem('goat_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const handleLogin = (u) => {
    setUser(u);
    localStorage.setItem('goat_user', JSON.stringify(u));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('goat_user');
  };

  // THEME
  const [theme, setTheme] = useState(localStorage.getItem('goat_theme') || 'system');
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') {
      const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    } else {
      root.setAttribute('data-theme', theme);
    }
    localStorage.setItem('goat_theme', theme);
  }, [theme]);

  // APP LOGIC
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
      const res = await fetch('/.netlify/functions/get-goats');
      setGoats(await res.json());
    } catch(e) { console.error(e); } 
    finally { setIsFetching(false); }
  };

  useEffect(() => { if (user) fetchGoats(); }, [user]);

  const handleAddNew = () => {
    setEditingGoat(null);
    setFormData({ name: '', breed: '', sex: 'F', dob: '', image_url: '' });
    setShowAddGoat(true);
  };

  const handleEdit = (goat) => {
    setEditingGoat(goat);
    const cleanDob = goat.dob ? goat.dob.split('T')[0] : '';
    setFormData({ 
      name: goat.name, 
      breed: goat.breed || '', 
      sex: goat.sex, 
      dob: cleanDob, 
      image_url: goat.image_url || '' 
    });
    setShowAddGoat(true);
  };

  const handleDeleteGoat = () => {
    if (!editingGoat) return;
    confirmAction(
      "Delete Goat?", 
      `Permanently remove ${editingGoat.name}?`,
      "Yes, Delete!",
      "No, keep it.",
      async () => {
        setIsSubmitting(true);
        try {
          const res = await fetch('/.netlify/functions/delete-goat', { method: 'DELETE', body: JSON.stringify({ id: editingGoat.id }) });
          if (res.ok) { showToast("Goat deleted."); fetchGoats(); setShowAddGoat(false); } 
          else { showToast("Failed to delete", "error"); }
        } catch (e) { showToast("Error deleting", "error"); } 
        finally { setIsSubmitting(false); }
      }
    );
  };

  const handleConfirmLogout = () => {
    confirmAction(
      "Log Out?", 
      "Are you sure you want to sign out?", 
      "Yes, Log Out",
      "Cancel",
      () => handleLogout()
    );
  };

  const handleDeleteAccount = () => {
    confirmAction(
      "Delete Account?", 
      "Delete your account and all data?",
      "Yes, Delete!",
      "No, keep it.",
      async () => {
        try {
          const res = await fetch('/.netlify/functions/delete-account', { method: 'DELETE', body: JSON.stringify({ username: user.username }) });
          if (res.ok) { alert("Account Deleted."); handleLogout(); } 
          else { alert("Failed to delete account"); }
        } catch (e) { alert("Error deleting account"); }
      }
    );
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setIsUploading(true);
    const data = new FormData();
    data.append("file", file);
    data.append("upload_preset", UPLOAD_PRESET);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: data });
      const fileData = await res.json();
      if (fileData.secure_url) setFormData(prev => ({ ...prev, image_url: fileData.secure_url }));
    } catch { showToast("Image upload failed", "error"); } 
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const endpoint = editingGoat ? '/.netlify/functions/update-goat' : '/.netlify/functions/add-goat';
    const method = editingGoat ? 'PUT' : 'POST';
    const payload = editingGoat ? { ...formData, id: editingGoat.id } : formData;

    try {
      const res = await fetch(endpoint, { method, body: JSON.stringify(payload) });
      if (res.ok) {
        showToast(editingGoat ? "Goat updated!" : "Goat added!");
        fetchGoats();
        setShowAddGoat(false);
      } else {
        showToast("Failed to save", "error");
      }
    } catch { showToast("Network Error", "error"); }
    finally { setIsSubmitting(false); }
  };

  const filtered = goats.filter(g => 
    g.name.toLowerCase().includes(searchTerm.toLowerCase()) && 
    (filterSex === 'All' || g.sex === filterSex)
  );

  // --- RENDER LOGIC ---
  
  // 1. Show Splash Screen if loading
  if (loadingSplash) return <SplashScreen />;

  // 2. Show Login if no user (after splash)
  if (!user) return <Login onLogin={handleLogin} />;

  // 3. Show App
  return (
    <div className="app-layout">
      {/* GLOBAL MODAL */}
      <DeleteModal isOpen={modalOpen} onClose={()=>setModalOpen(false)} onConfirm={modalConfig.onConfirm} title={modalConfig.title} message={modalConfig.message} confirmText={modalConfig.confirmText} cancelText={modalConfig.cancelText} />
      
      {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
      
      <header className="app-header glass-panel">
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <img src="/logo.png" style={{width:28, height:28}} alt=""/>
          <h1 className="app-title">{showAddGoat ? (editingGoat ? 'Edit Goat' : 'New Goat') : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
        </div>
        {!showAddGoat && activeTab === 'profiles' && (
          <button className="btn-primary" onClick={handleAddNew}><Plus size={16}/> <span className="nav-label">Add</span></button>
        )}
      </header>

      <main className="main-content">
        {showAddGoat ? (
          <AddGoatView formData={formData} setFormData={setFormData} isSubmitting={isSubmitting} isUploading={isUploading} handleSubmit={handleSubmit} handleImageChange={handleImageChange} onCancel={()=>setShowAddGoat(false)} isEditing={!!editingGoat} onDelete={handleDeleteGoat} />
        ) : (
          <div style={{width:'100%'}}>
            {activeTab === 'profiles' && (
              <>
                <div className="search-bar" style={{background:'var(--bg-card)', padding:10, borderRadius:12, border:'1px solid var(--border-color)', display:'flex', alignItems:'center', gap:10, marginBottom:15}}>
                  <Search size={18} color="var(--text-sub)"/><input style={{border:'none', background:'none', color:'var(--text-main)', width:'100%', outline:'none'}} placeholder="Search herd..." onChange={e=>setSearchTerm(e.target.value)} />
                </div>
                <div style={{display:'flex', gap:8, marginBottom:20, overflowX:'auto'}}>
                  {['All','F','M','W'].map(s => <button key={s} onClick={()=>setFilterSex(s)} className={`btn-filter ${filterSex === s ? 'active' : ''}`}>{s==='All'?'All':s==='F'?'Does':s==='M'?'Bucks':'Wethers'}</button>)}
                </div>
                <div className="goat-grid">
                  {filtered.map(g => (
                    <div key={g.id} className="goat-card" style={{position:'relative'}}>
                      
                      {/* EDIT BUTTON (Image Icon) */}
                      <button 
                        className="edit-btn"
                        onClick={(e) => { e.stopPropagation(); handleEdit(g); }}
                        aria-label="Edit Goat"
                        style={{ 
                          background: 'rgba(255, 255, 255, 0.2)',
                          backdropFilter: 'blur(4px)',
                          border: '1px solid rgba(255, 255, 255, 0.3)',
                          borderRadius: '50%',
                          width: '32px', height: '32px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          padding: 0
                        }}
                      >
                        <img 
                          src="/editlogo.png" 
                          alt="Edit" 
                          style={{ width: '16px', height: '16px', opacity: 0.8 }} 
                        />
                      </button>

                      {g.image_url ? <img src={g.image_url} className="goat-avatar" style={{width:50, height:50, borderRadius:'50%', objectFit:'cover'}} alt=""/> : <div className="goat-avatar" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>🐐</div>}
                      <div className="goat-info">
                        <h3>{g.name}</h3>
                        <div style={{fontSize:12, color:'var(--text-sub)'}}>ID: G00{g.id}</div>
                        <span style={{fontSize:11, background:'var(--bg-app)', padding:'2px 8px', borderRadius:4}}>{g.breed || 'Unknown'} • {g.sex}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
            {activeTab === 'lineage' && <BreedingPanel goats={goats} isLoading={isFetching} />}
            {activeTab === 'health' && <><AlertsPanel /><HealthPanel goats={goats} isLoading={isFetching} showToast={showToast}/></>}
            {activeTab === 'reports' && <Reports />}
            
            {activeTab === 'settings' && (
              <div style={{display:'flex', flexDirection:'column', gap:15}}>
                {/* Profile Card */}
                <div className="glass-panel" style={{display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', borderRadius: '16px', marginBottom: '25px', border: '1px solid var(--border-color)'}}>
                  <div style={{width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold'}}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{fontSize: '11px', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '4px'}}>Logged in as</div>
                    <div style={{fontSize: '22px', fontWeight: '800', color: 'var(--text-main)'}}>{user.username}</div>
                  </div>
                </div>

                <h3 style={{color: 'var(--text-main)', marginTop: 0, fontSize: '18px'}}>Appearance</h3>
                <div className="theme-selector" style={{display:'flex', background:'var(--bg-card)', padding:5, borderRadius:12, gap:5, border:'1px solid var(--border-color)'}}>
                  {['light','dark','system'].map(t => (
                    <button key={t} onClick={()=>setTheme(t)} style={{flex:1, padding:10, border:'none', background:theme===t?'var(--bg-app)':'transparent', borderRadius:8, cursor:'pointer', color:'var(--text-main)', fontWeight:600}}>
                      {t.charAt(0).toUpperCase() + t.slice(1)}
                    </button>
                  ))}
                </div>

                <h3 style={{color: 'var(--text-main)', marginTop: '30px', fontSize: '18px'}}>Account</h3>
                
                {/* LOG OUT BUTTON (Using Modal) */}
                <div onClick={handleConfirmLogout} style={{padding:15, background:'var(--bg-card)', borderRadius:12, border:'1px solid var(--border-color)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', color:'var(--text-main)', fontWeight:600, marginBottom: 10}}>
                   <LogOut size={20}/> Log Out
                </div>
                
                {/* ACCOUNT DELETION (Uses Modal) */}
                <div onClick={handleDeleteAccount} style={{padding:15, background:'#fee2e2', borderRadius:12, border:'1px solid #fecaca', display:'flex', gap:10, alignItems:'center', cursor:'pointer', color:'#dc2626', fontWeight:600}}>
                   <LogOut size={20}/> Delete Account
                </div>
                
                <SettingsFooter />
              </div>
            )}
          </div>
        )}
      </main>

      {!showAddGoat && (
        <nav className="nav-bar glass-panel">
          <button className={`nav-item ${activeTab==='profiles'?'active':''}`} onClick={()=>setActiveTab('profiles')}><LayoutGrid size={20}/><span>Profiles</span></button>
          <button className={`nav-item ${activeTab==='lineage'?'active':''}`} onClick={()=>setActiveTab('lineage')}><Dna size={20}/><span>Lineage</span></button>
          <button className={`nav-item ${activeTab==='health'?'active':''}`} onClick={()=>setActiveTab('health')}><Activity size={20}/><span>Health</span></button>
          <button className={`nav-item ${activeTab==='reports'?'active':''}`} onClick={()=>setActiveTab('reports')}><FileText size={20}/><span>Reports</span></button>
          <button className={`nav-item ${activeTab==='settings'?'active':''}`} onClick={()=>setActiveTab('settings')}><Settings size={20}/><span>Settings</span></button>
        </nav>
      )}
    </div>
  );
}

export default App;
