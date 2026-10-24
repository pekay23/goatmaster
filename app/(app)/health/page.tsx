'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '@/components/ui/TierBadge';
import { FeatureGate, useTier } from '@/lib/context/TierContext';
import { 
  Plus, 
  Search, 
  Filter, 
  ChevronDown,
  Edit,
  Trash2,
  Eye,
  AlertTriangle,
  Heart,
  Pill,
  Calendar,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface HealthRecord {
  id: string;
  goat_id: string;
  goat_name: string;
  type: string;
  notes: string;
  treatment: string;
  cost: number;
  record_date: string;
  next_due_date: string | null;
  created_at: string;
}

const HEALTH_TYPES = [
  'vaccination',
  'deworming',
  'treatment',
  'checkup',
  'injury',
  'illness',
  'supplement',
  'other',
];

export default function HealthPage() {
  const queryClient = useQueryClient();
  const { tier } = useTier();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['health-records', search, typeFilter],
    queryFn: () => fetch(`/api/app/health?search=${search}&type=${typeFilter}`).then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/app/health/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['health-records'] }),
  });

  const upcomingMutation = useMutation({
    mutationFn: () => fetch('/api/app/health/upcoming', { method: 'GET' }).then(r => r.json()),
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Health Records</h1>
          <p className="text-slate-500 mt-1">Vaccinations, treatments, and health monitoring</p>
        </div>
        <FeatureGate feature="breeding-records">
          <Link href="/app/health/new">
            <Button>
              <Plus size={20} className="mr-2" /> Add Record
            </Button>
          </Link>
        </FeatureGate>
      </div>

      {/* Upcoming Due */}
      <Card className="border-yellow-200">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="text-yellow-600" size={20} />
            Upcoming Due
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-slate-500">
            <p>No upcoming vaccinations or treatments due</p>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <Input
                placeholder="Search by goat, treatment, notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Types</option>
              {HEALTH_TYPES.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
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
              <Heart className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 mb-4">No health records yet</p>
              <FeatureGate feature="breeding-records">
                <Link href="/app/health/new">
                  <Button>Add First Record</Button>
                </Link>
              </FeatureGate>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Date</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Goat</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Type</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Treatment</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Cost</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Next Due</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.records.map((record: HealthRecord) => (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3 text-slate-600">{format(new Date(record.record_date), 'MMM d, yyyy')}</td>
                      <td className="px-4 py-3 font-medium text-slate-900">{record.goat_name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">{record.type}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{record.treatment || '—'}</td>
                      <td className="px-4 py-3 text-slate-600">{record.cost > 0 ? `GHS ${record.cost.toFixed(2)}` : '—'}</td>
                      <td className="px-4 py-3">
                        {record.next_due_date ? (
                          <span className={new Date(record.next_due_date) < new Date() ? 'text-red-600 font-medium' : 'text-slate-600'}>
                            {format(new Date(record.next_due_date), 'MMM d, yyyy')}
                          </span>
                        ) : (
                          <span className="text-slate-400">—</span>
                        )}
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
                              <Link href={`/app/health/${record.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/app/health/${record.id}/edit`}>
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