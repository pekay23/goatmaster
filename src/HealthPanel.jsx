import React, { useState } from 'react';
import { Activity, Calendar, Syringe, FileText, CheckCircle } from 'lucide-react';

const HealthPanel = ({ goats, isLoading, showToast }) => {
  const [formData, setFormData] = useState({
    goat_id: '',
    event_date: new Date().toISOString().split('T')[0],
    treatment: '',
    notes: '',
    next_due_date: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.goat_id) {
        if (showToast) showToast("Please select a goat first", "error");
        return;
    }

    setIsSubmitting(true);
    setSuccessMsg('');

    try {
      const res = await fetch('/.netlify/functions/add-health-log', {
        method: 'POST',
        body: JSON.stringify(formData)
      });

      if (res.ok) {
        if (showToast) showToast("Medical record saved!");
        setSuccessMsg("Record added successfully!");
        setFormData({ ...formData, treatment: '', notes: '', next_due_date: '' });
        setTimeout(() => setSuccessMsg(''), 5000);
      }
    } catch (err) {
      if (showToast) showToast("Connection error", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="glass-panel" style={{ 
      padding: '25px', 
      borderRadius: '24px', 
      border: '1px solid rgba(255, 152, 0, 0.2)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '25px' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '22px' }}>
            <div style={{ background: '#fff3e0', padding: '10px', borderRadius: '12px', display: 'flex' }}>
                <Activity size={24} color="#f57c00" />
            </div>
            Medical Log
        </h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '15px', marginBottom: '15px' }}>
          <div className="form-group">
            <label className="form-label">Goat</label>
            <select name="goat_id" className="form-select" value={formData.goat_id} onChange={handleChange} required>
                <option value="">{isLoading ? "⏳ Syncing..." : "-- Select --"}</option>
                {goats.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Date</label>
            <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
              <Calendar size={18} style={{position: 'absolute', left: '14px', color: '#f57c00', opacity: 0.7}} />
              <input type="date" name="event_date" className="form-input" value={formData.event_date} onChange={handleChange} required style={{paddingLeft: '45px'}}/>
            </div>
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Procedure (e.g. Vaccination)</label>
          <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            <Syringe size={18} style={{position: 'absolute', left: '14px', color: '#f57c00', opacity: 0.7}} />
            <input type="text" name="treatment" className="form-input" placeholder="What was done?" value={formData.treatment} onChange={handleChange} required style={{paddingLeft: '45px'}} />
          </div>
        </div>

        {/* --- OPTIMIZED ADMIN NOTES BOX --- */}
        <div className="form-group">
          <label className="form-label">Admin Notes</label>
          <div style={{ position: 'relative' }}>
            <FileText 
                size={18} 
                style={{ 
                    position: 'absolute', 
                    top: '14px', 
                    left: '14px', 
                    color: '#f57c00', 
                    opacity: 0.6 
                }} 
            />
            <textarea 
                name="notes" 
                className="form-input" 
                placeholder="Add dosage, vet name, or observations..." 
                value={formData.notes} 
                onChange={handleChange} 
                style={{ 
                    paddingLeft: '45px', 
                    paddingTop: '12px',
                    height: '110px', 
                    lineHeight: '1.5',
                    resize: 'vertical',
                    backgroundColor: 'rgba(255, 255, 255, 0.03)', /* Slightly distinct */
                    border: '1px solid rgba(255, 152, 0, 0.15)'
                }}
            ></textarea>
          </div>
        </div>

        <div className="form-group" style={{ background: 'rgba(255, 152, 0, 0.05)', padding: '15px', borderRadius: '16px', border: '1px dashed rgba(255, 152, 0, 0.3)' }}>
          <label className="form-label" style={{ color: '#e65100', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} /> Remind me on:
          </label>
          <input type="date" name="next_due_date" className="form-input" value={formData.next_due_date} onChange={handleChange} style={{ marginBottom: 0 }} />
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting || isLoading} style={{ width: '100%', justifyContent: 'center', marginTop: '20px', background: '#f57c00', padding: '16px', borderRadius: '14px' }}>
          {isSubmitting ? 'Saving...' : 'Save Health Record'}
        </button>
      </form>

      {successMsg && (
        <div style={{ marginTop: '20px', padding: '12px', backgroundColor: 'rgba(46, 125, 50, 0.1)', borderRadius: '12px', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600' }}>
          <CheckCircle size={18} /> {successMsg}
        </div>
      )}
    </div>
  );
};

export default HealthPanel;
