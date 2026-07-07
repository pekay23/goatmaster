import React, { useState } from 'react';
import { TrendingUp, Plus, Search, Trash2, Printer, ChevronDown } from 'lucide-react';
import { initDb, generateUUID } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function SalesPanel({ sales, inventory, isLoading, onUpdate, showToast, confirmAction, currency = 'GH₵' }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // POS State
  const [customer, setCustomer] = useState('');
  const [contactInfo, setContactInfo] = useState('');
  const [cart, setCart] = useState([]);
  const [deductInventory, setDeductInventory] = useState(true);

  const handleAddNew = () => {
    setCustomer('');
    setContactInfo('');
    setCart([]);
    setShowForm(true);
  };

  const addToCart = (e) => {
    const invId = e.target.value;
    if (!invId) return;
    
    const item = inventory.find(i => i.id === invId);
    if (!item) return;

    const existing = cart.find(c => c.id === item.id);
    if (existing) {
      setCart(cart.map(c => c.id === item.id ? { ...c, qty: c.qty + 1 } : c));
    } else {
      setCart([...cart, { ...item, qty: 1 }]);
    }
    e.target.value = ''; // Reset select
  };

  const updateCartQty = (id, delta) => {
    setCart(cart.map(c => {
      if (c.id === id) {
        const newQty = Math.max(1, c.qty + delta);
        return { ...c, qty: newQty };
      }
      return c;
    }));
  };

  const removeFromCart = (id) => {
    setCart(cart.filter(c => c.id !== id));
  };

  const totalAmount = cart.reduce((sum, item) => sum + (item.unit_price * item.qty), 0);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) {
      showToast('Add at least one item to the sale', 'error');
      return;
    }
    
    setIsSubmitting(true);
    try {
      const payload = { 
        id: generateUUID(), 
        customer, 
        contact_info: contactInfo, 
        amount: totalAmount, 
        items_data: cart.map(c => ({ id: c.id, name: c.name, qty: c.qty, price: c.unit_price })), 
        deduct_inventory: deductInventory,
        sale_date: new Date().toISOString()
      };
      
      const db = await initDb();
      await db.put('sales', payload);
      await queueSyncAction('sales', 'CREATE', payload);
      
      if (deductInventory) {
        for (const item of cart) {
          const invItem = inventory.find(i => i.id === item.id);
          if (invItem) {
            const updatedInv = { ...invItem, quantity: Math.max(0, invItem.quantity - item.qty) };
            await db.put('inventory', updatedInv);
            await queueSyncAction('inventory', 'UPDATE', updatedInv);
          }
        }
      }
      
      showToast('Sale recorded!'); 
      onUpdate(); 
      setShowForm(false);
    } catch (error) {
      console.error(error);
      showToast('Error recording sale', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id) => {
    confirmAction('Delete Sale?', 'Are you sure you want to delete this sale record?', 'Delete', 'Cancel', async () => {
      try {
        const db = await initDb();
        await db.delete('sales', id);
        await queueSyncAction('sales', 'DELETE', { id });
        
        showToast('Sale deleted'); 
        onUpdate(); 
      } catch {
        showToast('Error deleting sale', 'error');
      }
    });
  };

  const generateReceipt = (sale) => {
    const doc = new jsPDF();
    
    doc.setFontSize(22);
    doc.setTextColor(40, 40, 40);
    doc.text('GoatMaster Farm', 14, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100, 100, 100);
    doc.text('Sales Receipt', 14, 32);
    
    doc.setFontSize(10);
    doc.text(`Date: ${new Date(sale.sale_date).toLocaleDateString()}`, 14, 45);
    doc.text(`Customer: ${sale.customer}`, 14, 52);
    if (sale.contact_info) doc.text(`Contact: ${sale.contact_info}`, 14, 59);
    
    doc.text(`Receipt #: ${sale.id.split('-')[0].toUpperCase()}`, 140, 45);

    const items = sale.items_data || [];
    const tableData = items.map(item => [
      item.name, 
      item.qty.toString(), 
      `${currency}${item.price.toFixed(2)}`, 
      `${currency}${(item.qty * item.price).toFixed(2)}`
    ]);

    doc.autoTable({
      startY: 70,
      head: [['Item', 'Qty', 'Unit Price', 'Total']],
      body: tableData,
      theme: 'grid',
      headStyles: { fillColor: [44, 98, 59] },
      foot: [['', '', 'Grand Total:', `${currency}${parseFloat(sale.amount).toFixed(2)}`]],
      footStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0], fontStyle: 'bold' }
    });

    doc.setFontSize(10);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', 14, doc.lastAutoTable.finalY + 20);
    
    doc.save(`receipt_${sale.id.split('-')[0]}.pdf`);
  };

  const filtered = sales.filter(s => 
    s.customer.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (s.id && s.id.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {showForm ? (
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
          <h2 style={{ marginTop: 0 }}>New Sale</h2>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            
            <div style={{ display: 'flex', gap: 16 }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Customer Name</label>
                <input className="form-input" value={customer} onChange={e => setCustomer(e.target.value)} required />
              </div>
              <div className="form-group" style={{ flex: 1 }}>
                <label className="form-label">Contact Info (Optional)</label>
                <input className="form-input" value={contactInfo} onChange={e => setContactInfo(e.target.value)} />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span>Items in Sale</span>
              </label>
              
              <div style={{ position: 'relative', marginBottom: 12 }}>
                <select className="form-select" onChange={addToCart} defaultValue="" style={{ appearance: 'none' }}>
                  <option value="" disabled>+ Add an item to the sale...</option>
                  {inventory.filter(i => i.quantity > 0).map(item => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({currency}{item.unit_price} / {item.unit}) - {item.quantity} in stock
                    </option>
                  ))}
                </select>
                <ChevronDown size={16} color="var(--text-sub)" style={{ position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }} />
              </div>

              {cart.length > 0 && (
                <div style={{ border: '1px solid var(--border-color)', borderRadius: 12, overflow: 'hidden' }}>
                  {cart.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 12, background: idx % 2 === 0 ? 'var(--bg-app)' : 'transparent', borderBottom: idx < cart.length - 1 ? '1px solid var(--border-color)' : 'none' }}>
                      <div style={{ flex: 2, fontWeight: 600 }}>{item.name}</div>
                      <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <button type="button" onClick={() => updateCartQty(item.id, -1)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>-</button>
                        <span style={{ minWidth: 30, textAlign: 'center' }}>{item.qty}</span>
                        <button type="button" onClick={() => updateCartQty(item.id, 1)} style={{ padding: '4px 8px', borderRadius: 6, border: '1px solid var(--border-color)', background: 'var(--bg-card)', cursor: 'pointer' }}>+</button>
                      </div>
                      <div style={{ flex: 1, textAlign: 'right' }}>{currency}{(item.unit_price * item.qty).toFixed(2)}</div>
                      <button type="button" onClick={() => removeFromCart(item.id)} style={{ padding: 8, color: '#ef4444', background: 'transparent', border: 'none', cursor: 'pointer' }}><Trash2 size={16} /></button>
                    </div>
                  ))}
                  <div style={{ padding: 16, display: 'flex', justifyContent: 'space-between', background: 'var(--bg-card)', fontWeight: 700, fontSize: 18, borderTop: '1px solid var(--border-color)' }}>
                    <span>Total Amount:</span>
                    <span style={{ color: 'var(--primary)' }}>{currency}{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>

            <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 14, color: 'var(--text-sub)' }}>
              <input type="checkbox" checked={deductInventory} onChange={e => setDeductInventory(e.target.checked)} style={{ width: 16, height: 16, accentColor: 'var(--primary)' }} />
              Automatically deduct sold items from inventory stock
            </label>

            <div style={{ display: 'flex', gap: 10, marginTop: 10 }}>
              <button type="button" onClick={() => setShowForm(false)} className="btn-filter" style={{ flex: 1 }}>Cancel</button>
              <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSubmitting || cart.length === 0}>
                {isSubmitting ? 'Recording...' : 'Complete Sale'}
              </button>
            </div>
          </form>
        </div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
            <div className="search-bar" style={{ flex: 1, margin: 0 }}>
              <Search size={18} color="var(--text-sub)" />
              <input className="search-input" placeholder="Search sales by customer..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
            </div>
            <button className="btn-primary" onClick={handleAddNew} style={{ padding: '12px 16px' }}><Plus size={18} /> New Sale</button>
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
                <TrendingUp size={32} color="var(--text-sub)" />
                <p>No sales records found.</p>
              </div>
            ) : (
              filtered.map(sale => (
                <div key={sale.id} className="glass-panel" style={{ padding: 16, borderRadius: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <h3 style={{ margin: 0, fontSize: 16, color: 'var(--text-main)' }}>{sale.customer}</h3>
                    <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>
                      {new Date(sale.sale_date).toLocaleDateString()} &bull; {sale.items_data?.length || 0} items
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ fontWeight: 800, color: 'var(--primary)', fontSize: 18 }}>
                      {currency}{parseFloat(sale.amount).toFixed(2)}
                    </div>
                    <button onClick={() => generateReceipt(sale)} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', cursor: 'pointer', color: 'var(--text-main)', padding: 8, borderRadius: 8, display: 'flex', alignItems: 'center', gap: 6 }} title="Print Receipt">
                      <Printer size={16} />
                    </button>
                    <button onClick={() => handleDelete(sale.id)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#ef4444', padding: 8 }}>
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
