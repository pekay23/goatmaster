'use client';
import { useEffect } from 'react';

export default function ScrollReveals() {
  useEffect(() => {
    if (!('IntersectionObserver' in window) || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    const observed = new WeakSet<Element>();
    const observer = new IntersectionObserver(entries => { for (const entry of entries) { if (!entry.isIntersecting) continue; entry.target.setAttribute('data-revealed', 'true'); observer.unobserve(entry.target); } }, { threshold: 0.08 });
    const observe = (target: Element) => { if (observed.has(target)) return; observed.add(target); observer.observe(target); };
    const collect = (root: ParentNode) => root.querySelectorAll('[data-reveal]').forEach(observe);
    collect(document);
    const mutations = new MutationObserver(records => { for (const record of records) for (const node of record.addedNodes) { if (!(node instanceof HTMLElement)) continue; if (node.matches('[data-reveal]')) observe(node); collect(node); } });
    mutations.observe(document.body, { childList: true, subtree: true });
    return () => { mutations.disconnect(); observer.disconnect(); };
  }, []);
  return null;
}
