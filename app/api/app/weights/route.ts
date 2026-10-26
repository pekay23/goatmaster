import { createMeasurement, getMeasurements } from '../_measurements';
export function GET(request: Request) { return getMeasurements(request, 'weights'); }
export function POST(request: Request) { return createMeasurement(request, 'weights'); }
