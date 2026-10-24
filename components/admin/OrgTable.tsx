'use client';

import { useMemo, useState } from 'react';

export type Org = {
  id: string;
  name: string;
  slug: string;
  tier: string;
  custom_domain: string | null;
  member_count: number;
  created_at: string;
};

export function OrgTable({ data }: { data: Org[] }) {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const pageSize = 10;

  const filtered = useMemo(() => {
    if (!search) return data;
    const q = search.toLowerCase();
    return data.filter(
      (o) =>
        o.name.toLowerCase().includes(q) ||
        o.slug.toLowerCase().includes(q) ||
        o.tier.toLowerCase().includes(q) ||
        (o.custom_domain || '').toLowerCase().includes(q)
    );
  }, [data, search]);

  const totalPages = Math.ceil(filtered.length / pageSize);
  const paginated = filtered.slice(page * pageSize, (page + 1) * pageSize);

  return (
    <div>
      <input
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(0);
        }}
        placeholder="Search organizations..."
        className="mb-4 px-3 py-2 border rounded"
      />
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="border p-2 text-left">Name</th>
            <th className="border p-2 text-left">Slug</th>
            <th className="border p-2 text-left">Tier</th>
            <th className="border p-2 text-left">Members</th>
            <th className="border p-2 text-left">Domain</th>
            <th className="border p-2 text-left">Created</th>
          </tr>
        </thead>
        <tbody>
          {paginated.map((o) => (
            <tr key={o.id} className="border-b">
              <td className="px-3 py-2">{o.name}</td>
              <td className="px-3 py-2">{o.slug}</td>
              <td className="px-3 py-2">{o.tier}</td>
              <td className="px-3 py-2">{o.member_count}</td>
              <td className="px-3 py-2">{o.custom_domain || '-'}</td>
              <td className="px-3 py-2">{new Date(o.created_at).toLocaleDateString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <div className="mt-4 flex gap-2">
        <button onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0}>
          Previous
        </button>
        <span>
          Page {page + 1} of {totalPages || 1}
        </span>
        <button
          onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
          disabled={page >= totalPages - 1}
        >
          Next
        </button>
      </div>
    </div>
  );
}
