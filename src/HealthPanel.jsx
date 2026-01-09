import React, { useState } from 'react';

// 1. Updated: accept 'isLoading' prop
const HealthPanel = ({ goats, isLoading }) => {
  const [formData, setFormData] = useState({
    goat_id: '',
    event_date: '',
    treatment: '',
    notes: '',
    next_due_date: ''
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.goat_id) return alert("Please select a goat first");

    const res = await fetch('/.netlify/functions/add-health-log', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    if (res.ok) {
      alert("Health Log Added!");
      setFormData({ goat_id: '', event_date: '', treatment: '', notes: '', next_due_date: '' });
    } else {
      alert("Error adding log");
    }
  };

  return (
    <div style={{ padding: '20px', border: '1px solid #ff9800', marginTop: '20px', borderRadius: '8px' }}>
      <h2 style={{ color: '#e65100' }}>🏥 Health & Medical Log</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        
        {/* Dropdown to select which goat got treated */}
        <label>Select Animal:</label>
        <select name="goat_id" value={formData.goat_id} onChange={handleChange} required style={{ padding: '8px' }}>
          
          {/* 2. Updated: Show meaningful loading text */}
          <option value="">
            {isLoading ? "⏳ Loading Goats..." : "-- Choose Goat --"}
          </option>
          
          {goats.map(g => (
            <option key={g.id} value={g.id}>{g.name} ({g.id})</option>
          ))}
        </select>

        <label>Date Administered:</label>
        <input type="date" name="event_date" value={formData.event_date} onChange={handleChange} required style={{ padding: '8px' }}/>

        <input type="text" name="treatment" placeholder="Treatment (e.g. CDT Vaccine)" value={formData.treatment} onChange={handleChange} required style={{ padding: '8px' }}/>

        <textarea name="notes" placeholder="Notes (Dose amount, reaction?)" value={formData.notes} onChange={handleChange} style={{ padding: '8px' }}></textarea>

        <label style={{ fontWeight: 'bold', color: 'red' }}>Next Due Date (For Alerts):</label>
        <input type="date" name="next_due_date" value={formData.next_due_date} onChange={handleChange} style={{ padding: '8px' }}/>

        <button type="submit" style={{ padding: '10px', background: '#ff9800', color: 'white', border: 'none', cursor: 'pointer' }}>
          Log Health Event
        </button>
      </form>
    </div>
  );
};

export default HealthPanel;
