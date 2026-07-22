import React, { useMemo } from 'react';
import { TrendingUp, Package, Activity, Users, AlertTriangle, CheckCircle, BarChart3, ActivitySquare, ShieldAlert, CalendarDays, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

export default function AnalyticsDashboard({ goats = [], inventory = [], sales = [], alerts = [], healthRecords = [], breedingRecords = [], expenditures = [], usageLogs = [], farmEvents = [], currency = 'GH₵' }) {
  
  // -- Herd Metrics --
  const herdStats = useMemo(() => {
    const total = goats.length;
    const does = goats.filter(g => g.sex === 'F').length;
    const bucks = goats.filter(g => g.sex === 'M').length;
    const wethers = goats.filter(g => g.sex === 'W').length;
    return { total, does, bucks, wethers };
  }, [goats]);

  // -- Sales Metrics --
  const salesStats = useMemo(() => {
    const totalRevenue = sales.reduce((sum, s) => sum + (parseFloat(s.amount) || 0), 0);
    const totalItemsSold = sales.reduce((sum, s) => {
      const items = s.items_data || [];
      return sum + items.reduce((qtySum, i) => qtySum + (parseInt(i.qty) || 0), 0);
    }, 0);
    return { totalRevenue, totalItemsSold, count: sales.length };
  }, [sales]);

  // -- Finance & Usage Metrics --
  const financeStats = useMemo(() => {
    const totalExpenditure = expenditures.reduce((sum, e) => sum + (parseFloat(e.amount) || 0), 0);
    const netProfit = salesStats.totalRevenue - totalExpenditure;
    
    // Calculate total feed consumed
    const feedConsumed = usageLogs
      .filter(log => {
        const item = inventory.find(i => i.id === log.inventory_item_id);
        return item ? item.category === 'Feed' : log.item_name?.toLowerCase().includes('feed');
      })
      .reduce((sum, log) => sum + (parseFloat(log.quantity_used) || 0), 0);

    return { totalExpenditure, netProfit, feedConsumed };
  }, [expenditures, usageLogs, salesStats.totalRevenue, inventory]);

  // -- Inventory Metrics --
  const inventoryStats = useMemo(() => {
    const lowStockItems = inventory.filter(i => i.quantity <= (i.low_stock_threshold || 0));
    const totalValue = inventory.reduce((sum, i) => sum + (parseFloat(i.unit_price || 0) * (parseFloat(i.quantity || 0))), 0);
    return { lowStockCount: lowStockItems.length, totalValue, totalItems: inventory.length };
  }, [inventory]);

  // -- Health & Breeding --
  const healthStats = useMemo(() => {
    const activeAlerts = alerts.filter(a => a.status === 'active' || a.status === 'unread').length;
    const upcomingBirths = breedingRecords.filter(b => {
      if (!b.expected_kidding_date) return false;
      const days = (new Date(b.expected_kidding_date) - new Date()) / (1000 * 60 * 60 * 24);
      return days > 0 && days <= 30;
    }).length;
    return { activeAlerts, upcomingBirths };
  }, [alerts, breedingRecords]);

  // Simple Progress Bar Component
  const ProgressBar = ({ label, value, max, color }) => (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, color: 'var(--text-sub)', marginBottom: 4 }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600 }}>{value} / {max}</span>
      </div>
      <div style={{ height: 6, background: 'var(--border-color)', borderRadius: 3, overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${Math.min(100, (value / (max || 1)) * 100)}%`, background: color, borderRadius: 3 }} />
      </div>
    </div>
  );

  const exportPDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text('Goat Master - Analytics Report', 14, 20);
    doc.setFontSize(11);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Herd: ${herdStats.total} goats (${herdStats.does} does, ${herdStats.bucks} bucks, ${herdStats.wethers} wethers)`, 14, 36);
    doc.text(`Revenue: ${currency}${salesStats.totalRevenue.toFixed(2)} from ${salesStats.count} sales`, 14, 44);
    doc.text(`Inventory: ${inventoryStats.totalItems} items worth ${currency}${inventoryStats.totalValue.toFixed(2)}`, 14, 52);
    doc.text(`Expenses: ${currency}${financeStats.totalExpenditure.toFixed(2)}`, 14, 60);
    doc.text(`Net Profit: ${currency}${financeStats.netProfit.toFixed(2)}`, 14, 68);
    doc.save('goatmaster-report.pdf');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 10 }}>
        <div style={{ background: 'var(--primary-bg)', padding: 12, borderRadius: 14 }}>
          <BarChart3 size={28} color="var(--primary)" />
        </div>
        <div style={{ flex: 1 }}>
          <h2 style={{ margin: 0, fontSize: 22, color: 'var(--text-main)' }}>Analytics Overview</h2>
          <p style={{ margin: '4px 0 0', fontSize: 14, color: 'var(--text-sub)' }}>Real-time insights across your entire operation</p>
        </div>
        <button onClick={exportPDF} className="btn-primary" style={{ padding: '8px 14px', fontSize: 12, gap: 6 }}>
          <Download size={14} /> Export PDF
        </button>
      </div>

      {/* TOP KPI ROW */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}>
        {/* Revenue */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-sub)' }}>
            <TrendingUp size={18} color="#10b981" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Total Revenue</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-main)' }}>
            {currency}{salesStats.totalRevenue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>Across {salesStats.count} sales</div>
        </div>

        {/* Inventory Value */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-sub)' }}>
            <Package size={18} color="#f59e0b" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Inventory Value</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-main)' }}>
            {currency}{inventoryStats.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>For {inventoryStats.totalItems} distinct items</div>
        </div>

        {/* Herd Size */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-sub)' }}>
            <Users size={18} color="#3b82f6" />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Total Herd</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: 'var(--text-main)' }}>
            {herdStats.total}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>Goats currently enrolled</div>
        </div>

        {/* Expenses / Net */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-sub)' }}>
            <TrendingUp size={18} color={financeStats.netProfit >= 0 ? "#10b981" : "#ef4444"} style={{ transform: financeStats.netProfit < 0 ? 'scaleY(-1)' : 'none' }} />
            <span style={{ fontSize: 14, fontWeight: 600 }}>Net Profit</span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 800, color: financeStats.netProfit >= 0 ? '#10b981' : '#ef4444' }}>
            {financeStats.netProfit < 0 ? '-' : ''}{currency}{Math.abs(financeStats.netProfit).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-sub)' }}>{currency}{financeStats.totalExpenditure.toLocaleString(undefined, { minimumFractionDigits: 2 })} in total expenses</div>
        </div>
      </div>

      {/* SECOND ROW: Breakdowns */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 16 }}>
        
        {/* Herd Demographics */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16 }}>
          <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 16, color: 'var(--text-main)' }}>Herd Demographics</h3>
          <ProgressBar label="Does (Female)" value={herdStats.does} max={herdStats.total} color="#ec4899" />
          <ProgressBar label="Bucks (Male)" value={herdStats.bucks} max={herdStats.total} color="#3b82f6" />
          <ProgressBar label="Wethers (Castrated)" value={herdStats.wethers} max={herdStats.total} color="#8b5cf6" />
        </div>

        {/* Actionable Insights (Alerts, Health, Stock) */}
        <div className="glass-panel" style={{ padding: 20, borderRadius: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 style={{ fontSize: 16, marginTop: 0, marginBottom: 4, color: 'var(--text-main)' }}>Action Center</h3>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: inventoryStats.lowStockCount > 0 ? '#fef2f2' : '#f0fdf4', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {inventoryStats.lowStockCount > 0 ? <AlertTriangle size={20} color="#ef4444"/> : <CheckCircle size={20} color="#10b981"/>}
              <span style={{ color: inventoryStats.lowStockCount > 0 ? '#b91c1c' : '#047857', fontWeight: 600, fontSize: 14 }}>Inventory Alerts</span>
            </div>
            <span style={{ fontWeight: 800, color: inventoryStats.lowStockCount > 0 ? '#ef4444' : '#10b981' }}>{inventoryStats.lowStockCount} Low Stock</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: healthStats.activeAlerts > 0 ? '#fffbeb' : '#f0fdf4', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {healthStats.activeAlerts > 0 ? <ShieldAlert size={20} color="#f59e0b"/> : <CheckCircle size={20} color="#10b981"/>}
              <span style={{ color: healthStats.activeAlerts > 0 ? '#b45309' : '#047857', fontWeight: 600, fontSize: 14 }}>Health Alerts</span>
            </div>
            <span style={{ fontWeight: 800, color: healthStats.activeAlerts > 0 ? '#f59e0b' : '#10b981' }}>{healthStats.activeAlerts} Active</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: healthStats.upcomingBirths > 0 ? '#eff6ff' : '#f3f4f6', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <ActivitySquare size={20} color={healthStats.upcomingBirths > 0 ? "#3b82f6" : "#6b7280"}/>
              <span style={{ color: healthStats.upcomingBirths > 0 ? '#1d4ed8' : '#374151', fontWeight: 600, fontSize: 14 }}>Upcoming Kidding (30d)</span>
            </div>
            <span style={{ fontWeight: 800, color: healthStats.upcomingBirths > 0 ? '#3b82f6' : '#6b7280' }}>{healthStats.upcomingBirths} Does</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#f8fafc', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <Package size={20} color="#64748b"/>
              <span style={{ color: '#334155', fontWeight: 600, fontSize: 14 }}>Total Feed Consumed</span>
            </div>
            <span style={{ fontWeight: 800, color: '#475569' }}>{financeStats.feedConsumed.toFixed(1)} kg</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: 'rgba(99, 102, 241, 0.08)', borderRadius: 10 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CalendarDays size={20} color="#6366f1"/>
              <span style={{ color: '#4338ca', fontWeight: 600, fontSize: 14 }}>Farm Activity Logs</span>
            </div>
            <span style={{ fontWeight: 800, color: '#6366f1' }}>{farmEvents.length} Events</span>
          </div>
        </div>

      </div>
    </div>
  );
}
