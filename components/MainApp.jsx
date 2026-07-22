'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { LayoutGrid, Dna, Activity, FileText, Settings, Search, Plus, LogOut, Shield, Package, TrendingUp, BarChart3, Wallet, Droplets, Wheat, CalendarDays, BookOpen, ChevronRight, ScanLine, Sparkles, Beef, Milk, DollarSign, LineChart, HeartPulse, UserCog } from 'lucide-react';
import HealthPanel from './HealthPanel';
import BreedingPanel from './BreedingPanel';
import EventsPanel from './EventsPanel';
import Reports from './Reports';
import AlertsPanel from './AlertsPanel';
import SettingsFooter from './SettingsFooter';
import Login from './Login';
import GoatScanner from './GoatScanner';
import SmartScanner from './SmartScanner';
import BreedReference from './BreedReference';
import MaturationHelper from './MaturationHelper';
import ErrorBoundary from './ErrorBoundary';
import SplashScreen from './SplashScreen';
import Toast from './Toast';
import DeleteModal from './DeleteModal';
import GoatCard from './GoatCard';
import AddGoatView from './AddGoatView';
import TrainingPanel from './TrainingPanel';
import MergePanel from './MergePanel';
import { BREEDS } from '@/lib/breeds';
import { initDb, generateUUID } from '@/lib/localDb';
import { hasRemoteSession, syncStoreFromRemote, triggerSync, queueSyncAction } from '@/lib/sync';
import InventoryPanel from './InventoryPanel';
import SalesPanel from './SalesPanel';
import AnalyticsDashboard from './AnalyticsDashboard';
import ExpenditurePanel from './ExpenditurePanel';
import DairyPanel from './DairyPanel';
import RationCalculator from './RationCalculator';
import PedigreePanel from './PedigreePanel';

// ── CONSOLIDATED NAV GROUPS ──
const NAV_GROUPS = [
  {
    id: 'herd', label: 'Herd', icon: Beef,
    subs: [
      { id: 'profiles', label: 'Profiles' },
      { id: 'health',   label: 'Health' },
      { id: 'events',   label: 'Events' },
      { id: 'lineage',  label: 'Lineage' },
    ],
  },
  {
    id: 'ops', label: 'Ops', icon: Package,
    subs: [
      { id: 'inventory', label: 'Inventory' },
      { id: 'finance',   label: 'Finance' },
      { id: 'sales',     label: 'Sales' },
      { id: 'dairy',     label: 'Dairy' },
      { id: 'nutrition', label: 'Nutrition' },
    ],
  },
  {
    id: 'intel', label: 'Intel', icon: LineChart,
    subs: [
      { id: 'analytics', label: 'Analytics' },
      { id: 'scan',      label: 'Scan' },
    ],
  },
  {
    id: 'settings', label: 'Settings', icon: UserCog,
    subs: [],
  },
];

// ── MAIN APP ──
const EMPTY_FORM = { id: '', name: '', breed: '', sex: 'F', dob: '', image_url: '', ear_tag: '', dam_id: '', sire_id: '' };

export default function MainApp() {
  const [loadingSplash, setLoadingSplash] = useState(true);
  const [user, setUser]         = useState(null);
  const [toast, setToast]       = useState(null);
  const [modalOpen, setModalOpen]     = useState(false);
  const [modalConfig, setModalConfig] = useState({});
  const [showBreedRef, setShowBreedRef] = useState(false);
  const [activeGroup, setActiveGroup] = useState('herd');
  const [activeTab, setActiveTab]   = useState('profiles');
  const [showForm, setShowForm]     = useState(false);
  const [editingGoat, setEditingGoat] = useState(null);
  const [formData, setFormData]     = useState(EMPTY_FORM);

  const [goats, setGoats]                   = useState([]);
  const [inventory, setInventory]           = useState([]);
  const [sales, setSales]                   = useState([]);
  const [healthRecords, setHealthRecords]   = useState([]);
  const [breedingRecords, setBreedingRecords] = useState([]);
  const [alerts, setAlerts]                 = useState([]);
  const [expenditures, setExpenditures]     = useState([]);
  const [usageLogs, setUsageLogs]           = useState([]);
  const [milkRecords, setMilkRecords]       = useState([]);
  const [weightRecords, setWeightRecords]   = useState([]);
  const [farmEvents, setFarmEvents]         = useState([]);
  const [currency, setCurrency]             = useState('GH₵');
  const [initialEventGoatId, setInitialEventGoatId] = useState(null);

  const [isFetching, setIsFetching] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading]   = useState(false);
  const [searchTerm, setSearchTerm]     = useState('');
  const [filterSex, setFilterSex]       = useState('All');
  const [theme, setTheme]               = useState('system');
  const [scanMode, setScanMode]         = useState('identify');

  // Restore saved tab
  useEffect(() => {
    const savedTab = window.localStorage.getItem('goat_active_tab');
    if (savedTab) {
      setActiveTab(savedTab);
      for (const g of NAV_GROUPS) {
        if (g.subs?.some(s => s.id === savedTab) || g.id === savedTab) {
          setActiveGroup(g.id);
          break;
        }
      }
    }
  }, []);

  useEffect(() => {
    window.localStorage.setItem('goat_active_tab', activeTab);
  }, [activeTab]);

  // Theme
  useEffect(() => { const saved = localStorage.getItem('goat_theme'); if (saved) setTheme(saved); }, []);
  useEffect(() => {
    const root = document.documentElement;
    const dark = theme === 'dark' || (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    root.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('goat_theme', theme);
  }, [theme]);

  // Auth
  useEffect(() => {
    const savedUser = localStorage.getItem('goat_user');
    if (savedUser) { try { setUser(JSON.parse(savedUser)); } catch { setUser(null); } }
    setLoadingSplash(false);
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedCurrency = localStorage.getItem('currency');
      if (savedCurrency) setCurrency(savedCurrency);
    }
  }, []);

  const showToast = useCallback((msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const confirmAction = useCallback((title, message, confirmText, cancelText, action) => {
    setModalConfig({ title, message, confirmText, cancelText, onConfirm: () => { action(); setModalOpen(false); } });
    setModalOpen(true);
  }, []);

  const fetchData = useCallback(async (tabToLoad = null) => {
    try {
      setIsFetching(true);
      const db = await initDb();
      const tab = tabToLoad || activeTab;
      const loadPromises = [];

      if (tab === 'analytics') {
        loadPromises.push(
          db.getAll('goats').then(d => setGoats(d || [])),
          db.getAll('inventory').then(d => setInventory(d || [])),
          db.getAll('sales').then(d => setSales(d || [])),
          db.getAll('health_records').then(d => setHealthRecords(d || [])),
          db.getAll('breeding_records').then(d => setBreedingRecords(d || [])),
          db.getAll('alerts').then(d => setAlerts(d || [])),
          db.getAll('expenditures').then(d => setExpenditures(d || [])),
          db.getAll('usage_logs').then(d => setUsageLogs(d || [])),
          db.getAll('milk_records').then(d => setMilkRecords(d || [])),
          db.getAll('weight_records').then(d => setWeightRecords(d || [])),
          db.getAll('farm_events').then(d => setFarmEvents(d || []))
        );
      } else {
        if (['profiles', 'scan', 'lineage', 'health', 'dairy', 'settings', 'events'].includes(tab)) {
          loadPromises.push(db.getAll('goats').then(d => setGoats(d || [])));
        }
        if (['inventory', 'finance', 'sales'].includes(tab)) {
          loadPromises.push(db.getAll('inventory').then(d => setInventory(d || [])));
        }
        if (['sales'].includes(tab)) {
          loadPromises.push(db.getAll('sales').then(d => setSales(d || [])));
        }
        if (tab === 'finance') {
          loadPromises.push(db.getAll('expenditures').then(d => setExpenditures(d || [])));
        }
        if (tab === 'events') {
          loadPromises.push(db.getAll('farm_events').then(d => setFarmEvents(d || [])));
        }
        if (tab === 'health') {
          loadPromises.push(db.getAll('health_records').then(d => setHealthRecords(d || [])));
          loadPromises.push(db.getAll('weight_records').then(d => setWeightRecords(d || [])));
          loadPromises.push(db.getAll('alerts').then(d => setAlerts(d || [])));
        }
        if (tab === 'dairy') {
          loadPromises.push(db.getAll('milk_records').then(d => setMilkRecords(d || [])));
        }
        if (tab === 'lineage') {
          loadPromises.push(db.getAll('breeding_records').then(d => setBreedingRecords(d || [])));
        }
      }

      await Promise.all(loadPromises);
      setIsFetching(false);

      if (tab !== 'analytics') {
        Promise.all([
          db.getAll('goats').then(d => setGoats(d || [])),
          db.getAll('inventory').then(d => setInventory(d || [])),
          db.getAll('sales').then(d => setSales(d || [])),
          db.getAll('health_records').then(d => setHealthRecords(d || [])),
          db.getAll('breeding_records').then(d => setBreedingRecords(d || [])),
          db.getAll('alerts').then(d => setAlerts(d || [])),
          db.getAll('expenditures').then(d => setExpenditures(d || [])),
          db.getAll('usage_logs').then(d => setUsageLogs(d || [])),
          db.getAll('milk_records').then(d => setMilkRecords(d || [])),
          db.getAll('weight_records').then(d => setWeightRecords(d || [])),
          db.getAll('farm_events').then(d => setFarmEvents(d || []))
        ]).catch(console.error);
      }

      if (navigator.onLine) {
        const remoteSession = await hasRemoteSession();
        if (!remoteSession) return;
        const queueEmpty = await triggerSync();
        if (queueEmpty) {
          await Promise.all([
            syncStoreFromRemote('goats'), syncStoreFromRemote('inventory'), syncStoreFromRemote('sales'),
            syncStoreFromRemote('health_records'), syncStoreFromRemote('breeding_records'), syncStoreFromRemote('alerts'),
            syncStoreFromRemote('expenditures'), syncStoreFromRemote('usage_logs'), syncStoreFromRemote('milk_records'),
            syncStoreFromRemote('weight_records'), syncStoreFromRemote('farm_events')
          ]);
          setGoats(await db.getAll('goats') || []);
          setInventory(await db.getAll('inventory') || []);
          setSales(await db.getAll('sales') || []);
          setHealthRecords(await db.getAll('health_records') || []);
          setBreedingRecords(await db.getAll('breeding_records') || []);
          setAlerts(await db.getAll('alerts') || []);
          setExpenditures(await db.getAll('expenditures') || []);
          setUsageLogs(await db.getAll('usage_logs') || []);
          setMilkRecords(await db.getAll('milk_records') || []);
          setWeightRecords(await db.getAll('weight_records') || []);
          setFarmEvents(await db.getAll('farm_events') || []);
        }
      }
    } catch (error) {
      console.error('Fetch error:', error);
      setIsFetching(false);
    }
  }, [activeTab]);

  useEffect(() => { fetchData(); }, [activeTab]);

  const fetchGoats = useCallback(() => { fetchData('profiles'); }, [fetchData]);

  const handleLogin = useCallback((nextUser) => {
    const userObj = nextUser || { username: 'Demo User', role: 'admin', tier: 'pro' };
    setUser(userObj);
    localStorage.setItem('goat_user', JSON.stringify(userObj));
  }, []);

  const handleLogout = useCallback(async () => {
    try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
    setUser(null);
    localStorage.removeItem('goat_user');
    setActiveGroup('herd'); setActiveTab('profiles');
    window.localStorage.setItem('goat_active_tab', 'profiles');
  }, []);

  const navigateToEvents = (goatId) => {
    setInitialEventGoatId(goatId);
    setActiveGroup('herd'); setActiveTab('events');
    setShowForm(false);
  };

  const handleAddNew = () => { setEditingGoat(null); setFormData(EMPTY_FORM); setShowForm(true); };
  const handleEdit = (goat) => {
    setEditingGoat(goat);
    setFormData({ id: goat.id, name: goat.name, breed: goat.breed || '', sex: goat.sex, dob: goat.dob ? goat.dob.split('T')[0] : '', image_url: goat.image_url || '', ear_tag: goat.ear_tag || '', dam_id: goat.dam_id || '', sire_id: goat.sire_id || '' });
    setShowForm(true);
  };

  const handleImageChange = async (e) => {
    const file = e.target.files?.[0]; if (!file) return;
    const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_NAME;
    const preset = process.env.NEXT_PUBLIC_CLOUDINARY_PRESET;
    if (!cloudName || !preset) { showToast('Photo upload not configured.', 'error'); return; }
    if (file.size > 5 * 1024 * 1024) { showToast('Image too large (max 5 MB).', 'error'); return; }
    if (!file.type.startsWith('image/')) { showToast('Please select an image file.', 'error'); return; }
    setIsUploading(true);
    const data = new FormData(); data.append('file', file); data.append('upload_preset', preset);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, { method: 'POST', body: data });
      if (!res.ok) throw new Error('upload failed');
      const json = await res.json();
      if (json.secure_url) setFormData(p => ({ ...p, image_url: json.secure_url }));
      else throw new Error('no url');
    } catch { showToast('Image upload failed.', 'error'); }
    finally { setIsUploading(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault(); setIsSubmitting(true);
    try {
      const action = editingGoat ? 'UPDATE' : 'CREATE';
      const payload = { ...formData, id: editingGoat ? editingGoat.id : generateUUID(), dam_id: formData.dam_id || null, sire_id: formData.sire_id || null, owner_id: user.username };
      const db = await initDb();
      await db.put('goats', payload); await queueSyncAction('goats', action, payload);
      showToast(editingGoat ? 'Goat updated!' : 'Goat added!'); fetchData(); setShowForm(false);
    } catch (err) { console.error(err); showToast('Error saving goat locally', 'error'); }
    finally { setIsSubmitting(false); }
  };

  const handleDeleteGoat = () => {
    if (!editingGoat) return;
    confirmAction('Delete Goat?', `Permanently remove ${editingGoat.name} and all their records?`, 'Yes, Delete', 'Cancel', async () => {
      setIsSubmitting(true);
      try { const db = await initDb(); await db.delete('goats', editingGoat.id); await queueSyncAction('goats', 'DELETE', { id: editingGoat.id }); showToast('Goat deleted'); fetchData(); setShowForm(false); }
      catch (err) { console.error(err); showToast('Error deleting goat', 'error'); }
      finally { setIsSubmitting(false); }
    });
  };

  const filtered = goats.filter(g => g.name.toLowerCase().includes(searchTerm.toLowerCase()) && (filterSex === 'All' || g.sex === filterSex));

  if (loadingSplash) return <SplashScreen />;
  if (!user) return <Login onLogin={handleLogin} />;

  if (showBreedRef) {
    return (
      <div className="app-layout">
        <main className="main-content" style={{ padding: '20px 16px 40px' }}>
          <BreedReference onClose={() => setShowBreedRef(false)} />
        </main>
      </div>
    );
  }

  return (
    <div className="app-layout">
      <DeleteModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onConfirm={modalConfig.onConfirm}
        title={modalConfig.title} message={modalConfig.message} confirmText={modalConfig.confirmText} cancelText={modalConfig.cancelText} />
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* ── HEADER with sub-tab pills ── */}
      <header className="app-header" style={{ flexDirection: 'column', gap: 0, padding: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', width: '100%', boxSizing: 'border-box' }}>
          <img src="/icon-192.png" style={{ width: 28, height: 28, borderRadius: 6 }} alt="" />
          <h1 className="app-title" style={{ flex: 1, fontSize: 17 }}>
            {showForm ? (editingGoat ? 'Edit Goat' : 'New Goat') : activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h1>
          {!showForm && activeTab === 'profiles' && (
            <button className="btn-primary" onClick={handleAddNew} style={{ padding: '6px 12px', fontSize: 12 }}><Plus size={14} /><span>Add</span></button>
          )}
        </div>
        {/* Sub-tab pills (only for groups with sub-tabs) */}
        {!showForm && NAV_GROUPS.find(g => g.id === activeGroup)?.subs?.length > 0 && (
          <div style={{ display: 'flex', gap: 4, padding: '0 16px 10px', overflowX: 'auto', width: '100%', boxSizing: 'border-box' }}>
            {NAV_GROUPS.find(g => g.id === activeGroup).subs.map(sub => (
              <button key={sub.id}
                onClick={() => { setActiveTab(sub.id); setShowForm(false); }}
                style={{
                  padding: '5px 12px', borderRadius: 16, border: 'none', fontSize: 12, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap', fontFamily: 'inherit',
                  background: activeTab === sub.id ? 'var(--primary)' : 'var(--bg-app)',
                  color: activeTab === sub.id ? 'white' : 'var(--text-sub)',
                  transition: 'all 0.15s',
                }}>
                {sub.label}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* ── MAIN CONTENT ── */}
      <main className="main-content">
        {showForm ? (
          <AddGoatView formData={formData} setFormData={setFormData} goats={goats} isSubmitting={isSubmitting}
            isUploading={isUploading} handleSubmit={handleSubmit} handleImageChange={handleImageChange}
            onCancel={() => setShowForm(false)} isEditing={!!editingGoat} onDelete={handleDeleteGoat}
            farmEvents={farmEvents} navigateToEvents={navigateToEvents} />
        ) : (
          <>
            {activeTab === 'analytics' && <AnalyticsDashboard goats={goats} inventory={inventory} sales={sales} alerts={alerts} healthRecords={healthRecords} breedingRecords={breedingRecords} expenditures={expenditures} usageLogs={usageLogs} farmEvents={farmEvents} currency={currency} />}

            {activeTab === 'profiles' && (
              <>
                <div className="search-bar">
                  <Search size={18} color="var(--text-sub)" />
                  <input className="search-input" placeholder="Search herd…" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
                </div>
                <div style={{ display: 'flex', gap: 8, marginBottom: 18, overflowX: 'auto', paddingBottom: 4 }}>
                  {[['All','All'],['F','Does'],['M','Bucks'],['W','Wethers']].map(([val,label]) => (
                    <button key={val} onClick={() => setFilterSex(val)} className={`btn-filter ${filterSex === val ? 'active' : ''}`}>{label}</button>
                  ))}
                </div>
                {isFetching ? (
                  <div className="goat-grid">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="skeleton skeleton-card" style={{ display: 'flex', gap: 14, padding: 14, alignItems: 'center' }}>
                        <div className="skeleton" style={{ width: 52, height: 52, borderRadius: '50%', flexShrink: 0 }} />
                        <div style={{ flex: 1 }}><div className="skeleton skeleton-line medium" /><div className="skeleton skeleton-line short" /></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="goat-grid tab-content">
                    {filtered.map(g => <GoatCard key={g.id} goat={g} onEdit={handleEdit} />)}
                    {!filtered.length && (
                      <div style={{ gridColumn: '1/-1' }} className="empty-state">
                        <div className="empty-state-icon">{searchTerm ? '🔍' : '🐐'}</div>
                        <h3>{searchTerm ? 'No matches found' : 'Your herd is empty'}</h3>
                        <p>{searchTerm ? `No goats match "${searchTerm}".` : 'Add goats manually or use Scan to auto-discover them.'}</p>
                      </div>
                    )}
                  </div>
                )}
              </>
            )}

            {activeTab === 'inventory' && <InventoryPanel inventory={inventory} isLoading={isFetching} onUpdate={fetchData} showToast={showToast} confirmAction={confirmAction} currency={currency} />}
            {activeTab === 'finance' && <ExpenditurePanel expenditures={expenditures} inventory={inventory} isLoading={isFetching} onUpdate={fetchData} showToast={showToast} confirmAction={confirmAction} currency={currency} />}
            {activeTab === 'sales' && <SalesPanel sales={sales} inventory={inventory} isLoading={isFetching} onUpdate={fetchData} showToast={showToast} confirmAction={confirmAction} currency={currency} />}
            {activeTab === 'dairy' && <DairyPanel goats={goats} milkRecords={milkRecords} isLoading={isFetching} onUpdate={fetchData} showToast={showToast} confirmAction={confirmAction} />}
            {activeTab === 'nutrition' && <RationCalculator />}

            {activeTab === 'scan' && (
              <ErrorBoundary>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button onClick={() => setScanMode('identify')}
                      style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: scanMode === 'identify' ? '#6366f1' : 'var(--bg-app)', color: scanMode === 'identify' ? 'white' : 'var(--text-sub)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                      <ScanLine size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Identify
                    </button>
                    <button onClick={() => setScanMode('bulk')}
                      style={{ flex: 1, padding: '11px 0', borderRadius: 12, border: 'none', background: scanMode === 'bulk' ? '#6366f1' : 'var(--bg-app)', color: scanMode === 'bulk' ? 'white' : 'var(--text-sub)', fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit', textAlign: 'center' }}>
                      <Sparkles size={16} style={{ display: 'inline', verticalAlign: 'middle', marginRight: 4 }} /> Bulk Discovery
                    </button>
                  </div>
                  {scanMode === 'identify' ? (
                    <>
                      <MaturationHelper goats={goats} onSelectGoat={(g) => showToast(`Save as Training Photo: ${g.name}`, 'success')} />
                      <GoatScanner goats={goats} onScanComplete={(res) => { if (res?.goat) showToast(`Matched: ${res.goat.name} (${Math.round((res.confidence ?? 0) * 100)}%)`, 'success'); }} />
                    </>
                  ) : (
                    <SmartScanner goats={goats} showToast={showToast} onComplete={fetchGoats} />
                  )}
                </div>
              </ErrorBoundary>
            )}

            {activeTab === 'lineage' && (
              <>
                <BreedingPanel goats={goats} breedingRecords={breedingRecords} isLoading={isFetching} onUpdate={fetchData} showToast={showToast} />
                <div style={{ marginTop: 16 }}>
                  <PedigreePanel goats={goats} />
                </div>
              </>
            )}
            {activeTab === 'health' && <><AlertsPanel alerts={alerts} onUpdate={fetchData} showToast={showToast} /><HealthPanel goats={goats} healthRecords={healthRecords} weightRecords={weightRecords} isLoading={isFetching} onUpdate={fetchData} showToast={showToast} confirmAction={confirmAction} /></>}
            {activeTab === 'events' && <EventsPanel goats={goats} farmEvents={farmEvents} inventory={inventory} initialEventGoatId={initialEventGoatId} isLoading={isFetching} onUpdate={fetchData} showToast={showToast} confirmAction={confirmAction} />}

            {/* SETTINGS (includes admin panel for admin users) */}
            {activeTab === 'settings' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 15, maxWidth: 600 }}>
                <div className="glass-panel" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: 20, borderRadius: 18 }}>
                  <div style={{ width: 58, height: 58, borderRadius: '50%', backgroundColor: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 800, flexShrink: 0 }}>
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 1, fontWeight: 700, marginBottom: 4 }}>Logged in as</div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-main)' }}>{user.username}</span>
                      <span style={{ padding: '2px 8px', borderRadius: 6, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        background: user.tier === 'pro' ? '#fff3cd' : user.tier === 'basic' ? '#d4edff' : '#e8e8e8',
                        color: user.tier === 'pro' ? '#856404' : user.tier === 'basic' ? '#0066cc' : '#555' }}>
                        {user.tier || 'free'}
                      </span>
                    </div>
                    {user.email && <div style={{ fontSize: 13, color: 'var(--text-sub)', marginTop: 4 }}>{user.email}</div>}
                  </div>
                </div>

                <div className="glass-panel" style={{ padding: 20, borderRadius: 18, display: 'flex', gap: 16 }}>
                  {[['Total',goats.length,'🐐'],['Does',goats.filter(g=>g.sex==='F').length,'♀'],['Bucks',goats.filter(g=>g.sex==='M').length,'♂'],['Wethers',goats.filter(g=>g.sex==='W').length,'⚥']].map(([l,v,e]) => (
                    <div key={l} style={{ flex: 1, textAlign: 'center' }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: 'var(--primary)' }}>{v}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-sub)', marginTop: 2 }}>{e} {l}</div>
                    </div>
                  ))}
                </div>

                <h3 style={{ color: 'var(--text-main)', margin: '8px 0 0', fontSize: 16 }}>Appearance</h3>
                <div className="theme-selector">
                  {['light','dark','system'].map(t => (
                    <button key={t} onClick={() => setTheme(t)} style={{ background: theme === t ? 'var(--bg-app)' : 'transparent', fontWeight: theme === t ? 700 : 400 }}>
                      {t === 'light' ? '☀️ Light' : t === 'dark' ? '🌙 Dark' : '⚙️ System'}
                    </button>
                  ))}
                </div>

                <h3 style={{ color: 'var(--text-main)', margin: '8px 0 0', fontSize: 16 }}>Knowledge</h3>
                <button onClick={() => setShowBreedRef(true)}
                  style={{ padding: 15, background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit', width: '100%', justifyContent: 'space-between' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 12 }}><BookOpen size={20} /><span>Browse {BREEDS.length - 1} Breeds</span></span>
                  <ChevronRight size={18} color="var(--text-sub)" />
                </button>

                <h3 style={{ color: 'var(--text-main)', margin: '8px 0 0', fontSize: 16 }}>AI Training</h3>
                <TrainingPanel goats={goats} showToast={showToast} />

                <h3 style={{ color: 'var(--text-main)', margin: '8px 0 0', fontSize: 16 }}>Fix Duplicates</h3>
                <MergePanel goats={goats} showToast={showToast} onMerged={fetchGoats} />

                <h3 style={{ color: 'var(--text-main)', margin: '8px 0 0', fontSize: 16 }}>Account</h3>
                {user.role === 'admin' && (
                  <a href="/admin" style={{ padding: 15, background: 'var(--primary-bg)', borderRadius: 14, border: '1px solid var(--primary)', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', color: 'var(--primary)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit', width: '100%', textDecoration: 'none' }}>
                    <Shield size={20} /> Admin Panel
                  </a>
                )}
                <button onClick={() => confirmAction('Log Out?', 'Are you sure you want to sign out?', 'Yes, Log Out', 'Cancel', handleLogout)}
                  style={{ padding: 15, background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border-color)', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', color: 'var(--text-main)', fontWeight: 600, fontSize: 15, fontFamily: 'inherit', width: '100%' }}>
                  <LogOut size={20} /> Log Out
                </button>
                <button onClick={() => confirmAction('Delete Account?', 'This permanently deletes your account.', 'Yes, Delete', 'Cancel', async () => {
                  const res = await fetch('/api/auth/delete', { method: 'DELETE', credentials: 'include' });
                  if (res.ok) handleLogout(); else showToast('Failed to delete account', 'error');
                })} style={{ padding: 15, background: '#fee2e2', borderRadius: 14, border: '1px solid #fecaca', display: 'flex', gap: 12, alignItems: 'center', cursor: 'pointer', color: '#dc2626', fontWeight: 600, fontSize: 15, fontFamily: 'inherit', width: '100%' }}>
                  <LogOut size={20} /> Delete Account
                </button>
                <SettingsFooter />
              </div>
            )}
          </>
        )}
      </main>

      {/* ── BOTTOM NAV (4 groups) ── */}
      {!showForm && (
        <nav className="nav-bar">
          {NAV_GROUPS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`nav-item ${activeGroup === id ? 'active' : ''}`}
              onClick={() => {
                if (id === 'settings') { setActiveGroup('settings'); setActiveTab('settings'); return; }
                setActiveGroup(id);
                const firstSub = NAV_GROUPS.find(g => g.id === id)?.subs?.[0];
                if (firstSub) setActiveTab(firstSub.id);
              }}>
              <Icon size={20} /><span>{label}</span>
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}