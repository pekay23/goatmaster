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

// --- FORM COMPONENT ---
const AddGoatView = ({ formData, setFormData, isSubmitting, isUploading, handleSubmit, handleImageChange, onCancel, isEditing }) => (
  <div className="page-section-wrapper">
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
        <button type="submit" className="btn-primary" style={{flex:1, justifyContent:'center'}} disabled={isSubmitting || isUploading}>{isUploading ? 'Uploading...' : (isEditing ? 'Update' : 'Create')}</button>
      </div>
    </form>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [toast, setToast] = useState(null);
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
  const [theme, setTheme] = useState(localStorage.getItem('goat_theme') || 'system');

  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  useEffect(() => {
    const saved = localStorage.getItem('goat_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

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

  const fetchGoats = async () => {
    setIsFetching(true);
    try {
      const res = await fetch('/.netlify/functions/get-goats');
      setGoats(await res.json());
    } catch(e) { console.error(e); } 
    finally { setIsFetching(false); }
  };

  useEffect(() => { if (user) fetchGoats(); }, [user]);

  const handleAddNew = () => { setEditingGoat(null); setFormData({ name: '', breed: '', sex: 'F', dob: '', image_url: '' }); setShowAddGoat(true); };
  const handleEdit = (goat) => { setEditingGoat(goat); setFormData({ name: goat.name, breed: goat.breed || '', sex: goat.sex, dob: goat.dob ? goat.dob.split('T')[0] : '', image_url: goat.image_url || '' }); setShowAddGoat(true); };

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
    } catch { showToast("Upload failed", "error"); } 
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const endpoint = editingGoat ? '/.netlify/functions/update-goat' : '/.netlify/functions/add-goat';
    const method = editingGoat ? 'PUT' : 'POST';
    try {
      const res = await fetch(endpoint, { method, body: JSON.stringify(editingGoat ? {...formData, id: editingGoat.id} : formData) });
      if (res.ok) { showToast(editingGoat ? "Updated!" : "Added!"); fetchGoats(); setShowAddGoat(false); }
    } catch { showToast("Save error", "error"); }
    finally { setIsSubmitting(false); }
  };

  const filtered = goats.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()) && (filterSex === 'All' || g.sex === filterSex));

  if (!user) return <Login onLogin={u => {setUser(u); localStorage.setItem('goat_user', JSON.stringify(u));}} />;

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
            <h1 className="app-title">{showAddGoat ? (editingGoat ? 'Edit Goat' : 'New Goat') : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}</h1>
          </div>
          {activeTab === 'profiles' && !showAddGoat && (
            <button className="btn-primary" onClick={handleAddNew}><Plus size={18}/> <span className="nav-label">Add</span></button>
          )}
        </div>

        {showAddGoat ? (
          <AddGoatView formData={formData} setFormData={setFormData} isSubmitting={isSubmitting} isUploading={isUploading} handleSubmit={handleSubmit} handleImageChange={handleImageChange} onCancel={() => setShowAddGoat(false)} isEditing={!!editingGoat} />
        ) : (
          <div className="page-section-wrapper">
            {activeTab === 'profiles' && (
              <>
                <div className="search-bar" style={{background:'var(--bg-card)', padding:10, borderRadius:8, display:'flex', alignItems:'center', gap:10, marginBottom:15, border:'1px solid var(--border-color)'}}>
                  <Search size={18} color="var(--text-sub)" /><input style={{border:'none', outline:'none', background:'transparent', width:'100%', color:'var(--text-main)'}} placeholder="Search..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} />
                </div>
                <div style={{display:'flex', gap:8, marginBottom:20, overflowX:'auto'}}>
                  {['All','F','M','W'].map(s => <button key={s} onClick={()=>setFilterSex(s)} className={`btn-filter ${filterSex === s ? 'active' : ''}`}>{s==='All'?'All':s==='F'?'Does':s==='M'?'Bucks':'Wethers'}</button>)}
                </div>
                <div className="goat-grid">
                  {filtered.map(g => (
                    <div key={g.id} className="goat-card" style={{position:'relative'}}>
                      <button className="edit-btn" onClick={(e) => { e.stopPropagation(); handleEdit(g); }}><Edit2 size={16} /></button>
                      {g.image_url ? <img src={g.image_url} className="goat-avatar" alt=""/> : <div className="goat-avatar" style={{display:'flex',alignItems:'center',justifyContent:'center'}}>🐐</div>}
                      <div className="goat-info"><h3>{g.name}</h3><div style={{fontSize:12, color:'var(--text-sub)'}}>ID: G00{g.id}</div><span style={{fontSize:11, background:'var(--bg-app)', padding:'2px 8px', borderRadius:4}}>{g.breed || 'Unknown'} • {g.sex}</span></div>
                    </div>
                  ))}
                </div>
              </>
            )}
            
            {activeTab === 'lineage' && <BreedingPanel goats={goats} isLoading={isFetching} />}
            {activeTab === 'health' && <><AlertsPanel /><HealthPanel goats={goats} isLoading={isFetching} showToast={showToast}/></>}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'settings' && (
              <>
                <div className="glass-panel" style={{display: 'flex', alignItems: 'center', gap: '15px', padding: '20px', borderRadius: '16px', marginBottom: '20px'}}>
                  <div style={{width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '28px', fontWeight: 'bold'}}>{user.username.charAt(0).toUpperCase()}</div>
                  <div><div style={{fontSize: '11px', color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold', marginBottom: '4px'}}>Logged in as</div><div style={{fontSize: '22px', fontWeight: '800', color: 'var(--text-main)'}}>{user.username}</div></div>
                </div>
                <div style={{background:'var(--bg-card)', padding:5, borderRadius:12, display:'flex', gap:5, marginBottom:20, border:'1px solid var(--border-color)'}}>
                  {['light','dark','system'].map(t => <button key={t} onClick={()=>setTheme(t)} style={{flex:1, padding:8, border:'none', background:theme===t?'var(--bg-app)':'transparent', borderRadius:8, cursor:'pointer', color:'var(--text-main)', fontWeight:600}}>{t.charAt(0).toUpperCase() + t.slice(1)}</button>)}
                </div>
                <div onClick={handleLogout} style={{padding:15, background:'var(--bg-card)', borderRadius:12, border:'1px solid var(--border-color)', display:'flex', gap:10, alignItems:'center', cursor:'pointer', color:'var(--text-main)', fontWeight:600, marginBottom: 10}}><LogOut size={20}/> Log Out</div>
                <div onClick={async () => { if (window.confirm("⚠️ Delete account?")) { try { const res = await fetch('/.netlify/functions/delete-account', { method: 'DELETE', body: JSON.stringify({ username: user.username }) }); if (res.ok) { alert("Deleted."); handleLogout(); } } catch (e) { alert("Error."); } } }} style={{padding:15, background:'#fee2e2', borderRadius:12, border:'1px solid #fecaca', display:'flex', gap:10, alignItems:'center', cursor:'pointer', color:'#dc2626', fontWeight:600}}><LogOut size={20}/> Delete Account</div>
                <SettingsFooter />
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
