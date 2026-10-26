export type RecordSection = 'herd' | 'health' | 'breeding' | 'inventory' | 'events' | 'weights' | 'milk';
export function isRecordSection(value: string): value is RecordSection {
  return value === 'herd' || value === 'health' || value === 'breeding' || value === 'inventory' || value === 'events' || value === 'weights' || value === 'milk';
}
