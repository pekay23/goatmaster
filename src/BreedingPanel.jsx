import React, { useState } from 'react';
import { Heart, Calendar, Calculator } from 'lucide-react'; // Added icons

const BreedingPanel = ({ goats, isLoading }) => {
  const [formData, setFormData] = useState({
    dam_id: '',
    sire_id: '',
    date_bred: ''
  });

  const [successResult, setSuccessResult] = useState(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessResult(null);

    if (!formData.dam_id || !formData.date_bred) return alert("Mother and Date are required");

    const res = await fetch('/.netlify/functions/add-breeding', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      const result = await res.json();
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
    <div className="glass-panel" style={{ 
      padding: '20px', 
      borderRadius: '16px',
      border: '1px solid var(--border-color)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <h2 style={{ 
        color: 'var(--text-main)', 
        marginTop: 0, 
        marginBottom: '20px',
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        fontSize: '20px'
      }}>
        <Heart size={24} color="#e91e63" /> Breeding Tracker
      </h2>
      
      <form onSubmit={handleSubmit}>
        
        <div className="form-group">
          <label className="form-label">Select Dam (Mother)</label>
          <select name="dam_id" className="form-select" value={formData.dam_id} onChange={handleChange} required>
             <option value="">{isLoading ? "⏳ Loading..." : "-- Choose Doe --"}</option>
             {dams.map(g => (
               <option key={g.id} value={g.id}>{g.name}</option>
             ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Select Sire (Father) - Optional</label>
          <select name="sire_id" className="form-select" value={formData.sire_id} onChange={handleChange}>
             <option value="">{isLoading ? "⏳ Loading..." : "-- Choose Buck --"}</option>
             {sires.map(g => (
               <option key={g.id} value={g.id}>{g.name}</option>
             ))}
          </select>
        </div>

        <div className="form-group">
          <label className="form-label">Date Bred</label>
          <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            <Calendar size={18} style={{position: 'absolute', left: '12px', color: 'var(--text-sub)', pointerEvents: 'none'}} />
            <input 
              type="date" 
              name="date_bred" 
              className="form-input" 
              value={formData.date_bred} 
              onChange={handleChange} 
              required 
              style={{paddingLeft: '40px'}} // Make room for icon
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px', background: '#e91e63' }}>
          <Calculator size={18} /> Calculate Due Date & Save
        </button>
      </form>

      {/* --- SUCCESS RESULT DISPLAY --- */}
      {successResult && (
        <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: 'rgba(233, 30, 99, 0.1)', 
            border: '1px solid #e91e63', 
            borderRadius: '12px',
            color: 'var(--text-main)', 
            textAlign: 'left'
        }}>
          <h3 style={{ color: '#e91e63', marginTop: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
            ✅ Success!
          </h3>
          
          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-sub)' }}>Mother:</span><br/>
            <span style={{ fontSize: '1.1em' }}>{successResult.damName}</span>
          </div>

          <div style={{ marginBottom: '8px' }}>
            <span style={{ fontWeight: '600', color: 'var(--text-sub)' }}>Estimated Kidding Date:</span><br/>
            <span style={{ fontSize: '1.4em', fontWeight: '800', color: '#e91e63' }}>
              {successResult.kiddingDate}
            </span>
          </div>

          <p style={{ margin: 0, fontSize: '0.85em', color: 'var(--text-sub)', fontStyle: 'italic' }}>
            (Approx. 150 days from breeding date)
          </p>
        </div>
      )}
    </div>
  );
};

export default BreedingPanel;
