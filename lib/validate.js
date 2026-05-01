// Lightweight input validation helpers

export function requireFields(obj, fields) {
  for (const f of fields) {
    if (obj[f] === undefined || obj[f] === null || String(obj[f]).trim() === '') {
      return `"${f}" is required`;
    }
  }
  return null;
}

export function sanitiseString(val, maxLen = 200) {
  if (typeof val !== 'string') return '';
  return val.trim().slice(0, maxLen);
}

export function sanitiseDate(val) {
  if (!val || val === '') return null;
  const d = new Date(val);
  return isNaN(d.getTime()) ? null : val;
}

export function isPositiveInt(val) {
  const n = parseInt(val, 10);
  return Number.isInteger(n) && n > 0;
}
