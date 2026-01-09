import React, { useState } from 'react';
import { Activity, Calendar, Syringe, FileText } from 'lucide-react';

const HealthPanel = ({ goats, isLoading }) => {
  const [formData, setFormData] = useState({
    goat_id: '',
    event_date: '',
    treatment: '',
    notes: '',
    next_due_date: ''
  });

  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');

    if (!formData.goat_id) return alert("Please select a goat first");

    const res = await fetch('/.netlify/functions/add-health-log', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      setSuccessMsg("Health Log Added Successfully!");
      setFormData({ goat_id: '', event_date: '', treatment: '', notes: '', next_due_date: '' });
      setTimeout(() => setSuccessMsg(''), 4000);
    } else {
      alert("Error adding log");
    }
  };

  return (
    <div className="glass-panel" style={{ 
      padding: '25px', 
      borderRadius: '20px', 
      border: '1px solid rgba(255, 152, 0, 0.3)', // Subtle Orange Border
      boxShadow: 'var(--shadow)',
      width: '100%',
      boxSizing: 'border-box'
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
        {/* Orange Icon Background */}
        <div style={{
          background: '#fff3e0', 
          padding: '8px', 
          borderRadius: '10px', 
          display: 'flex'
        }}>
          <Activity size={24} color="#f57c00" />
        </div>
        Health & Medical Log
      </h2>
      
      <form onSubmit={handleSubmit}>
        
        {/* GRID LAYOUT: Side-by-Side on Desktop */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
          gap: '20px',
          marginBottom: '20px'
        }}>
          
          <div className="form-group" style={{marginBottom: 0}}>
            <label className="form-label">Select Animal</label>
            <div style={{position: 'relative'}}>
              <select name="goat_id" className="form-select" value={formData.goat_id} onChange={handleChange} required style={{marginBottom: 0}}>
                <option value="">{isLoading ? "⏳ Loading..." : "-- Choose Goat --"}</option>
                {goats.map(g => (
                  <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group" style={{marginBottom: 0}}>
            <label className="form-label">Date Administered</label>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <Calendar size={20} style={{position: 'absolute', left: '14px', color: 'var(--text-sub)', pointerEvents: 'none'}} />
              <input type="date" name="event_date" className="form-input" value={formData.event_date} onChange={handleChange} required style={{paddingLeft: '45px', marginBottom: 0}}/>
            </div>
          </div>

        </div>

        <div className="form-group">
          <label className="form-label">Treatment / Procedure</label>
          <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            <Syringe size={20} style={{position: 'absolute', left: '14px', color: 'var(--text-sub)', pointerEvents: 'none'}} />
            <input type="text" name="treatment" className="form-input" placeholder="e.g. CDT Vaccine, Deworming" value={formData.treatment} onChange={handleChange} required style={{paddingLeft: '45px'}}/>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Notes (Dose, Reaction, etc.)</label>
          <div style={{position: 'relative'}}>
            <FileText size={20} style={{position: 'absolute', top: '14px', left: '14px', color: 'var(--text-sub)', pointerEvents: 'none'}} />
            <textarea name="notes" className="form-input" placeholder="Optional details..." value={formData.notes} onChange={handleChange} style={{paddingLeft: '45px', height: '80px', resize: 'vertical'}}></textarea>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label" style={{ color: '#e65100', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Calendar size={14} /> Next Due Date (For Alerts)
          </label>
          <input type="date" name="next_due_date" className="form-input" value={formData.next_due_date} onChange={handleChange} style={{border: '1px solid #ffcc80'}}/>
        </div>

        <button type="submit" className="btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: '10px', background: '#f57c00', padding: '14px', fontSize: '16px' }}>
          <Activity size={20} /> Log Health Event
        </button>
      </form>

      {/* --- SUCCESS MESSAGE --- */}
      {successMsg && (
        <div style={{ 
            marginTop: '20px', 
            padding: '15px', 
            backgroundColor: 'rgba(255, 152, 0, 0.1)', 
            border: '1px solid #ff9800', 
            borderRadius: '12px',
            color: '#e65100', 
            textAlign: 'center',
            fontWeight: '600'
        }}>
          ✅ {successMsg}
        </div>
      )}
    </div>
  );
};

export default HealthPanel;
