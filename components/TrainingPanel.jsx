'use client';
import { useState, useEffect } from 'react';
import { Cpu, Loader2 } from 'lucide-react';

export default function TrainingPanel({ goats, showToast }) {
  const [status, setStatus] = useState(null);
  const [training, setTraining] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    fetch('/api/smart-scan/train', { credentials: 'include' })
      .then(r => r.json()).then(setStatus).catch(() => setStatus({ available: false }));
  }, []);

  const startTraining = async () => {
    setTraining(true); setResult(null);
    try {
      const res = await fetch('/api/smart-scan/train', {
        method: 'POST', credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ epochs: 20 }),
      });
      const data = await res.json();
      setResult(data);
      if (data.status === 'ok') showToast('AI model trained successfully!', 'success');
      else if (data.status === 'skipped') showToast(data.reason, 'error');
      else showToast(data.error || 'Training failed', 'error');
    } catch { showToast('Could not reach ML service', 'error'); }
    finally { setTraining(false); }
  };

  if (!status) return null;

  return (
    <div className="glass-panel" style={{ padding: 18, borderRadius: 14, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <Cpu size={20} color="var(--primary)" />
        <div>
          <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text-main)' }}>Train Recognition AI</div>
          <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>
            {status.available
              ? `${status.goats_in_db || 0} goats, ${status.embeddings_in_db || 0} photos in training set`
              : 'ML service not connected'}
          </div>
        </div>
      </div>

      {status.available && (
        <>
          <p style={{ margin: 0, fontSize: 13, color: 'var(--text-sub)' }}>
            Uses your enrolled photos to teach the AI what each goat looks like from every angle.
            Enroll more photos first for better results.
          </p>

          {status.has_finetuned_weights && (
            <div style={{ fontSize: 12, color: '#16a34a', fontWeight: 600 }}>
              Previously trained model loaded
            </div>
          )}

          <button
            onClick={startTraining}
            disabled={training || !status.ready_to_train}
            className="btn-primary"
            style={{ width: '100%', justifyContent: 'center', padding: 13 }}
          >
            {training
              ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Training...</>
              : !status.ready_to_train
                ? 'Need 2+ goats with 3+ photos each'
                : status.has_finetuned_weights ? 'Retrain AI' : 'Train AI'}
          </button>

          {result?.status === 'ok' && (
            <div style={{ padding: 12, background: '#dcfce7', borderRadius: 10, fontSize: 13, color: '#166534' }}>
              Trained on {result.goats_used} goats using {result.triplets} comparisons.
              Final loss: {result.final_loss} ({result.train_time_sec}s)
            </div>
          )}
        </>
      )}
    </div>
  );
}