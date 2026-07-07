import React, { useState } from 'react';
import { Wallet, Search, Plus, Trash2 } from 'lucide-react';
import { initDb, generateUUID } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';

const EMPTY_FORM = { amount: '', category: 'Feed', description: '', inventory_item_id: '' };
const CATEGORIES = ['Feed', 'Medicine', 'Equipment', 'Labour', 'Fuel', 'Other'];

export default function ExpenditurePanel({ expenditures, inventory, isLoading, onUpdate, showToast, confirmAction, currency = 'GH₵' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.amount || formData.amount <= 0) return;
    
    setIsSubmitting(true);
    try {
      const payload = {
        id: generateUUID(),
        amount: parseFloat(formData.amount),
        category: formData.category,
        description: formData.description,
        inventory_item_id: formData.inventory_item_id || null,
        spent_at: new Date().toISOString()
      };
      
      const db = await initDb();
      await db.put('expenditures', payload);
      await queueSyncAction('expenditures', 'CREATE', payload);
      
      showToast('Expenditure logged successfully');
      onUpdate();
      setShowForm(false);
      setFormData(EMPTY_FORM);
    } catch {
      showToast('Error saving expenditure', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    confirmAction('Delete Expenditure?', 'Are you sure you want to delete this expenditure record?', 'Delete', 'Cancel', async () => {
      try {
        const db = await initDb();
        await db.delete('expenditures', id);
        await queueSyncAction('expenditures', 'DELETE', { id });
        
        showToast('Record deleted');
        onUpdate();
      } catch {
        showToast('Error deleting record', 'error');
      }
    });
  };

  const filtered = expenditures.filter(e => 
    (e.description || '').toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterCategory === 'All' || e.category === filterCategory)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {showForm ? (
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
          <h2 style={{ marginTop: 0 }}>Log Expenditure</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Amount ({currency})</label>
                <input type="number" step="0.01" className="form-input" value={formData.amount} onChange={e => setFormData(p => ({ ...p, amount: e.target.value }))} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Category</label>
                <select className="form-input" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))}>
                  {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            
            <div className="form-group">
              <label className="form-label">Link to Inventory Item (Optional)</label>
              <select className="form-input" value={formData.inventory_item_id} onChange={e => setFormData(p => ({ ...p, inventory_item_id: e.target.value }))}>
                <option value="">-- No specific item --</option>
                {inventory.map(item => <option key={item.id} value={item.id}>{item.name}</option>)}
              </select>
              <p style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 4 }}>Link this expense to a specific inventory restock if applicable.</p>
            </div>

            <div className="form-group">
              <label className="form-label">Description / Notes</label>
              <input type="text" className="form-input" value={formData.description} onChange={e => setFormData(p => ({ ...p, description: e.target.value }))} placeholder="e.g. Bought 10 bags of grower feed" required />
            </div>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-filter" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Log Expense'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1, margin: 0 }}>
              <Search size={18} color="var(--text-sub)" />
              <input className="search-input" placeholder="Search expenses..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={() => setShowForm(true)} style={{ padding: '12px 16px' }}><Plus size={18} /> Add</button>
          </div>
          
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {['All', ...CATEGORIES].map(c => (
              <button key={c} onClick={() => setFilterCategory(c)} className={`btn-filter ${filterCategory === c ? 'active' : ''}`}>{c}</button>
            ))}
          </div>

          <div style={{ display: 'grid', gap: 12 }}>
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="skeleton skeleton-card" style={{ padding: 16, borderRadius: 12 }}>
                  <div className="skeleton skeleton-line medium" style={{ marginBottom: 8 }} />
                  <div className="skeleton skeleton-line short" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="empty-state">
                <Wallet size={32} color="var(--text-sub)" />
                <p>No expenditures found.</p>
              </div>
            ) : (
              filtered.map(exp => (
                <div key={exp.id} className="glass-panel" style={{ padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)' }}>{exp.description}</h3>
                    <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>
                      {exp.category} &bull; {new Date(exp.spent_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <span style={{ fontSize: 18, fontWeight: 700, color: '#ef4444' }}>
                      -{currency}{parseFloat(exp.amount).toFixed(2)}
                    </span>
                    <button onClick={() => handleDelete(exp.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 8 }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}
