'use client';
import { Camera } from 'lucide-react';

export default function GoatCard({ goat, onEdit }) {
  return (
    <div className="goat-card" onClick={() => onEdit(goat)}>
      <button className="edit-btn" onClick={(e) => { e.stopPropagation(); onEdit(goat); }} aria-label="Edit">
        <img src="/editlogo.png" alt="Edit" style={{ width: 16, height: 16, opacity: 0.8 }} />
      </button>
      {goat.image_url
        ? <img src={goat.image_url} className="goat-avatar" style={{ width: 52, height: 52, borderRadius: '50%', objectFit: 'cover' }} alt="" />
        : <div className="goat-avatar">🐐</div>}
      <div className="goat-info">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 2 }}>
          <h3 style={{ margin: 0 }}>{goat.name}</h3>
          {goat.photo_count > 0 && (
            <span style={{ fontSize: 10, color: 'var(--primary)', fontWeight: 800, background: 'var(--primary-bg)', padding: '2px 6px', borderRadius: 6, display: 'flex', alignItems: 'center', gap: 3 }}>
              <Camera size={10} /> {goat.photo_count}
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-sub)', marginBottom: 4 }}>
          ID: G{String(goat.id).padStart(3, '0')}{goat.ear_tag ? ` · ${goat.ear_tag}` : ''}
        </div>
        <span style={{ fontSize: 11, background: 'var(--bg-app)', padding: '2px 8px', borderRadius: 6 }}>
          {goat.breed || 'Unknown'} · {goat.sex}
        </span>
      </div>
    </div>
  );
}