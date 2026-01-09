import React, { useState, useEffect } from 'react';

const AlertsPanel = () => {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/.netlify/functions/get-alerts')
      .then(res => res.json())
      .then(data => {
        setAlerts(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setLoading(false);
      });
  }, []);

  if (loading) return null; // Don't show anything while loading
  if (alerts.length === 0) return null; // Don't show the box if everything is good!

  // Helper to check if a date is in the past
  const isOverdue = (dateString) => {
    const today = new Date();
    today.setHours(0,0,0,0); // Reset time to midnight for accurate comparison
    const dueDate = new Date(dateString);
    return dueDate < today;
  };

  // Helper to format date nicely
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  return (
    <div style={{ 
      marginBottom: '20px', 
      border: '2px solid #d32f2f', 
      borderRadius: '8px', 
      overflow: 'hidden',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
    }}>
      {/* Header */}
      <div style={{ 
        backgroundColor: '#d32f2f', 
        color: 'white', 
        padding: '10px', 
        fontWeight: 'bold',
        display: 'flex',
        alignItems: 'center',
        gap: '10px'
      }}>
        <span>⚠️ Action Required</span>
        <span style={{ 
          backgroundColor: 'white', color: '#d32f2f', 
          borderRadius: '50%', width: '20px', height: '20px', 
          display: 'flex', justifyContent: 'center', alignItems: 'center', fontSize: '0.8em' 
        }}>
          {alerts.length}
        </span>
      </div>

      {/* List of Alerts */}
      <div style={{ backgroundColor: '#fff5f5', padding: '10px' }}>
        {alerts.map((alert) => {
          const overdue = isOverdue(alert.next_due_date);
          return (
            <div key={alert.id} style={{ 
              display: 'flex', 
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '10px',
              marginBottom: '8px',
              backgroundColor: 'white',
              borderLeft: overdue ? '5px solid #d32f2f' : '5px solid #ff9800',
              borderRadius: '4px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}>
              <div>
                <div style={{ fontWeight: 'bold' }}>{alert.name}</div>
                <div style={{ fontSize: '0.9em', color: '#555' }}>{alert.treatment}</div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ 
                  fontWeight: 'bold', 
                  color: overdue ? '#d32f2f' : '#ff9800' 
                }}>
                  {overdue ? 'PAST DUE' : 'UPCOMING'}
                </div>
                <div style={{ fontSize: '0.85em', color: '#666' }}>
                  {formatDate(alert.next_due_date)}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default AlertsPanel;
