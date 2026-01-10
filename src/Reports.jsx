import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { Download, FileText, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('herd');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);

  // --- INTERACTIVE STATE ---
  const [tableSearch, setTableSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  // Helper: Clean Dates
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
    setTableSearch('');
    setSortConfig({ key: null, direction: 'asc' });
    
    fetch(`/.netlify/functions/get-reports?type=${reportType}`)
      .then(res => res.json())
      .then(resData => {
        const cleaned = cleanData(resData);
        setData(cleaned);
        setLoading(false);
      })
      .catch(err => console.error(err));
  }, [reportType]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const processedData = useMemo(() => {
    let items = [...data];
    if (tableSearch) {
      const lowerTerm = tableSearch.toLowerCase();
      items = items.filter(item => 
        Object.values(item).some(val => 
          String(val).toLowerCase().includes(lowerTerm)
        )
      );
    }
    if (sortConfig.key) {
      items.sort((a, b) => {
        const valA = a[sortConfig.key] ? String(a[sortConfig.key]).toLowerCase() : '';
        const valB = b[sortConfig.key] ? String(b[sortConfig.key]).toLowerCase() : '';
        if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
        if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return items;
  }, [data, tableSearch, sortConfig]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`${reportType.toUpperCase()} REPORT`, 14, 20);
    if(processedData.length > 0) {
        const headers = [Object.keys(processedData[0]).map(k => k.replace(/_/g, ' ').toUpperCase())];
        const rows = processedData.map(obj => Object.values(obj));
        doc.autoTable({ startY: 30, head: headers, body: rows });
    }
    doc.save(`${reportType}_report.pdf`);
  };

  const exportToCSV = () => {
    if (processedData.length === 0) return;
    const headers = Object.keys(processedData[0]).join(",");
    const rows = processedData.map(row => Object.values(row).join(",")).join("\n");
    const csvContent = headers + "\n" + rows;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    saveAs(blob, `${reportType}.csv`);
  };

  return (
    <div className="glass-panel" style={{ 
      padding: '20px', 
      borderRadius: '16px', 
      border: '1px solid var(--border-color)',
      marginBottom: '80px',
      width: '100%',
      maxWidth: '100%',
      boxSizing: 'border-box',
      display: 'flex',
      flexDirection: 'column',
      gap: '20px'
    }}>
      
      {/* --- HEADER --- */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
        <div style={{ background: '#e3f2fd', padding: '12px', borderRadius: '14px', display: 'flex' }}>
          <FileText size={28} color="#2196f3" />
        </div>
        <div>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: '20px', fontWeight: '700' }}>Farm Reports</h2>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-sub)' }}>Export data & analyze trends</p>
        </div>
      </div>
      
      {/* --- CONTENT --- */}
      <div style={{ width: '100%' }}>
        
        {/* 1. Report Type Toggles */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '15px', overflowX: 'auto', paddingBottom: '5px' }}>
          {['herd', 'health', 'breeding'].map(type => (
            <button 
              key={type}
              onClick={() => setReportType(type)} 
              className={`btn-filter ${reportType === type ? 'active' : ''}`}
              style={{ fontSize: '13px', padding: '6px 12px', whiteSpace: 'nowrap' }}
            >
              {type === 'herd' ? 'Herd Census' : type === 'health' ? 'Health Issues' : 'Kidding Schedule'}
            </button>
          ))}
        </div>

        {/* 2. Interactive Search Bar */}
        <div className="search-bar" style={{ marginBottom: '15px', background: 'var(--bg-app)' }}>
          <Search size={16} color="var(--text-sub)" />
          <input 
            className="search-input" 
            placeholder={`Search ${reportType} records...`} 
            value={tableSearch}
            onChange={e => setTableSearch(e.target.value)}
            style={{ fontSize: '14px' }}
          />
        </div>

        {/* 3. Export Buttons */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '15px' }}>
          <button onClick={exportToCSV} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '13px' }}>
            <Download size={14} /> CSV
          </button>
          <button onClick={exportToPDF} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: '13px' }}>
            <Download size={14} /> PDF
          </button>
        </div>

        {/* 4. Interactive Table */}
        {loading ? (
          <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '20px' }}>Loading data...</p>
        ) : processedData.length === 0 ? (
          <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: '20px', fontStyle: 'italic' }}>
            {tableSearch ? "No matches found." : "No records found."}
          </p>
        ) : (
          <div style={{ overflowX: 'auto', borderRadius: '12px', border: '1px solid var(--border-color)', maxWidth: '100%' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
              <thead>
                <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                  {Object.keys(data[0]).map(key => (
                    <th 
                      key={key} 
                      onClick={() => handleSort(key)}
                      style={{ 
                        padding: '12px 10px', 
                        textAlign: 'left', 
                        fontSize: '12px', 
                        fontWeight: '700', 
                        color: 'var(--text-sub)',
                        textTransform: 'capitalize',
                        whiteSpace: 'nowrap',
                        cursor: 'pointer',
                        userSelect: 'none'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {key.replace(/_/g, ' ')}
                        {sortConfig.key === key ? (
                          sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>
                        ) : (
                          <ArrowUpDown size={12} style={{ opacity: 0.3 }}/>
                        )}
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {processedData.map((row, i) => (
                  <tr 
                    key={i} 
                    style={{ 
                      borderBottom: '1px solid var(--border-color)',
                      transition: 'background 0.2s'
                    }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--bg-app)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    {Object.values(row).map((val, j) => (
                      <td key={j} style={{ 
                        padding: '12px 10px', 
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
    </div>
  );
};

export default Reports;
