import OrganizationDirectory from '@/components/admin/OrganizationDirectory';
export default async function AdminOrganizationsPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const read = (key: string) => typeof params[key] === 'string' ? params[key] : '';
  return <OrganizationDirectory search={read('search')} tier={read('tier')} status={read('status')} sample={read('sample') || 'all'} sort={read('sort') || 'newest'} page={Math.max(1, Number.parseInt(read('page') || '1', 10) || 1)} />;
}
