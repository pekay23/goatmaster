'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';

export default function AdminOrgDetailPage() {
  const params = useParams();
  const id = params?.id as string;
  const [org, setOrg] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);

  useEffect(() => {
    if (!id) return;
    fetch(`/api/admin/organizations/${id}`)
      .then((r) => r.json())
      .then((d) => { setOrg(d.organization); setMembers(d.members || []); })
      .catch(() => {});
  }, [id]);

  if (!org) return <div>Loading...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">{org.name}</h1>
      <p className="text-sm text-gray-500 mb-4">{org.slug} · {org.tier}</p>
      <h2 className="text-lg font-semibold mb-2">Members ({members.length})</h2>
      <ul className="space-y-1">
        {members.map((m) => (
          <li key={m.id} className="border-b py-1">{m.username} — {m.email} ({m.role})</li>
        ))}
      </ul>
    </div>
  );
}
