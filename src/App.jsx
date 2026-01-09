import React, { useState, useEffect } from 'react';
import './App.css';
import { 
  LayoutGrid, 
  Dna, 
  Activity, 
  FileText, 
  Settings, 
  Search, 
  Plus, 
  Camera, 
  LogOut 
} from 'lucide-react';
import HealthPanel from './HealthPanel';
import BreedingPanel from './BreedingPanel';
import Reports from './Reports';
import AlertsPanel from './AlertsPanel';
import SettingsFooter from './SettingsFooter';
import Login from './Login';

// --- ☁️ CLOUDINARY CONFIGURATION ---
// ⚠️ PASTE YOUR KEYS HERE AGAIN!
const CLOUD_NAME = "dvjxdxhdr"; 
const UPLOAD_PRESET = "goat_uploads";

function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('goat_user');
    if (savedUser) setUser(JSON.parse(savedUser));
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('goat_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('goat_user');
  };

  // --- APP STATE ---
  const [activeTab, setActiveTab] = useState('profiles'); // Navigation State
  const [showAddGoat, setShowAddGoat] = useState(false); // Toggle Add Form
  
  const [goats, setGoats] = useState([]);
  const [isFetching, setIsFetching] = useState(true); 
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterSex, setFilterSex] = useState('All');
  
  const [formData, setFormData] = useState({ name: '', breed: '', sex: 'F', dob: '', image_url: '' });

  // Fetch Data
  const fetchGoats = async () => {
    setIsFetching(true);
    try {
      const response = await fetch('/.netlify/functions/get-goats');
      const data = await response.json();
      setGoats(data);
    } catch (error) {
      console.error("Error fetching goats:", error);
    } finally {
      setIsFetching(false);
    }
  };

  useEffect(() => {
    if (user) fetchGoats();
  }, [user]);

  // Image Upload Logic
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
      if (fileData.secure_url) {
        setFormData(prev => ({ ...prev, image_url: fileData.secure_url }));
      }
    } catch (error) {
      alert("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  const handleInputChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault(); 
    setIsSubmitting(true);
    try {
      const response = await fetch('/.netlify/functions/add-goat', { method: 'POST', body: JSON.stringify(formData) });
      if (response.ok) {
        alert('✅ Goat added successfully!');
        setFormData({ name: '', breed: '', sex: 'F', dob: '', image_url: '' }); 
        fetchGoats(); 
        setShowAddGoat(false); // Close the form after success
      } else {
        const errorText = await response.text();
        alert(`❌ Failed: ${errorText}`);
      }
    } catch (networkError) {
      alert(`❌ Network Error: ${networkError.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredGoats = goats.filter(goat => {
    const matchesSearch = goat.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesSex = filterSex === 'All' || goat.sex === filterSex;
    return matchesSearch && matchesSex;
  });

  // --- GATEKEEPER ---
  if (!user) return <Login onLogin={handleLogin} />;

  // --- UI COMPONENTS ---
  
  // 1. PROFILES SCREEN (List + Search)
  const ProfilesView = () => (
    <div className="screen-content">
      <div className="search-bar">
        <Search size={20} color="#888" />
        <input 
          type="text" 
          className="search-input" 
          placeholder="Search by ID or name..." 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Filter Chips */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto' }}>
        {['All', 'F', 'M', 'W'].map(sex => (
          <button 
            key={sex}
            className={`btn-filter ${filterSex === sex ? 'active' : ''}`}
            onClick={() => setFilterSex(sex)}
          >
            {sex === 'All' ? 'All' : sex === 'F' ? 'Female' : sex === 'M' ? 'Male' : 'Wether'}
          </button>
        ))}
      </div>

      {/* Goat List */}
      {isFetching ? <p>Loading herd...</p> : (
        <div>
          {filteredGoats.map((goat) => (
            <div key={goat.id} className="goat-card">
              {goat.image_url ? (
                <img src={goat.image_url} alt={goat.name} className="goat-avatar" />
              ) : (
                <div className="goat-avatar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🐐</div>
              )}
              <div className="goat-info">
                <h3>{goat.name}</h3>
                <div className="goat-id">ID: G00{goat.id}</div>
                <div className="badges">
                  <span className={`badge ${goat.sex}`}>
                    {goat.sex === 'F' ? 'Female' : goat.sex === 'M' ? 'Male' : 'Wether'}
                  </span>
                  {goat.breed && <span className="badge breed">{goat.breed}</span>}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  // 2. ADD GOAT SCREEN (Matches Image 2)
  const AddGoatView = () => (
    <div className="screen-content">
      <div className="photo-upload-box">
        <label style={{ cursor: 'pointer', display: 'block' }}>
           <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: 'none' }}/>
           {formData.image_url ? (
              <img src={formData.image_url} alt="Preview" style={{ width: '100%', borderRadius: '8px', maxHeight: '200px', objectFit: 'cover' }} />
           ) : (
             <>
               <Camera size={40} />
               <p>{isUploading ? "Uploading..." : "Add Photo"}</p>
             </>
           )}
        </label>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Name *</label>
          <input type="text" name="name" className="form-input" placeholder="Goat name" value={formData.name} onChange={handleInputChange} required />
        </div>
        <div className="form-group">
          <label className="form-label">Breed</label>
          <input type="text" name="breed" className="form-input" placeholder="e.g. Nubian" value={formData.breed} onChange={handleInputChange} />
        </div>
        <div className="form-group">
          <label className="form-label">Sex *</label>
          <select name="sex" className="form-select" value={formData.sex} onChange={handleInputChange}>
            <option value="F">Female</option>
            <option value="M">Male</option>
            <option value="W">Wether</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date of Birth</label>
          <input type="date" name="dob" className="form-input" value={formData.dob} onChange={handleInputChange} />
        </div>
        
        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '20px' }} disabled={isSubmitting || isUploading}>
           {isSubmitting ? 'Creating Profile...' : 'Create Goat Profile'}
        </button>
        <button type="button" onClick={() => setShowAddGoat(false)} style={{ width: '100%', padding: '15px', background: 'none', border: 'none', color: '#666', marginTop: '10px' }}>
          Cancel
        </button>
      </form>
    </div>
  );

  return (
    <div className="app-container">
      {/* HEADER */}
      <header className="app-header">
        {showAddGoat ? (
           <h1 className="app-title">Add New Goat</h1>
        ) : (
           <>
            <h1 className="app-title">
               {activeTab === 'profiles' ? 'Herd Profiles' : 
                activeTab === 'lineage' ? 'Lineage Tracking' :
                activeTab === 'health' ? 'Health Alerts' : 
                activeTab === 'reports' ? 'Reports' : 'Settings'}
            </h1>
            {activeTab === 'profiles' && (
              <button className="btn-primary" onClick={() => setShowAddGoat(true)}>
                <Plus size={18} /> Add Goat
              </button>
            )}
           </>
        )}
      </header>

      {/* MAIN CONTENT AREA */}
      <main>
        {showAddGoat ? (
          <AddGoatView />
        ) : (
          <>
            {activeTab === 'profiles' && <ProfilesView />}
            
            {activeTab === 'lineage' && (
              <div className="screen-content">
                <BreedingPanel goats={goats} isLoading={isFetching} />
              </div>
            )}
            
            {activeTab === 'health' && (
              <div className="screen-content">
                <AlertsPanel />
                <br/>
                <HealthPanel goats={goats} isLoading={isFetching} />
              </div>
            )}

            {activeTab === 'reports' && (
              <div className="screen-content">
                <Reports />
              </div>
            )}

            {activeTab === 'settings' && (
               <div className="screen-content">
                 <div className="goat-card" onClick={handleLogout} style={{ cursor: 'pointer', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                      <LogOut size={20} color="#dc3545" />
                      <strong>Log Out</strong>
                    </div>
                 </div>
                 <SettingsFooter />
               </div>
            )}
          </>
        )}
      </main>

      {/* BOTTOM NAVIGATION BAR */}
      {!showAddGoat && (
        <nav className="bottom-nav">
          <button className={`nav-item ${activeTab === 'profiles' ? 'active' : ''}`} onClick={() => setActiveTab('profiles')}>
            <LayoutGrid size={24} />
            <span>Profiles</span>
          </button>
          <button className={`nav-item ${activeTab === 'lineage' ? 'active' : ''}`} onClick={() => setActiveTab('lineage')}>
            <Dna size={24} />
            <span>Lineage</span>
          </button>
          <button className={`nav-item ${activeTab === 'health' ? 'active' : ''}`} onClick={() => setActiveTab('health')}>
            <Activity size={24} />
            <span>Health</span>
          </button>
          <button className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
            <FileText size={24} />
            <span>Reports</span>
          </button>
          <button className={`nav-item ${activeTab === 'settings' ? 'active' : ''}`} onClick={() => setActiveTab('settings')}>
            <Settings size={24} />
            <span>Settings</span>
          </button>
        </nav>
      )}
    </div>
  );
}

export default App;
