import React, { useState, useRef, useEffect } from 'react';
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
  
  // --- AUTO-SIZE REMEDY ---
  const textareaRef = useRef(null);

  // This function runs every time you type to adjust the box height
  const adjustHeight = () => {
    const element = textareaRef.current;
    if (element) {
      element.style.height = 'auto'; // Reset height to recalculate
      element.style.height = `${element.scrollHeight}px`; // Set to content height
    }
  };

  // Adjust height on initial load or if notes are cleared
  useEffect(() => {
    adjustHeight();
  }, [formData.notes]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (e.target.name === 'notes') adjustHeight();
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
      padding: '20px', 
      borderRadius: '24px', 
      border: '1px solid rgba(255, 152, 0, 0.2)',
      width: '100%',
      boxSizing: 'border-box'
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
        <h2 style={{ color: 'var(--text-main)', margin: 0, display: 'flex', alignItems: 'center', gap: '12px', fontSize: '20px' }}>
            <div style={{ background: '#fff3e0', padding: '8px', borderRadius: '10px', display: 'flex' }}>
                <Activity size={22} color="#f57c00" />
            </div>
            Medical Log
        </h2>
      </div>
      
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px', marginBottom: '12px' }}>
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
          <label className="form-label">Procedure</label>
          <div style={{position: 'relative', display: 'flex', alignItems: 'center'}}>
            <Syringe size={18} style={{position: 'absolute', left: '14px', color: '#f57c00', opacity: 0.7}} />
            <input type="text" name="treatment" className="form-input" placeholder="What was done?" value={formData.treatment} onChange={handleChange} required style={{paddingLeft: '45px'}} />
          </div>
        </div>

        {/* --- ELASTIC AUTO-SIZE ADMIN NOTES --- */}
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
                ref={textareaRef}
                name="notes" 
                className="form-input" 
                placeholder="Type your notes here... (Box grows as you type)" 
                value={formData.notes} 
                onChange={handleChange} 
                style={{ 
                    width: '100%', 
                    paddingLeft: '45px', 
                    paddingTop: '12px',
                    minHeight: '50px', /* Starts small */
                    maxHeight: '300px', /* Limits growth so it doesn't push nav off screen */
                    lineHeight: '1.5',
                    overflowY: 'auto',
                    resize: 'none', /* Disable manual resize to keep UI clean */
                    backgroundColor: 'rgba(255, 255, 255, 0.03)',
                    border: '1px solid rgba(255, 152, 0, 0.15)',
                    fontSize: '16px',
                    transition: 'height 0.1s ease'
                }}
            ></textarea>
          </div>
        </div>

        <div className="form-group" style={{ background: 'rgba(255, 152, 0, 0.05)', padding: '15px', borderRadius: '16px', border: '1px dashed rgba(255, 152, 0, 0.2)' }}>
          <label className="form-label" style={{ color: '#e65100', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Calendar size={16} /> Remind me on:
          </label>
          <input type="date" name="next_due_date" className="form-input" value={formData.next_due_date} onChange={handleChange} style={{ marginBottom: 0 }} />
        </div>

        <button type="submit" className="btn-primary" disabled={isSubmitting || isLoading} style={{ width: '100%', justifyContent: 'center', marginTop: '15px', background: '#f57c00', padding: '14px', borderRadius: '12px' }}>
          {isSubmitting ? 'Saving...' : 'Save Health Record'}
        </button>
      </form>

      {successMsg && (
        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: 'rgba(46, 125, 50, 0.1)', borderRadius: '10px', color: '#2e7d32', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontWeight: '600', fontSize: '13px' }}>
          <CheckCircle size={16} /> {successMsg}
        </div>
      )}
    </div>
  );
};

export default HealthPanel;
