import React, { useState } from 'react';
import { Heart, Calendar, Calculator, Dna } from 'lucide-react';

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
      padding: '25px', 
      borderRadius: '20px',
      border: '1px solid var(--border-color)',
      width: '100%',
      boxSizing: 'border-box',
      boxShadow: 'var(--shadow)',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      
      {/* --- HEADER --- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{
          background: '#fce4ec', 
          padding: '12px', 
          borderRadius: '14px', 
          display: 'flex',
          boxShadow: '0 4px 10px rgba(233, 30, 99, 0.2)'
        }}>
          <Dna size={28} color="#e91e63" />
        </div>
        <div>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '20px', fontWeight: '700' }}>Breeding Tracker</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-sub)' }}>Calculate due dates & log lineage</p>
        </div>
      </div>
      
      {/* --- FORM --- */}
      <form onSubmit={handleSubmit}>
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
          <div className="form-group" style={{marginBottom: 0}}>
            <label className="form-label">Dam (Mother)</label>
            <select name="dam_id" className="form-select" value={formData.dam_id} onChange={handleChange} required>
                <option value="">{isLoading ? "⏳..." : "-- Select --"}</option>
                {dams.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="form-group" style={{marginBottom: 0}}>
            <label className="form-label">Sire (Father)</label>
            <select name="sire_id" className="form-select" value={formData.sire_id} onChange={handleChange}>
                <option value="">{isLoading ? "⏳..." : "-- Select --"}</option>
                {sires.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Date Bred</label>
          <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            <Calendar size={18} style={{position: 'absolute', left: '14px', color: 'var(--text-sub)', pointerEvents: 'none'}} />
            <input 
              type="date" 
              name="date_bred" 
              className="form-input" 
              value={formData.date_bred} 
              onChange={handleChange} 
              required 
              style={{paddingLeft: '45px'}} 
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px', background: '#e91e63', padding: '14px', fontSize: '15px', borderRadius: '12px' }}>
          <Calculator size={18} /> Calculate Due Date & Save
        </button>
      </form>

      {/* --- SUCCESS RESULT --- */}
      {successResult && (
        <div style={{ 
            padding: '15px', 
            backgroundColor: 'rgba(233, 30, 99, 0.05)', 
            border: '1px solid rgba(233, 30, 99, 0.2)', 
            borderRadius: '12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
        }}>
          <div>
            <div style={{fontSize: '12px', color: '#e91e63', fontWeight: 'bold', textTransform: 'uppercase'}}>Expected Kidding</div>
            <div style={{fontSize: '20px', fontWeight: '800', color: 'var(--text-main)'}}>{successResult.kiddingDate}</div>
          </div>
          <Heart size={24} color="#e91e63" fill="#e91e63" style={{opacity: 0.8}} />
        </div>
      )}

    </div>
  );
};

export default BreedingPanel;
