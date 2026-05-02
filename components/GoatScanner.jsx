'use client';
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Camera, Upload, X, CheckCircle, AlertCircle, RefreshCw, Zap, Eye, Video } from 'lucide-react';
import { getLocalMatch } from '@/lib/localDb';
import { createWorker } from 'tesseract.js';

// ── TF.js is loaded lazily to avoid blocking the initial bundle ──
let tfLoaded = false;
let mobilenet = null;
let tf = null;

async function loadModels() {
  if (tfLoaded) return;
  tf = await import('@tensorflow/tfjs');
  const mn = await import('@tensorflow-models/mobilenet');
  
  // Initialize TF.js
  await tf.ready();
  mobilenet = await mn.load({ version: 2, alpha: 1.0 });
  tfLoaded = true;
  return { tf, mobilenet };
}

// Extract a 1024-dim embedding from a canvas / img element via MobileNet
async function extractEmbedding(imgElement) {
  if (!mobilenet) await loadModels();
  
  return tf.tidy(() => {
    // Explicit tensor conversion as per Phase 1 requirements
    const tensor = tf.browser.fromPixels(imgElement)
      .resizeNearestNeighbor([224, 224])
      .toFloat()
      .expandDims();
    
    // mobileNet.infer can take a tensor or an image
    const activation = mobilenet.infer(tensor, true); 
    return Array.from(activation.dataSync());
  });
}

// ── BREED HEURISTIC ──
async function guessBreed(imgElement) {
  if (!mobilenet) await loadModels();
  const preds = await mobilenet.classify(imgElement, 5);
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
  const [facing, setFacing]     = useState('environment');
  const [result, setResult]     = useState(null);
  const [frameCount, setFrameCount] = useState(0);
  const [enrollGoatId, setEnrollGoatId] = useState('');
  const [enrollCount, setEnrollCount]   = useState(0);
  const [capturedThumb, setCapturedThumb] = useState(null);
  const [error, setError]       = useState('');
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrText, setOcrText]       = useState('');

  // ── OVERLAY RENDERING ──
  const drawOverlay = useCallback((isScanning, matchedGoat = null) => {
    const canvas = overlayRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const { width, height } = canvas;
    ctx.clearRect(0, 0, width, height);

    if (!isScanning && !matchedGoat) return;

    // Draw scan area brackets
    const boxW = width * 0.5;
    const boxH = height * 0.6;
    const x = (width - boxW) / 2;
    const y = (height - boxH) / 2;

    ctx.strokeStyle = matchedGoat ? '#22c55e' : '#4ade80';
    ctx.lineWidth = 4;
    ctx.lineCap = 'round';

    // Draw corners
    const len = 30;
    // Top-left
    ctx.beginPath(); ctx.moveTo(x, y + len); ctx.lineTo(x, y); ctx.lineTo(x + len, y); ctx.stroke();
    // Top-right
    ctx.beginPath(); ctx.moveTo(x + boxW - len, y); ctx.lineTo(x + boxW, y); ctx.lineTo(x + boxW, y + len); ctx.stroke();
    // Bottom-left
    ctx.beginPath(); ctx.moveTo(x, y + boxH - len); ctx.lineTo(x, y + boxH); ctx.lineTo(x + len, y + boxH); ctx.stroke();
    // Bottom-right
    ctx.beginPath(); ctx.moveTo(x + boxW - len, y + boxH); ctx.lineTo(x + boxW, y + boxH); ctx.lineTo(x + boxW, y + boxH - len); ctx.stroke();

    if (isScanning) {
      // Animated scan line
      const scanY = y + (Math.sin(Date.now() / 400) * 0.5 + 0.5) * boxH;
      const grad = ctx.createLinearGradient(x, scanY, x + boxW, scanY);
      grad.addColorStop(0, 'transparent');
      grad.addColorStop(0.5, 'rgba(74, 222, 128, 0.5)');
      grad.addColorStop(1, 'transparent');
      ctx.fillStyle = grad;
      ctx.fillRect(x, scanY - 2, boxW, 4);
    }
  }, []);

  // Sync overlay size with video
  useEffect(() => {
    const timer = setInterval(() => {
      if (state === STATE.SCANNING) drawOverlay(true);
    }, 30);
    return () => clearInterval(timer);
  }, [state, drawOverlay]);

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
        videoRef.current.onloadedmetadata = () => {
          if (overlayRef.current) {
            overlayRef.current.width = videoRef.current.videoWidth;
            overlayRef.current.height = videoRef.current.videoHeight;
          }
        };
        await videoRef.current.play();
      }
      setCameraActive(true);
      setState(STATE.SCANNING);
      startFrameLoop();
    } catch (err) {
      setError('Camera access denied or hardware error.');
      setState(STATE.IDLE);
    }
  };

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

      // Phase 2: Check local re-ID cache first for instant results
      const localMatch = await getLocalMatch(embedding, 0.88);
      
      if (localMatch) {
        console.log('[scan] Instant local match found:', localMatch.goat.name);
        setResult({ ...localMatch, breedGuess: breedResult.breed });
        setCapturedThumb(canvasEl.toDataURL('image/jpeg', 0.7));
        setState(STATE.RESULT);
        stopCamera();
        if (onScanComplete) onScanComplete(localMatch);
        return;
      }

      // Fallback to server for high-accuracy or missing local match
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          embedding,
          image: canvasEl.toDataURL('image/jpeg', 0.8) 
        }),
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
      if (framesSinceLastScan >= 20) {
        framesSinceLastScan = 0;
        const canvas = captureFrame();
        if (canvas) runScan(canvas);
      }
    }, 100);
  }, [captureFrame, runScan]);

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setState(STATE.LOADING);
    setError('');

    if (file.type.startsWith('video/')) {
      // Video processing
      const video = document.createElement('video');
      video.src = URL.createObjectURL(file);
      video.muted = true;
      video.onloadeddata = async () => {
        video.currentTime = video.duration / 2; // Grab middle frame
      };
      video.onseeked = async () => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        ctx.drawImage(video, 0, 0);
        await runScan(canvas);
      };
    } else {
      // Image processing
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
    }
  };

  const [enrollFrames, setEnrollFrames] = useState([]);
  const [enrollProgress, setEnrollProgress] = useState(0);

  const captureEnrollFrame = () => {
    const canvas = captureFrame();
    if (!canvas) return;
    const b64 = canvas.toDataURL('image/jpeg', 0.8);
    setEnrollFrames(prev => [...prev, b64]);
  };

  const handleBatchEnroll = async () => {
    if (!enrollGoatId || enrollFrames.length === 0) return;
    setState(STATE.ENROLLING);
    setEnrollProgress(0);
    
    try {
      const res = await fetch('/api/enroll', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goat_id: enrollGoatId, images: enrollFrames }),
      });
      const data = await res.json();
      if (data.ok) {
        setEnrollCount(data.count);
        setState(STATE.ENROLLED);
      } else {
        setError(data.error || 'Enrollment failed');
        setState(STATE.RESULT);
      }
    } catch (err) {
      setError('Connection error during enrollment');
      setState(STATE.RESULT);
    }
  };

  const runOcr = async (canvasEl) => {
    setOcrLoading(true);
    try {
      const worker = await createWorker('eng');
      const { data: { text } } = await worker.recognize(canvasEl);
      await worker.terminate();
      const cleanText = text.replace(/[^a-zA-Z0-9-]/g, '').trim();
      setOcrText(cleanText);
      return cleanText;
    } catch (err) {
      console.warn('[ocr] Failed', err);
    } finally {
      setOcrLoading(false);
    }
  };

  const handleVerifyTag = async () => {
    const canvas = captureFrame();
    if (!canvas) return;
    const text = await runOcr(canvas);
    
    if (!result?.goat && text) {
      const res = await fetch('/api/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ earTag: text }),
      });
      const data = await res.json();
      if (data.goat) setResult(data);
    }
  };

  const reset = () => {
    stopCamera();
    setResult(null); setCapturedThumb(null); setError('');
    setEnrollGoatId(''); setEnrollCount(0);
    setEnrollFrames([]); setEnrollProgress(0);
    setOcrText(''); setOcrLoading(false);
    setState(STATE.IDLE); setFrameCount(0);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px' }}>
        <div style={{ background: '#e6f4ea', padding: 10, borderRadius: 12 }}>
          <Camera size={26} color="var(--primary)" />
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: 'var(--text-main)' }}>Goat Scanner</h2>
          <p style={{ margin: '3px 0 0', fontSize: 12, color: 'var(--text-sub)' }}>
            {modelsReady ? '✓ AI core loaded' : '⏳ Initializing AI…'}
          </p>
        </div>
        {state !== STATE.IDLE && (
          <button onClick={reset} style={{ marginLeft: 'auto', background: 'var(--bg-app)', border: '1px solid var(--border-color)', borderRadius: 10, padding: '7px 12px', cursor: 'pointer', fontSize: 13, color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: 5, fontFamily: 'inherit' }}>
            <RefreshCw size={13} /> Reset
          </button>
        )}
      </div>

      {state === STATE.IDLE && (
        <div style={{ display: 'flex', gap: 10 }}>
          {['camera', 'upload'].map(m => (
            <button key={m} onClick={() => setMode(m)} className={`btn-filter ${mode === m ? 'active' : ''}`} style={{ flex: 1, padding: '11px 0', fontSize: 14 }}>
              {m === 'camera' ? <><Camera size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Live Camera</> : <><Upload size={15} style={{ marginRight: 6, verticalAlign: 'middle' }} />Video / Photo</>}
            </button>
          ))}
        </div>
      )}

      {error && (
        <div style={{ padding: '12px 16px', background: '#fee2e2', borderRadius: 12, border: '1px solid #fecaca', color: '#dc2626', fontSize: 14, display: 'flex', gap: 8, alignItems: 'center' }}>
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {(state === STATE.IDLE || state === STATE.LOADING || state === STATE.SCANNING) && mode === 'camera' && (
        <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', background: '#111', aspectRatio: '4/3', width: '100%' }}>
          <video ref={videoRef} style={{ width: '100%', height: '100%', objectFit: 'cover', display: cameraActive ? 'block' : 'none' }} playsInline muted />
          <canvas ref={overlayRef} style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', zIndex: 10 }} />

          {!cameraActive && (
            <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Camera size={28} color="rgba(255,255,255,0.4)" />
              </div>
              <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 14 }}>Waiting to start camera</span>
            </div>
          )}

          {cameraActive && (
            <div style={{ position: 'absolute', top: 12, left: 12, background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '4px 10px', fontSize: 11, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 5, zIndex: 20 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#4ade80', animation: 'pulse 1s infinite' }} />
              LIVE SCANNING
            </div>
          )}
        </div>
      )}

      <canvas ref={canvasRef} style={{ display: 'none' }} />

      {state === STATE.IDLE && mode === 'camera' && (
        <button onClick={startCamera} className="btn-primary" style={{ width: '100%', justifyContent: 'center', padding: 16, fontSize: 16, borderRadius: 16 }} disabled={!modelsReady}>
          <Zap size={18} /> {modelsReady ? 'Start Camera' : 'Warming up AI…'}
        </button>
      )}

      {state === STATE.IDLE && mode === 'upload' && (
        <label style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 36, border: '2px dashed var(--border-color)', borderRadius: 20, cursor: 'pointer', background: 'rgba(255,255,255,0.3)' }}>
          <input type="file" accept="image/*,video/*" style={{ display: 'none' }} onChange={handleFileUpload} disabled={!modelsReady} />
          <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--primary-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
            <Video size={32} color="var(--primary)" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontWeight: 700, color: 'var(--text-main)', fontSize: 15 }}>Upload Goat Media</div>
            <div style={{ color: 'var(--text-sub)', fontSize: 13, marginTop: 4 }}>Select a photo or short video clip</div>
          </div>
        </label>
      )}

      {state === STATE.SCANNING && (
        <div className="glass-panel" style={{ padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#4ade80', animation: 'pulse 1s infinite', flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 600, fontSize: 14, color: 'var(--text-main)' }}>Analyzing live frames…</div>
            <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>Processing {frameCount} tensors. Focus on the goat.</div>
          </div>
        </div>
      )}

      {state === STATE.RESULT && result && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {capturedThumb && (
            <div style={{ position: 'relative', borderRadius: 20, overflow: 'hidden', width: '100%', aspectRatio: '4/3' }}>
              <img src={capturedThumb} alt="Captured" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              {result.goat && (
                <div style={{ position: 'absolute', top: '20%', left: '25%', right: '25%', bottom: '20%', border: `3px solid ${result.lowConfidence ? '#f59e0b' : '#22c55e'}`, borderRadius: 12, pointerEvents: 'none' }}>
                  <div style={{ position: 'absolute', top: -32, left: '50%', transform: 'translateX(-50%)', background: result.lowConfidence ? '#f59e0b' : '#22c55e', color: 'white', padding: '4px 12px', borderRadius: 8, fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap' }}>
                    {result.goat.name}
                  </div>
                </div>
              )}
            </div>
          )}

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
                      {!result.lowConfidence && <CheckCircle size={18} color="#22c55e" />}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 3 }}>
                      {result.goat.breed || result.breedGuess} · {result.goat.sex}
                    </div>
                  </div>
                </div>
                <div style={{ width: '100%', background: 'rgba(0,0,0,0.03)', borderRadius: 12, padding: 12, display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: 13, color: 'var(--text-sub)' }}>Match Score</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: result.lowConfidence ? '#f59e0b' : '#22c55e' }}>{Math.round(result.confidence * 100)}%</span>
                </div>

                {result.goat.ear_tag && (
                   <div style={{ width: '100%', padding: '12px 14px', background: 'var(--bg-main)', borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'space-between', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span style={{ fontSize: 10, color: 'var(--text-sub)', fontWeight: 700, letterSpacing: '0.05em' }}>OFFICIAL EAR TAG</span>
                        <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-main)' }}>{result.goat.ear_tag}</span>
                      </div>
                      {ocrText ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: ocrText.toLowerCase().includes(result.goat.ear_tag.toLowerCase()) ? '#16a34a' : '#dc2626' }}>
                          <CheckCircle size={18} />
                          <span style={{ fontSize: 13, fontWeight: 800 }}>{ocrText.toLowerCase().includes(result.goat.ear_tag.toLowerCase()) ? 'VERIFIED' : 'MISMATCH'}</span>
                        </div>
                      ) : (
                        <button 
                          onClick={handleVerifyTag} 
                          disabled={ocrLoading}
                          className="btn-filter" 
                          style={{ padding: '8px 12px', fontSize: 12, display: 'flex', alignItems: 'center', gap: 8, background: 'var(--primary)', color: 'white', border: 'none' }}
                        >
                          {ocrLoading ? <RefreshCw size={14} className="spin" /> : <Eye size={14} />}
                          Verify Tag
                        </button>
                      )}
                   </div>
                )}
              </>
            ) : (
              <div style={{ width: '100%', textAlign: 'center', padding: '10px 0' }}>
                <h3 style={{ margin: '0 0 6px', color: 'var(--text-main)', fontSize: 18 }}>Goat Not Recognized</h3>
                <p style={{ margin: 0, color: 'var(--text-sub)', fontSize: 14 }}>Breed Guess: {result.breedGuess}</p>
              </div>
            )}
          </div>

          <div className="glass-panel" style={{ padding: 18, flexDirection: 'column', gap: 14, display: 'flex' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Eye size={18} color="var(--primary)" />
              <span style={{ fontWeight: 700, fontSize: 15, color: 'var(--text-main)' }}>
                {state === STATE.ENROLLED ? 'Enrollment Complete ✓' : 'Batch Enrollment'}
              </span>
            </div>

            {state === STATE.ENROLLED ? (
              <div style={{ background: '#e6f4ea', borderRadius: 10, padding: '10px 14px', color: '#166534', fontSize: 14, fontWeight: 600 }}>
                ✓ {enrollFrames.length} photos added — total {enrollCount} training photos.
              </div>
            ) : (
              <>
                <p style={{ margin: 0, fontSize: 13, color: 'var(--text-sub)' }}>
                  Take 5–15 photos from different angles (front, side, ears) for best accuracy.
                </p>
                
                <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
                  {enrollFrames.map((f, i) => (
                    <div key={i} style={{ position: 'relative', width: 48, height: 48, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
                      <img src={f} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" />
                      <button onClick={() => setEnrollFrames(prev => prev.filter((_, idx) => idx !== i))} style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.5)', border: 'none', color: 'white', borderRadius: '50%', padding: 2, display: 'flex' }}><X size={10} /></button>
                    </div>
                  ))}
                  {enrollFrames.length < 15 && (
                    <button onClick={captureEnrollFrame} style={{ width: 48, height: 48, borderRadius: 8, border: '2px dashed var(--border-color)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', flexShrink: 0 }}>
                      <Camera size={18} />
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                   <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{enrollFrames.length} / 15 frames</span>
                   {enrollFrames.length > 0 && <button onClick={() => setEnrollFrames([])} style={{ fontSize: 11, color: '#ef4444', border: 'none', background: 'transparent', cursor: 'pointer' }}>Clear All</button>}
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: 13, color: 'var(--text-sub)', marginBottom: 6 }}>Select goat to enroll</label>
                  <select
                    className="form-select"
                    value={enrollGoatId}
                    onChange={e => setEnrollGoatId(e.target.value)}
                  >
                    <option value="">— pick a goat —</option>
                    {goats.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
                  </select>
                </div>

                <button
                  onClick={handleBatchEnroll}
                  className="btn-primary"
                  style={{ width: '100%', justifyContent: 'center', padding: 13 }}
                  disabled={!enrollGoatId || enrollFrames.length < 3 || state === STATE.ENROLLING}
                >
                  {state === STATE.ENROLLING ? 'Processing Batch…' : `Enroll ${enrollFrames.length} Photos`}
                </button>
                {enrollFrames.length < 3 && <p style={{ margin: 0, fontSize: 11, color: 'var(--text-sub)', textAlign: 'center' }}>Capture at least 3 photos</p>}
              </>
            )}
          </div>
          <button onClick={reset} className="btn-filter" style={{ width: '100%', padding: 13 }}>Scan Another</button>
        </div>
      )}

      <style>{`
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.3; } }
      `}</style>
    </div>
  );
}
