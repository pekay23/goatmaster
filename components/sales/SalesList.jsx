'use client';
import { Search, Trash2, FileText } from 'lucide-react';
import { useMemo, useState } from 'react';

export default function SalesList({ sales, onDeleteReceipt }) {
  const [searchTerm, setSearchTerm] = useState('');

  const filtered = useMemo(() => {
    if (!searchTerm.trim()) return [...sales].sort((a, b) => new Date(b.sale_date || 0) - new Date(a.sale_date || 0));
    const term = searchTerm.toLowerCase();
    return sales.filter(s =>
      s.customer?.toLowerCase().includes(term) ||
      s.contact_info?.toLowerCase().includes(term) ||
      s.items_data?.some(i => i.name?.toLowerCase().includes(term))
    ).sort((a, b) => new Date(b.sale_date || 0) - new Date(a.sale_date || 0));
  }, [sales, searchTerm]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="search-bar">
        <Search size={16} color="var(--text-sub)" />
        <input className="search-input" placeholder="Search sales by customer or item…" value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)} />
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state" style={{ padding: 30 }}>
          <div className="empty-state-icon">🛒</div>
          <h3>{searchTerm ? 'No matching sales' : 'No sales yet'}</h3>
          <p>{searchTerm ? 'Try a different search term.' : 'Record your first sale using the form above.'}</p>
        </div>
      ) : (
        filtered.map(sale => (
          <div key={sale.id} className="glass-panel" style={{ padding: '14px 16px', display: 'flex', justifyContent: 'space-between', gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 4 }}>
                <strong style={{ fontSize: 15, color: 'var(--text-main)' }}>{sale.customer}</strong>
                <span style={{ fontSize: 11, padding: '2px 6px', borderRadius: 4, background: '#dcfce7', color: '#166534', fontWeight: 700 }}>GH₵{parseFloat(sale.amount).toFixed(2)}</span>
                <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>{sale.sale_date?.split('T')[0]}</span>
              </div>
              {sale.contact_info && <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 4 }}>{sale.contact_info}</div>}
              {sale.items_data?.length > 0 && (
                <div style={{ fontSize: 12, color: 'var(--text-sub)', display: 'flex', gap: 4, flexWrap: 'wrap' }}>
                  {sale.items_data.map((item, i) => (
                    <span key={i}>{item.name} × {item.qty}{i < sale.items_data.length - 1 ? ', ' : ''}</span>
                  ))}
                </div>
              )}
            </div>
            <div style={{ display: 'flex', gap: 6, flexShrink: 0, alignItems: 'flex-start' }}>
              <button onClick={() => onDeleteReceipt(sale.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 4 }}>
                <Trash2 size={15} />
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}