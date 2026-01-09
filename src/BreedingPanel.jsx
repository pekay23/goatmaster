import React, { useState } from 'react';

const BreedingPanel = ({ goats, isLoading }) => {
  const [formData, setFormData] = useState({
    dam_id: '',
    sire_id: '',
    date_bred: ''
  });

  // New state to hold the result to display on screen
  const [successResult, setSuccessResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessResult(null); // Clear previous results

    if (!formData.dam_id || !formData.date_bred) return alert("Mother and Date are required");

    const res = await fetch('/.netlify/functions/add-breeding', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      const result = await res.json();
      
      // Find the name of the Mom (Dam) to display nicely
      const damName = goats.find(g => g.id.toString() === formData.dam_id)?.name || "Doe";

      setSuccessResult({
        damName: damName,
        kiddingDate: result.estimated_kidding_date
      });

      setFormData({ dam_id: '', sire_id: '', date_bred: '' });
    } else {
      alert("Error adding breeding log");
    }
  };

  const dams = goats.filter(g => g.sex === 'F');
  const sires = goats.filter(g => g.sex === 'M');

  return (
    <div style={{ padding: '20px', border: '1px solid #9c27b0', marginTop: '20px', borderRadius: '8px' }}>
      <h2 style={{ color: '#7b1fa2' }}>💞 Breeding Tracker</h2>
      
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        <label>Select Dam (Mother):</label>
        <select name="dam_id" value={formData.dam_id} onChange={handleChange} required style={{ padding: '8px' }}>
           <option value="">{isLoading ? "⏳ Loading..." : "-- Choose Doe --"}</option>
           {dams.map(g => (
             <option key={g.id} value={g.id}>{g.name}</option>
           ))}
        </select>

        <label>Select Sire (Father) - Optional:</label>
        <select name="sire_id" value={formData.sire_id} onChange={handleChange} style={{ padding: '8px' }}>
           <option value="">{isLoading ? "⏳ Loading..." : "-- Choose Buck --"}</option>
           {sires.map(g => (
             <option key={g.id} value={g.id}>{g.name}</option>
           ))}
        </select>

        <label>Date Bred:</label>
        <input type="date" name="date_bred" value={formData.date_bred} onChange={handleChange} required style={{ padding: '8px' }}/>

        <button type="submit" style={{ padding: '10px', background: '#9c27b0', color: 'white', border: 'none', cursor: 'pointer' }}>
          Calculate Due Date & Save
        </button>
      </form>

      {/* --- SUCCESS RESULT DISPLAY --- */}
      {successResult && (
        <div style={{ 
            marginTop: '15px', 
            padding: '15px', 
            backgroundColor: '#f3e5f5', // Light Purple Background
            border: '1px solid #9c27b0', 
            borderRadius: '5px',
            color: '#333333', // FORCE DARK TEXT COLOR
            textAlign: 'left'
        }}>
          <h3 style={{ color: '#7b1fa2', marginTop: 0 }}>✅ Success!</h3>
          
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Mother:</span><br/>
            <span style={{ fontSize: '1.1em' }}>{successResult.damName}</span>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: 'bold', color: '#555' }}>Estimated Kidding Date:</span><br/>
            <span style={{ fontSize: '1.4em', fontWeight: 'bold', color: '#d81b60' }}>
              {successResult.kiddingDate}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.85em', color: '#666', fontStyle: 'italic' }}>
            (Approx. 150 days from breeding date)
          </p>
        </div>
      )}
    </div>
  );
};

export default BreedingPanel;
