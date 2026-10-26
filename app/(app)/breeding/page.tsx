import { Suspense } from 'react';
import RecordList from '@/components/app/RecordList';
import { FeatureGate } from '@/lib/context/TierContext';
export default function Page() { return <FeatureGate feature='breeding-records'><Suspense fallback={<p role="status">Loading records…</p>}><RecordList section='breeding'/></Suspense></FeatureGate>; }
