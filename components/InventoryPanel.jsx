import React, { useState } from 'react';
import { Package, AlertTriangle, Plus, Search, Trash2, Edit2, MinusCircle, X } from 'lucide-react';
import { initDb, generateUUID } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';

const EMPTY_ITEM = { name: '', category: 'Feed', quantity: 0, unit: 'kg', low_stock_threshold: 0, unit_price: 0, supplier: '' };

export default function InventoryPanel({ inventory, isLoading, onUpdate, showToast, confirmAction, currency = 'GH₵' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [formData, setFormData] = useState(EMPTY_ITEM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [usingItem, setUsingItem] = useState(null);
  const [usageQty, setUsageQty] = useState('');
  const [usageNotes, setUsageNotes] = useState('');

  const categories = ['All', ...new Set(inventory.map(i => i.category).filter(Boolean))];

  const handleAddNew = () => {
    setEditingItem(null);
    setFormData(EMPTY_ITEM);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setFormData(item);
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const action = editingItem ? 'UPDATE' : 'CREATE';
      const payload = { ...formData, id: editingItem ? editingItem.id : generateUUID() };
      
      const db = await initDb();
      await db.put('inventory', payload);
      await queueSyncAction('inventory', action, payload);
      
      showToast(editingItem ? 'Item updated!' : 'Item added!'); 
      onUpdate(); 
      setShowForm(false);
    } catch { 
      showToast('Error saving item locally', 'error'); 
    } finally { 
      setIsSubmitting(false); 
    }
  };

  const handleDelete = (id) => {
    confirmAction('Delete Item?', 'Are you sure you want to permanently delete this inventory item?', 'Delete', 'Cancel', async () => {
      try {
        const db = await initDb();
        await db.delete('inventory', id);
        await queueSyncAction('inventory', 'DELETE', { id });
        
        showToast('Item deleted'); 
        onUpdate(); 
      } catch {
        showToast('Error deleting item', 'error');
      }
    });
  };

  const handleUseItem = async (e, item) => {
    e.preventDefault();
    if (!usageQty || usageQty <= 0) return;
    
    setIsSubmitting(true);
    try {
      const db = await initDb();
      
      // Update inventory qty
      const updatedItem = { ...item, quantity: Math.max(0, item.quantity - parseFloat(usageQty)) };
      await db.put('inventory', updatedItem);
      await queueSyncAction('inventory', 'UPDATE', updatedItem);
      
      // Add usage log
      const logPayload = {
        id: generateUUID(),
        inventory_item_id: item.id,
        item_name: item.name,
        quantity_used: parseFloat(usageQty),
        unit: item.unit,
        notes: usageNotes,
        logged_at: new Date().toISOString()
      };
      await db.put('usage_logs', logPayload);
      await queueSyncAction('usage_logs', 'CREATE', logPayload);
      
      showToast(`Logged usage of ${usageQty} ${item.unit}`);
      onUpdate();
      setUsingItem(null);
      setUsageQty('');
      setUsageNotes('');
    } catch {
      showToast('Error logging usage', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filtered = inventory.filter(i => 
    i.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filterCategory === 'All' || i.category === filterCategory)
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {showForm ? (
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
          <h2 style={{ marginTop: 0 }}>{editingItem ? 'Edit Item' : 'Add Inventory Item'}</h2>
          <form onSubmit={handleSubmit} className="form-grid" style={{ gap: 16 }}>
            <div className="form-group">
              <label className="form-label">Name</label>
              <input className="form-input" value={formData.name} onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Category</label>
              <input className="form-input" list="inv-categories" value={formData.category} onChange={e => setFormData(p => ({ ...p, category: e.target.value }))} required />
              <datalist id="inv-categories">
                <option value="Feed" />
                <option value="Medicine" />
                <option value="Supplies" />
                <option value="Equipment" />
              </datalist>
            </div>
            <div className="form-group">
              <label className="form-label">Quantity</label>
              <input type="number" className="form-input" value={formData.quantity} onChange={e => setFormData(p => ({ ...p, quantity: e.target.value === '' ? '' : parseFloat(e.target.value) }))} required />
            </div>
            <div className="form-group">
              <label className="form-label">Unit</label>
              <input className="form-input" value={formData.unit} onChange={e => setFormData(p => ({ ...p, unit: e.target.value }))} placeholder="kg, lbs, bottles..." required />
            </div>
            <div className="form-group">
              <label className="form-label">Low Stock Threshold</label>
              <input type="number" className="form-input" value={formData.low_stock_threshold} onChange={e => setFormData(p => ({ ...p, low_stock_threshold: e.target.value === '' ? '' : parseFloat(e.target.value) }))} />
            </div>
            <div className="form-group">
              <label className="form-label">Unit Price ({currency})</label>
              <input type="number" step="0.01" className="form-input" value={formData.unit_price} onChange={e => setFormData(p => ({ ...p, unit_price: e.target.value === '' ? '' : parseFloat(e.target.value) }))} />
            </div>
            <div className="form-group" style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">Supplier (Optional)</label>
              <input className="form-input" value={formData.supplier} onChange={e => setFormData(p => ({ ...p, supplier: e.target.value }))} />
            </div>
            <div style={{ display: 'flex', gap: 10, marginTop: 10, gridColumn: '1 / -1' }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-filter" style={{ flex: 1, minHeight: 44 }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center', minHeight: 44 }} disabled={isSubmitting}>
                {isSubmitting ? 'Saving...' : 'Save Item'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
            <div className="search-bar" style={{ flex: 1, minWidth: 200, margin: 0 }}>
              <Search size={18} color="var(--text-sub)" />
              <input className="search-input" placeholder="Search inventory..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={handleAddNew} style={{ padding: '12px 16px', minHeight: 44, whiteSpace: 'nowrap' }}><Plus size={18} /> Add</button>
          </div>
          
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4, scrollbarWidth: 'none', msOverflowStyle: 'none', WebkitOverflowScrolling: 'touch' }}>
            {categories.map(c => (
              <button key={c} onClick={() => setFilterCategory(c)} className={`btn-filter ${filterCategory === c ? 'active' : ''}`} style={{ minHeight: 44, whiteSpace: 'nowrap', padding: '10px 16px' }}>{c}</button>
            ))}
            <style>{`
              .InventoryPanel div[style*="overflowX"]::-webkit-scrollbar { display: none; }
            `}</style>
          </div>

          <div className="card-grid" style={{ gap: 12 }}>
            {isLoading ? (
              [1, 2, 3].map(i => (
                <div key={i} className="skeleton skeleton-card" style={{ padding: 16, borderRadius: 12 }}>
                  <div className="skeleton skeleton-line medium" style={{ marginBottom: 8 }} />
                  <div className="skeleton skeleton-line short" />
                </div>
              ))
            ) : filtered.length === 0 ? (
              <div className="empty-state" style={{ gridColumn: '1 / -1' }}>
                <Package size={32} color="var(--text-sub)" />
                <p>No inventory items found.</p>
              </div>
            ) : (
              filtered.map(item => {
                const isLowStock = item.quantity <= (item.low_stock_threshold || 0);
                return (
                  <React.Fragment key={item.id}>
                  <div className="glass-panel" style={{ padding: 16, borderRadius: usingItem === item.id ? '12px 12px 0 0' : 12, display: 'flex', flexDirection: 'column', gap: 12, borderLeft: isLowStock ? '4px solid #ef4444' : '4px solid transparent' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)' }}>{item.name}</h3>
                          {isLowStock && <span style={{ background: '#fee2e2', color: '#dc2626', fontSize: 10, padding: '4px 8px', borderRadius: 4, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 4 }}><AlertTriangle size={10} /> LOW STOCK</span>}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>
                          {item.category} &bull; {item.quantity} {item.unit} in stock
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        <button onClick={() => { setUsingItem(item.id); setUsageQty(''); setUsageNotes(''); }} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#10b981', padding: 10, minHeight: 44, minWidth: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }} title="Log Usage">
                          <MinusCircle size={18} />
                        </button>
                        <button onClick={() => handleEdit(item)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-sub)', padding: 10, minHeight: 44, minWidth: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Edit2 size={18} />
                        </button>
                        <button onClick={() => handleDelete(item.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 10, minHeight: 44, minWidth: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </div>
                  </div>
                  {usingItem === item.id && (
                    <div style={{ padding: 16, background: 'var(--bg-app)', borderBottomLeftRadius: 12, borderBottomRightRadius: 12, borderTop: '1px dashed var(--border-color)', marginTop: -4 }}>
                      <form onSubmit={(e) => handleUseItem(e, item)} className="form-grid" style={{ gap: 10, gridTemplateColumns: '1fr' }}>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <input type="number" step="0.01" max={item.quantity} className="form-input" placeholder={`Qty (${item.unit})`} value={usageQty} onChange={e => setUsageQty(e.target.value)} required />
                        </div>
                        <div className="form-group" style={{ marginBottom: 0 }}>
                          <input type="text" className="form-input" placeholder="Notes (Optional)" value={usageNotes} onChange={e => setUsageNotes(e.target.value)} />
                        </div>
                        <div style={{ display: 'flex', gap: 8, gridColumn: '1 / -1' }}>
                          <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ flex: 1, justifyContent: 'center', minHeight: 44 }}>Log</button>
                          <button type="button" onClick={() => setUsingItem(null)} style={{ background: 'transparent', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', padding: 10, minHeight: 44, minWidth: 44, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><X size={18} /></button>
                        </div>
                      </form>
                    </div>
                  )}
                  </React.Fragment>
                );
              })
            )}
          </div>
        </>
      )}
    </div>
  );
}
