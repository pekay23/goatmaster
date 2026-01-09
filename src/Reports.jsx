import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { Download, FileText } from 'lucide-react'; // Import icons

const Reports = () => {
  const [reportType, setReportType] = useState('herd'); // default
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch Data
  useEffect(() => {
    setLoading(true);
    fetch(`/.netlify/functions/get-reports?type=${reportType}`)
      .then(res => res.json())
      .then(resData => {
        setData(resData);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [reportType]);

  // Export PDF
  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`${reportType.toUpperCase()} REPORT`, 14, 20);
    
    if(data.length > 0) {
        const headers = [Object.keys(data[0])];
        const rows = data.map(obj => Object.values(obj));
        doc.autoTable({ startY: 30, head: headers, body: rows });
    }
    
    doc.save(`${reportType}_report.pdf`);
  };

  // Export CSV
  const exportToCSV = () => {
    if (data.length === 0) return;
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map(row => Object.values(row).join(",")).join("\n");
    const csvContent = headers + "\n" + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${reportType}.csv`);
  };

  return (
    <div className="glass-panel" style={{ 
      padding: '20px', 
      borderRadius: '16px', 
      border: '1px solid var(--border-color)',
      marginBottom: '80px' // Space for bottom nav
    }}>
      <h2 style={{ color: 'var(--text-main)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <FileText size={24} /> Farm Reports
      </h2>
      
      {/* Report Switcher Buttons */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', overflowX: 'auto', paddingBottom: '5px' }}>
        {['herd', 'health', 'breeding'].map(type => (
          <button 
            key={type}
            onClick={() => setReportType(type)} 
            className={`btn-filter ${reportType === type ? 'active' : ''}`}
            style={{ whiteSpace: 'nowrap' }}
          >
            {type === 'herd' ? 'Herd Census' : type === 'health' ? 'Health Issues' : 'Kidding Schedule'}
          </button>
        ))}
      </div>

      {/* Export Actions */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={exportToCSV} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
          <Download size={16} /> CSV
        </button>
        <button onClick={exportToPDF} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
          <Download size={16} /> PDF
        </button>
      </div>

      {/* Data Table */}
      {loading ? (
        <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '20px' }}>Loading data...</p>
      ) : data.length === 0 ? (
        <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>No records found.</p>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                {Object.keys(data[0]).map(key => (
                  <th key={key} style={{ 
                    padding: '12px', 
                    textAlign: 'left', 
                    fontSize: '13px', 
                    fontWeight: '600', 
                    color: 'var(--text-sub)',
                    textTransform: 'capitalize'
                  }}>
                    {key.replace('_', ' ')}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {data.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} style={{ 
                      padding: '12px', 
                      fontSize: '14px', 
                      color: 'var(--text-main)' 
                    }}>
                      {val}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default Reports;
