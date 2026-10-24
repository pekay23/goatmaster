'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '@/components/ui/TierBadge';
import { FeatureGate, LimitGate, useTier } from '@/lib/context/TierContext';
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
  Baby,
  Package,
  Camera,
  Users,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface Goat {
  id: string;
  name: string;
  breed: string | null;
  sex: string | null;
  dob: string | null;
  ear_tag: string | null;
  image_url: string | null;
  status: string;
  dam_id: string | null;
  sire_id: string | null;
  created_at: string;
}

export default function HerdPage() {
  const queryClient = useQueryClient();
  const { tier } = useTier();
  const [search, setSearch] = useState('');
  const [sexFilter, setSexFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['goats', search, sexFilter, statusFilter],
    queryFn: () => fetch(`/api/app/goats?search=${search}&sex=${sexFilter}&status=${statusFilter}`).then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/app/goats/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['goats'] }),
  });

  const stats = data?.goats?.reduce((acc: any, goat: Goat) => {
    acc[goat.status] = (acc[goat.status] || 0) + 1;
    return acc;
  }, {}) || {};

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Herd</h1>
          <p className="text-slate-500 mt-1">Manage your goats</p>
        </div>
        <LimitGate limit="goats" current={data?.total || 0}>
          <FeatureGate feature="breeding-records">
            <Link href="/app/herd/new">
              <Button className="w-full sm:w-auto">
                <Plus size={20} className="mr-2" /> Add Goat
              </Button>
            </Link>
          </FeatureGate>
        </LimitGate>
      </div>

      {/* Stats Row */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Total</p>
            <p className="text-3xl font-bold text-slate-900">{data?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Active</p>
            <p className="text-3xl font-bold text-green-600">{stats.active || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Pregnant</p>
            <p className="text-3xl font-bold text-pink-600">{stats.pregnant || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">For Sale</p>
            <p className="text-3xl font-bold text-amber-600">{stats.for_sale || 0}</p>
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
                placeholder="Search by name, tag, breed..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={sexFilter}
              onChange={(e) => setSexFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Sexes</option>
              <option value="male">Male</option>
              <option value="female">Female</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Statuses</option>
              <option value="active">Active</option>
              <option value="pregnant">Pregnant</option>
              <option value="for_sale">For Sale</option>
              <option value="deceased">Deceased</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Goats Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">Failed to load goats</div>
          ) : data?.goats?.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 mb-4">No goats yet</p>
              <LimitGate limit="goats" current={data?.total || 0}>
                <FeatureGate feature="breeding-records">
                  <Link href="/app/herd/new">
                    <Button>Add Your First Goat</Button>
                  </Link>
                </FeatureGate>
              </LimitGate>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Goat</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Breed</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Sex</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Age</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Tag</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.goats.map((goat: Goat) => (
                    <tr key={goat.id} className="hover:bg-slate-50">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          {goat.image_url ? (
                            <img src={goat.image_url} alt={goat.name} className="w-10 h-10 rounded-full object-cover" />
                          ) : (
                            <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center text-green-600 font-bold">
                              {goat.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                          <div>
                            <p className="font-medium text-slate-900">{goat.name}</p>
                            <p className="text-sm text-slate-500">{goat.ear_tag || 'No tag'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{goat.breed || '—'}</td>
                      <td className="px-4 py-3">
                        <Badge variant={goat.sex === 'male' ? 'default' : 'secondary'}>
                          {goat.sex === 'male' ? '♂ Buck' : goat.sex === 'female' ? '♀ Doe' : '—'}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        {goat.dob ? `${Math.floor((Date.now() - new Date(goat.dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))} yrs` : '—'}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={
                          goat.status === 'active' ? 'success' :
                          goat.status === 'pregnant' ? 'default' :
                          goat.status === 'for_sale' ? 'secondary' :
                          'destructive'
                        }>
                          {goat.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{goat.ear_tag || '—'}</td>
                      <td className="px-4 py-3 text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreVertical size={18} />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem asChild>
                              <Link href={`/app/herd/${goat.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/app/herd/${goat.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                if (confirm('Delete this goat?')) {
                                  deleteMutation.mutate(goat.id);
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