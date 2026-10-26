import { notFound } from 'next/navigation';
import RecordDetails from '@/components/app/RecordDetails';
import { isRecordSection } from '@/components/app/record-schema';

export default async function RecordDetailsPage({ params, searchParams }: { params: Promise<{ section: string; id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { section, id } = await params;
  if (!isRecordSection(section)) notFound();
  const search = await searchParams;
  return <RecordDetails section={section} recordId={id} returnTo={typeof search.returnTo === 'string' ? search.returnTo : undefined}/>;
}
