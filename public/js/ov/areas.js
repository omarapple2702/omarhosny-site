const ic = (d) => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
// c = which signature colour leads that place: o (orange) or p (pink).
export const AREAS = [
  { id: 'kid', label: 'Curious kid', title: 'Curious kid', c: 'o', icon: ic('<circle cx="12" cy="12" r="9"/><path d="M9.6 9.4a2.5 2.5 0 1 1 3.6 2.3c-.8.4-1.2 1-1.2 1.8"/><path d="M12 17.2v.1"/>') },
  { id: 'code', label: 'First lines', title: 'First lines', c: 'p', icon: ic('<path d="M8 8l-4 4 4 4M16 8l4 4-4 4M13.5 6l-3 12"/>') },
  { id: 'build', label: 'Bigger things', title: 'Bigger things', c: 'o', icon: ic('<rect x="4" y="15" width="16" height="5" rx="1.5"/><rect x="7" y="9" width="10" height="5" rx="1.5"/><rect x="10" y="3.5" width="4" height="4.5" rx="1"/>') },
  { id: 'day', label: 'Ideal day', title: 'An ideal day', c: 'p', icon: ic('<path d="M3 17h18M7 17a5 5 0 0 1 10 0M12 4.5v2.5M5.5 9l1.8 1.8M18.5 9l-1.8 1.8M6 21h12"/>') },
  { id: 'fun', label: 'The fun guy', title: 'The fun guy', c: 'o', icon: ic('<circle cx="12" cy="12" r="9"/><path d="M8.5 14.3c2 2.6 5 2.6 7 0M9 9.6v.1M15 9.6v.1"/>') },
  { id: 'lens', label: 'Through my lens', title: 'Through my lens', c: 'p', icon: ic('<path d="M4 8h3l1.8-2.6h6.4L17 8h3v11H4z"/><circle cx="12" cy="13.5" r="3.6"/>') },
  { id: 'sound', label: 'Soundtrack', title: 'The soundtrack', c: 'o', icon: ic('<path d="M4 10v4M8 6v12M12 3v18M16 8v8M20 11v2"/>') },
  { id: 'travel', label: 'Somewhere new', title: 'Somewhere new', c: 'p', icon: ic('<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c3.2 3 3.2 15 0 18M12 3c-3.2 3-3.2 15 0 18"/>') },
  { id: 'next', label: 'What’s next', title: 'What’s next', c: 'o', icon: ic('<path d="M5 19L19 5M10 5h9v9"/>') },
];
