'use client';
import React, { useState, useRef, useEffect } from 'react';
import { Camera, CheckCircle, Package } from 'lucide-react';
import { initDb, generateUUID } from '@/lib/localDb';
import { queueSyncAction } from '@/lib/sync';
import { PRESET_CATEGORIES } from './constants';
import { extractKeywords } from './utils';
import GoatTagSelector from './GoatTagSelector';
import ImageUploader from '../shared/ImageUploader';

export default function EventForm({ goats, inventory, editingEventId, onSaved, showToast, onCancel }) {
  const [subject, setSubject] = useState('');
  const [details, setDetails] = useState('');
  const [eventDate, setEventDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('General');
  const [customCategory, setCustomCategory] = useState('');
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState(false);
  const [selectedGoatIds, setSelectedGoatIds] = useState([]);
  const [imageUrl, setImageUrl] = useState('');
  const [inventoryItemId, setInventoryItemId] = useState('');
  const [quantityUsed, setQuantityUsed] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const textareaRef = useRef(null);

  useEffect(() => {
    const el = textareaRef.current;
    if (el) { el.style.height = 'auto'; el.style.height = `${el.scrollHeight}px`; }
  }, [details]);

  // Load editing data
  useEffect(() => {
    if (!editingEventId) return;
    const evt = goats.length ? null : null; // placeholder — actual edit data set by parent via the function below
  }, [editingEventId, goats]);

  // Exposed method for parent to populate form for editing
  React.useImperativeHandle(
    React.createRef(),
    () => ({ loadEvent: (evt) => {
      setSubject(evt.subject || '');
      setDetails(evt.details || '');
      setEventDate(evt.event_date ? evt.event_date.split('T')[0] : new Date().toISOString().split('T')[0]);
      setImageUrl(evt.image_url || '');
      setInventoryItemId(evt.inventory_item_id || '');
      setQuantityUsed(evt.quantity_used || '');
      if (PRESET_CATEGORIES.includes(evt.category)) {
        setCategory(evt.category); setIsCustomCategoryMode(false);
      } else if (evt.category) {
        setCategory('Custom'); setIsCustomCategoryMode(true); setCustomCategory(evt.category);
      } else {
        setCategory('General');
      }
      setSelectedGoatIds(Array.isArray(evt.goat_ids) ? evt.goat_ids : []);
    }}),
    []
  );

  const resetForm = () => {
    setSubject(''); setDetails(''); setImageUrl(''); setInventoryItemId(''); setQuantityUsed('');
    setEventDate(new Date().toISOString().split('T')[0]); setCategory('General');
    setCustomCategory(''); setIsCustomCategoryMode(false); setSelectedGoatIds([]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!subject.trim()) { showToast?.('Subject/Title is required', 'error'); return; }
    const finalCategory = isCustomCategoryMode && customCategory.trim()
      ? customCategory.trim() : (category === 'Custom' ? 'General' : category);
    const keywords = extractKeywords(subject);

    setIsSubmitting(true);
    try {
      const payload = {
        id: editingEventId || generateUUID(),
        subject: subject.trim(), details: details.trim(), event_date: eventDate,
        category: finalCategory, keywords, goat_ids: selectedGoatIds,
        image_url: imageUrl || null,
        inventory_item_id: inventoryItemId || null,
        quantity_used: quantityUsed ? parseFloat(quantityUsed) : null,
      };
      const db = await initDb();
      await db.put('farm_events', payload);
      await queueSyncAction('farm_events', editingEventId ? 'UPDATE' : 'CREATE', payload);
      showToast?.(editingEventId ? 'Event updated successfully!' : 'Farm event recorded!');
      resetForm();
      onSaved?.();
    } catch (err) {
      console.error(err); showToast?.('Error saving event record', 'error');
    } finally { setIsSubmitting(false); }
  };

  return (
    <form onSubmit={handleSubmit} className="glass-panel" style={{ padding: '20px 18px', display: 'flex', flexDirection: 'column', gap: 16, width: '100%', boxSizing: 'border-box' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>
          {editingEventId ? '✏️ Modify Event' : '📝 New Farm Event Record'}
        </h3>
        {editingEventId && (
          <button type="button" onClick={() => { resetForm(); onCancel?.(); }} style={{ fontSize: 12, color: 'var(--text-sub)', background: 'transparent', border: 'none', cursor: 'pointer', textDecoration: 'underline' }}>
            Cancel editing
          </button>
        )}
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label" style={{ fontWeight: 700 }}>Title / Subject <span style={{ color: '#ef4444' }}>*</span></label>
        <input type="text" className="form-input" placeholder="e.g. Dewormed all does in pen 3..." value={subject}
          onChange={e => setSubject(e.target.value)} required />
        {subject.trim() && (
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center', marginTop: 8 }}>
            <span style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600 }}>Detected Keywords:</span>
            {extractKeywords(subject).map(kw => (
              <span key={kw} style={{ fontSize: 11, padding: '2px 8px', borderRadius: 12, background: 'rgba(99, 102, 241, 0.12)', color: '#6366f1', fontWeight: 600 }}>#{kw}</span>
            ))}
            {extractKeywords(subject).length === 0 && (
              <span style={{ fontSize: 11, color: 'var(--text-sub)', fontStyle: 'italic' }}>No key terms extracted</span>
            )}
          </div>
        )}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
        <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
          <label className="form-label">Event Date</label>
          <input type="date" className="form-input" value={eventDate} onChange={e => setEventDate(e.target.value)} required />
        </div>
        <div className="form-group" style={{ flex: '1 1 200px', marginBottom: 0 }}>
          <label className="form-label">Category</label>
          {!isCustomCategoryMode ? (
            <select className="form-select" value={category} onChange={e => {
              if (e.target.value === 'Custom') { setIsCustomCategoryMode(true); setCategory('Custom'); }
              else setCategory(e.target.value);
            }}>
              {PRESET_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
              <option value="Custom">✨ + Custom Category...</option>
            </select>
          ) : (
            <div style={{ display: 'flex', gap: 6 }}>
              <input type="text" className="form-input" placeholder="Enter custom category name..." value={customCategory}
                onChange={e => setCustomCategory(e.target.value)} required />
              <button type="button" onClick={() => { setIsCustomCategoryMode(false); setCategory('General'); }}
                style={{ padding: '0 12px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 10, color: 'var(--text-sub)', cursor: 'pointer', fontSize: 12 }}>Select</button>
            </div>
          )}
        </div>
      </div>

      <div className="form-group" style={{ marginBottom: 0 }}>
        <label className="form-label">Details / Observations (Optional)</label>
        <textarea ref={textareaRef} className="form-input" placeholder="Add full notes, observations, dosages, cost, or specifics..."
          value={details} onChange={e => setDetails(e.target.value)} style={{ minHeight: 80, maxHeight: 220, resize: 'none', overflowY: 'auto', lineHeight: 1.5 }} />
      </div>

      <GoatTagSelector goats={goats} selectedGoatIds={selectedGoatIds}
        onToggle={(gid) => setSelectedGoatIds(prev => prev.includes(gid) ? prev.filter(id => id !== gid) : [...prev, gid])}
        onSelectGroup={(sex) => {
          const targetIds = goats.filter(g => sex === 'All' || g.sex === sex).map(g => g.id);
          setSelectedGoatIds(Array.from(new Set([...selectedGoatIds, ...targetIds])));
        }}
        onClear={() => setSelectedGoatIds([])} />

      <ImageUploader imageUrl={imageUrl} onImageChange={setImageUrl} label="Photo Attachment" showToast={showToast} />

      <div style={{ background: 'var(--bg-app)', padding: 14, borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 12 }}>
        <h3 style={{ margin: '0', fontSize: 14, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <Package size={16} color="#6366f1" /> Used Inventory (Optional)
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <select className="form-select" value={inventoryItemId} onChange={e => setInventoryItemId(e.target.value)} style={{ fontSize: 14 }}>
            <option value="">-- No item used --</option>
            {inventory.map(item => (
              <option key={item.id} value={item.id}>{item.name} ({item.quantity} {item.unit} left)</option>
            ))}
          </select>
          {inventoryItemId && (
            <div>
              <label className="form-label" style={{ fontSize: 12 }}>Quantity Used</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="number" className="form-input" value={quantityUsed} onChange={e => setQuantityUsed(e.target.value)} min="0" step="0.01" placeholder="0.00" />
                <span style={{ color: 'var(--text-sub)', fontSize: 14 }}>{inventory.find(i => i.id === inventoryItemId)?.unit}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <button type="submit" className="btn-primary" disabled={isSubmitting} style={{ width: '100%', justifyContent: 'center', background: '#6366f1', padding: 15, fontSize: 16, borderRadius: 16, marginTop: 4, boxShadow: '0 4px 12px rgba(99, 102, 241, 0.25)' }}>
        <CheckCircle size={18} />
        {isSubmitting ? 'Saving...' : editingEventId ? 'Update Farm Event' : 'Save Farm Event'}
      </button>
    </form>
  );
}