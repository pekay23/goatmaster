'use client';

export const dynamic = 'force-dynamic';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { 
  CreditCard, 
  AlertTriangle, 
  TrendingUp, 
  DollarSign, 
  Users, 
  RefreshCw,
  ExternalLink,
  X,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
import { TierBadge } from '@/components/ui/TierBadge';
import { SubscriptionStatusBadge } from '@/components/admin/SubscriptionStatusBadge';

interface Subscription {
  id: string;
  name: string;
  slug: string;
  tier: string;
  subscription_status: string;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  manual_override: boolean;
  override_reason: string | null;
  owner_email: string | null;
  tier_price_cents: number | null;
}

interface Webhook {
  id: string;
  event_id: string;
  event_type: string;
  organization_id: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
  processed_at: string | null;
}

interface AtRiskOrg {
  id: string;
  name: string;
  slug: string;
  tier: string;
  subscription_status: string;
  current_period_end: string | null;
  cancel_at_period_end: boolean;
  paystack_customer_code: string | null;
  paystack_subscription_code: string | null;
  owner_email: string | null;
  tier_price_cents: number | null;
  risk_level: string;
  days_until_renewal: number | null;
  scans_7d: number;
}

interface RetentionOffer {
  id: string;
  organization_id: string;
  org_name: string;
  offer_type: string;
  discount: number;
  expires_at: string;
  status: string;
  created_at: string;
}

interface RevenueData {
  mrr: {
    total: number;
    activeSubs: number;
    byTier: Array<{ tier: string; orgCount: number; mrrCents: number }>;
  };
  arr: { total: number };
  failedPayments7d: number;
  signupTrend: Array<{ date: string; total: number; paid: number }>;
  monthlyRevenue: Array<{ month: string; revenueCents: number }>;
  cohorts: Array<{ cohortMonth: string; totalOrgs: number; activeOrgs: number; paidOrgs: number; retentionRate: number }>;
  tierDistribution: Array<{ tier: string; count: number }>;
}

function formatCurrency(cents: number): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: 'GHS',
  }).format(cents / 100);
}

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '—';
  return format(new Date(dateStr), 'MMM d, yyyy');
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-800';
    case 'past_due': return 'bg-yellow-100 text-yellow-800';
    case 'cancelled': return 'bg-red-100 text-red-800';
    case 'trialing': return 'bg-blue-100 text-blue-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}

function getRiskColor(level: string): string {
  switch (level) {
    case 'past_due': return 'bg-red-100 text-red-800';
    case 'cancelling': return 'bg-orange-100 text-orange-800';
    case 'cancelled': return 'bg-gray-100 text-gray-800';
    default: return 'bg-yellow-100 text-yellow-800';
  }
}

// Subscription Table Component
function SubscriptionTable({ 
  data, 
  onTierChange, 
  onOpenPortal, 
  onCancel,
  isLoading
}: { 
  data: Subscription[] | undefined;
  onTierChange: (params: { orgId: string; tier: string }) => void;
  onOpenPortal: (customerCode: string) => void;
  onCancel: (subscriptionCode: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <CreditCard className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <p>No subscriptions found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Organization</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Owner</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Tier</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">MRR</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Renewal</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.map((sub) => (
            <tr key={sub.id} className="hover:bg-gray-50">
              <td className="px-4 py-3">
                <div className="font-medium">{sub.name}</div>
                <div className="text-sm text-gray-500">{sub.slug}</div>
              </td>
              <td className="px-4 py-3">
                <div className="text-sm">{sub.owner_email || '—'}</div>
              </td>
              <td className="px-4 py-3">
                <TierBadge tier={sub.tier} size="sm" />
                {sub.manual_override && (
                  <Badge variant="outline" className="ml-1 text-xs">Manual</Badge>
                )}
              </td>
              <td className="px-4 py-3">
                <SubscriptionStatusBadge status={sub.subscription_status as any} />
                {sub.cancel_at_period_end && (
                  <Badge variant="outline" className="ml-1 mt-1 text-xs">Cancelling</Badge>
                )}
              </td>
              <td className="px-4 py-3 font-mono text-sm">
                {sub.tier_price_cents ? formatCurrency(sub.tier_price_cents) : '—'}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {formatDate(sub.current_period_end)}
              </td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onTierChange({ orgId: sub.id, tier: 'pro' })}>
                      Upgrade to Pro
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTierChange({ orgId: sub.id, tier: 'basic' })}>
                      Downgrade to Basic
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => onTierChange({ orgId: sub.id, tier: 'free' })}>
                      Downgrade to Free
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    {sub.paystack_customer_code && (
                      <DropdownMenuItem onClick={() => onOpenPortal(sub.paystack_customer_code!)}>
                        <ExternalLink className="mr-2 h-4 w-4" /> Open Paystack Portal
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      className="text-red-600" 
                      onClick={() => onCancel(sub.paystack_subscription_code!)}
                      disabled={!sub.paystack_subscription_code}
                    >
                      <X className="mr-2 h-4 w-4" /> Cancel Subscription
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Webhook Log Table
function WebhookLogTable({ 
  data, 
  onRetry,
  isLoading
}: { 
  data: Webhook[] | undefined;
  onRetry: (id: string) => void;
  isLoading: boolean;
}) {
  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 animate-pulse bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <AlertTriangle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
        <p>No webhook events found</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-border/50">
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Event Type</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Organization</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Status</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Created</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Processed</th>
            <th className="px-4 py-3 text-left text-sm font-medium text-gray-500">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.map((webhook) => (
            <tr key={webhook.id} className="hover:bg-gray-50">
              <td className="px-4 py-3 font-mono text-sm">{webhook.event_type}</td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {webhook.organization_id || 'N/A'}
              </td>
              <td className="px-4 py-3">
                <Badge 
                  variant={webhook.status === 'processed' ? 'success' : webhook.status === 'failed' ? 'destructive' : 'secondary'}
                >
                  {webhook.status}
                </Badge>
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {formatDate(webhook.created_at)}
              </td>
              <td className="px-4 py-3 text-sm text-gray-500">
                {webhook.processed_at ? formatDate(webhook.processed_at) : '—'}
              </td>
              <td className="px-4 py-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                      </svg>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {webhook.status !== 'processed' && (
                      <DropdownMenuItem onClick={() => onRetry(webhook.id)}>
                        <RefreshCw className="mr-2 h-4 w-4" /> Retry
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem>
                      <ExternalLink className="mr-2 h-4 w-4" /> View Payload
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Churn Recovery Panel
function ChurnRecoveryPanel({ 
  atRiskOrgs, 
  retentionOffers,
  isLoading,
  onCreateOffer
}: { 
  atRiskOrgs: AtRiskOrg[] | undefined;
  retentionOffers: RetentionOffer[] | undefined;
  isLoading: boolean;
  onCreateOffer: (offer: { organizationId: string; offerType: string; discount: number; expiryDays: number }) => void;
}) {
  const [showOfferModal, setShowOfferModal] = useState<{ org: AtRiskOrg | null }>({ org: null });

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="h-20 animate-pulse bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* At-Risk Organizations */}
      <div>
        <h3 className="text-lg font-semibold mb-4">At-Risk Organizations</h3>
        {atRiskOrgs && atRiskOrgs.length > 0 ? (
          <div className="space-y-3">
            {atRiskOrgs.map((org) => (
              <div key={org.id} className="border border-border/50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{org.name}</span>
                      <Badge variant="outline" className="text-xs">{org.slug}</Badge>
                      <Badge className={getRiskColor(org.risk_level)}>{org.risk_level}</Badge>
                    </div>
                    <div className="text-sm text-gray-500 mt-1">
                      Owner: {org.owner_email} | Tier: {org.tier} | Scans (7d): {org.scans_7d}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {org.days_until_renewal !== null && (
                      <Badge variant="outline" className={org.days_until_renewal <= 7 ? 'border-red-500 text-red-600' : ''}>
                        {org.days_until_renewal} days until renewal
                      </Badge>
                    )}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setShowOfferModal({ org })}
                    >
                      Send Offer
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">
            <TrendingUp className="mx-auto h-12 w-12 text-gray-300 mb-3" />
            <p>No at-risk organizations found</p>
          </div>
        )}
      </div>

      {/* Recent Retention Offers */}
      <div>
        <h3 className="text-lg font-semibold mb-4">Recent Retention Offers</h3>
        {retentionOffers && retentionOffers.length > 0 ? (
          <div className="space-y-2">
            {retentionOffers.map((offer) => (
              <div key={offer.id} className="border border-border/50 rounded-lg p-3 flex items-center justify-between">
                <div>
                  <div className="font-medium">{offer.org_name}</div>
                  <div className="text-sm text-gray-500">
                    {offer.offer_type} • {offer.discount > 0 ? `${offer.discount}% off` : 'Payment reminder'}
                  </div>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Badge variant={offer.status === 'accepted' ? 'success' : 'secondary'}>
                    {offer.status}
                  </Badge>
                  {formatDate(offer.created_at)}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-sm">No retention offers sent yet</p>
        )}
      </div>

      {/* Offer Modal */}
      {showOfferModal.org && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowOfferModal({ org: null })}>
          <div className="bg-white rounded-xl p-6 w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-semibold mb-4">Send Retention Offer to {showOfferModal.org.name}</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Offer Type</label>
                <select 
                  className="w-full border border-border rounded-lg px-3 py-2"
                  defaultValue="discount"
                >
                  <option value="discount">Discount Offer</option>
                  <option value="payment_reminder">Payment Reminder</option>
                  <option value="extension">Subscription Extension</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Discount (%)</label>
                <input 
                  type="number" 
                  className="w-full border border-border rounded-lg px-3 py-2"
                  defaultValue="20"
                  min="0"
                  max="50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Expiry (days)</label>
                <input 
                  type="number" 
                  className="w-full border border-border rounded-lg px-3 py-2"
                  defaultValue="7"
                  min="1"
                  max="30"
                />
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setShowOfferModal({ org: null })}>Cancel</Button>
                <Button 
                  onClick={() => {
                    // In real implementation, get values from form
                    onCreateOffer({ 
                      organizationId: showOfferModal.org!.id, 
                      offerType: 'discount', 
                      discount: 20, 
                      expiryDays: 7 
                    });
                    setShowOfferModal({ org: null });
                  }}
                >
                  Send Offer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Revenue Analytics Charts
function RevenueCharts({ data, isLoading }: { data: RevenueData | undefined; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="grid gap-6 lg:grid-cols-2">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-64 animate-pulse bg-gray-100 rounded-lg" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const monthlyRevenue = data.monthlyRevenue.map(r => ({
    month: format(new Date(r.month), 'MMM yyyy'),
    revenue: r.revenueCents / 100,
  }));

  const tierData = data.mrr.byTier.map(t => ({
    tier: t.tier,
    mrr: t.mrrCents / 100,
  }));

  const signupData = data.signupTrend.map(s => ({
    date: format(new Date(s.date), 'MMM d'),
    total: s.total,
    paid: s.paid,
  }));

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-4">
        <StatCard 
          title="Monthly Recurring Revenue" 
          value={formatCurrency(data.mrr.total)} 
          icon={DollarSign}
        />
        <StatCard 
          title="Annual Recurring Revenue" 
          value={formatCurrency(data.arr.total)} 
          icon={TrendingUp}
        />
        <StatCard 
          title="Active Subscriptions" 
          value={data.mrr.activeSubs.toString()} 
          icon={Users}
        />
        <StatCard 
          title="Failed Payments (7d)" 
          value={data.failedPayments7d.toString()} 
          icon={AlertTriangle}
          negative
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Monthly Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <RevenueBarChart data={monthlyRevenue} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>MRR by Tier</CardTitle>
          </CardHeader>
          <CardContent>
            <TierPieChart data={tierData} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Signup Trend (30 days)</CardTitle>
          </CardHeader>
          <CardContent>
            <SignupLineChart data={signupData} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Cohort Retention</CardTitle>
          </CardHeader>
          <CardContent>
            <CohortTable data={data.cohorts} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Simple stat card
function StatCard({ title, value, icon: Icon, negative = false }: { 
  title: string; 
  value: string; 
  icon: React.ComponentType<{ className?: string }>;
  negative?: boolean;
}) {
  return (
    <div className="bg-white border border-border/50 rounded-xl p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-gray-500">{title}</p>
          <p className={`text-2xl font-bold ${negative ? 'text-red-600' : 'text-gray-900'}`}>{value}</p>
        </div>
        <div className="bg-gray-100 rounded-lg p-3">
          <Icon className="h-6 w-6 text-gray-600" />
        </div>
      </div>
    </div>
  );
}

// Simple card wrapper
function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white border border-border/50 rounded-xl">{children}</div>;
}
function CardHeader({ children }: { children: React.ReactNode }) {
  return <div className="p-5 border-b border-border/50">{children}</div>;
}
function CardTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="font-semibold text-gray-900">{children}</h3>;
}
function CardContent({ children }: { children: React.ReactNode }) {
  return <div className="p-5">{children}</div>;
}

// Placeholder charts - replace with actual chart library (Recharts)
function RevenueBarChart({ data }: { data: Array<{ month: string; revenue: number }> }) {
  const maxRevenue = Math.max(...data.map(d => d.revenue), 1);
  return (
    <div className="h-64 flex items-end justify-between gap-2">
      {data.map((d, i) => (
        <div key={i} className="flex-1 flex flex-col items-center">
          <div 
            className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
            style={{ height: `${(d.revenue / maxRevenue) * 100}%`, minHeight: '4px' }}
          />
          <span className="text-xs text-gray-500 mt-2">{d.month}</span>
        </div>
      ))}
    </div>
  );
}

function TierPieChart({ data }: { data: Array<{ tier: string; mrr: number }> }) {
  const total = data.reduce((sum, d) => sum + d.mrr, 0);
  const colors = ['#2D7D46', '#C65D3B', '#1A1F2E', '#F5F0E1'];
  return (
    <div className="h-64 flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        {data.map((d, i) => (
          <div key={d.tier} className="flex items-center gap-3">
            <div 
              className="w-4 h-4 rounded" 
              style={{ backgroundColor: colors[i % colors.length] }}
            />
            <span className="text-sm font-medium capitalize">{d.tier}</span>
            <span className="text-sm text-gray-500">
              {formatCurrency(d.mrr * 100)} ({(total > 0 ? (d.mrr / total * 100).toFixed(1) : 0)}%)
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function SignupLineChart({ data }: { data: Array<{ date: string; total: number; paid: number }> }) {
  const maxVal = Math.max(...data.map(d => d.total), 1);
  return (
    <div className="h-64 relative">
      <div className="flex-1 flex items-end gap-1 h-full">
        {data.map((d, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div 
              className="w-full bg-primary rounded-t transition-all hover:bg-primary/80"
              style={{ height: `${(d.paid / maxVal) * 100}%`, minHeight: '4px' }}
            />
            <div 
              className="w-full bg-gray-200 rounded-t transition-all"
              style={{ height: `${((d.total - d.paid) / maxVal) * 100}%`, minHeight: '4px' }}
            />
            <span className="text-xs text-gray-500 mt-1">{d.date}</span>
          </div>
        ))}
      </div>
      <div className="absolute bottom-0 left-0 right-0 flex justify-center gap-4 text-xs">
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-primary rounded" />
          Paid
        </span>
        <span className="flex items-center gap-1">
          <span className="w-3 h-3 bg-gray-200 rounded" />
          Free
        </span>
      </div>
    </div>
  );
}

function CohortTable({ data }: { data: Array<{ cohortMonth: string; totalOrgs: number; activeOrgs: number; paidOrgs: number; retentionRate: number }> }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-border/50">
            <th className="px-4 py-2 text-left">Cohort</th>
            <th className="px-4 py-2 text-right">Total</th>
            <th className="px-4 py-2 text-right">Active</th>
            <th className="px-4 py-2 text-right">Paid</th>
            <th className="px-4 py-2 text-right">Retention</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border/50">
          {data.map((c) => (
            <tr key={c.cohortMonth}>
              <td className="px-4 py-2 font-medium">{format(new Date(c.cohortMonth), 'MMM yyyy')}</td>
              <td className="px-4 py-2 text-right">{c.totalOrgs}</td>
              <td className="px-4 py-2 text-right">{c.activeOrgs}</td>
              <td className="px-4 py-2 text-right">{c.paidOrgs}</td>
              <td className="px-4 py-2 text-right font-medium">
                {c.retentionRate.toFixed(1)}%
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Main Billing Dashboard Page
export default function BillingDashboard() {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<'subscriptions' | 'webhooks' | 'churn' | 'revenue'>('subscriptions');

  const handleTabChange = (value: string) => {
    setActiveTab(value as 'subscriptions' | 'webhooks' | 'churn' | 'revenue');
  };

  // Fetch subscriptions
  const { data: subscriptionsData, isLoading: subsLoading } = useQuery({
    queryKey: ['admin-billing'],
    queryFn: () => fetch('/api/admin/billing').then(r => r.json()),
    refetchInterval: 30000,
  });

  // Fetch webhooks
  const { data: webhooksData, isLoading: webhooksLoading } = useQuery({
    queryKey: ['admin-billing-webhooks'],
    queryFn: () => fetch('/api/admin/billing/webhooks').then(r => r.json()),
    refetchInterval: 60000,
  });

  // Fetch churn data
  const { data: churnData, isLoading: churnLoading } = useQuery({
    queryKey: ['admin-churn'],
    queryFn: () => fetch('/api/admin/billing/churn').then(r => r.json()),
    refetchInterval: 300000, // 5 min
  });

  // Fetch revenue analytics
  const { data: revenueData, isLoading: revenueLoading } = useQuery({
    queryKey: ['admin-revenue'],
    queryFn: () => fetch('/api/admin/billing/revenue').then(r => r.json()),
    refetchInterval: 300000,
  });

  // Mutations
  const overrideTier = useMutation({
    mutationFn: ({ orgId, tier }: { orgId: string; tier: string }) =>
      fetch(`/api/admin/organizations/${orgId}/tier`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, manual: true, reason: 'Admin override from billing dashboard' }),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-billing'] });
      queryClient.invalidateQueries({ queryKey: ['admin-revenue'] });
    },
  });

  const retryWebhook = useMutation({
    mutationFn: (id: string) =>
      fetch(`/api/admin/billing/webhooks/${id}/retry`, { method: 'POST' }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-billing-webhooks'] }),
  });

  const createOffer = useMutation({
    mutationFn: (offer: { organizationId: string; offerType: string; discount: number; expiryDays: number }) =>
      fetch('/api/admin/billing/churn', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(offer),
      }).then(r => r.json()),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['admin-churn'] }),
  });

  const handleTierChange = ({ orgId, tier }: { orgId: string; tier: string }) => {
    overrideTier.mutate({ orgId, tier });
  };

  const handleOpenPortal = (customerCode: string) => {
    window.open(`https://dashboard.paystack.com/#/customers/${customerCode}`, '_blank');
  };

  const handleCancel = (subscriptionCode: string) => {
    if (confirm('Are you sure you want to cancel this subscription?')) {
      // Implement cancel mutation
      alert('Cancel subscription - implement mutation');
    }
  };

  const handleRetryWebhook = (id: string) => {
    retryWebhook.mutate(id);
  };

  const handleCreateOffer = (offer: { organizationId: string; offerType: string; discount: number; expiryDays: number }) => {
    createOffer.mutate(offer);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Billing Dashboard</h1>
          <p className="text-gray-500">Paystack subscription management and revenue analytics</p>
        </div>
        <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-billing'] })}>
          <RefreshCw className="mr-2 h-4 w-4" /> Refresh
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="subscriptions">Subscriptions</TabsTrigger>
          <TabsTrigger value="webhooks">Webhook Logs</TabsTrigger>
          <TabsTrigger value="churn">Churn Recovery</TabsTrigger>
          <TabsTrigger value="revenue">Revenue Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="subscriptions">
          <SubscriptionTable 
            data={subscriptionsData?.subscriptions}
            onTierChange={handleTierChange}
            onOpenPortal={handleOpenPortal}
            onCancel={handleCancel}
            isLoading={subsLoading}
          />
        </TabsContent>

        <TabsContent value="webhooks">
          <WebhookLogTable 
            data={webhooksData?.webhooks}
            onRetry={handleRetryWebhook}
            isLoading={webhooksLoading}
          />
        </TabsContent>

        <TabsContent value="churn">
          <ChurnRecoveryPanel 
            atRiskOrgs={churnData?.atRiskOrgs}
            retentionOffers={churnData?.retentionOffers}
            isLoading={churnLoading}
            onCreateOffer={handleCreateOffer}
          />
        </TabsContent>

        <TabsContent value="revenue">
          <RevenueCharts data={revenueData} isLoading={revenueLoading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}