import { NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth';

/**
 * POST /api/smart-scan/embed
 * Body: { image_b64: "data:image/jpeg;base64,..." }
 *
 * Proxies to the ML service's /embed endpoint for higher-quality
 * YOLOv8 crop + ResNet50 embeddings. Used by SmartScanner when
 * ML_SERVICE_URL is available.
 */
export async function POST(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  if (!process.env.ML_SERVICE_URL) {
    return NextResponse.json({ error: 'ML service not configured' }, { status: 503 });
  }

  try {
    const { image_b64 } = await request.json();
    if (!image_b64) {
      return NextResponse.json({ error: 'image_b64 required' }, { status: 400 });
    }

    const mlRes = await fetch(`${process.env.ML_SERVICE_URL}/embed`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-ML-Key': process.env.ML_SERVICE_KEY || '',
      },
      body: JSON.stringify({ image_b64 }),
    });

    if (!mlRes.ok) {
      return NextResponse.json({ error: 'ML service error' }, { status: 502 });
    }

    const data = await mlRes.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('[smart-scan/embed]', err.message);
    return NextResponse.json({ error: 'Failed to get embedding' }, { status: 500 });
  }
}

/**
 * GET /api/smart-scan/embed
 * Health check — returns whether server-side embedding is available.
 */
export async function GET(request) {
  const { error } = await requireAuth(request);
  if (error) return error;

  return NextResponse.json({
    available: !!process.env.ML_SERVICE_URL,
  });
}
