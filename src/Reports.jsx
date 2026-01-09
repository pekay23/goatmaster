import React, { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';

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
    <div style={{ padding: '20px', border: '1px solid #ccc', marginTop: '20px' }}>
      <h2>📊 Farm Reports</h2>
      
      <div style={{ marginBottom: '15px' }}>
        <button onClick={() => setReportType('herd')} style={{ marginRight: '10px' }}>Herd Summary</button>
        <button onClick={() => setReportType('health')}>Health Check</button>
      </div>

      <div style={{ marginBottom: '15px' }}>
        <button onClick={exportToCSV} style={{ marginRight: '10px', background: '#28a745', color: 'white' }}>Download CSV</button>
        <button onClick={exportToPDF} style={{ background: '#dc3545', color: 'white' }}>Download PDF</button>
      </div>

      {loading ? <p>Loading...</p> : (
        <table border="1" cellPadding="5" style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#f0f0f0' }}>
              {data.length > 0 && Object.keys(data[0]).map(key => <th key={key}>{key}</th>)}
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => (
              <tr key={i}>
                {Object.values(row).map((val, j) => <td key={j}>{val}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default Reports;
