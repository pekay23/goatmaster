'use client';
import { Camera, X } from 'lucide-react';

export default function ImageUploader({ imageUrl, onImageChange, label = 'Photo', showToast }) {
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
    if (!cloudName || !preset) { showToast?.('Photo upload not configured.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast?.('Image too large (max 5 MB).', 'error'); return; }
    if (!file.type.startsWith('image/')) { showToast?.('Please select an image file.', 'error'); return; }

    const data = new FormData();
    data.append('file', file);
    data.append('upload_preset', preset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: data });
      if (!res.ok) throw new Error('upload failed');
      const json = await res.json();
      if (json.secure_url) onImageChange(json.secure_url);
    } catch { showToast?.('Image upload failed.', 'error'); }
  };

  return (
    <div style={{ background: 'var(--bg-app)', padding: 14, borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', gap: 12 }}>
      <h3 style={{ margin: '0', fontSize: 14, fontWeight: 700, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
        <Camera size={16} color="#6366f1" /> {label} (Optional)
      </h3>
      <div style={{ textAlign: 'center', padding: 16, border: '2px dashed var(--border-color)', borderRadius: 12, cursor: 'pointer', background: 'var(--bg-card)' }}>
        <label style={{ cursor: 'pointer', display: 'block' }}>
          <input type="file" hidden onChange={handleFile} accept="image/*" />
          {imageUrl ? (
            <div style={{ position: 'relative' }}>
              <img src={imageUrl} style={{ height: 140, width: '100%', borderRadius: 8, objectFit: 'cover' }} alt="" />
              <button type="button" aria-label="Remove image" onClick={(e) => { e.preventDefault(); onImageChange(''); }}
                style={{ position: 'absolute', top: 6, right: 6, background: 'rgba(0,0,0,0.6)', color: '#fff', border: 'none', borderRadius: '50%', width: 26, height: 26, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} />
              </button>
            </div>
          ) : (
            <div>
              <Camera size={28} style={{ color: 'var(--text-sub)' }} />
              <p style={{ color: 'var(--text-sub)', margin: '8px 0 0', fontSize: 13 }}>Tap to add a photo</p>
            </div>
          )}
        </label>
      </div>
    </div>
  );
}