import OrganizationWorkspace from '@/components/admin/OrganizationWorkspace';
export default async function AdminOrgDetailPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { id } = await params;
  const search = await searchParams;
  const view = typeof search.tab === 'string' ? search.tab : 'overview';
  const back = typeof search.return === 'string' && search.return.startsWith('/admin/organizations?') ? search.return : '/admin/organizations';
  return <OrganizationWorkspace id={id} view={view} back={back}/>;
}
