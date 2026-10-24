import { NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: Request) {
  const user = await getAuthUser(request);
  if (!user || !user.orgId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { imageBase64, goatId } = body;

    if (!imageBase64) {
      return NextResponse.json({ error: 'Missing image' }, { status: 400 });
    }

    // Call ML service via ConnectRPC (or REST fallback)
    const mlServiceUrl = process.env.ML_SERVICE_URL || 'http://localhost:8080';
    
    const res = await fetch(`${mlServiceUrl}/api/scan`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-ml-key': process.env.ML_SERVICE_KEY || '',
      },
      body: JSON.stringify({
        image_b64: imageBase64,
        user_id: user.sub,
        goat_id: goatId,
      }),
    });

    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || 'ML service error');
    }

    return NextResponse.json(data);
  } catch (err) {
    console.error('ML scan error:', err);
    return NextResponse.json({ error: 'Scan failed' }, { status: 500 });
  }
}