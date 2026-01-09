import React, { useState, useEffect } from 'react';
import './App.css';
import { LayoutGrid, Dna, Activity, FileText, Settings, Search, Plus, Camera, LogOut, Sun, Moon, Monitor, X, Edit2 } from 'lucide-react';
import HealthPanel from './HealthPanel';
import BreedingPanel from './BreedingPanel';
import Reports from './Reports';
import AlertsPanel from './AlertsPanel';
import SettingsFooter from './SettingsFooter';
import Login from './Login';

// ☁️ CLOUDINARY CONFIGURATION
const CLOUD_NAME = "dvjxdxhdr"; 
const UPLOAD_PRESET = "goat_uploads";

// --- TOAST COMPONENT ---
const Toast = ({ message, type, onClose }) => (
  <div className={`toast ${type} glass-panel`}>
    <div style={{display:'flex', justifyContent:'space-between', alignItems:'center'}}>
      <span>{message}</span>
      <X size={14} style={{cursor:'pointer', marginLeft: 10}} onClick={onClose}/>
    </div>
  </div>
);

// --- ADD/EDIT FORM COMPONENT ---
const AddGoatView = ({ formData, setFormData, isSubmitting, isUploading, handleSubmit, handleImageChange, onCancel, isEditing }) => {
  return (
    <div className="add-goat-view">
      <div style={{textAlign:'center', padding:30, border:'2px dashed var(--border-color)', borderRadius:12, cursor:'pointer', marginBottom:20}}>
        <label style={{cursor:'pointer'}}>
          <input type="file" hidden onChange={handleImageChange} />
          {formData.image_url ? <img src={formData.image_url} style={{height:150, borderRadius:8}} alt=""/> : <div><Camera size={30} style={{color:'var(--text-sub)'}}/><p>{isEditing ? 'Change Photo' : 'Add Photo'}</p></div>}
        </label>
      </div>
      <form onSubmit={handleSubmit}>
        <label className="form-label">Name</label>
        <input className="form-input" name="name" value={formData.name} onChange={e=>setFormData({...formData, [e.target.name]:e.target.value})} required />
        <label className="form-label">Breed</label>
        <input className="form-input" name="breed" value={formData.breed} onChange={e=>setFormData({...formData, [e.target.name]:e.target.value})} />
        <label className="form-label">Sex</label>
        <select className="form-select" name="sex" value={formData.sex} onChange={e=>setFormData({...formData, [e.target.name]:e.target.value})}>
          <option value="F">Doe</option><option value="M">Buck</option><option value="W">Wether</option>
        </select>
        <label className="form-label">Date of Birth</label>
        <input className="form-input" type="date" name="dob" value={formData.dob} onChange={e=>setFormData({...formData, [e.target.name]:e.target.value})} />
        
        <div style={{display:'flex', gap:10, marginTop:20}}>
          <button type="button" onClick={onCancel} style={{flex:1, padding:12, border:'1px solid var(--border-color)', background:'transparent', borderRadius:8, cursor:'pointer', color:'var(--text-main)'}}>Cancel</button>
          <button type="submit" className="btn-primary" style={{flex:1, justifyContent:'center'}} disabled={isSubmitting || isUploading}>
            {isUploading ? 'Uploading...' : (isEditing ? 'Update Profile' : 'Create Profile')}
          </button>
        </div>
      </form>
    </div>
  );
};

function App() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000); 
  };

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

  if (!user) return <Login onLogin={handleLogin} />;

  const ProfilesView = () => (
    <div>
      <div className="search-bar">
        <Search size={18} color="var(--text-sub)" />
        <input className="search-input" placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
      </div>
      <div style={{display:'flex', gap:8, marginBottom:20, overflowX:'auto'}}>
        {['All','F','M','W'].map(s => (
          <button key={s} onClick={()=>setFilterSex(s)} style={{
            padding:'6px 16px', borderRadius:20, border:'1px solid var(--border-color)',
            background: filterSex === s ? 'var(--primary-bg)' : 'var(--bg-card)',
            color: filterSex === s ? 'var(--primary)' : 'var(--text-sub)', cursor:'pointer'
          }}>
            {s==='All'?'All':s==='F'?'Does':s==='M'?'Bucks':'Wethers'}
          </button>
        ))}
      </div>
      
      <div className="goat-grid">
        {filtered.map(g => (
          <div key={g.id} className="goat-card" style={{position: 'relative'}}>
            
            {/* UPDATED EDIT BUTTON (Manual SVG) */}
            <button 
              className="edit-btn"
              onClick={(e) => { e.stopPropagation(); handleEdit(g); }}
              aria-label="Edit Goat"
            >
              <svg 
                width="18" 
                height="18" 
                viewBox="0 0 24 24" 
                fill="none" 
                stroke="currentColor" 
                strokeWidth="2.5" 
                strokeLinecap="round" 
                strokeLinejoin="round"
              >
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            </button>

            {g.image_url ? <img src={g.image_url} className="goat-avatar" alt=""/> : <div className="goat-avatar" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>🐐</div>}
            <div className="goat-info">
              <h3>{g.name}</h3>
              <div style={{fontSize:12, color:'var(--text-sub)'}}>ID: G00{g.id}</div>
              <span style={{fontSize:11, background:'var(--bg-app)', padding:'2px 8px', borderRadius:4}}>{g.breed || 'Unknown'} • {g.sex}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="app-layout">
      {!showAddGoat && (
        <nav className="nav-bar glass-panel">
          <button className={`nav-item ${activeTab==='profiles'?'active':''}`} onClick={()=>setActiveTab('profiles')}><LayoutGrid size={24} /><span className="nav-label">Profiles</span></button>
          <button className={`nav-item ${activeTab==='lineage'?'active':''}`} onClick={()=>setActiveTab('lineage')}><Dna size={24} /><span className="nav-label">Lineage</span></button>
          <button className={`nav-item ${activeTab==='health'?'active':''}`} onClick={()=>setActiveTab('health')}><Activity size={24} /><span className="nav-label">Health</span></button>
          <button className={`nav-item ${activeTab==='reports'?'active':''}`} onClick={()=>setActiveTab('reports')}><FileText size={24} /><span className="nav-label">Reports</span></button>
          <button className={`nav-item ${activeTab==='settings'?'active':''}`} onClick={()=>setActiveTab('settings')}><Settings size={24} /><span className="nav-label">Settings</span></button>
        </nav>
      )}

      <div className="main-content">
        {toast && <Toast message={toast.msg} type={toast.type} onClose={()=>setToast(null)} />}
        
        <div className="app-header glass-panel">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src="/logo.png" alt="Logo" style={{ width: '32px', height: '32px', objectFit: 'contain' }} />
            <h1 className="app-title">
              {showAddGoat ? (editingGoat ? 'Edit Goat' : 'New Goat') : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
            </h1>
          </div>
          {activeTab === 'profiles' && !showAddGoat && (
            <button className="btn-primary" onClick={handleAddNew}><Plus size={18}/> <span className="nav-label">Add</span></button>
          )}
        </div>

        {showAddGoat ? (
          <AddGoatView 
            formData={formData} 
            setFormData={setFormData} 
            isSubmitting={isSubmitting} 
            isUploading={isUploading} 
            handleSubmit={handleSubmit} 
            handleImageChange={handleImageChange} 
            onCancel={() => setShowAddGoat(false)}
            isEditing={!!editingGoat}
          />
        ) : (
          <>
            {activeTab === 'profiles' && <ProfilesView />}
            
            <div className="page-container">
              {activeTab === 'lineage' && <BreedingPanel goats={goats} isLoading={isFetching} />}
              {activeTab === 'health' && <><AlertsPanel /><HealthPanel goats={goats} isLoading={isFetching} showToast={showToast} />
            </>}
              {activeTab === 'reports' && <Reports />}
              
              {activeTab === 'settings' && (
                <div className="screen-content">
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
                  <div className="theme-selector">
                    {['light','dark','system'].map(t => (
                      <button key={t} onClick={()=>setTheme(t)} className={`theme-btn ${theme === t ? 'active' : ''}`}>
                        {t === 'light' && <Sun size={18} />} {t === 'dark' && <Moon size={18} />} {t === 'system' && <Monitor size={18} />}
                        <span style={{marginLeft: 8}}>{t.charAt(0).toUpperCase() + t.slice(1)}</span>
                      </button>
                    ))}
                  </div>

                  <h3 style={{color: 'var(--text-main)', marginTop: '30px', fontSize: '18px'}}>Account</h3>
                  <div onClick={handleLogout} style={{padding:15, background:'var(--bg-card)', borderRadius:12, border:'1px solid var(--border-color)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', color:'var(--text-main)', fontWeight:600, marginBottom: 10}}>
                     <LogOut size={20}/> Log Out
                  </div>
                  <div onClick={async () => {
                    if (window.confirm("⚠️ Are you sure? This will delete your account and all data immediately.")) {
                      try {
                        const res = await fetch('/.netlify/functions/delete-account', { method: 'DELETE', body: JSON.stringify({ username: user.username }) });
                        if (res.ok) { alert("Account Deleted."); handleLogout(); } else { alert("Failed to delete account"); }
                      } catch (e) { alert("Error deleting account"); }
                    }
                  }} style={{padding:15, background:'#fee2e2', borderRadius:12, border:'1px solid #fecaca', display:'flex', gap:10, alignItems:'center', cursor:'pointer', color:'#dc2626', fontWeight:600}}>
                     <LogOut size={20}/> Delete Account
                  </div>
                  <SettingsFooter />
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default App;
