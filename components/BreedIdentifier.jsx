'use client';
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Camera, Upload, RefreshCw, Zap, AlertCircle, Award, X, Info } from 'lucide-react';
import { identifyBreed, analyseImageColours, BREED_BY_ID } from '@/lib/breeds';

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

const TYPE_COLORS = {
  dairy:     { bg: '#dbeafe', fg: '#1e40af', label: 'Dairy' },
  meat:      { bg: '#fee2e2', fg: '#991b1b', label: 'Meat' },
  fiber:     { bg: '#fef3c7', fg: '#92400e', label: 'Fiber' },
  dual:      { bg: '#e0e7ff', fg: '#3730a3', label: 'Dual-Purpose' },
  companion: { bg: '#f3e8ff', fg: '#6b21a8', label: 'Companion' },
};

const ConfidenceBar = ({ value }) => {
  const pct = Math.round((value || 0) * 100);
  const color = pct >= 60 ? '#22c55e' : pct >= 35 ? '#f59e0b' : '#ef4444';
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
      <div style={{ flex: 1, height: 6, background: 'var(--bg-app)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 700, color, minWidth: 36, textAlign: 'right' }}>{pct}%</span>
    </div>
  );
};

const BreedResultCard = ({ candidate, isPrimary }) => {
  const breed = BREED_BY_ID[candidate.id];
  if (!breed) return null;
  const tc = TYPE_COLORS[breed.type] || TYPE_COLORS.dual;

  return (
    <div className="glass-panel" style={{
      padding: 16, gap: 12, display: 'flex', flexDirection: 'column',
      border: isPrimary ? '2px solid var(--primary)' : '1px solid var(--border-color)',
      animation: 'slideUpFade 0.3s ease-out',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
        {isPrimary && (
          <div style={{ background: 'var(--primary)', color: 'white', borderRadius: 10, padding: 8, flexShrink: 0 }}>
            <Award size={20} />
          </div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ margin: 0, fontSize: isPrimary ? 18 : 16, fontWeight: 800, color: 'var(--text-main)' }}>
            {breed.name}
          </h3>
          <div style={{ display: 'flex', gap: 6, marginTop: 4, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 10, background: tc.bg, color: tc.fg, padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>{tc.label}</span>
            <span style={{ fontSize: 10, background: 'var(--bg-app)', color: 'var(--text-sub)', padding: '2px 8px', borderRadius: 6, fontWeight: 600 }}>📍 {breed.origin}</span>
          </div>
        </div>
      </div>
      <ConfidenceBar value={candidate.confidence} />
      {isPrimary && (
        <div style={{ background: 'var(--bg-app)', borderRadius: 10, padding: '10px 12px', display: 'flex', gap: 8, alignItems: 'flex-start' }}>
          <Info size={14} style={{ flexShrink: 0, marginTop: 2, color: 'var(--text-sub)' }} />
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>{breed.distinguishing}</p>
        </div>
      )}
    </div>
  );
};

const STATE = { IDLE: 'idle', LOADING: 'loading', SCANNING: 'scanning', RESULT: 'result' };

export default function BreedIdentifier() {
  const videoRef    = useRef(null);
  const canvasRef   = useRef(null);
  const streamRef   = useRef(null);

  const [phase, setPhase] = useState(STATE.IDLE);
  const [modelsReady, setModelsReady] = useState(false);
  const [mode, setMode]   = useState('camera'); // camera | upload
  const [error, setError] = useState('');
  const [result, setResult] = useState(null); // { best, alternatives, thumb }

  useEffect(() => {
    loadModels().then(() => setModelsReady(true)).catch(console.error);
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  };

  const startCamera = async () => {
    setError(''); setResult(null); setPhase(STATE.LOADING);
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
      setPhase(STATE.SCANNING);
    } catch {
      setError('Camera access denied or unavailable.');
      setPhase(STATE.IDLE);
    }
  };

  const captureAndIdentify = useCallback(async () => {
    const v = videoRef.current, c = canvasRef.current;
    if (!v || !c || v.readyState < 2) return;
    const ctx = c.getContext('2d');
    c.width = v.videoWidth; c.height = v.videoHeight;
    ctx.drawImage(v, 0, 0);
    await runIdentify(c);
    stopCamera();
  }, []);

  const runIdentify = async (canvas) => {
    if (!modelsReady) return;
    setPhase(STATE.LOADING);
    try {
      const predictions = await mobilenet.classify(canvas, 5);
      const colourAnalysis = analyseImageColours(canvas);
      const id = identifyBreed({ predictions, colourAnalysis, userRegion: 'GH' });
      const thumb = canvas.toDataURL('image/jpeg', 0.8);
      setResult({ ...id, thumb });
      setPhase(STATE.RESULT);
    } catch (err) {
      setError('Identification failed: ' + err.message);
      setPhase(STATE.IDLE);
    }
  };

  const handleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setResult(null); setPhase(STATE.LOADING);
    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      await runIdentify(canvas);
    };
    img.src = URL.createObjectURL(file);
  };

  const reset = () => {
    stopCamera();
    setPhase(STATE.IDLE); setResult(null); setError('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
        <div style={{ background: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)', padding: 10, borderRadius: 12 }}>
          <Award size={26} color="#4f46e5" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>Breed Identifier</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>
            {modelsReady ? '✓ Identifies breed only — does not match individual goats' : '⏳ Loading AI…'}
          </p>
        </div>
        {phase !== STATE.IDLE && (
          <button onClick={reset} style={{ background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> Reset
          </button>
        )}
      </div>

      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', borderRadius: 12, border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* IDLE */}
      {phase === STATE.IDLE && (
        <>
          <div style={{ display: 'flex', gap: 10 }}>
            {[['camera', 'Camera', Camera], ['upload', 'Upload', Upload]].map(([m, l, Icon]) => (
              <button key={m} onClick={() => setMode(m)} className={`btn-filter ${mode === m ? 'active' : ''}`} style={{ flex: 1, padding: '11px 0', fontSize: 14, gap: 6, display: 'inline-flex', justifyContent: 'center', alignItems: 'center' }}>
                <Icon size={15} /> {l}
              </button>
            ))}
          </div>

          {mode === 'camera' ? (
            <button onClick={startCamera} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 16, fontSize: 16, borderRadius: 16 }} disabled={!modelsReady}>
              <Zap size={18} /> {modelsReady ? 'Open Camera' : 'Loading AI…'}
            </button>
          ) : (
            <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 36, border: '2px dashed var(--border-color)', borderRadius: 20, cursor: 'pointer', background: 'rgba(255,255,255,0.3)' }}>
              <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleUpload} disabled={!modelsReady} />
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Upload size={28} color="var(--primary)" />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 15 }}>Upload a goat photo</div>
                <div style={{ color: 'var(--text-sub)', fontSize: 13, marginTop: 4 }}>Get the most likely breed</div>
              </div>
            </label>
          )}

          <div className="glass-panel" style={{ padding: 16, gap: 8, display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>About this tool</h4>
            <p style={{ margin: 0, fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>
              Quick breed lookup for any goat — including ones not in your herd. Useful for identifying breeds at a market, on a farm visit, or when buying new stock. Results show the top 3 most likely breeds with confidence scores.
            </p>
          </div>
        </>
      )}

      {/* SCANNING */}
      {phase === STATE.SCANNING && (
        <>
          <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#111', aspectRatio: '4/3', width: '100%' }}>
            <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover' }} playsInline muted />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              <div style={{ width: '60%', height: '70%', border: '3px solid rgba(74, 222, 128, 0.7)', borderRadius: 16, boxShadow: '0 0 0 9999px rgba(0,0,0,0.4)' }} />
            </div>
          </div>
          <button onClick={captureAndIdentify} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 14, fontSize: 15 }}>
            <Camera size={16} /> Identify Breed
          </button>
        </>
      )}

      {/* LOADING */}
      {phase === STATE.LOADING && (
        <div className="glass-panel" style={{ padding: 30, alignItems: 'center', display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div style={{ width: 32, height: 32, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <span style={{ color: 'var(--text-main)', fontSize: 14 }}>Analysing image…</span>
        </div>
      )}

      {/* RESULT */}
      {phase === STATE.RESULT && result && (
        <>
          {result.thumb && (
            <div style={{ borderRadius: 20, overflow: 'hidden', width: '100%', aspectRatio: '4/3' }}>
              <img src={result.thumb} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          )}

          <h3 style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
            Most likely breed
          </h3>
          <BreedResultCard candidate={result.best} isPrimary />

          {result.alternatives?.length > 0 && (
            <>
              <h3 style={{ margin: '8px 0 0', fontSize: 13, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700 }}>
                Other possibilities
              </h3>
              {result.alternatives.map(alt => (
                <BreedResultCard key={alt.id} candidate={alt} isPrimary={false} />
              ))}
            </>
          )}

          <button onClick={reset} className="btn-filter" style={{ width: '100%', padding: 13 }}>Identify Another</button>
        </>
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes slideUpFade { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  );
}
