'use client';
import React, { useState, useEffect, useMemo } from 'react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { saveAs } from 'file-saver';
import { Download, FileText, Search, ArrowUp, ArrowDown, ArrowUpDown } from 'lucide-react';

const Reports = () => {
  const [reportType, setReportType] = useState('herd');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [tableSearch, setTableSearch] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const cleanData = (rawData) => rawData.map(row => {
    const newRow = { ...row };
    Object.keys(newRow).forEach(key => {
      const val = newRow[key];
      if (typeof val === 'string' && val.includes('T') && val.length > 10 && !isNaN(Date.parse(val))) {
        newRow[key] = val.split('T')[0];
      }
    });
    return newRow;
  });

  useEffect(() => {
    setLoading(true);
    setTableSearch('');
    setSortConfig({ key: null, direction: 'asc' });
    fetch(`/api/reports?type=${reportType}`)
      .then(res => res.json())
      .then(resData => { setData(cleanData(Array.isArray(resData) ? resData : [])); setLoading(false); })
      .catch(() => setLoading(false));
  }, [reportType]);

  const handleSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc' }));
  };

  const processedData = useMemo(() => {
    let items = [...data];
    if (tableSearch) {
      const t = tableSearch.toLowerCase();
      items = items.filter(item => Object.values(item).some(val => String(val).toLowerCase().includes(t)));
    }
    if (sortConfig.key) {
      items.sort((a, b) => {
        const vA = String(a[sortConfig.key] ?? '').toLowerCase();
        const vB = String(b[sortConfig.key] ?? '').toLowerCase();
        return sortConfig.direction === 'asc' ? vA.localeCompare(vB) : vB.localeCompare(vA);
      });
    }
    return items;
  }, [data, tableSearch, sortConfig]);

  const exportToPDF = () => {
    const doc = new jsPDF();
    doc.text(`${reportType.toUpperCase()} REPORT`, 14, 20);
    if (processedData.length > 0) {
      const headers = [Object.keys(processedData[0]).map(k => k.replace(/_/g, ' ').toUpperCase())];
      const rows = processedData.map(obj => Object.values(obj));
      doc.autoTable({ startY: 30, head: headers, body: rows });
    }
    doc.save(`${reportType}_report.pdf`);
  };

  const exportToCSV = () => {
    if (!processedData.length) return;
    const headers = Object.keys(processedData[0]).join(',');
    const rows = processedData.map(row => Object.values(row).join(',')).join('\n');
    saveAs(new Blob([headers + '\n' + rows], { type: 'text/csv;charset=utf-8;' }), `${reportType}.csv`);
  };

  return (
    <div className="glass-panel" style={{ padding: 20, borderRadius: 16, border: '1px solid var(--border-color)', marginBottom: 40, width: '100%', boxSizing: 'border-box', display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 15 }}>
        <div style={{ background: '#e3f2fd', padding: 12, borderRadius: 14, display: 'flex' }}>
          <FileText size={28} color="#2196f3" />
        </div>
        <div>
          <h2 style={{ color: 'var(--text-main)', margin: 0, fontSize: 20, fontWeight: 700 }}>Farm Reports</h2>
          <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-sub)' }}>Export data & analyze trends</p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
        {['herd', 'health', 'breeding'].map(type => (
          <button key={type} onClick={() => setReportType(type)} className={`btn-filter ${reportType === type ? 'active' : ''}`}>
            {type === 'herd' ? 'Herd Census' : type === 'health' ? 'Health Issues' : 'Kidding Schedule'}
          </button>
        ))}
      </div>

      <div className="search-bar" style={{ background: 'var(--bg-app)', marginBottom: 0 }}>
        <Search size={16} color="var(--text-sub)" />
        <input className="search-input" placeholder={`Search ${reportType} records...`} value={tableSearch} onChange={e => setTableSearch(e.target.value)} style={{ fontSize: 14 }} />
      </div>

      <div style={{ display: 'flex', gap: 10 }}>
        <button onClick={exportToCSV} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: 13 }}>
          <Download size={14} /> CSV
        </button>
        <button onClick={exportToPDF} className="btn-primary" style={{ flex: 1, justifyContent: 'center', background: 'var(--bg-card)', color: 'var(--text-main)', border: '1px solid var(--border-color)', fontSize: 13 }}>
          <Download size={14} /> PDF
        </button>
      </div>

      {loading ? (
        <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: 20 }}>Loading…</p>
      ) : processedData.length === 0 ? (
        <p style={{ color: 'var(--text-sub)', textAlign: 'center', padding: 20, fontStyle: 'italic' }}>
          {tableSearch ? 'No matches found.' : 'No records found.'}
        </p>
      ) : (
        <div style={{ overflowX: 'auto', borderRadius: 12, border: '1px solid var(--border-color)' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', background: 'var(--bg-card)' }}>
            <thead>
              <tr style={{ background: 'var(--bg-app)', borderBottom: '1px solid var(--border-color)' }}>
                {Object.keys(data[0]).map(key => (
                  <th key={key} onClick={() => handleSort(key)} style={{ padding: '12px 10px', textAlign: 'left', fontSize: 12, fontWeight: 700, color: 'var(--text-sub)', whiteSpace: 'nowrap', cursor: 'pointer', userSelect: 'none' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      {key.replace(/_/g, ' ')}
                      {sortConfig.key === key ? (sortConfig.direction === 'asc' ? <ArrowUp size={12}/> : <ArrowDown size={12}/>) : <ArrowUpDown size={12} style={{ opacity: 0.3 }}/>}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {processedData.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border-color)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-app)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  {Object.values(row).map((val, j) => (
                    <td key={j} style={{ padding: '11px 10px', fontSize: 13, color: 'var(--text-main)', whiteSpace: 'nowrap' }}>{val}</td>
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
