export type SampleGoat = {
  id: string;
  name: string;
  tag: string;
  breed: string;
  sex: 'Doe' | 'Buck';
  born: string;
  status: string;
};

export type SampleFarm = {
  id: string;
  name: string;
  tier: 'free' | 'basic' | 'pro';
  goats: SampleGoat[];
  health: Array<{ goat: string; type: string; treatment: string; recorded: string; next: string }>;
  breeding: Array<{ dam: string; sire: string; status: string; expected: string; kids: number }>;
  inventory: Array<{ name: string; category: string; quantity: number; minimum: number; unit: string; unitPrice: number }>;
  events: Array<{ subject: string; category: string; date: string; completed: boolean }>;
  weights: Array<{ goat: string; weight: number; date: string }>;
  milk: Array<{ goat: string; morning: number; evening: number; date: string }>;
};

const goatNames = ['Ama', 'Kofi', 'Akua', 'Kojo', 'Esi', 'Kwame', 'Abena', 'Yaw'];

function animals(slug: string, count: number): SampleGoat[] {
  return goatNames.slice(0, count).map((name, index) => ({
    id: `${slug}-${index}`,
    name,
    tag: `SAM-${String(index + 1).padStart(3, '0')}`,
    breed: index % 2 ? 'West African Dwarf' : 'Sahelian',
    sex: index % 2 ? 'Buck' : 'Doe',
    born: index === 0 ? 'Recent sample birth date' : 'Sample birth date',
    status: index === 0 ? 'pregnant' : index === 3 ? 'for_sale' : 'active',
  }));
}

/** Mirrors the clearly marked demo organizations seeded by scripts/seed-sample-data.js. */
export const sampleFarms: SampleFarm[] = [
  {
    id: 'sample-meadow', name: 'Sample Meadow Farm', tier: 'free', goats: animals('mea', 4),
    health: [
      { goat: 'Ama', type: 'Vaccination', treatment: 'Sample historical vaccination', recorded: 'Earlier record', next: 'Past due' },
      { goat: 'Ama', type: 'Vaccination', treatment: 'Sample vaccination follow-up', recorded: 'Recent record', next: 'Past due' },
      { goat: 'Akua', type: 'Deworming', treatment: 'Sample planned treatment', recorded: 'Recent record', next: 'Coming up' },
    ],
    breeding: [{ dam: 'Ama', sire: 'Kofi', status: 'confirmed', expected: 'Coming up', kids: 0 }],
    inventory: [
      { name: 'Sample mineral feed', category: 'Feed', quantity: 3, minimum: 5, unit: 'kg', unitPrice: 9 },
      { name: 'Sample bedding', category: 'Bedding', quantity: 25, minimum: 5, unit: 'bag', unitPrice: 12 },
    ],
    events: [
      { subject: 'Sample Herd check', category: 'Health', date: 'Today', completed: false },
      { subject: 'Sample Fence inspection', category: 'Maintenance', date: 'Overdue', completed: false },
      { subject: 'Sample Feed delivery', category: 'Inventory', date: 'In 3 days', completed: false },
      { subject: 'Sample Completed herd review', category: 'General', date: 'Completed', completed: true },
    ],
    weights: [{ goat: 'Ama', weight: 28, date: 'Earlier sample measurement' }, { goat: 'Ama', weight: 30, date: 'Recent sample measurement' }, { goat: 'Ama', weight: 31, date: 'Latest sample measurement' }],
    milk: [{ goat: 'Akua', morning: 1.2, evening: 0.8, date: 'Earlier sample yield' }, { goat: 'Akua', morning: 1.2, evening: 0.8, date: 'Recent sample yield' }, { goat: 'Akua', morning: 1.2, evening: 0.8, date: 'Latest sample yield' }],
  },
  {
    id: 'sample-ridge', name: 'Sample Ridge Farm', tier: 'basic', goats: animals('rid', 6),
    health: [{ goat: 'Ama', type: 'Vaccination', treatment: 'Sample historical vaccination', recorded: 'Earlier record', next: 'Past due' }, { goat: 'Ama', type: 'Vaccination', treatment: 'Sample vaccination follow-up', recorded: 'Recent record', next: 'Past due' }, { goat: 'Akua', type: 'Deworming', treatment: 'Sample planned treatment', recorded: 'Recent record', next: 'Coming up' }],
    breeding: [{ dam: 'Ama', sire: 'Kofi', status: 'confirmed', expected: 'Coming up', kids: 0 }],
    inventory: [{ name: 'Sample mineral feed', category: 'Feed', quantity: 3, minimum: 5, unit: 'kg', unitPrice: 9 }, { name: 'Sample bedding', category: 'Bedding', quantity: 25, minimum: 5, unit: 'bag', unitPrice: 12 }],
    events: [{ subject: 'Sample Herd check', category: 'Health', date: 'Today', completed: false }, { subject: 'Sample Fence inspection', category: 'Maintenance', date: 'Overdue', completed: false }, { subject: 'Sample Feed delivery', category: 'Inventory', date: 'In 3 days', completed: false }, { subject: 'Sample Completed herd review', category: 'General', date: 'Completed', completed: true }],
    weights: [{ goat: 'Ama', weight: 28, date: 'Earlier sample measurement' }, { goat: 'Ama', weight: 30, date: 'Recent sample measurement' }, { goat: 'Ama', weight: 31, date: 'Latest sample measurement' }],
    milk: [{ goat: 'Akua', morning: 1.2, evening: 0.8, date: 'Earlier sample yield' }, { goat: 'Akua', morning: 1.2, evening: 0.8, date: 'Recent sample yield' }, { goat: 'Akua', morning: 1.2, evening: 0.8, date: 'Latest sample yield' }],
  },
  {
    id: 'sample-river', name: 'Sample River Farm', tier: 'pro', goats: animals('riv', 8),
    health: [{ goat: 'Ama', type: 'Vaccination', treatment: 'Sample historical vaccination', recorded: 'Earlier record', next: 'Past due' }, { goat: 'Ama', type: 'Vaccination', treatment: 'Sample vaccination follow-up', recorded: 'Recent record', next: 'Past due' }, { goat: 'Akua', type: 'Deworming', treatment: 'Sample planned treatment', recorded: 'Recent record', next: 'Coming up' }],
    breeding: [{ dam: 'Ama', sire: 'Kofi', status: 'confirmed', expected: 'Coming up', kids: 0 }],
    inventory: [{ name: 'Sample mineral feed', category: 'Feed', quantity: 3, minimum: 5, unit: 'kg', unitPrice: 9 }, { name: 'Sample bedding', category: 'Bedding', quantity: 25, minimum: 5, unit: 'bag', unitPrice: 12 }],
    events: [{ subject: 'Sample Herd check', category: 'Health', date: 'Today', completed: false }, { subject: 'Sample Fence inspection', category: 'Maintenance', date: 'Overdue', completed: false }, { subject: 'Sample Feed delivery', category: 'Inventory', date: 'In 3 days', completed: false }, { subject: 'Sample Completed herd review', category: 'General', date: 'Completed', completed: true }],
    weights: [{ goat: 'Ama', weight: 28, date: 'Earlier sample measurement' }, { goat: 'Ama', weight: 30, date: 'Recent sample measurement' }, { goat: 'Ama', weight: 31, date: 'Latest sample measurement' }],
    milk: [{ goat: 'Akua', morning: 1.2, evening: 0.8, date: 'Earlier sample yield' }, { goat: 'Akua', morning: 1.2, evening: 0.8, date: 'Recent sample yield' }, { goat: 'Akua', morning: 1.2, evening: 0.8, date: 'Latest sample yield' }],
  },
];
