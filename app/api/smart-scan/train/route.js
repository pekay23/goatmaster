import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/smart-scan/train
 * Triggers fine-tuning of the ResNet50 re-ID model on the ML service.
 * Uses goat photos already in the database.
 */
export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  if (!process.env.ML_SERVICE_URL) {
    return NextResponse.json({ error: 'ML service not configured' }, { status: 503 });
  }

  try {
    const body = await request.json().catch(() => ({}));

    const mlRes = await fetch(`${process.env.ML_SERVICE_URL}/train/reid`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ML-Key': process.env.ML_SERVICE_KEY || '',
      },
      body: JSON.stringify({
        epochs: body.epochs || 20,
        lr: body.lr || 0.0001,
        margin: body.margin || 0.3,
        min_photos_per_goat: body.min_photos_per_goat || 3,
      }),
    });

    if (!mlRes.ok) {
      const errData = await mlRes.json().catch(() => ({}));
      return NextResponse.json({ error: errData.detail || 'Training failed' }, { status: 502 });
    }

    const data = await mlRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[train]', err.message);
    return NextResponse.json({ error: 'Training request failed' }, { status: 500 });
  }
}

/**
 * GET /api/smart-scan/train
 * Returns training status — whether fine-tuned weights exist, data readiness.
 */
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  if (!process.env.ML_SERVICE_URL) {
    return NextResponse.json({
      available: false,
      reason: 'ML service not configured',
    });
  }

  try {
    const mlRes = await fetch(`${process.env.ML_SERVICE_URL}/train/status`, {
      headers: { 'X-ML-Key': process.env.ML_SERVICE_KEY || '' },
    });

    if (!mlRes.ok) {
      return NextResponse.json({ available: false, reason: 'ML service unreachable' });
    }

    const data = await mlRes.json();
    return NextResponse.json({ available: true, ...data });
  } catch {
    return NextResponse.json({ available: false, reason: 'ML service unreachable' });
  }
}
