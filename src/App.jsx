import React, { useState, useEffect } from 'react';
import './App.css';
import HealthPanel from './HealthPanel';
import BreedingPanel from './BreedingPanel';
import Reports from './Reports';
import AlertsPanel from './AlertsPanel';
import SettingsFooter from './SettingsFooter';
import Login from './Login'; // Import the Login Screen

// --- ☁️ CLOUDINARY CONFIGURATION ---
// ⚠️ PASTE YOUR KEYS HERE AGAIN!
const CLOUD_NAME = "dvjxdxhdr"; 
const UPLOAD_PRESET = "goat_uploads";

function App() {
  // --- AUTH STATE ---
  const [user, setUser] = useState(null);

  // Check if user was already logged in (Persistent Login)
  useEffect(() => {
    const savedUser = localStorage.getItem('goat_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('goat_user', JSON.stringify(userData)); // Save to browser
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('goat_user');
  };

  // --- APP STATE ---
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
    if (user) fetchGoats(); // Only fetch if logged in
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
      } else {
        alert("Image upload failed.");
      }
    } catch (error) {
      alert("Error uploading image");
    } finally {
      setIsUploading(false);
    }
  };

  // Form Submit Logic
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

  // --- 🔒 THE GATEKEEPER ---
  // If no user, show Login Screen instead of App
  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  // --- MAIN DASHBOARD ---
  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', padding: '20px', fontFamily: 'sans-serif' }}>
      
      {/* HEADER with Logout */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <div>
          <h1 style={{ margin: 0 }}>🐐 Goat Master</h1>
          <span style={{ fontSize: '0.8em', color: '#666' }}>Welcome, {user.username}</span>
        </div>
        <button onClick={handleLogout} style={{ padding: '8px 12px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Logout
        </button>
      </div>

      <AlertsPanel />

      <div style={{ border: '1px solid #ccc', padding: '20px', marginBottom: '20px', borderRadius: '8px', backgroundColor: '#fdfdfd' }}>
        <h2>Add New Goat</h2>
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <label style={{ fontWeight: 'bold' }}>Goat Photo:</label>
          <input type="file" accept="image/*" onChange={handleImageChange} style={{ padding: '10px' }}/>
          {isUploading && <p style={{ color: 'blue', fontStyle: 'italic' }}>☁️ Uploading photo...</p>}
          {formData.image_url && <img src={formData.image_url} alt="Preview" style={{ width: '100px', height: '100px', objectFit: 'cover', borderRadius: '8px' }} />}
          
          <input type="text" name="name" placeholder="Goat Name" value={formData.name} onChange={handleInputChange} required style={{ padding: '10px' }}/>
          <input type="text" name="breed" placeholder="Breed (e.g. Boer)" value={formData.breed} onChange={handleInputChange} style={{ padding: '10px' }}/>
          <select name="sex" value={formData.sex} onChange={handleInputChange} style={{ padding: '10px' }}>
            <option value="F">Doe (Female)</option>
            <option value="M">Buck (Male)</option>
            <option value="W">Wether</option>
          </select>
          <label>Date of Birth:</label>
          <input type="date" name="dob" value={formData.dob} onChange={handleInputChange} style={{ padding: '10px' }}/>
          <button type="submit" disabled={isSubmitting || isUploading} style={{ padding: '12px', backgroundColor: (isSubmitting || isUploading) ? '#ccc' : '#28a745', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
            {isUploading ? 'Uploading Image...' : isSubmitting ? 'Saving...' : 'Save Goat'}
          </button>
        </form>
      </div>

      <hr />
      
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <input type="text" placeholder="🔍 Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} style={{ flex: 1, padding: '10px', border: '1px solid #999', borderRadius: '4px' }} />
        <select value={filterSex} onChange={(e) => setFilterSex(e.target.value)} style={{ padding: '10px', border: '1px solid #999', borderRadius: '4px' }}>
          <option value="All">All Sexes</option>
          <option value="F">Does</option>
          <option value="M">Bucks</option>
          <option value="W">Wethers</option>
        </select>
      </div>

      <h2>Current Herd ({filteredGoats.length})</h2>
      {isFetching ? <p>Loading...</p> : (
        <div style={{ display: 'grid', gap: '10px', maxHeight: '400px', overflowY: 'auto' }}>
          {filteredGoats.map((goat) => (
            <div key={goat.id} style={{ display: 'flex', gap: '15px', alignItems: 'center', padding: '15px', border: '1px solid #ddd', borderRadius: '4px', backgroundColor: '#fff' }}>
              {goat.image_url ? <img src={goat.image_url} alt={goat.name} style={{ width: '60px', height: '60px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: '#eee', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>🐐</div>}
              <div><strong style={{ fontSize: '1.2em' }}>{goat.name}</strong><br/><span style={{ color: '#555' }}>{goat.breed} • {goat.sex}</span></div>
            </div>
          ))}
        </div>
      )}

      <HealthPanel goats={goats} isLoading={isFetching} />
      <BreedingPanel goats={goats} isLoading={isFetching} />
      <Reports />
      <SettingsFooter />

    </div>
  );
}

export default App;
