'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';

export interface ConflictPair {
  id: string;
  local: any;
  remote: any;
  fields: string[];
}

export function ConflictMergeModal({
  conflict,
  onResolve,
  onClose,
}: {
  conflict: ConflictPair;
  onResolve: (resolved: any) => void;
  onClose: () => void;
}) {
  const [choices, setChoices] = useState<Record<string, 'local' | 'remote'>>(() => {
    const init: Record<string, 'local' | 'remote'> = {};
    for (const f of conflict.fields) init[f] = 'remote';
    return init;
  });

  const resolved = { ...conflict.remote, id: conflict.id };
  for (const f of conflict.fields) {
    if (choices[f] === 'local') resolved[f] = conflict.local[f];
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-[80vh] overflow-auto">
        <h2 className="text-lg font-semibold mb-4">Resolve Sync Conflict</h2>
        <div className="space-y-3">
          {conflict.fields.map((field) => (
            <div key={field} className="border rounded p-3">
              <div className="font-medium mb-2">{field}</div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  className={`p-2 border rounded text-left ${choices[field] === 'local' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setChoices((c) => ({ ...c, [field]: 'local' }))}
                >
                  <div className="text-xs text-gray-500">Local</div>
                  <div>{String(conflict.local?.[field] ?? '')}</div>
                </button>
                <button
                  className={`p-2 border rounded text-left ${choices[field] === 'remote' ? 'border-blue-500 bg-blue-50' : ''}`}
                  onClick={() => setChoices((c) => ({ ...c, [field]: 'remote' }))}
                >
                  <div className="text-xs text-gray-500">Remote</div>
                  <div>{String(conflict.remote?.[field] ?? '')}</div>
                </button>
              </div>
            </div>
          ))}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onResolve(resolved)}>Apply Resolution</Button>
        </div>
      </div>
    </div>
  );
}
