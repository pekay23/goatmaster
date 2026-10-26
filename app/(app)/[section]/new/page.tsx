import { notFound } from 'next/navigation';
import { RecordForm } from '@/components/app/RecordForm';
import { isRecordSection } from '@/components/app/record-schema';

export default async function NewRecordPage({ params, searchParams }: { params: Promise<{ section: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { section } = await params;
  if (!isRecordSection(section)) notFound();
  const search = await searchParams;
  const prefill: Record<string, string> = {};
  for (const [parameter, field] of [['goatId', 'goat_id'], ['damId', 'dam_id'], ['sireId', 'sire_id'], ['type', 'type']]) {
    const value = search[parameter];
    if (typeof value === 'string') prefill[field] = value;
  }
  return <RecordForm section={section} prefill={prefill} returnTo={typeof search.returnTo === 'string' ? search.returnTo : undefined}/>;
}
