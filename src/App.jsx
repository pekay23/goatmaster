import React, { useState, useEffect } from 'react';
import './App.css';
import { LayoutGrid, Dna, Activity, FileText, Settings, Search, Plus, Camera, LogOut, Sun, Moon, Monitor, X, Edit2 } from 'lucide-react';
import HealthPanel from './HealthPanel';
import BreedingPanel from './BreedingPanel';
import Reports from './Reports';
import AlertsPanel from './AlertsPanel';
import SettingsFooter from './SettingsFooter';
import Login from './Login';

const CLOUD_NAME = "dvjxdxhdr"; 
const UPLOAD_PRESET = "goat_uploads";

const AddGoatView = ({ formData, setFormData, isSubmitting, isUploading, handleSubmit, handleImageChange, onCancel, isEditing }) => (
  <div className="glass-panel" style={{padding: 20, borderRadius: 20}}>
    <div style={{textAlign:'center', padding:20, border:'2px dashed var(--border)', borderRadius:12, marginBottom:20}}>
      <label style={{cursor:'pointer'}}>
        <input type="file" hidden onChange={handleImageChange} />
        {formData.image_url ? <img src={formData.image_url} style={{height:120, borderRadius:8}} alt=""/> : <div><Camera size={30}/><p style={{color:'var(--text-sub)'}}>Add Photo</p></div>}
      </label>
    </div>
    <form onSubmit={handleSubmit}>
      <input className="form-input" placeholder="Goat Name" value={formData.name} onChange={e=>setFormData({...formData, name:e.target.value})} required style={{marginBottom:15}}/>
      <input className="form-input" placeholder="Breed" value={formData.breed} onChange={e=>setFormData({...formData, breed:e.target.value})} style={{marginBottom:15}}/>
      <select className="form-select" value={formData.sex} onChange={e=>setFormData({...formData, sex:e.target.value})} style={{marginBottom:15}}><option value="F">Female</option><option value="M">Male</option><option value="W">Wether</option></select>
      <input className="form-input" type="date" value={formData.dob} onChange={e=>setFormData({...formData, dob:e.target.value})} style={{marginBottom:20}}/>
      <div style={{display:'flex', gap:10}}><button type="button" onClick={onCancel} style={{flex:1, padding:12, borderRadius:10, border:'1px solid var(--border)', background:'none', color:'var(--text-main)', cursor:'pointer'}}>Cancel</button><button type="submit" className="btn-primary" style={{flex:1, justifyContent:'center'}} disabled={isSubmitting || isUploading}>{isEditing ? 'Update' : 'Create'}</button></div>
    </form>
  </div>
);

function App() {
  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState('profiles');
  const [showAddGoat, setShowAddGoat] = useState(false);
  const [editingGoat, setEditingGoat] = useState(null);
  const [formData, setFormData] = useState({ name: '', breed: '', sex: 'F', dob: '', image_url: '' });
  const [goats, setGoats] = useState([]);
  const [isFetching, setIsFetching] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [theme, setTheme] = useState(localStorage.getItem('goat_theme') || 'system');

  useEffect(() => {
    const saved = localStorage.getItem('goat_user');
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const isDark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', isDark ? 'dark' : 'light');
    localStorage.setItem('goat_theme', theme);
  }, [theme]);

  const fetchGoats = async () => {
    setIsFetching(true);
    try { const res = await fetch('/.netlify/functions/get-goats'); setGoats(await res.json()); } 
    finally { setIsFetching(false); }
  };

  useEffect(() => { if (user) fetchGoats(); }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    const endpoint = editingGoat ? '/.netlify/functions/update-goat' : '/.netlify/functions/add-goat';
    const method = editingGoat ? 'PUT' : 'POST';
    try {
      const res = await fetch(endpoint, { method, body: JSON.stringify(editingGoat ? {...formData, id: editingGoat.id} : formData) });
      if (res.ok) { fetchGoats(); setShowAddGoat(false); }
    } finally { setIsSubmitting(false); }
  };

  if (!user) return <Login onLogin={u => {setUser(u); localStorage.setItem('goat_user', JSON.stringify(u));}} />;

  return (
    <div className="app-layout">
      {/* GLASS HEADER */}
      <header className="app-header glass-panel">
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <img src="/logo.png" style={{width:28, height:28}} alt=""/>
          <h1 className="app-title">
  {showAddGoat ? (editingGoat ? 'Edit Goat' : 'New Goat') : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
</h1>

        </div>
        {!showAddGoat && activeTab === 'profiles' && (
          <button className="btn-primary" onClick={()=>{setEditingGoat(null); setFormData({name:'', breed:'', sex:'F', dob:'', image_url:''}); setShowAddGoat(true)}}><Plus size={16}/>Add</button>
        )}
      </header>

      <main className="main-content">
        {showAddGoat ? (
          <AddGoatView formData={formData} setFormData={setFormData} isSubmitting={isSubmitting} handleSubmit={handleSubmit} handleImageChange={async (e)=>{
            const file = e.target.files[0]; if (!file) return;
            const data = new FormData(); data.append("file", file); data.append("upload_preset", UPLOAD_PRESET);
            const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, { method: "POST", body: data });
            const f = await res.json(); setFormData(p=>({...p, image_url:f.secure_url}));
          }} onCancel={()=>setShowAddGoat(false)} isEditing={!!editingGoat} />
        ) : (
          <div style={{width:'100%'}}>
            {activeTab === 'profiles' && (
              <>
                <div className="glass-panel" style={{display:'flex', padding:10, borderRadius:12, gap:10, marginBottom:15}}>
                  <Search size={18} color="var(--text-sub)"/><input style={{border:'none', background:'none', color:'var(--text-main)', width:'100%', outline:'none'}} placeholder="Search herd..." onChange={e=>setSearchTerm(e.target.value)} />
                </div>
                {goats.filter(g=>g.name.toLowerCase().includes(searchTerm.toLowerCase())).map(g => (
                  <div key={g.id} className="goat-card glass-panel" style={{position:'relative'}}>
                    <button className="edit-btn" onClick={()=> {setEditingGoat(g); setFormData({name:g.name, breed:g.breed, sex:g.sex, dob:g.dob?g.dob.split('T')[0]:'', image_url:g.image_url}); setShowAddGoat(true)}}>
                      <Edit2 size={14}/>
                    </button>
                    {g.image_url ? <img src={g.image_url} className="goat-img-circle" style={{width:50, height:50, borderRadius:'50%'}} alt=""/> : <div style={{width:50, height:50, borderRadius:'50%', background:'rgba(0,0,0,0.05)', display:'flex', alignItems:'center', justifyContent:'center'}}>🐐</div>}
                    <div><h3 style={{margin:0, fontSize:16}}>{g.name}</h3><span style={{fontSize:12, color:'var(--text-sub)'}}>{g.breed} • {g.sex}</span></div>
                  </div>
                ))}
              </>
            )}
            {activeTab === 'lineage' && <BreedingPanel goats={goats} isLoading={isFetching} />}
            {activeTab === 'health' && <><AlertsPanel /><HealthPanel goats={goats} isLoading={isFetching}/></>}
            {activeTab === 'reports' && <Reports />}
            {activeTab === 'settings' && (
              <div style={{display:'flex', flexDirection:'column', gap:15}}>
                <div className="glass-panel" style={{display:'flex', alignItems:'center', gap:15, padding:20, borderRadius:16}}>
                  <div style={{width:50, height:50, borderRadius:'50%', background:'var(--primary)', color:'white', display:'flex', alignItems:'center', justifyContent:'center', fontWeight:'bold'}}>{user.username[0].toUpperCase()}</div>
                  <div><div style={{fontSize:11, color:'var(--text-sub)'}}>ACCOUNT</div><div style={{fontWeight:'bold'}}>{user.username}</div></div>
                </div>
                <div className="glass-panel" style={{display:'flex', padding:4, borderRadius:12, gap:4}}>
                  {['light','dark','system'].map(t => <button key={t} onClick={()=>setTheme(t)} style={{flex:1, padding:10, border:'none', borderRadius:8, background:theme===t?'var(--bg-app)':'none', color:theme===t?'var(--primary)':'var(--text-sub)', cursor:'pointer', fontWeight:600}}>{t.toUpperCase()}</button>)}
                </div>
                <button onClick={()=>{localStorage.removeItem('goat_user'); setUser(null)}} className="glass-panel" style={{width:'100%', padding:15, borderRadius:12, color:'#dc3545', fontWeight:700, cursor:'pointer', border:'1px solid rgba(220, 53, 69, 0.2)'}}>LOG OUT</button>
                <SettingsFooter />
              </div>
            )}
          </div>
        )}
      </main>

      {/* GLASS NAV BAR */}
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
