'use client';
import { Camera, CalendarDays } from 'lucide-react';
import { BREEDS } from '@/lib/breeds';

export default function AddGoatView({ formData, setFormData, goats, isSubmitting, isUploading, handleSubmit, handleImageChange, onCancel, isEditing, onDelete, farmEvents = [], navigateToEvents }) {
  const goatEvents = isEditing ? farmEvents.filter(e => e.goat_ids?.includes(formData.id)).sort((a,b) => new Date(b.event_date) - new Date(a.event_date)) : [];

  return (
    <div className="add-goat-view">
      <div style={{ textAlign: 'center', padding: 24, border: '2px dashed var(--border-color)', borderRadius: 16, cursor: 'pointer', marginBottom: 20 }}>
        <label style={{ cursor: 'pointer' }}>
          <input type="file" hidden onChange={handleImageChange} accept="image/*" />
          {formData.image_url
            ? <img src={formData.image_url} style={{ height: 140, borderRadius: 12, objectFit: 'cover' }} alt="" />
            : <div><Camera size={32} style={{ color: 'var(--text-sub)' }} /><p style={{ color: 'var(--text-sub)', margin: '8px 0 0', fontSize: 14 }}>{isEditing ? 'Change Photo' : 'Add Photo'}</p></div>}
        </label>
      </div>
      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label className="form-label">Name</label>
          <input className="form-input" name="name" value={formData.name}
            onChange={e => setFormData(p => ({ ...p, name: e.target.value }))} required />
        </div>
        <div className="form-group">
          <label className="form-label">Breed</label>
          <input className="form-input" name="breed" list="breed-options" value={formData.breed}
            onChange={e => setFormData(p => ({ ...p, breed: e.target.value }))}
            placeholder="Type or pick from list…" />
          <datalist id="breed-options">
            {BREEDS.filter(b => b.id !== 'mixed').map(b => (
              <option key={b.id} value={b.name}>{b.origin} · {b.type}</option>
            ))}
          </datalist>
        </div>
        <div className="form-group">
          <label className="form-label">Sex</label>
          <select className="form-select" name="sex" value={formData.sex} onChange={e => setFormData(p => ({ ...p, sex: e.target.value }))}>
            <option value="F">Doe (Female)</option>
            <option value="M">Buck (Male)</option>
            <option value="W">Wether (Castrated)</option>
          </select>
        </div>
        <div className="form-group">
          <label className="form-label">Date of Birth</label>
          <input className="form-input" type="date" name="dob" value={formData.dob} onChange={e => setFormData(p => ({ ...p, dob: e.target.value }))} onInvalid={e => e.preventDefault()} />
        </div>
        <div className="form-group">
          <label className="form-label">Ear Tag #</label>
          <input className="form-input" name="ear_tag" value={formData.ear_tag} onChange={e => setFormData(p => ({ ...p, ear_tag: e.target.value }))} placeholder="e.g. T-0042" />
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
          <div className="form-group">
            <label className="form-label">Dam</label>
            <select className="form-select" name="dam_id" value={formData.dam_id || ''} onChange={e => setFormData(p => ({ ...p, dam_id: e.target.value }))}>
              <option value="">Unknown</option>
              {goats
                .filter(g => g.sex === 'F' && g.id !== formData.id)
                .map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="form-label">Sire</label>
            <select className="form-select" name="sire_id" value={formData.sire_id || ''} onChange={e => setFormData(p => ({ ...p, sire_id: e.target.value }))}>
              <option value="">Unknown</option>
              {goats
                .filter(g => g.sex === 'M' && g.id !== formData.id)
                .map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
            </select>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <button type="button" onClick={onCancel} style={{ flex: 1, padding: 13, border: '1.5px solid var(--border-color)', background: 'transparent', borderRadius: 12, cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600, fontFamily: 'inherit' }}>Cancel</button>
          {isEditing && <button type="button" onClick={onDelete} style={{ flex: 1, padding: 13, border: '1px solid #fecaca', background: '#fee2e2', borderRadius: 12, cursor: 'pointer', color: '#dc2626', fontWeight: 700, fontFamily: 'inherit' }}>Delete</button>}
          <button type="submit" className="btn-primary" style={{ flex: 1, justifyContent: 'center' }} disabled={isSubmitting || isUploading}>
            {isUploading ? 'Uploading…' : isEditing ? 'Update' : 'Create'}
          </button>
        </div>
      </form>

      {isEditing && (
        <div style={{ marginTop: 40, borderTop: '1px solid var(--border-color)', paddingTop: 20 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 15 }}>
            <h3 style={{ margin: 0, fontSize: 18, color: 'var(--text-main)' }}>Recent Activity</h3>
            <button 
              type="button"
              onClick={() => navigateToEvents && navigateToEvents(formData.id)}
              className="btn-primary" 
              style={{ padding: '6px 12px', fontSize: 12 }}
            >
              <CalendarDays size={14} /> Log Event
            </button>
          </div>

          {goatEvents.length === 0 ? (
            <p style={{ color: 'var(--text-sub)', fontSize: 14, textAlign: 'center', padding: '20px 0' }}>No events logged for {formData.name} yet.</p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {goatEvents.slice(0, 5).map(e => (
                <div key={e.id} style={{ padding: 12, background: 'var(--bg-app)', borderRadius: 10, border: '1px solid var(--border-color)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                    <strong style={{ fontSize: 14, color: 'var(--text-main)' }}>{e.subject}</strong>
                    <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>{new Date(e.event_date).toLocaleDateString()}</span>
                  </div>
                  <span style={{ display: 'inline-block', padding: '2px 8px', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 4, fontSize: 11, fontWeight: 600, color: 'var(--text-sub)' }}>
                    {e.category}
                  </span>
                </div>
              ))}
              {goatEvents.length > 5 && (
                <button type="button" onClick={() => navigateToEvents && navigateToEvents(formData.id)} style={{ background: 'transparent', border: 'none', color: 'var(--primary)', fontWeight: 600, cursor: 'pointer', fontSize: 13, padding: '10px 0' }}>
                  View all {goatEvents.length} events →
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}