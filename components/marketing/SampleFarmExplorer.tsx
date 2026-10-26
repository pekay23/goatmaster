'use client';

import { useId, useMemo, useState } from 'react';
import Link from 'next/link';
import { sampleFarms } from './sample-data';

type View = 'dashboard' | 'herd' | 'health' | 'breeding' | 'inventory' | 'events' | 'weights' | 'milk' | 'scan';
const navigation: Array<{ id: View; label: string; icon: string }> = [
  { id: 'dashboard', label: 'Dashboard', icon: '⌂' },
  { id: 'herd', label: 'Herd', icon: '♧' },
  { id: 'health', label: 'Health', icon: '＋' },
  { id: 'breeding', label: 'Breeding', icon: '↗' },
  { id: 'inventory', label: 'Inventory', icon: '▤' },
  { id: 'scan', label: 'Scan', icon: '◎' },
];
const quickActions: Array<{ label: string; view: View }> = [
  { label: 'Add goat', view: 'herd' }, { label: 'Record treatment', view: 'health' },
  { label: 'Record weights', view: 'weights' }, { label: 'Record breeding', view: 'breeding' },
  { label: 'Record milk', view: 'milk' }, { label: 'Plan an event', view: 'events' },
];
const titles: Record<View, { title: string; description: string }> = {
  dashboard: { title: 'Today on the farm', description: 'The animals, records, and supplies that need your attention.' },
  herd: { title: 'Your herd', description: 'Find an animal, open its history, or add the next record.' },
  health: { title: 'Health records', description: 'Treatments, vaccinations, and the dates that matter next.' },
  breeding: { title: 'Breeding records', description: 'Follow mating, pregnancy, and kidding.' },
  inventory: { title: 'Farm supplies', description: 'Feed, medicine, and equipment with current stock levels.' },
  events: { title: 'Farm events', description: 'Plan visits, jobs, and important dates for your farm.' },
  weights: { title: 'Weight records', description: 'Track measurements for individual animals over time.' },
  milk: { title: 'Milk records', description: 'Keep morning and evening yields together.' },
  scan: { title: 'Smart Scan', description: 'The camera and photo workflow in the tenant app.' },
};

export default function SampleFarmExplorer({ compact = false }: { compact?: boolean }) {
  const [farmId, setFarmId] = useState(sampleFarms[0].id);
  const [view, setView] = useState<View>(compact ? 'herd' : 'dashboard');
  const [selectedGoatId, setSelectedGoatId] = useState('');
  const [search, setSearch] = useState('');
  const selectId = useId();
  const farm = sampleFarms.find(candidate => candidate.id === farmId) ?? sampleFarms[0];
  const goat = farm.goats.find(candidate => candidate.id === selectedGoatId) ?? farm.goats[0];
  const filteredGoats = useMemo(() => farm.goats.filter(animal => (animal.name + ' ' + animal.tag + ' ' + animal.breed).toLowerCase().includes(search.toLowerCase())), [farm.goats, search]);
  const lowStock = farm.inventory.filter(item => item.quantity <= item.minimum).length;
  const overdueHealth = farm.health.length;
  const upcomingEvents = farm.events.filter(event => !event.completed && event.date !== 'Overdue').length;
  const activeView = titles[view];

  return <div className="sample-demo-preview" data-testid="sample-farm-explorer">
    <div className="sample-demo-toolbar"><span>Preview workspace</span><label htmlFor={selectId}>Sample farm<select id={selectId} value={farmId} onChange={event => { setFarmId(event.target.value); setSelectedGoatId(''); setSearch(''); }} aria-label="Choose a sample farm">{sampleFarms.map(candidate => <option value={candidate.id} key={candidate.id}>{candidate.name}</option>)}</select></label><small>Illustrative data · read only</small></div>
    <div className={'sample-portal' + (compact ? ' sample-portal-compact' : '')}>
    <aside className="sample-portal-sidebar" aria-label="Portal navigation preview">
      <div className="sample-portal-brand"><span className="brand-mark" aria-hidden="true">G</span><span>GoatMaster</span></div>
      <nav className="sample-portal-nav" aria-label="Portal sections">{navigation.map(item => <button type="button" key={item.id} aria-current={view === item.id ? 'page' : undefined} onClick={() => setView(item.id)}><span className="sample-nav-icon" aria-hidden="true">{item.icon}</span><span>{item.label}</span>{item.id === 'scan' && farm.tier !== 'pro' && <span className="sample-lock-mark" aria-label="Plan locked">⌑</span>}</button>)}</nav>
    </aside>
    <div className="sample-portal-main">
      <header className="sample-portal-topbar"><div><strong>{farm.name}</strong><small>Farm workspace</small></div></header>
      <main className="sample-portal-content">
        <header className="sample-page-heading"><div><p className="sample-page-kicker">{view === 'dashboard' ? 'Your farm notebook' : farm.name}</p><h3>{activeView.title}</h3><p>{activeView.description}</p></div>{view !== 'dashboard' && view !== 'scan' && <button className="sample-primary-button" type="button" disabled title="Sample data is read-only">＋ {view === 'herd' ? 'Add goat' : view === 'inventory' ? 'Add item' : view === 'events' ? 'Plan event' : 'Add record'}</button>}</header>
        {view === 'dashboard' && <Dashboard farm={farm} overdueHealth={overdueHealth} lowStock={lowStock} upcomingEvents={upcomingEvents} onOpen={setView}/>}
        {view === 'herd' && <Herd farm={farm} goat={goat} search={search} setSearch={setSearch} setGoat={setSelectedGoatId} onOpen={setView}/>}
        {view === 'health' && <Health farm={farm}/>}
        {view === 'breeding' && <Breeding farm={farm}/>}
        {view === 'inventory' && <Inventory farm={farm}/>}
        {view === 'events' && <Events farm={farm}/>}
        {view === 'weights' && <Weights farm={farm}/>}
        {view === 'milk' && <Milk farm={farm}/>}
        {view === 'scan' && <Scan farm={farm}/>}
      </main>
    </div>
    </div>
    <div className="sample-demo-disclaimer"><span>Illustrative demo data only. Changes are not saved.</span>{compact ? <Link href="/demo">Open the sample farm ↗</Link> : <Link href="/signup">Start your own farm ↗</Link>}</div>
  </div>;
}

function Dashboard({ farm, overdueHealth, lowStock, upcomingEvents, onOpen }: { farm: typeof sampleFarms[number]; overdueHealth: number; lowStock: number; upcomingEvents: number; onOpen: (view: View) => void }) {
  const metrics = [{ label: 'Animals in your herd', value: farm.goats.length, view: 'herd' as View }, { label: 'Active health alerts', value: overdueHealth, view: 'health' as View }, { label: 'Events in the next week', value: upcomingEvents, view: 'events' as View }, { label: 'Supplies running low', value: lowStock, view: 'inventory' as View }];
  const tasks = [
    ...farm.health.filter(record => record.treatment !== 'Sample historical vaccination').map(record => ({ title: `${record.goat} · ${record.treatment}`, detail: record.type, when: record.next === 'Past due' ? 'overdue' : 'upcoming', view: 'health' as View })),
    ...farm.breeding.filter(record => record.status === 'confirmed' && record.expected === 'Coming up').map(record => ({ title: `Kidding expected · ${record.dam}`, detail: 'Update breeding record', when: 'upcoming', view: 'breeding' as View })),
    ...farm.events.filter(event => !event.completed).slice(0, 3).map(event => ({ title: event.subject, detail: event.category, when: event.date === 'Overdue' ? 'overdue' : event.date === 'Today' ? 'today' : 'upcoming', view: 'events' as View })),
    ...(lowStock ? [{ title: 'Review low-stock supplies', detail: `${lowStock} item below its reminder threshold`, when: 'today', view: 'inventory' as View }] : []),
  ];
  const buckets = ['overdue', 'today', 'upcoming'];
  return <div className="sample-page-stack"><nav className="sample-quick-actions" aria-label="Quick actions">{quickActions.map(action => <button key={action.label} type="button" onClick={() => onOpen(action.view)}>{action.label}</button>)}</nav>
    <section className="sample-metric-grid" aria-label="Farm overview">{metrics.map(metric => <button type="button" key={metric.label} onClick={() => onOpen(metric.view)}><span>{metric.label}</span><strong>{metric.value}</strong></button>)}</section>
    <section><div className="sample-card-heading"><h4>Your work list</h4><span>{tasks.length} items</span></div><div className="sample-task-columns">{buckets.map(bucket => { const items = tasks.filter(task => task.when === bucket); return <article className="sample-task-column" key={bucket}><h5>{bucket === 'upcoming' ? 'Next 7 days' : bucket}<span>{items.length}</span></h5>{items.length ? items.map((task, index) => <div className="sample-task-entry" key={task.title + index}><strong>{task.title}</strong><small>{task.detail}</small><button type="button" onClick={() => onOpen(task.view)}>{task.view === 'health' ? 'Review record' : 'Open section'} →</button></div>) : <p>No tasks in this group.</p>}</article>; })}</div></section>
    <div className="sample-measurement-grid"><section className="sample-portal-card"><span>Average weight change · last 30 days</span><strong>{farm.weights.length > 1 ? '+3.00 kg' : 'Not enough measurements'}</strong></section><section className="sample-portal-card"><span>Milk recorded · last 7 days</span><strong>{farm.milk.reduce((total, record) => total + record.morning + record.evening, 0).toFixed(2)} L</strong></section></div>
  </div>;
}

function Table({ headings, rows }: { headings: string[]; rows: Array<Array<string | number>> }) {
  return <div className="sample-table-wrap"><table className="sample-record-table"><thead><tr>{headings.map(heading => <th scope="col" key={heading}>{heading}</th>)}</tr></thead><tbody>{rows.map((row, index) => <tr key={index}>{row.map((value, cellIndex) => <td key={cellIndex}>{value}</td>)}</tr>)}</tbody></table>{rows.length === 0 && <p className="sample-empty-state">No sample records yet.</p>}</div>;
}

function Herd({ farm, goat, search, setSearch, setGoat, onOpen }: { farm: typeof sampleFarms[number]; goat: typeof sampleFarms[number]['goats'][number]; search: string; setSearch: (value: string) => void; setGoat: (value: string) => void; onOpen: (view: View) => void }) {
  return <div className="sample-page-stack"><Metrics values={[[farm.goats.length, 'All animals'], [farm.goats.filter(animal => animal.status === 'active').length, 'Active'], [farm.goats.filter(animal => animal.status === 'pregnant').length, 'Pregnant'], [farm.goats.filter(animal => animal.status === 'for_sale').length, 'For sale']]}/><label className="sample-search-label">Search records<input type="search" placeholder="Name, ear tag, or breed" value={search} onChange={event => setSearch(event.target.value)}/></label><div className="sample-portal-card"><Table headings={['Animal', 'Breed', 'Sex', 'Status', 'Ear tag']} rows={farm.goats.map(animal => [animal.name, animal.breed, animal.sex, animal.status.replaceAll('_', ' '), animal.tag])}/></div><section className="sample-portal-card sample-goat-detail"><p className="sample-page-kicker">Animal profile · {goat.tag}</p><h4>{goat.name}</h4><p>{goat.breed} · {goat.sex} · {goat.status.replaceAll('_', ' ')}</p><div className="sample-inline-links"><button type="button" onClick={() => onOpen('health')}>View health records →</button><button type="button" onClick={() => onOpen('breeding')}>View breeding records →</button></div><label className="sample-animal-select">Explore animal<select value={goat.id} onChange={event => setGoat(event.target.value)}>{farm.goats.map(animal => <option value={animal.id} key={animal.id}>{animal.name} · {animal.tag}</option>)}</select></label></section></div>;
}
function Metrics({ values }: { values: Array<[number, string]> }) { return <section className="sample-metric-grid" aria-label="Section totals">{values.map(([value, label]) => <div key={label}><span>{label}</span><strong>{label.startsWith('Stock value') ? value.toFixed(2) : value}</strong></div>)}</section>; }
function Health({ farm }: { farm: typeof sampleFarms[number] }) { return <div className="sample-page-stack"><div className="sample-demo-action">Treatments, vaccinations, and follow-up dates stay connected to the animal.</div><div className="sample-portal-card"><Table headings={['Animal', 'Type', 'Treatment', 'Recorded', 'Next due']} rows={farm.health.map(record => [record.goat, record.type, record.treatment, record.recorded, record.next])}/></div></div>; }
function Breeding({ farm }: { farm: typeof sampleFarms[number] }) { return <div className="sample-page-stack"><Metrics values={[[farm.breeding.filter(record => record.status === 'planned').length, 'Planned'], [farm.breeding.filter(record => record.status === 'confirmed').length, 'Confirmed'], [farm.breeding.reduce((sum, record) => sum + record.kids, 0), 'Kids born · 30 days'], [farm.breeding.filter(record => record.expected === 'Coming up').length, 'Due this month']]}/><div className="sample-portal-card"><Table headings={['Dam', 'Sire', 'Status', 'Expected kidding', 'Kids']} rows={farm.breeding.map(record => [record.dam, record.sire, record.status, record.expected, record.kids])}/></div></div>; }
function Inventory({ farm }: { farm: typeof sampleFarms[number] }) { return <div className="sample-page-stack"><Metrics values={[[farm.inventory.length, 'Items'], [farm.inventory.filter(item => item.quantity <= item.minimum).length, 'Low stock'], [farm.inventory.reduce((sum, item) => sum + item.quantity * item.unitPrice, 0), 'Stock value · GHS'], [new Set(farm.inventory.map(item => item.category)).size, 'Categories']]}/><div className="sample-portal-card"><Table headings={['Item', 'Category', 'Quantity', 'Minimum', 'Unit price (GHS)']} rows={farm.inventory.map(item => [item.name, item.category, `${item.quantity} ${item.unit}`, `${item.minimum} ${item.unit}`, item.unitPrice.toFixed(2)])}/></div></div>; }
function Events({ farm }: { farm: typeof sampleFarms[number] }) { return <div className="sample-page-stack"><div className="sample-portal-card"><Table headings={['Event', 'Category', 'Date', 'Status']} rows={farm.events.map(event => [event.subject, event.category, event.date, event.completed ? 'Completed' : 'Open'])}/></div></div>; }
function Weights({ farm }: { farm: typeof sampleFarms[number] }) { return <div className="sample-page-stack"><div className="sample-portal-card"><Table headings={['Animal', 'Weight (kg)', 'Recorded']} rows={farm.weights.map(record => [record.goat, record.weight.toFixed(1), record.date])}/></div></div>; }
function Milk({ farm }: { farm: typeof sampleFarms[number] }) { return <div className="sample-page-stack"><div className="sample-portal-card"><Table headings={['Animal', 'Morning (L)', 'Evening (L)', 'Recorded']} rows={farm.milk.map(record => [record.goat, record.morning.toFixed(1), record.evening.toFixed(1), record.date])}/></div></div>; }
function Scan({ farm }: { farm: typeof sampleFarms[number] }) { return <section className="sample-portal-card sample-scan-preview"><p className="sample-page-kicker">Plan access · {farm.tier}</p><h4>Smart Scan</h4><p>{farm.tier === 'pro' ? 'In the tenant app, Pro users can upload or capture a goat photo to start a scan. This read-only preview does not run image analysis.' : 'Smart Scan is not included in this sample farm’s plan. In the app, the page explains plan access and links to plan comparison.'}</p><span>{farm.tier === 'pro' ? 'Camera and upload controls available in the app' : 'Compare plans to review Smart Scan availability'}</span></section>; }
