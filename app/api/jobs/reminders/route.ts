import { NextResponse } from 'next/server';
import { timingSafeEqual } from 'node:crypto';
import { generateReminders } from '@/lib/reminders';
export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  const provided = request.headers.get('authorization') || '';
  const expected = 'Bearer ' + secret;
  if (!secret || provided.length !== expected.length || !timingSafeEqual(Buffer.from(provided), Buffer.from(expected))) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try { return NextResponse.json(await generateReminders()); } catch(error) { console.error('Reminder generation failed:',error); return NextResponse.json({ error: 'Reminder generation failed' }, { status: 500 }); }
}
