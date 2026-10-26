import { Suspense } from 'react';
import RecordList from '@/components/app/RecordList';
export default function Page() { return <Suspense fallback={<p role="status">Loading records…</p>}><RecordList section="events"/></Suspense>; }
