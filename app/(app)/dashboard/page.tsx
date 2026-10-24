'use client';

import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TierBadge } from '@/components/ui/TierBadge';
import { 
  Users, 
  Heart, 
  Baby, 
  Package, 
  TrendingUp, 
  AlertTriangle,
  Calendar,
  Plus,
  Camera
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

interface DashboardStats {
  totalGoats: number;
  activeAlerts: number;
  upcomingEvents: number;
  lowStockItems: number;
  recentBirths: number;
  recentDeaths: number;
  avgWeightGain: number;
  milkYield: number;
}

interface Alert {
  id: string;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: () => fetch('/api/app/dashboard/stats').then(r => r.json()),
    refetchInterval: 30000,
  });

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['dashboard-alerts'],
    queryFn: () => fetch('/api/app/alerts?limit=5').then(r => r.json()),
    refetchInterval: 60000,
  });

  const { data: events, isLoading: eventsLoading } = useQuery({
    queryKey: ['dashboard-events'],
    queryFn: () => fetch('/api/app/events?limit=5&upcoming=true').then(r => r.json()),
    refetchInterval: 60000,
  });

  const statCards = [
    { 
      label: 'Total Goats', 
      value: stats?.totalGoats ?? 0, 
      icon: Users, 
      color: 'text-green-600 bg-green-100',
      href: '/app/herd',
    },
    { 
      label: 'Active Alerts', 
      value: stats?.activeAlerts ?? 0, 
      icon: AlertTriangle, 
      color: 'text-yellow-600 bg-yellow-100',
      href: '/app/health',
    },
    { 
      label: 'Upcoming Events', 
      value: stats?.upcomingEvents ?? 0, 
      icon: Calendar, 
      color: 'text-blue-600 bg-blue-100',
      href: '/app/breeding',
    },
    { 
      label: 'Low Stock Items', 
      value: stats?.lowStockItems ?? 0, 
      icon: Package, 
      color: 'text-red-600 bg-red-100',
      href: '/app/inventory',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Dashboard</h1>
          <p className="text-slate-500 mt-1">Overview of your herd performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/app/herd/new" className="inline-flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-xl font-medium hover:bg-green-700 transition-colors">
            <Plus size={20} />
            Add Goat
          </Link>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((stat) => (
          <Link key={stat.label} href={stat.href} className="block">
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{stat.label}</p>
                    <p className="text-3xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${stat.color}`}>
                    <stat.icon size={24} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      {/* Alerts & Events */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Alerts */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Recent Alerts</CardTitle>
            <Link href="/app/health/alerts" className="text-sm text-green-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {alertsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse bg-gray-100 rounded" />
                ))}
              </div>
            ) : alerts?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <AlertTriangle className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p>No active alerts</p>
              </div>
            ) : (
              <div className="space-y-3">
                {alerts.map((alert: Alert) => (
                  <div key={alert.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center flex-shrink-0">
                      <AlertTriangle size={18} className="text-yellow-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{alert.title}</p>
                      <p className="text-sm text-slate-500 truncate">{alert.message}</p>
                      <p className="text-xs text-slate-400 mt-1">{format(new Date(alert.createdAt), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Events */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-lg">Upcoming Events</CardTitle>
            <Link href="/app/breeding/events" className="text-sm text-green-600 hover:underline">View all</Link>
          </CardHeader>
          <CardContent>
            {eventsLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="h-16 animate-pulse bg-gray-100 rounded" />
                ))}
              </div>
            ) : events?.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                <Calendar className="mx-auto h-12 w-12 text-slate-300 mb-3" />
                <p>No upcoming events</p>
              </div>
            ) : (
              <div className="space-y-3">
                {events.map((event: any) => (
                  <div key={event.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                      <Calendar size={18} className="text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-slate-900">{event.title}</p>
                      <p className="text-sm text-slate-500">{event.type}</p>
                      <p className="text-xs text-slate-400 mt-1">{format(new Date(event.eventDate), 'MMM d, h:mm a')}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
            <Link href="/app/herd/new" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-center">
              <Users size={28} className="mx-auto text-green-600 mb-2" />
              <p className="font-medium text-slate-900">Add Goat</p>
            </Link>
            <Link href="/app/health/new" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-center">
              <Heart size={28} className="mx-auto text-red-600 mb-2" />
              <p className="font-medium text-slate-900">Log Health</p>
            </Link>
            <Link href="/app/breeding/new" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-center">
              <Baby size={28} className="mx-auto text-pink-600 mb-2" />
              <p className="font-medium text-slate-900">Record Breeding</p>
            </Link>
            <Link href="/app/inventory/new" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-center">
              <Package size={28} className="mx-auto text-amber-600 mb-2" />
              <p className="font-medium text-slate-900">Add Inventory</p>
            </Link>
            <Link href="/app/scan" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-center">
              <Camera size={28} className="mx-auto text-purple-600 mb-2" />
              <p className="font-medium text-slate-900">Smart Scan</p>
            </Link>
            <Link href="/app/reports" className="p-4 bg-slate-50 rounded-xl hover:bg-slate-100 transition-colors text-center">
              <TrendingUp size={28} className="mx-auto text-blue-600 mb-2" />
              <p className="font-medium text-slate-900">View Reports</p>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}