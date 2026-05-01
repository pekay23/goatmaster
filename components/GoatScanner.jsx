'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle, RefreshCw, Zap, Eye } from 'lucide-react';

// ── TF.js is loaded lazily to avoid blocking the initial bundle ──
let tfLoaded = false;
let mobilenet = null;

async function loadModels() {
  if (tfLoaded) return;
  const tf = await import('@tensorflow/tfjs');
  const mn = await import('@tensorflow-models/mobilenet');
  mobilenet = await mn.load({ version: 2, alpha: 1.0 });
  tfLoaded = true;
  return { tf, mobilenet };
}

// Extract a 1024-dim embedding from a canvas / img element via MobileNet
async function extractEmbedding(imgElement) {
  if (!mobilenet) await loadModels();
  const tf = await import('@tensorflow/tfjs');
  const activation = mobilenet.infer(imgElement, true); // true = intermediate features
  const data = await activation.data();
  activation.dispose();
  return Array.from(data);
}

// ── BREED HEURISTIC ──
// Until a fine-tuned breed model is trained, we use colour & shape heuristics
// from MobileNet's top-5 classifications as a rough guide.
async function guessBreed(imgElement) {
  if (!mobilenet) await loadModels();
  const preds = await mobilenet.classify(imgElement, 5);
  // Map ImageNet labels that overlap with goat breeds
  const breedHints = {
    'Angora': ['wool', 'angora', 'fleece'],
    'Boer': ['goat', 'ibex', 'chamois'],
    'Nubian': ['goat', 'deer'],
    'Alpine': ['mountain goat', 'ibex', 'chamois'],
    'Saanen': ['white', 'goat'],
  };
  for (const [breed, keywords] of Object.entries(breedHints)) {
    if (preds.some(p => keywords.some(k => p.className.toLowerCase().includes(k)))) {
      return { breed, probability: preds[0]?.probability ?? 0 };
    }
  }
  return { breed: 'Unknown', probability: 0 };
}

// ── SCAN STATES ──
const STATE = { IDLE: 'idle', LOADING: 'loading', SCANNING: 'scanning', RESULT: 'result', ENROLLING: 'enrolling', ENROLLED: 'enrolled' };

export default function GoatScanner({ goats = [], onScanComplete }) {
  const videoRef     = useRef(null);
  const canvasRef    = useRef(null);
  const overlayRef   = useRef(null);
  const frameTimerRef = useRef(null);
  const streamRef    = useRef(null);

  const [mode, setMode]         = useState('camera'); // camera | upload
  const [state, setState]       = useState(STATE.IDLE);
  const [modelsReady, setModelsReady] = useState(false);
  const [cameraActive, setCameraActive] = useState(false);
  const [facing, setFacing]     = useState('environment'); // back camera on mobile
  const [result, setResult]     = useState(null);   // { goat, confidence, method, breedGuess }
  const [frameCount, setFrameCount] = useState(0);
  const [enrollGoatId, setEnrollGoatId] = useState('');
  const [enrollCount, setEnrollCount]   = useState(0);
  const [capturedThumb, setCapturedThumb] = useState(null);
  const [error, setError]       = useState('');

  // Pre-load models on mount
  useEffect(() => {
    loadModels().then(() => setModelsReady(true)).catch(console.error);
    return () => stopCamera();
  }, []);

  const stopCamera = () => {
    if (frameTimerRef.current) clearInterval(frameTimerRef.current);
    if (streamRef.current) streamRef.current.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setCameraActive(false);
  };

  const startCamera = async () => {
    stopCamera();
    setError('');
    setState(STATE.LOADING);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: facing, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraActive(true);
      setState(STATE.SCANNING);
      startFrameLoop();
    } catch (err) {
      setError('Camera access denied. Please allow camera permissions and try again.');
      setState(STATE.IDLE);
    }
  };

  const flipCamera = async () => {
    setFacing(f => f === 'environment' ? 'user' : 'environment');
    if (cameraActive) {
      stopCamera();
      // startCamera will pick up the new facing state via the useEffect below
    }
  };

  useEffect(() => { if (cameraActive) startCamera(); }, [facing]);

  const captureFrame = useCallback(() => {
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas || video.readyState < 2) return null;
    const ctx = canvas.getContext('2d');
    canvas.width  = video.videoWidth;
    canvas.height = video.videoHeight;
    ctx.drawImage(video, 0, 0);
    return canvas;
  }, []);

  const runScan = useCallback(async (canvasEl) => {
    if (!canvasEl || !modelsReady) return;
    try {
      const [embedding, breedResult] = await Promise.all([
        extractEmbedding(canvasEl),
        guessBreed(canvasEl),
      ]);

      // Hit the server for identity matching
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ embedding }),
      });
      const data = await res.json();

      setResult({ ...data, breedGuess: breedResult.breed });
      setCapturedThumb(canvasEl.toDataURL('image/jpeg', 0.7));
      setState(STATE.RESULT);
      stopCamera();
      if (onScanComplete) onScanComplete(data);
    } catch (err) {
      console.error('Scan error', err);
    }
  }, [modelsReady, onScanComplete]);

  const startFrameLoop = useCallback(() => {
    let framesSinceLastScan = 0;
    frameTimerRef.current = setInterval(async () => {
      framesSinceLastScan++;
      setFrameCount(n => n + 1);
      // Draw preview overlay every frame, scan every 20 frames (~2s at 10fps)
      if (framesSinceLastScan >= 20) {
        framesSinceLastScan = 0;
        const canvas = captureFrame();
        if (canvas) runScan(canvas);
      }
    }, 100); // 10 fps
  }, [captureFrame, runScan]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setState(STATE.LOADING);
    setError('');
    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      await runScan(canvas);
    };
    img.src = URL.createObjectURL(file);
  };

  const handleEnroll = async () => {
    if (!enrollGoatId || !capturedThumb) return;
    setState(STATE.ENROLLING);
    const img = new Image();
    img.onload = async () => {
      const canvas = canvasRef.current;
      const ctx = canvas.getContext('2d');
      canvas.width = img.width; canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      const embedding = await extractEmbedding(canvas);
      await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goatId: parseInt(enrollGoatId), embedding }),
      });
      const countRes = await fetch(`/api/enroll?goatId=${enrollGoatId}`);
      const countData = await countRes.json();
      setEnrollCount(countData.count);
      setState(STATE.ENROLLED);
    };
    img.src = capturedThumb;
  };

  const reset = () => {
    stopCamera();
    setResult(null); setCapturedThumb(null); setError('');
    setEnrollGoatId(''); setEnrollCount(0);
    setState(STATE.IDLE); setFrameCount(0);
  };

  // ── CONFIDENCE DISPLAY ──
  const ConfidenceBadge = ({ score }) => {
    const pct = Math.round((score ?? 0) * 100);
    const color = pct >= 80 ? '#22c55e' : pct >= 60 ? '#f59e0b' : '#ef4444';
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <div style={{ width: 80, height: 6, background: 'rgba(0,0,0,0.1)', borderRadius: 3, overflow: 'hidden' }}>
          <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 3, transition: 'width 0.5s' }} />
        </div>
        <span style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
      </div>
    );
  };

  // ── RENDER ──
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

      {/* Header */}
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
        <div style={{ background: '#e6f4ea', padding: 10, borderRadius: 12 }}>
          <Camera size={26} color="var(--primary)" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>Goat Scanner</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>
            {modelsReady ? '✓ AI model ready' : '⏳ Loading model…'}
          </p>
        </div>
        {state !== STATE.IDLE && (
          <button onClick={reset} style={{ marginLeft: 'auto', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> Reset
          </button>
        )}
      </div>

      {/* Mode toggle */}
      {state === STATE.IDLE && (
        <div style={{ display: 'flex', gap: 10 }}>
          {['camera', 'upload'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`btn-filter ${mode === m ? 'active' : ''}`} style={{ flex: 1, padding: '11px 0', fontSize: 14 }}>
              {m === 'camera' ? <><Camera size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Live Camera</> : <><Upload size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Upload Image</>}
            </button>
          ))}
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', borderRadius: 12, border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Camera viewport */}
      {(state === STATE.IDLE || state === STATE.LOADING || state === STATE.SCANNING) && mode === 'camera' && (
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#111', aspectRatio: '4/3', width: '100%' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }} playsInline muted />

          {/* Scan frame overlay */}
          {cameraActive && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
              {/* Corner brackets */}
              {[['0%','0%','right','bottom'],['0%','auto','right','top'],['auto','0%','left','bottom'],['auto','auto','left','top']].map(([t,b,r,l], i) => (
                <div key={i} style={{ position: 'absolute', top: t === 'auto' ? undefined : '20%', bottom: b === 'auto' ? undefined : '20%', right: r === 'left' ? undefined : '25%', left: l === 'right' ? undefined : '25%', width: 28, height: 28, borderTop: t !== 'auto' ? '3px solid #4ade80' : undefined, borderBottom: b !== 'auto' ? '3px solid #4ade80' : undefined, borderLeft: l !== 'right' ? '3px solid #4ade80' : undefined, borderRight: r !== 'left' ? '3px solid #4ade80' : undefined }} />
              ))}
              {/* Scan line */}
              <div style={{ position: 'absolute', left: '25%', right: '25%', height: 2, background: 'linear-gradient(90deg, transparent, #4ade80, transparent)', animation: 'scanLine 2s linear infinite' }} />
            </div>
          )}

          {/* Placeholder when camera not active */}
          {!cameraActive && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={28} color="rgba(255,255,255,0.4)" />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Camera not started</span>
            </div>
          )}

          {/* Frame counter */}
          {cameraActive && (
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 5 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 1s infinite' }} />
              LIVE
            </div>
          )}

          {/* Flip camera button */}
          {cameraActive && (
            <button onClick={flipCamera} style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: 10, padding: '8px 10px', cursor: 'pointer', color: 'white' }}>
              <RefreshCw size={16} />
            </button>
          )}
        </div>
      )}

      {/* Hidden canvas for capture */}
      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {/* Action buttons — IDLE */}
      {state === STATE.IDLE && mode === 'camera' && (
        <button onClick={startCamera} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 16, fontSize: 16, borderRadius: 16 }} disabled={!modelsReady}>
          <Zap size={18} /> {modelsReady ? 'Start Scanning' : 'Loading Model…'}
        </button>
      )}

      {state === STATE.IDLE && mode === 'upload' && (
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 36, border: '2px dashed var(--border-color)', borderRadius: 20, cursor: 'pointer', background: 'rgba(255,255,255,0.3)', transition: 'background 0.2s' }}>
          <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={!modelsReady} />
          <Upload size={32} color="var(--text-sub)" />
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 15 }}>Tap to select photo or video</div>
            <div style={{ color: 'var(--text-sub)', fontSize: 13, marginTop: 4 }}>JPG, PNG, MP4 supported</div>
          </div>
          {!modelsReady && <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>⏳ Loading AI model first…</div>}
        </label>
      )}

      {/* Scanning state indicator */}
      {state === STATE.SCANNING && (
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80', animation: 'pulse 1s infinite', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-main)' }}>Scanning…</div>
            <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>Analysing frame {frameCount} — hold steady near the goat's face</div>
          </div>
        </div>
      )}

      {state === STATE.LOADING && (
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 22, height: 22, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <span style={{ color: 'var(--text-main)', fontSize: 14 }}>Starting camera…</span>
        </div>
      )}

      {/* ── RESULT PANEL ── */}
      {state === STATE.RESULT && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

          {/* Captured image with overlay */}
          {capturedThumb && (
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', width: '100%', aspectRatio: '4/3' }}>
              <img src={capturedThumb} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {/* Bounding box overlay for matched goat */}
              {result.goat && (
                <div style={{ position: 'absolute', top: '20%', left: '28%', right: '28%', bottom: '18%', border: `3px solid ${result.lowConfidence ? '#f59e0b' : '#22c55e'}`, borderRadius: 12, pointerEvents: 'none' }}>
                  {/* Name tag at top of box */}
                  <div style={{ position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)', background: result.lowConfidence ? '#f59e0b' : '#22c55e', color: 'white', padding: '4px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 2px 8px rgba(0,0,0,0.2)' }}>
                    {result.goat.name}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Result card */}
          <div className="glass-panel" style={{ padding: 20, flexDirection: 'column', gap: 16, display: 'flex', alignItems: 'flex-start' }}>
            {result.goat ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, width: '100%' }}>
                  {result.goat.image_url
                    ? <img src={result.goat.image_url} style={{ width: 56, height: 56, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} alt="" />
                    : <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🐐</div>
                  }
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <h3 style={{ margin: 0, fontSize: 20, fontWeight: 800, color: 'var(--text-main)' }}>{result.goat.name}</h3>
                      {result.lowConfidence
                        ? <span style={{ fontSize: 10, background: '#fef3c7', color: '#92400e', padding: '2px 8px', borderRadius: 6, fontWeight: 700 }}>UNCERTAIN</span>
                        : <CheckCircle size={18} color="#22c55e" />
                      }
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 3 }}>
                      ID: G{String(result.goat.id).padStart(3, '0')} · {result.goat.breed || result.breedGuess || 'Unknown breed'} · {result.goat.sex}
                    </div>
                  </div>
                </div>

                <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>Match confidence</span>
                    <ConfidenceBadge score={result.confidence} />
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>Method</span>
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)', textTransform: 'capitalize' }}>{result.method || 'face'}</span>
                  </div>
                  {result.breedGuess && result.breedGuess !== 'Unknown' && (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>Breed detected</span>
                      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-main)' }}>{result.breedGuess}</span>
                    </div>
                  )}
                </div>

                {/* Low confidence: show best guess with option to correct */}
                {result.lowConfidence && (
                  <div style={{ width: '100%', background: '#fef3c7', borderRadius: 12, padding: '12px 14px', border: '1px solid #fde68a' }}>
                    <p style={{ margin: '0 0 10px', fontSize: 13, color: '#92400e', fontWeight: 600 }}>⚠️ Low confidence — is this correct?</p>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => setState(STATE.IDLE)} style={{ flex: 1, padding: '9px 0', borderRadius: 10, border: '1px solid #d97706', background: 'transparent', color: '#92400e', cursor: 'pointer', fontSize: 13, fontWeight: 600, fontFamily: 'inherit' }}>Rescan</button>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div style={{ width: '100%', textAlign: 'center', padding: '10px 0' }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🔍</div>
                <h3 style={{ margin: '0 0 6px', color: 'var(--text-main)', fontSize: 18 }}>No match found</h3>
                <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: 14 }}>
                  {result.breedGuess && result.breedGuess !== 'Unknown' ? `Looks like a ${result.breedGuess}. ` : ''}
                  This goat may not be enrolled yet.
                </p>
              </div>
            )}
          </div>

          {/* ── ENROLL SECTION ── */}
          <div className="glass-panel" style={{ padding: 18, flexDirection: 'column', gap: 14, display: 'flex' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Eye size={18} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>
                {state === STATE.ENROLLED ? 'Enrolled ✓' : 'Enroll this photo'}
              </span>
            </div>

            {state === STATE.ENROLLED ? (
              <div style={{ background: '#e6f4ea', borderRadius: 10, padding: '10px 14px', color: '#166534', fontSize: 14, fontWeight: 600 }}>
                ✓ Photo saved — this goat now has {enrollCount} training photo{enrollCount !== 1 ? 's' : ''}. Add 5+ for best accuracy.
              </div>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-sub)' }}>
                  Save this frame as a training photo for a goat. Add 5–15 photos from different angles.
                </p>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--text-sub)', marginBottom: 6 }}>Select goat to enroll</label>
                  <select
                    className="form-select"
                    value={enrollGoatId}
                    onChange={e => setEnrollGoatId(e.target.value)}
                  >
                    <option value="">— pick a goat —</option>
                    {goats.map(g => <option key={g.id} value={g.id}>{g.name} ({g.breed || 'Unknown breed'})</option>)}
                  </select>
                </div>
                <button
                  onClick={handleEnroll}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: 13 }}
                  disabled={!enrollGoatId || state === STATE.ENROLLING}
                >
                  {state === STATE.ENROLLING ? 'Saving…' : '+ Save as Training Photo'}
                </button>
              </>
            )}
          </div>

          <button onClick={reset} className="btn-filter" style={{ width: '100%', padding: 13 }}>Scan Another Goat</button>
        </div>
      )}

      {/* Instructions */}
      {state === STATE.IDLE && (
        <div className="glass-panel" style={{ padding: '16px 18px', flexDirection: 'column', gap: 10, display: 'flex', alignItems: 'flex-start' }}>
          <h4 style={{ margin: 0, fontSize: 14, fontWeight: 700, color: 'var(--text-main)' }}>How it works</h4>
          {[
            ['1', "Point camera at a goat's face or body"],
            ['2', 'AI extracts a visual fingerprint on-device'],
            ['3', 'Matched against enrolled goats in your database'],
            ['4', 'Enroll new photos to improve accuracy over time'],
          ].map(([n, t]) => (
            <div key={n} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
              <div style={{ width: 22, height: 22, borderRadius: '50%', background: 'var(--primary-bg)', color: 'var(--primary)', fontSize: 12, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>{n}</div>
              <span style={{ fontSize: 13, color: 'var(--text-sub)', lineHeight: 1.5 }}>{t}</span>
            </div>
          ))}
        </div>
      )}

      {/* Keyframe animations injected once */}
      <style>{`
        @keyframes scanLine { 0% { top: 20%; } 50% { top: 78%; } 100% { top: 20%; } }
        @keyframes pulse    { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
        @keyframes spin     { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
