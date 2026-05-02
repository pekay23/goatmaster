'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, Sparkles, Check, X, Edit3, Loader2, Zap, AlertCircle, Plus, RefreshCw, ChevronRight } from 'lucide-react';
import { BulkDiscoverySession, estimateSharpness } from '@/lib/bulkDiscovery';

// ── TF.js lazy loader ─────────────────────────────────────────────
let tfLoaded = false, mobilenet = null, tf = null;
async function loadModels() {
  if (tfLoaded) return;
  tf = await import('@tensorflow/tfjs');
  const mn = await import('@tensorflow-models/mobilenet');
  await tf.ready();
  mobilenet = await mn.load({ version: 2, alpha: 1.0 });
  tfLoaded = true;
}

async function extractEmbedding(imgEl) {
  if (!mobilenet) await loadModels();
  return tf.tidy(() => {
    const tensor = tf.browser.fromPixels(imgEl).resizeNearestNeighbor([224, 224]).toFloat().expandDims();
    const activation = mobilenet.infer(tensor, true);
    return Array.from(activation.dataSync());
  });
}

async function guessBreed(imgEl) {
  if (!mobilenet) await loadModels();
  const preds = await mobilenet.classify(imgEl, 5);
  const hints = {
    'Angora': ['wool', 'angora', 'fleece'],
    'Boer':   ['goat', 'ibex'],
    'Nubian': ['deer'],
    'Alpine': ['mountain goat', 'chamois'],
    'Saanen': ['white'],
  };
  for (const [breed, kw] of Object.entries(hints)) {
    if (preds.some(p => kw.some(k => p.className.toLowerCase().includes(k)))) return breed;
  }
  return 'Unknown';
}

// ── STATES ─────────────────────────────────────────────────────────
const PHASE = {
  IDLE: 'idle',
  CAPTURING: 'capturing',
  PROCESSING: 'processing',
  REVIEW: 'review',
  SAVING: 'saving',
  DONE: 'done',
};

// ── FRAME DOT (visual indicator during capture) ────────────────────
const FrameDot = ({ status }) => {
  const colors = { matched: '#22c55e', merged: '#3b82f6', new: '#f59e0b' };
  return (
    <div style={{
      width: 8, height: 8, borderRadius: '50%',
      background: colors[status] || '#cbd5e1',
      animation: 'fadeInScale 0.3s ease-out',
    }} />
  );
};

// ── EDITABLE GOAT CARD (review phase) ──────────────────────────────
const NewGoatCard = ({ candidate, onChange, onRemove }) => {
  const [editing, setEditing] = useState(false);
  return (
    <div style={{
      display: 'flex', gap: 14, padding: 14,
      background: 'var(--bg-card)', borderRadius: 16,
      border: '1px solid var(--border-color)',
      animation: 'slideUpFade 0.3s ease-out',
    }}>
      <img src={candidate.bestThumb} alt="" style={{
        width: 72, height: 72, objectFit: 'cover', borderRadius: 12,
        border: '2px solid var(--primary)', flexShrink: 0,
      }} />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
          <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 6, fontWeight: 800, letterSpacing: 0.5 }}>NEW</span>
          <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>{candidate.frameCount} frames</span>
        </div>
        {editing ? (
          <>
            <input
              value={candidate.suggestedName}
              onChange={e => onChange({ ...candidate, suggestedName: e.target.value })}
              style={{ width: '100%', padding: '6px 8px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 14, marginBottom: 4, background: 'var(--bg-app)', color: 'var(--text-main)' }}
              autoFocus
            />
            <div style={{ display: 'flex', gap: 6 }}>
              <input
                value={candidate.suggestedBreed}
                onChange={e => onChange({ ...candidate, suggestedBreed: e.target.value })}
                placeholder="Breed"
                style={{ flex: 1, padding: '6px 8px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12, background: 'var(--bg-app)', color: 'var(--text-main)' }}
              />
              <select
                value={candidate.suggestedSex}
                onChange={e => onChange({ ...candidate, suggestedSex: e.target.value })}
                style={{ padding: '6px 8px', border: '1px solid var(--border-color)', borderRadius: 8, fontSize: 12, background: 'var(--bg-app)', color: 'var(--text-main)' }}
              >
                <option value="F">Doe</option>
                <option value="M">Buck</option>
                <option value="W">Wether</option>
              </select>
            </div>
          </>
        ) : (
          <>
            <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>{candidate.suggestedName}</h4>
            <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>
              {candidate.suggestedBreed || 'Unknown breed'} · {candidate.suggestedSex === 'F' ? 'Doe' : candidate.suggestedSex === 'M' ? 'Buck' : 'Wether'}
            </div>
          </>
        )}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <button onClick={() => setEditing(!editing)} style={{ padding: 6, background: editing ? 'var(--primary)' : 'var(--bg-app)', color: editing ? 'white' : 'var(--text-sub)', border: '1px solid var(--border-color)', borderRadius: 8, cursor: 'pointer' }} aria-label="Edit">
          {editing ? <Check size={14} /> : <Edit3 size={14} />}
        </button>
        <button onClick={onRemove} style={{ padding: 6, background: '#fee2e2', color: '#dc2626', border: '1px solid #fecaca', borderRadius: 8, cursor: 'pointer' }} aria-label="Remove">
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

const MatchedGoatCard = ({ match }) => (
  <div style={{
    display: 'flex', gap: 14, padding: 14, background: 'var(--bg-card)',
    borderRadius: 16, border: '1px solid var(--border-color)',
    animation: 'slideUpFade 0.3s ease-out',
  }}>
    {match.goat.image_url
      ? <img src={match.goat.image_url} alt="" style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 12, border: '2px solid #22c55e', flexShrink: 0 }} />
      : <div style={{ width: 72, height: 72, borderRadius: 12, background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, flexShrink: 0 }}>🐐</div>
    }
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        <span style={{ fontSize: 10, background: '#dcfce7', color: '#166534', padding: '2px 8px', borderRadius: 6, fontWeight: 800, letterSpacing: 0.5 }}>RECOGNISED</span>
        <span style={{ fontSize: 11, color: 'var(--text-sub)' }}>{match.frameCount} frames</span>
      </div>
      <h4 style={{ margin: 0, fontSize: 16, fontWeight: 700, color: 'var(--text-main)' }}>{match.goat.name}</h4>
      <div style={{ fontSize: 12, color: 'var(--text-sub)', marginTop: 2 }}>
        {match.goat.breed || 'Unknown'} · {match.goat.sex === 'F' ? 'Doe' : match.goat.sex === 'M' ? 'Buck' : 'Wether'}
      </div>
    </div>
    <Check size={20} color="#22c55e" style={{ alignSelf: 'center' }} />
  </div>
);

// ── MAIN COMPONENT ─────────────────────────────────────────────────
export default function SmartScanner({ goats = [], onComplete, showToast }) {
  const videoRef  = useRef(null);
  const canvasRef = useRef(null);
  const sessionRef = useRef(null);
  const captureTimerRef = useRef(null);
  const streamRef = useRef(null);

  const [phase, setPhase] = useState(PHASE.IDLE);
  const [modelsReady, setModelsReady] = useState(false);
  const [mode, setMode] = useState('camera'); // camera | upload
  const [error, setError] = useState('');

  const [frameDots, setFrameDots]   = useState([]); // recent statuses for visual feedback
  const [stats, setStats]           = useState({ matched: 0, new: 0, total: 0 });
  const [progress, setProgress]     = useState(0); // 0–100
  const [summary, setSummary]       = useState(null); // { matched: [], newGoats: [] }

  // Pre-load models in background
  useEffect(() => {
    loadModels().then(() => setModelsReady(true)).catch(console.error);
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (captureTimerRef.current) clearInterval(captureTimerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  // ── INITIALISE SESSION ────────────────────────────────────────
  const initSession = useCallback(async () => {
    // Fetch all existing embeddings so we can match against them
    try {
      const res = await fetch('/api/goats/embeddings', { credentials: 'include' });
      const embeddings = await res.json();
      sessionRef.current = new BulkDiscoverySession(embeddings);
      return embeddings.length;
    } catch {
      sessionRef.current = new BulkDiscoverySession([]);
      return 0;
    }
  }, []);

  // ── PROCESS A SINGLE FRAME ───────────────────────────────────
  const processFrame = useCallback(async (canvas) => {
    if (!sessionRef.current) return null;
    try {
      const [embedding, breed] = await Promise.all([
        extractEmbedding(canvas), guessBreed(canvas),
      ]);
      const sharpness = estimateSharpness(canvas);
      const thumb = canvas.toDataURL('image/jpeg', 0.7);
      const result = sessionRef.current.addFrame({ embedding, thumb, breed, sharpness });

      setFrameDots(prev => [...prev.slice(-15), result.status]);
      setStats(prev => {
        const matched = sessionRef.current.matches.size;
        const newGoats = sessionRef.current.candidates.length;
        return { matched, new: newGoats, total: prev.total + 1 };
      });
      return result;
    } catch (e) {
      console.error('[smart-scan] frame error', e);
      return null;
    }
  }, []);

  // ── LIVE CAMERA START ─────────────────────────────────────────
  const startCamera = async () => {
    setError(''); setFrameDots([]); setStats({ matched: 0, new: 0, total: 0 });
    setPhase(PHASE.CAPTURING);

    await initSession();

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // Capture every 1.2s
      captureTimerRef.current = setInterval(() => {
        const v = videoRef.current, c = canvasRef.current;
        if (!v || !c || v.readyState < 2) return;
        const ctx = c.getContext('2d');
        c.width = v.videoWidth; c.height = v.videoHeight;
        ctx.drawImage(v, 0, 0);
        processFrame(c);
      }, 1200);
    } catch (e) {
      setError('Camera access denied or unavailable.');
      setPhase(PHASE.IDLE);
    }
  };

  // ── FINISH LIVE SESSION ──────────────────────────────────────
  const finishCapture = () => {
    stopCamera();
    setPhase(PHASE.PROCESSING);
    setTimeout(() => {
      const result = sessionRef.current.summarise('G', goats.length + 1);
      setSummary(result);
      setPhase(PHASE.REVIEW);
    }, 600);
  };

  // ── VIDEO/IMAGE FILE UPLOAD ──────────────────────────────────
  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setFrameDots([]); setStats({ matched: 0, new: 0, total: 0 });
    setPhase(PHASE.PROCESSING); setProgress(0);

    await initSession();

    if (file.type.startsWith('video/')) {
      // Extract ~10 frames evenly across the video
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.playsInline = true;

      await new Promise((resolve) => {
        video.onloadedmetadata = resolve;
      });

      const numFrames = 10;
      const duration = video.duration;
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');

      for (let i = 0; i < numFrames; i++) {
        const t = (duration * i) / (numFrames - 1);
        await new Promise((resolve) => {
          video.currentTime = t;
          video.onseeked = async () => {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            ctx.drawImage(video, 0, 0);
            await processFrame(canvas);
            setProgress(Math.round(((i + 1) / numFrames) * 100));
            resolve();
          };
        });
      }
    } else {
      // Single image
      const img = new Image();
      await new Promise((resolve) => {
        img.onload = resolve;
        img.src = URL.createObjectURL(file);
      });
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      await processFrame(canvas);
      setProgress(100);
    }

    const result = sessionRef.current.summarise('G', goats.length + 1);
    setSummary(result);
    setPhase(PHASE.REVIEW);
  };

  // ── SAVE EVERYTHING ──────────────────────────────────────────
  const saveAll = async () => {
    if (!summary) return;
    setPhase(PHASE.SAVING);
    setError('');

    try {
      // 1. Add embeddings to existing matched goats
      if (summary.matched.length > 0) {
        const enrollments = summary.matched.map(m => ({
          goatId: m.goat.id, embeddings: m.embeddings,
        }));
        await fetch('/api/enroll/bulk', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ enrollments }),
        });
      }

      // 2. Create new goats
      if (summary.newGoats.length > 0) {
        const newGoats = summary.newGoats.map(c => ({
          name: c.suggestedName,
          breed: c.suggestedBreed,
          sex: c.suggestedSex,
          image_url: c.bestThumb,
          notes: c.suggestedNotes,
          embeddings: c.embeddings,
        }));
        const res = await fetch('/api/goats/bulk', {
          method: 'POST', credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ newGoats }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to save');
      }

      setPhase(PHASE.DONE);
      if (showToast) showToast(
        `Saved! ${summary.newGoats.length} new goat${summary.newGoats.length !== 1 ? 's' : ''} added, ${summary.matched.length} updated.`,
        'success'
      );
      if (onComplete) onComplete();
    } catch (e) {
      setError(e.message);
      setPhase(PHASE.REVIEW);
    }
  };

  const reset = () => {
    stopCamera();
    setPhase(PHASE.IDLE); setSummary(null); setFrameDots([]);
    setStats({ matched: 0, new: 0, total: 0 }); setProgress(0); setError('');
  };

  const updateNewGoat = (id, updates) => {
    setSummary(s => ({ ...s, newGoats: s.newGoats.map(g => g.candidateId === id ? { ...g, ...updates } : g) }));
  };
  const removeNewGoat = (id) => {
    setSummary(s => ({ ...s, newGoats: s.newGoats.filter(g => g.candidateId !== id) }));
  };

  // ── RENDER ──────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      {/* HEADER */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
        <div style={{ background: 'linear-gradient(135deg, #fef3c7, #fde68a)', padding: 10, borderRadius: 12 }}>
          <Sparkles size={26} color="#d97706" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>Smart Scan</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>
            {modelsReady ? '✓ Auto-discover & enrol your whole herd' : '⏳ Loading AI…'}
          </p>
        </div>
        {phase !== PHASE.IDLE && (
          <button onClick={reset} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> Reset
          </button>
        )}
      </div>

      {/* ERROR */}
      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', borderRadius: 12, border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* IDLE */}
      {phase === PHASE.IDLE && (
        <>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['camera', 'Live Camera', Camera], ['upload', 'Video / Photo', Upload]].map(([m, l, Icon]) => (
              <button key={m} onClick={() => setMode(m)} className={`btn-filter ${mode === m ? 'active' : ''}`} style={{ flex: 1, padding: '11px 0', fontSize: 14, gap: 6, display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                <Icon size={15} /> {l}
              </button>
            ))}
          </div>

          {mode === 'camera' ? (
            <button onClick={startCamera} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 16, fontSize: 16, borderRadius: 16 }} disabled={!modelsReady}>
              <Zap size={18} /> {modelsReady ? 'Start Smart Scan' : 'Loading AI…'}
            </button>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 36, border: '2px dashed var(--border-color)', borderRadius: 20, cursor: 'pointer', background: 'rgba(255,255,255,0.3)' }}>
              <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={!modelsReady} />
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={28} color="var(--primary)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 15 }}>Upload herd footage</div>
                <div style={{ color: 'var(--text-sub)', fontSize: 13, marginTop: 4 }}>Video or photo with multiple goats</div>
              </div>
            </label>
          )}

          <div className="glass-panel" style={{ padding: 16, gap: 10, display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>How Smart Scan works</h4>
            {[
              ['Walk through your herd or upload a video', '1'],
              ['AI extracts a fingerprint for each goat seen', '2'],
              ['Recognised goats get more training photos', '3'],
              ['New goats are auto-named and ready to save', '4'],
            ].map(([t, n]) => (
              <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: 11, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>{n}</div>
                <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>{t}</span>
              </div>
            ))}
          </div>
        </>
      )}

      {/* CAPTURING */}
      {phase === PHASE.CAPTURING && (
        <>
          <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#111', aspectRatio: '4/3', width: '100%' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.6)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: 'white', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 1s infinite' }} />
              SCANNING HERD
            </div>
            {/* Live stats overlay */}
            <div style={{ position: 'absolute', bottom: 12, left: 12, right: 12, display: 'flex', gap: 6 }}>
              <div style={{ flex: 1, background: 'rgba(0,0,0,0.65)', borderRadius: 10, padding: '8px 10px', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{stats.total}</div>
                <div style={{ fontSize: 9, opacity: 0.7, letterSpacing: 0.5 }}>FRAMES</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(34, 197, 94, 0.7)', borderRadius: 10, padding: '8px 10px', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{stats.matched}</div>
                <div style={{ fontSize: 9, opacity: 0.85, letterSpacing: 0.5 }}>KNOWN</div>
              </div>
              <div style={{ flex: 1, background: 'rgba(245, 158, 11, 0.75)', borderRadius: 10, padding: '8px 10px', color: 'white', textAlign: 'center' }}>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{stats.new}</div>
                <div style={{ fontSize: 9, opacity: 0.85, letterSpacing: 0.5 }}>NEW</div>
              </div>
            </div>
          </div>

          {/* Frame dots */}
          <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--text-sub)', flexShrink: 0 }}>Recent:</span>
            <div style={{ flex: 1, display: 'flex', gap: 4, alignItems: 'center' }}>
              {frameDots.length === 0
                ? <span style={{ fontSize: 12, color: 'var(--text-sub)', fontStyle: 'italic' }}>Waiting for first frame…</span>
                : frameDots.map((s, i) => <FrameDot key={i} status={s} />)
              }
            </div>
          </div>

          <button onClick={finishCapture} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 15 }}>
            <Check size={16} /> Finish Scanning ({stats.total} frames)
          </button>
        </>
      )}

      {/* PROCESSING */}
      {phase === PHASE.PROCESSING && (
        <div className="glass-panel" style={{ padding: 30, alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Loader2 size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-main)' }}>Analyzing your herd…</div>
            <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>Clustering frames, identifying individuals</div>
          </div>
          {progress > 0 && (
            <div style={{ width: '100%', maxWidth: 240 }}>
              <div style={{ width: '100%', height: 6, background: 'var(--bg-app)', borderRadius: 3, overflow: 'hidden' }}>
                <div style={{ width: `${progress}%`, height: '100%', background: 'var(--primary)', transition: 'width 0.3s' }} />
              </div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', textAlign: 'center', marginTop: 4 }}>{progress}%</div>
            </div>
          )}
        </div>
      )}

      {/* REVIEW */}
      {phase === PHASE.REVIEW && summary && (
        <>
          <div style={{ display: 'flex', gap: 10 }}>
            <div className="glass-panel" style={{ flex: 1, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#22c55e' }}>{summary.matched.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>Recognised</div>
            </div>
            <div className="glass-panel" style={{ flex: 1, padding: '14px 16px', textAlign: 'center' }}>
              <div style={{ fontSize: 26, fontWeight: 800, color: '#f59e0b' }}>{summary.newGoats.length}</div>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>New goats</div>
            </div>
          </div>

          {summary.newGoats.length > 0 && (
            <>
              <h3 style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Plus size={16} /> New goats to add
              </h3>
              {summary.newGoats.map(c => (
                <NewGoatCard key={c.candidateId} candidate={c}
                  onChange={(updates) => updateNewGoat(c.candidateId, updates)}
                  onRemove={() => removeNewGoat(c.candidateId)} />
              ))}
            </>
          )}

          {summary.matched.length > 0 && (
            <>
              <h3 style={{ margin: '8px 0 0', fontSize: 15, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Check size={16} /> Already in your herd
              </h3>
              {summary.matched.map(m => <MatchedGoatCard key={m.goat.id} match={m} />)}
            </>
          )}

          {summary.newGoats.length === 0 && summary.matched.length === 0 && (
            <div className="glass-panel" style={{ padding: 30, textAlign: 'center' }}>
              <div style={{ fontSize: 36, marginBottom: 8 }}>🤔</div>
              <h3 style={{ margin: '0 0 6px', color: 'var(--text-main)' }}>No goats detected</h3>
              <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: 13 }}>Try again with clearer photos or video</p>
            </div>
          )}

          <button onClick={saveAll} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 15 }} disabled={summary.newGoats.length === 0 && summary.matched.length === 0}>
            <Sparkles size={16} /> Save All ({summary.newGoats.length + summary.matched.length})
          </button>
        </>
      )}

      {/* SAVING */}
      {phase === PHASE.SAVING && (
        <div className="glass-panel" style={{ padding: 30, alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <Loader2 size={36} color="var(--primary)" style={{ animation: 'spin 1s linear infinite' }} />
          <div style={{ fontWeight: 700, fontSize: 16, color: 'var(--text-main)' }}>Saving to your herd…</div>
        </div>
      )}

      {/* DONE */}
      {phase === PHASE.DONE && (
        <div className="glass-panel" style={{ padding: 30, alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 14 }}>
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: '#dcfce7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Check size={32} color="#16a34a" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <h3 style={{ margin: '0 0 6px', color: 'var(--text-main)' }}>Herd updated!</h3>
            <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: 13 }}>Edit any goat from the Profiles tab to add details.</p>
          </div>
          <button onClick={reset} className="btn-primary" style={{ padding: '10px 20px' }}>
            Scan again
          </button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes fadeInScale { from { opacity: 0; transform: scale(0.5); } to { opacity: 1; transform: scale(1); } }
      `}</style>
    </div>
  );
}
