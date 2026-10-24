'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { TierBadge } from '@/components/ui/TierBadge';
import { useTier } from '@/lib/context/TierContext';
import { useSync } from '@/lib/context/SyncContext';
import { 
  User, 
  Bell, 
  Shield, 
  Globe, 
  Database, 
  Palette, 
  Smartphone,
  LogOut,
  Moon,
  Sun,
  RefreshCw,
  Wifi,
  WifiOff,
  Save,
  Loader2,
  AlertTriangle,
  Trash2,
  Download
} from 'lucide-react';
import Link from 'next/link';
import { format } from 'date-fns';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { tier, features, canUseFeature } = useTier();
  const { isOnline, isSyncing, lastSynced, pendingCount, triggerSync, error: syncError } = useSync();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'sync' | 'appearance' | 'billing' | 'danger'>('profile');
  const [isSaving, setIsSaving] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ['app-user'],
    queryFn: () => fetch('/api/admin/auth/me').then(r => r.json()),
  });

  const saveMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await fetch('/api/app/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['app-user'] });
      setIsSaving(false);
    },
    onError: () => setIsSaving(false),
  });

  const handleSave = (data: any) => {
    setIsSaving(true);
    saveMutation.mutate(data);
  };

  const handleSync = async () => {
    await triggerSync();
  };

  const tabs: Array<{ id: 'profile' | 'notifications' | 'sync' | 'appearance' | 'billing' | 'danger'; label: string; icon: React.ComponentType<{ className?: string; size?: number }> }> = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'sync', label: 'Sync & Offline', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'billing', label: 'Billing', icon: Shield },
    { id: 'danger', label: 'Danger Zone', icon: AlertTriangle },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-500 mt-1">Manage your account and preferences</p>
      </div>

      {/* Tier Banner */}
      <Card className="bg-gradient-to-r from-green-600 to-green-700 text-white">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-green-100 text-sm">Current Plan</p>
              <div className="flex items-center gap-3 mt-1">
                <TierBadge tier={tier} size="lg" className="bg-white/20 text-white border-white/30" />
                <span className="text-sm opacity-90">Max goats: {features?.maxGoats === -1 ? 'Unlimited' : features?.maxGoats}</span>
                <span className="text-sm opacity-90">Scans/day: {features?.maxScansPerDay === -1 ? 'Unlimited' : features?.maxScansPerDay}</span>
              </div>
            </div>
            <Link href="/app/settings/billing">
              <Button variant="secondary" className="bg-white/20 hover:bg-white/30 border-white/30 text-white whitespace-nowrap">
                Manage Subscription
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 mb-6 border-b border-slate-200">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab === tab.id ? 'default' : 'ghost'}
            className="gap-2"
            onClick={() => setActiveTab(tab.id)}
          >
            <tab.icon size={18} />
            {tab.label}
          </Button>
        ))}
      </div>

      {/* Tab Panels */}
      {activeTab === 'profile' && (
        <Card>
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6 max-w-md">
            {isLoading ? (
              <div className="animate-pulse space-y-4">
                <div className="h-10 bg-gray-100 rounded w-1/4"></div>
                <div className="h-10 bg-gray-100 rounded w-1/2"></div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                  <Input defaultValue={user?.username} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Email</label>
                  <Input type="email" defaultValue={user?.email} disabled />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Role</label>
                  <Badge variant="outline">{user?.role}</Badge>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Organization</label>
                  <Input defaultValue={user?.orgName || 'Loading...'} disabled />
                </div>
                <Button onClick={() => handleSave({ name: user?.username })}>
                  <Save size={18} className="mr-2" /> Save Changes
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {activeTab === 'notifications' && (
        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              {[
                { id: 'health_alerts', label: 'Health Alerts', desc: 'Vaccination due, treatment reminders' },
                { id: 'breeding_alerts', label: 'Breeding Alerts', desc: 'Heat cycles, kidding dates, pregnancy checks' },
                { id: 'inventory_alerts', label: 'Low Stock Alerts', desc: 'When items fall below minimum quantity' },
                { id: 'sync_status', label: 'Sync Status', desc: 'Offline/online and sync completion' },
                { id: 'weekly_report', label: 'Weekly Report', desc: 'Summary of herd activity' },
              ].map((item) => (
                <div key={item.id} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">{item.label}</p>
                    <p className="text-sm text-slate-500">{item.desc}</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input type="checkbox" defaultChecked className="sr-only peer" />
                    <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                  </label>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'sync' && (
        <Card>
          <CardHeader>
            <CardTitle>Sync & Offline</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${isOnline ? 'bg-green-100' : 'bg-red-100'}`}>
                  {isOnline ? <Wifi size={24} className="text-green-600" /> : <WifiOff size={24} className="text-red-600" />}
                </div>
                <div>
                  <p className="font-medium text-slate-900">{isOnline ? 'Online' : 'Offline'}</p>
                  <p className="text-sm text-slate-500">
                    {isOnline ? 'Connected to server' : 'Changes will sync when online'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {pendingCount > 0 && (
                  <Badge variant="secondary" className="mr-3">{pendingCount} pending</Badge>
                )}
                <Button 
                  onClick={handleSync}
                  disabled={isSyncing || !isOnline || pendingCount === 0}
                >
                  {isSyncing ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Syncing...
                    </>
                  ) : (
                    <>
                      <RefreshCw size={18} className="mr-2" />
                      Sync Now
                    </>
                  )}
                </Button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">Last Synced</p>
                <p className="font-medium text-slate-900">
                  {lastSynced ? format(lastSynced, 'MMM d, yyyy h:mm a') : 'Never'}
                </p>
              </div>
              <div className="p-4 bg-slate-50 rounded-xl">
                <p className="text-sm text-slate-500 mb-1">Pending Changes</p>
                <p className="font-medium text-slate-900">{pendingCount}</p>
              </div>
            </div>

            {syncError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-center gap-3 text-red-700">
                <AlertTriangle size={20} />
                <span>Sync error: {syncError}</span>
              </div>
            )}

            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-medium text-slate-900 mb-3">Offline Storage</h4>
              <div className="grid gap-4 sm:grid-cols-3 text-sm">
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">IndexedDB</p>
                  <p className="font-medium text-slate-900">~2.4 MB</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">Cache</p>
                  <p className="font-medium text-slate-900">~1.1 MB</p>
                </div>
                <div className="p-3 bg-slate-50 rounded-lg">
                  <p className="text-slate-500">Queue</p>
                  <p className="font-medium text-slate-900">{pendingCount} items</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'appearance' && (
        <Card>
          <CardHeader>
            <CardTitle>Appearance</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-slate-900">Theme</p>
                  <p className="text-sm text-slate-500">Choose your preferred color scheme</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="flex items-center gap-2">
                    <Sun size={18} /> Light
                  </Button>
                  <Button variant="outline" className="flex items-center gap-2">
                    <Moon size={18} /> Dark
                  </Button>
                  <Button variant="default" className="flex items-center gap-2">
                    <Smartphone size={18} /> System
                  </Button>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Language</p>
                    <p className="text-sm text-slate-500">App language preference</p>
                  </div>
                  <select className="px-4 py-2 border border-slate-200 rounded-lg">
                    <option>English</option>
                    <option>Twi (Coming Soon)</option>
                  </select>
                </div>
              </div>
              <div className="border-t border-slate-200 pt-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-slate-900">Units</p>
                    <p className="text-sm text-slate-500">Measurement system</p>
                  </div>
                  <select className="px-4 py-2 border border-slate-200 rounded-lg">
                    <option>Metric (kg, L, cm)</option>
                    <option>Imperial (lb, gal, in)</option>
                  </select>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'billing' && (
        <Card>
          <CardHeader>
            <CardTitle>Billing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-green-50 border border-green-200 rounded-xl">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-green-800">Current Plan: <span className="capitalize">{tier}</span></p>
                  <p className="text-sm text-green-700">Billed monthly via Paystack</p>
                </div>
                <Link href="/app/settings/billing">
                  <Button>Manage Subscription</Button>
                </Link>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-medium text-slate-900 mb-3">Payment Method</h4>
              <div className="p-4 bg-slate-50 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                    <Shield size={20} className="text-green-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-900">Paystack</p>
                    <p className="text-sm text-slate-500">Default payment method</p>
                  </div>
                </div>
                <Button variant="outline" size="sm">Update</Button>
              </div>
            </div>
            <div className="border-t border-slate-200 pt-4">
              <h4 className="font-medium text-slate-900 mb-3">Billing History</h4>
              <Link href="/app/settings/billing/history">
                <Button variant="ghost">View All Payments</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}

      {activeTab === 'danger' && (
        <Card className="border-red-200">
          <CardHeader>
            <CardTitle className="text-red-600 flex items-center gap-2">
              <AlertTriangle size={20} /> Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-sm text-red-700 mb-3">
                These actions are irreversible. Please be certain before proceeding.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="text-red-600 border-red-300 hover:bg-red-50">
                  <Trash2 size={18} className="mr-2" /> Delete All Data
                </Button>
                <Button variant="destructive">
                  <LogOut size={18} className="mr-2" /> Delete Account
                </Button>
              </div>
            </div>
            <div>
              <h4 className="font-medium text-slate-900 mb-3">Export Data</h4>
              <Button variant="outline">
                <Download size={18} className="mr-2" /> Download All Data (CSV)
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}