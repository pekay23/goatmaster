'use client'
import { useState } from 'react'

const tiers = [
  { name: 'Free', price: 0, features: ['Up to 10 goats', 'Basic tracking'] },
  { name: 'Pro', price: 19, features: ['Unlimited goats', 'Health records', 'Breeding'] },
  { name: 'Enterprise', price: 49, features: ['Multi-farm', 'Analytics', 'Support'] },
]

export default function TierSelector() {
  const [selected, setSelected] = useState('Pro')
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {tiers.map((t) => (
        <button key={t.name} onClick={() => setSelected(t.name)}
          className={`p-6 rounded-lg border ${selected === t.name ? 'border-[#2D7D46] bg-[#F5F0E1]' : 'border-gray-200'}`}>
          <h3 className="font-bold text-xl">{t.name}</h3>
          <p className="text-3xl font-bold mt-2">${t.price}<span className="text-sm">/mo</span></p>
          <ul className="mt-4 text-sm">{t.features.map(f => <li key={f}>{f}</li>)}</ul>
        </button>
      ))}
    </div>
  )
}
