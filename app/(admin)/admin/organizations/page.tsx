'use client';

import { useEffect, useState } from 'react';
import { OrgTable } from '@/components/admin/OrgTable';

export default function AdminOrganizationsPage() {
  const [orgs, setOrgs] = useState([]);
  useEffect(() => {
    fetch('/api/admin/organizations')
      .then((r) => r.json())
      .then((d) => setOrgs(d.organizations || []))
      .catch(() => {});
  }, []);
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Organizations</h1>
      <OrgTable data={orgs} />
    </div>
  );
}
