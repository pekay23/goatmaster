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
  Package,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  quantity: number;
  unit: string;
  min_quantity: number;
  unit_price: number;
  supplier: string;
  created_at: string;
}

const CATEGORIES = [
  'feed',
  'medicine',
  'supplement',
  'equipment',
  'bedding',
  'fencing',
  'other',
];

export default function InventoryPage() {
  const queryClient = useQueryClient();
  const { tier } = useTier();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['inventory', search, categoryFilter],
    queryFn: () => fetch(`/api/app/inventory?search=${search}&category=${categoryFilter}`).then(r => r.json()),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => fetch(`/api/app/inventory/${id}`, { method: 'DELETE' }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['inventory'] }),
  });

  const lowStockCount = data?.items?.filter((item: InventoryItem) => item.quantity <= item.min_quantity).length || 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Inventory</h1>
          <p className="text-slate-500 mt-1">Track feed, medicine, and supplies</p>
        </div>
        <FeatureGate feature="breeding-records">
          <Link href="/app/inventory/new">
            <Button>
              <Plus size={20} className="mr-2" /> Add Item
            </Button>
          </Link>
        </FeatureGate>
      </div>

      {/* Low Stock Alert */}
      {lowStockCount > 0 && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertTriangle className="text-red-600" size={24} />
              <div>
                <p className="font-medium text-red-800">Low Stock Alert</p>
                <p className="text-sm text-red-700">
                  {lowStockCount} item{lowStockCount > 1 ? 's' : ''} below minimum quantity
                </p>
              </div>
              <Link href="/app/inventory?filter=low_stock" className="ml-auto text-sm text-red-600 hover:underline font-medium">
                View all
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Total Items</p>
            <p className="text-3xl font-bold text-slate-900">{data?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Low Stock</p>
            <p className="text-3xl font-bold text-red-600">{lowStockCount}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Total Value</p>
            <p className="text-3xl font-bold text-green-600">
              GHS {data?.items?.reduce((sum: number, item: InventoryItem) => sum + item.quantity * item.unit_price, 0).toFixed(2) || '0.00'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <p className="text-sm text-slate-500">Categories</p>
            <p className="text-3xl font-bold text-blue-600">
              {new Set(data?.items?.map((item: InventoryItem) => item.category) || []).size}
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
                placeholder="Search by name, category, supplier..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-4 py-2 border border-slate-200 rounded-lg text-sm"
            >
              <option value="">All Categories</option>
              {CATEGORIES.map(c => (
                <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
              ))}
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Items Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 animate-pulse bg-gray-100" />
              ))}
            </div>
          ) : error ? (
            <div className="p-6 text-center text-red-600">Failed to load inventory</div>
          ) : data?.items?.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="mx-auto h-12 w-12 text-slate-300 mb-3" />
              <p className="text-slate-500 mb-4">No inventory items yet</p>
              <FeatureGate feature="breeding-records">
                <Link href="/app/inventory/new">
                  <Button>Add First Item</Button>
                </Link>
              </FeatureGate>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Item</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Category</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Qty / Unit</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Min Qty</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Unit Price</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Supplier</th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-slate-500">Status</th>
                    <th className="px-4 py-3 text-right text-sm font-medium text-slate-500">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {data.items.map((item: InventoryItem) => (
                    <tr key={item.id} className={`hover:bg-slate-50 ${item.quantity <= item.min_quantity ? 'bg-red-50' : ''}`}>
                      <td className="px-4 py-3 font-medium text-slate-900">{item.name}</td>
                      <td className="px-4 py-3">
                        <Badge variant="outline" className="capitalize">{item.category}</Badge>
                      </td>
                      <td className="px-4 py-3 text-slate-600">{item.quantity} {item.unit}</td>
                      <td className="px-4 py-3 text-slate-600">{item.min_quantity} {item.unit}</td>
                      <td className="px-4 py-3 text-slate-600">GHS {item.unit_price.toFixed(2)}</td>
                      <td className="px-4 py-3 text-slate-600">{item.supplier || '—'}</td>
                      <td className="px-4 py-3">
                        {item.quantity <= item.min_quantity ? (
                          <Badge variant="destructive">Low Stock</Badge>
                        ) : item.quantity <= item.min_quantity * 1.5 ? (
                          <Badge variant="secondary">Watch</Badge>
                        ) : (
                          <Badge variant="success">OK</Badge>
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
                              <Link href={`/app/inventory/${item.id}`}>
                                <Eye className="mr-2 h-4 w-4" /> View
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                              <Link href={`/app/inventory/${item.id}/edit`}>
                                <Edit className="mr-2 h-4 w-4" /> Edit
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem 
                              className="text-red-600"
                              onClick={() => {
                                if (confirm('Delete this item?')) {
                                  deleteMutation.mutate(item.id);
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