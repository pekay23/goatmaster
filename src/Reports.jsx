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
        if (typeof val === 'string' && val.includes('T') && val.length > 10) {
          if (!isNaN(Date.parse(val))) {
            newRow[key] = val.split('T')[0]; 
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
        const cleaned = cleanData(resData);
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
      padding: '15px', 
      borderRadius: '16px', 
      border: '1px solid var(--border-color)',
      marginBottom: '80px',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box'
    }}>
      <h2 style={{ 
        color: 'var(--text-main)', 
        marginTop: 0, 
        marginBottom: '15px',
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        fontSize: '20px'
      }}>
        <FileText size={24} /> Farm Reports
      </h2>
      
      {/* Scrollable Filters */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px', whiteSpace: 'nowrap' }}>
        {['herd', 'health', 'breeding'].map(type => (
          <button 
            key={type}
            onClick={() => setReportType(type)} 
            className={`btn-filter ${reportType === type ? 'active' : ''}`}
            style={{ fontSize: '13px', padding: '6px 12px' }}
          >
            {type === 'herd' ? 'Herd Census' : type === 'health' ? 'Health Issues' : 'Kidding Schedule'}
          </button>
        ))}
      </div>

      {/* Buttons */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
        <button onClick={exportToCSV} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '13px' }}>
          <Download size={14} /> CSV
        </button>
        <button onClick={exportToPDF} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '13px' }}>
          <Download size={14} /> PDF
        </button>
      </div>

      {/* Table Container */}
      {loading ? (
        <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '20px' }}>Loading data...</p>
      ) : data.length === 0 ? (
        <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>No records found.</p>
      ) : (
        <div style={{ 
          overflowX: 'auto', 
          borderRadius: '12px', 
          border: '1px solid var(--border-color)',
          maxWidth: '100%' 
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                {Object.keys(data[0]).map(key => (
                  <th key={key} style={{ 
                    padding: '10px', 
                    textAlign: 'left', 
                    fontSize: '12px', 
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
                      padding: '10px', 
                      fontSize: '13px', 
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
