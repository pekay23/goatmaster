'use client';
import { useState } from 'react';
import { Plus, X, Minus, ShoppingCart } from 'lucide-react';
import { initDb, generateUUID } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';

export default function SaleForm({ inventory, onSaved, showToast, onCancel }) {
  const [customer, setCustomer] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [cart, setCart] = useState([]);
  const [selectedItemId, setSelectedItemId] = useState('');
  const [deductInventory, setDeductInventory] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const addToCart = () => {
    if (!selectedItemId) return;
    const item = inventory.find(i => i.id === selectedItemId);
    if (!item) return;
    setCart(prev => {
      const existing = prev.find(c => c.id === item.id);
      if (existing) return prev.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { id: item.id, name: item.name, price: parseFloat(item.unit_price) || 0, qty: 1, unit: item.unit }];
    });
    setSelectedItemId('');
  };

  const updateCartQty = (id, qty) => {
    if (qty <= 0) { setCart(prev => prev.filter(c => c.id !== id)); return; }
    setCart(prev => prev.map(c => c.id === id ? { ...c, qty } : c));
  };

  const removeFromCart = (id) => setCart(prev => prev.filter(c => c.id !== id));

  const total = cart.reduce((sum, c) => sum + c.price * c.qty, 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!customer.trim() || cart.length === 0) { showToast?.('Customer name and at least one item required', 'error'); return; }
    setIsSubmitting(true);
    try {
      const payload = {
        id: generateUUID(),
        customer: customer.trim(),
        contact_info: contactInfo.trim(),
        amount: total,
        items_data: cart,
      };
      const db = await initDb();
      await db.put('sales', payload);
      await queueSyncAction('sales', 'CREATE', payload);

      if (deductInventory) {
        for (const item of cart) {
          const invItem = inventory.find(i => i.id === item.id);
          if (invItem) {
            const updated = { ...invItem, quantity: parseFloat(invItem.quantity) - item.qty };
            await db.put('inventory', updated);
            await queueSyncAction('inventory', 'UPDATE', updated);
          }
        }
      }
      showToast?.('Sale recorded!');
      onSaved?.();
    } catch (err) { console.error(err); showToast?.('Error saving sale', 'error'); }
    finally { setIsSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}>
      <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-main)' }}>🛒 New Sale / POS</h3>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Customer Name</label>
        <input type="text" className="form-input" value={customer} onChange={e => setCustomer(e.target.value)} placeholder="Customer name" required />
      </div>
      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Contact Info (Optional)</label>
        <input type="text" className="form-input" value={contactInfo} onChange={e => setContactInfo(e.target.value)} placeholder="Phone/email" />
      </div>

      <div style={{ display: 'flex', gap: 8 }}>
        <select className="form-select" value={selectedItemId} onChange={e => setSelectedItemId(e.target.value)} style={{ flex: 1 }}>
          <option value="">-- Add item --</option>
          {inventory.filter(i => parseFloat(i.quantity) > 0).map(i => (
            <option key={i.id} value={i.id}>{i.name} (GH₵{i.unit_price || 0} · {i.quantity} {i.unit})</option>
          ))}
        </select>
        <button type="button" onClick={addToCart} className="btn-primary" style={{ padding: '8px 14px' }}><Plus size={16} /></button>
      </div>

      {cart.length > 0 && (
        <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr style={{ background: 'var(--bg-app)' }}>
                <th style={{ padding: '8px 10px', textAlign: 'left', color: 'var(--text-sub)', fontWeight: 600 }}>Item</th>
                <th style={{ padding: '8px 10px', textAlign: 'center', color: 'var(--text-sub)', fontWeight: 600 }}>Qty</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-sub)', fontWeight: 600 }}>Price</th>
                <th style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-sub)', fontWeight: 600 }}>Total</th>
                <th style={{ padding: '8px 10px', width: 30 }}></th>
              </tr>
            </thead>
            <tbody>
              {cart.map(c => (
                <tr key={c.id}>
                  <td style={{ padding: '8px 10px', color: 'var(--text-main)' }}>{c.name}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                      <button type="button" onClick={() => updateCartQty(c.id, c.qty - 1)} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 6, width: 22, height: 22, cursor: 'pointer' }}><Minus size={10} /></button>
                      <span style={{ fontWeight: 700 }}>{c.qty}</span>
                      <button type="button" onClick={() => updateCartQty(c.id, c.qty + 1)} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 6, width: 22, height: 22, cursor: 'pointer' }}><Plus size={10} /></button>
                    </div>
                  </td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', color: 'var(--text-sub)' }}>GH₵{c.price.toFixed(2)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'right', fontWeight: 700, color: 'var(--text-main)' }}>GH₵{(c.price * c.qty).toFixed(2)}</td>
                  <td style={{ padding: '8px 10px', textAlign: 'center' }}>
                    <button type="button" onClick={() => removeFromCart(c.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444' }}><X size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan={3} style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: 'var(--text-main)', borderTop: '1px solid var(--border-color)' }}>Total</td>
                <td style={{ padding: '10px', textAlign: 'right', fontWeight: 800, color: '#10b981', borderTop: '1px solid var(--border-color)' }}>GH₵{total.toFixed(2)}</td>
                <td style={{ borderTop: '1px solid var(--border-color)' }}></td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-sub)', cursor: 'pointer' }}>
        <input type="checkbox" checked={deductInventory} onChange={e => setDeductInventory(e.target.checked)} />
        Deduct items from inventory
      </label>

      <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
        <button type="button" onClick={onCancel} style={{ flex: 1, padding: 12, border: '1.5px solid var(--border-color)', background: 'transparent', borderRadius: 12, cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
        <button type="submit" className="btn-primary" disabled={isSubmitting || cart.length === 0} style={{ flex: 1, justifyContent: 'center' }}>
          {isSubmitting ? 'Saving...' : `Complete Sale (GH₵${total.toFixed(2)})`}
        </button>
      </div>
    </form>
  );
}