import BatchRecordForm from '@/components/app/BatchRecordForm';
export default async function BatchPage({searchParams}:{searchParams:Promise<{kind?:string}>}){const params=await searchParams;return <BatchRecordForm initialKind={params.kind==='weight'||params.kind==='milk'?params.kind:'health'}/>;}
