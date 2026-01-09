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
      boxShadow: 'var(--shadow)'
    }}>
      <h2 style={{ 
        color: 'var(--text-main)', 
        marginTop: 0, 
        marginBottom: '25px',
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px',
        fontSize: '22px'
      }}>
        <div style={{
          background: '#fce4ec', 
          padding: '8px', 
          borderRadius: '10px', 
          display: 'flex'
        }}>
          <Dna size={24} color="#e91e63" />
        </div>
        Breeding Tracker
      </h2>
      
      <form onSubmit={handleSubmit}>
        
        {/* GRID LAYOUT: Side-by-Side Dropdowns */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '20px'
        }}>
          
          <div className="form-group" style={{marginBottom: 0}}>
            <label className="form-label">Select Dam (Mother)</label>
            <div style={{position: 'relative'}}>
              <select name="dam_id" className="form-select" value={formData.dam_id} onChange={handleChange} required style={{marginBottom: 0}}>
                 <option value="">{isLoading ? "⏳ Loading..." : "-- Choose Doe --"}</option>
                 {dams.map(g => (
                   <option key={g.id} value={g.id}>{g.name}</option>
                 ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{marginBottom: 0}}>
            <label className="form-label">Select Sire (Father)</label>
            <div style={{position: 'relative'}}>
              <select name="sire_id" className="form-select" value={formData.sire_id} onChange={handleChange} style={{marginBottom: 0}}>
                 <option value="">{isLoading ? "⏳ Loading..." : "-- Choose Buck --"}</option>
                 {sires.map(g => (
                   <option key={g.id} value={g.id}>{g.name}</option>
                 ))}
              </select>
            </div>
          </div>

        </div>

        <div className="form-group">
          <label className="form-label">Date Bred</label>
          <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            <Calendar size={20} style={{position: 'absolute', left: '14px', color: 'var(--text-sub)', pointerEvents: 'none'}} />
            <input 
              type="date" 
              name="date_bred" 
              className="form-input" 
              value={formData.date_bred} 
              onChange={handleChange} 
              required 
              style={{paddingLeft: '45px', marginBottom: 0}} 
            />
          </div>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '25px', background: '#e91e63', padding: '14px', fontSize: '16px' }}>
          <Calculator size={20} /> Calculate Due Date & Save
        </button>
      </form>

      {/* --- SUCCESS RESULT --- */}
      {successResult && (
        <div style={{ 
            marginTop: '25px', 
            padding: '20px', 
            backgroundColor: 'rgba(233, 30, 99, 0.08)', 
            border: '1px solid rgba(233, 30, 99, 0.3)', 
            borderRadius: '16px',
            color: 'var(--text-main)', 
            textAlign: 'center'
        }}>
          <Heart size={32} color="#e91e63" style={{marginBottom: '10px'}} fill="#e91e63" />
          <h3 style={{ color: '#e91e63', margin: '0 0 5px 0' }}>Success!</h3>
          <p style={{fontSize: '14px', color: 'var(--text-sub)', margin: 0}}>Breeding recorded for <strong>{successResult.damName}</strong></p>
          
          <div style={{margin: '15px 0', padding: '10px', background: 'var(--bg-card)', borderRadius: '10px', display: 'inline-block', border: '1px solid rgba(233, 30, 99, 0.2)'}}>
            <span style={{ fontSize: '0.9em', color: 'var(--text-sub)', display: 'block', marginBottom: '2px' }}>Expected Kidding Date</span>
            <span style={{ fontSize: '1.5em', fontWeight: '800', color: '#e91e63' }}>
              {successResult.kiddingDate}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default BreedingPanel;
