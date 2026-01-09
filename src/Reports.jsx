import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { Download, FileText } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('herd');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // Helper: Remove "T00:00:00.000Z" from dates
  const cleanData = (rawData) => {
    return rawData.map(row => {
      const newRow = { ...row };
      Object.keys(newRow).forEach(key => {
        const val = newRow[key];
        // Check if value is a string and looks like an ISO date (YYYY-MM-DDTHH...)
        if (typeof val === 'string' && val.includes('T') && val.length > 10) {
          // Check if it's actually a date
          if (!isNaN(Date.parse(val))) {
            newRow[key] = val.split('T')[0]; // Keep only the date part
          }
        }
      });
      return newRow;
    });
  };

  useEffect(() => {
    setLoading(true);
    fetch(`/.netlify/functions/get-reports?type=${reportType}`)
      .then(res => res.json())
      .then(resData => {
        const cleaned = cleanData(resData); // Clean dates before setting state
        setData(cleaned);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [reportType]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`${reportType.toUpperCase()} REPORT`, 14, 20);
    
    if(data.length > 0) {
        const headers = [Object.keys(data[0]).map(k => k.replace(/_/g, ' ').toUpperCase())];
        const rows = data.map(obj => Object.values(obj));
        doc.autoTable({ startY: 30, head: headers, body: rows });
    }
    
    doc.save(`${reportType}_report.pdf`);
  };

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
      marginBottom: '80px' 
    }}>
      <h2 style={{ color: 'var(--text-main)', marginTop: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
        <FileText size={24} /> Farm Reports
      </h2>
      
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

      <div style={{ display: 'flex', gap: '10px', marginBottom: '20px' }}>
        <button onClick={exportToCSV} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
          <Download size={16} /> CSV
        </button>
        <button onClick={exportToPDF} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)' }}>
          <Download size={16} /> PDF
        </button>
      </div>

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
                    textTransform: 'capitalize',
                    whiteSpace: 'nowrap'
                  }}>
                    {key.replace(/_/g, ' ')}
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
                      color: 'var(--text-main)',
                      whiteSpace: 'nowrap'
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
