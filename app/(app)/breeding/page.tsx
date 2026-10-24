'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { FeatureGate, useTier } from '@/lib/context/TierContext';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  Heart,
  Baby,
  Calendar,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface BreedingRecord {
  id: string;
  dam_id: string;
  dam_name: string;
  sire_id: string | null;
  sire_name: string | null;
  mating_date: string;
  expected_kidding_date: string | null;
  actual_kidding_date: string | null;
  kids_count: number;
  status: string;
  notes: string;
  created_at: string;
}

const BREEDING_STATUSES = [
  'planned',
  'mated',
  'confirmed',
  'kidded',
  'failed',
];

export default function BreedingPage() {
  const queryClient = useQueryClient();
  const { tier } = useTier();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['breeding-records', search, statusFilter],
    queryFn: () => fetch(`/api/app/breeding?search=${search}&status=${statusFilter}`).then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/app/breeding/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['breeding-records'] }),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Breeding Records</h1>
          <p className="text-slate-500 mt-1">Track mating, pregnancy, and kidding</p>
        </div>
        <FeatureGate feature="breeding-records">
          <Link href="/app/breeding/new">
            <Button>
              <Plus size={20} className="mr-2" /> Add Record
            </Button>
          </Link>
        </FeatureGate>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Planned</p>
            <p className="text-3xl font-bold text-blue-600">{data?.records?.filter((r: BreedingRecord) => r.status === 'planned').length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Confirmed Pregnant</p>
            <p className="text-3xl font-bold text-pink-600">{data?.records?.filter((r: BreedingRecord) => r.status === 'confirmed').length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Kidded (30 days)</p>
            <p className="text-3xl font-bold text-green-600">{data?.records?.filter((r: BreedingRecord) => r.status === 'kidded').length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Due This Month</p>
            <p className="text-3xl font-bold text-amber-600">
              {data?.records?.filter((r: BreedingRecord) => r.expected_kidding_date && new Date(r.expected_kidding_date) < new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)).length || 0}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                placeholder="Search by dam, sire, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              {BREEDING_STATUSES.map(s => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Records Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">Failed to load records</div>
          ) : data?.records?.length === 0 ? (
            <div className="p-12 text-center">
              <Baby className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 mb-4">No breeding records yet</p>
              <FeatureGate feature="breeding-records">
                <Link href="/app/breeding/new">
                  <Button>Add First Record</Button>
                </Link>
              </FeatureGate>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Mating Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Dam</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Sire</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Expected</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Actual</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Kids</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.records.map((record: BreedingRecord) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">{format(new Date(record.mating_date), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{record.dam_name}</td>
                      <td className="px-4 py-3 text-slate-600">{record.sire_name || '—'}</td>
                      <td className="px-4 py-3">
                        {record.expected_kidding_date ? (
                          <span className={new Date(record.expected_kidding_date) < new Date() && record.status !== 'kidded' ? 'text-red-600 font-medium' : 'text-slate-600'}>
                            {format(new Date(record.expected_kidding_date), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {record.actual_kidding_date ? format(new Date(record.actual_kidding_date), 'MMM d, yyyy') : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          record.status === 'kidded' ? 'success' :
                          record.status === 'confirmed' ? 'default' :
                          record.status === 'failed' ? 'destructive' :
                          'secondary'
                        }>
                          {record.status.charAt(0).toUpperCase() + record.status.slice(1)}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-slate-600">
                        {record.kids_count || '—'}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/app/breeding/${record.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/app/breeding/${record.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                if (confirm('Delete this record?')) {
                                  deleteMutation.mutate(record.id);
                                }
                              }}
                            >
                              <Trash2 className="mr-2 h-4 w-4" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}