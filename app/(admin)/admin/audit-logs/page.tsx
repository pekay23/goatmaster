'use client';

import { useEffect, useState } from 'react';
import { Search, Activity, Calendar, Download } from 'lucide-react';

type AuditLog = {
  id: string;
  actor_email: string;
  actor_role: string;
  action: string;
  resource: string;
  resource_id: string | null;
  organization_id: string | null;
  ip_address: string | null;
  created_at: string;
};

type Filters = {
  actor: string;
  action: string;
  resource: string;
  dateFrom: string;
  dateTo: string;
  page: number;
  limit: number;
};

export default function AuditLogsPage() {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [filters, setFilters] = useState<Filters>({
    actor: '',
    action: '',
    resource: '',
    dateFrom: '',
    dateTo: '',
    page: 1,
    limit: 50,
  });
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const qs = new URLSearchParams({
          actor: filters.actor,
          action: filters.action,
          resource: filters.resource,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          page: String(filters.page),
          limit: String(filters.limit),
        });

        const res = await fetch(`/api/admin/audit-logs?${qs}`);
        const data = await res.json();
        if (cancelled) return;
        setLogs(data.logs ?? []);
        setTotal(Number(data.total ?? 0));
      } catch {
        if (!cancelled) setLogs([]);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [filters.actor, filters.action, filters.resource, filters.dateFrom, filters.dateTo, filters.page, filters.limit]);

  const setFilter = (key: keyof Filters, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const exportCsv = async () => {
    const qs = new URLSearchParams({
      actor: filters.actor,
      action: filters.action,
      resource: filters.resource,
      dateFrom: filters.dateFrom,
      dateTo: filters.dateTo,
      export: 'csv',
    });
    const res = await fetch(`/api/admin/audit-logs?${qs}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const prevPage = () => setFilters((prev) => ({ ...prev, page: Math.max(prev.page - 1, 1) }));
  const nextPage = () => setFilters((prev) => ({ ...prev, page: prev.page + 1 }));
  const totalPages = Math.max(Math.ceil(total / filters.limit), 1);
  const hasPrev = filters.page > 1;
  const hasNext = filters.page < totalPages;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Audit Logs</h1>
          <p className="text-sm text-text-sub">Searchable audit trail of admin and system actions.</p>
        </div>
        <button
          onClick={exportCsv}
          disabled={loading || logs.length === 0}
          className="inline-flex items-center gap-2 px-3 py-2 border border-border rounded-md text-sm hover:bg-bg-elevated disabled:opacity-50 disabled:pointer-events-none"
        >
          <Download size={16} /> Export CSV
        </button>
      </div>

      <div className="grid gap-3 md:grid-cols-4">
        <div className="relative">
          <Activity className="absolute left-3 top-3 size-4 text-text-muted" />
          <input
            type="search"
            placeholder="Actor (email)"
            value={filters.actor}
            onChange={(e) => setFilter('actor', e.target.value)}
            className="w-full pl-10 px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <Activity className="absolute left-3 top-3 size-4 text-text-muted" />
          <input
            type="search"
            placeholder="Action"
            value={filters.action}
            onChange={(e) => setFilter('action', e.target.value)}
            className="w-full pl-10 px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <Activity className="absolute left-3 top-3 size-4 text-text-muted" />
          <input
            type="search"
            placeholder="Resource"
            value={filters.resource}
            onChange={(e) => setFilter('resource', e.target.value)}
            className="w-full pl-10 px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 size-4 text-text-muted" />
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilter('dateFrom', e.target.value)}
            className="w-full pl-10 px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="relative">
          <Calendar className="absolute left-3 top-3 size-4 text-text-muted" />
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilter('dateTo', e.target.value)}
            className="w-full pl-10 px-3 py-2 border border-border rounded-md text-sm focus:outline-none focus:border-primary"
          />
        </div>
      </div>

      <div className="border border-border rounded-md overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="bg-bg-elevated/50 border-b border-border">
              <th className="px-4 py-3">Timestamp</th>
              <th className="px-4 py-3">Actor</th>
              <th className="px-4 py-3">Role</th>
              <th className="px-4 py-3">Action</th>
              <th className="px-4 py-3">Resource</th>
              <th className="px-4 py-3">Resource ID</th>
              <th className="px-4 py-3">IP Address</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border/50">
                <td className="px-4 py-2 text-text-sub">{new Date(log.created_at).toLocaleString()}</td>
                <td className="px-4 py-2 font-medium">{log.actor_email}</td>
                <td className="px-4 py-2 text-text-sub">{log.actor_role}</td>
                <td className="px-4 py-2">{log.action}</td>
                <td className="px-4 py-2">{log.resource}</td>
                <td className="px-4 py-2 text-text-sub">{log.resource_id ?? '—'}</td>
                <td className="px-4 py-2 text-text-sub">{log.ip_address ?? '—'}</td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={7} className="px-4 py-6 text-center text-text-muted">
                  No audit logs found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between">
        <div className="text-sm text-text-sub">
          Showing {logs.length} of {total} entries
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={prevPage}
            disabled={!hasPrev}
            className="px-3 py-1.5 border border-border rounded-md text-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            Prev
          </button>
          <span className="px-3 py-1.5 text-sm">
            {filters.page} / {totalPages}
          </span>
          <button
            onClick={nextPage}
            disabled={!hasNext}
            className="px-3 py-1.5 border border-border rounded-md text-sm disabled:opacity-50 disabled:pointer-events-none"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
