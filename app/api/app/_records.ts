import { isValidRecordDate } from '@/lib/input-validation';
import { NextResponse } from 'next/server';

export const uuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function pagination(search: URLSearchParams) {
  const page = Math.min(100000, Math.max(1, Number.parseInt(search.get('page') || '1', 10) || 1));
  const limit = Math.min(100, Math.max(1, Number.parseInt(search.get('limit') || '25', 10) || 25));
  return { page, limit, offset: (page - 1) * limit };
}

export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function validDate(value: unknown): boolean {
  if (value == null || value === '') return true;
  return isValidRecordDate(value);
}

export function apiError(error: unknown, message: string) {
  if (isObject(error) && typeof error.code === 'string') {
    if (['23514', '22P02', '22007', '22008', '23502'].includes(error.code)) return NextResponse.json({ error: error.code === '23514' && typeof error.message === 'string' ? error.message : 'Check the record values and try again.' }, { status: 400 });
    if (error.code === '23503') return NextResponse.json({ error: 'This record is linked to another record. Update its linked records first.' }, { status: 409 });
    if (error.code === '23505') return NextResponse.json({ error: 'A record with those details already exists.' }, { status: 409 });
  }
  console.error(message, error);
  return NextResponse.json({ error: message }, { status: 500 });
}

export function recordVersion(value: unknown): number | null {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 ? value : null;
}
