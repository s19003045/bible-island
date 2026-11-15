const paths = {
  book: '<path d="M3 4.5c3-1 6-.5 9 1.5 3-2 6-2.5 9-1.5v15c-3-1-6-.5-9 1.5-3-2-6-2.5-9-1.5z"/><path d="M12 6v15M6 9h3m6 0h3"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-2.5 5.5L8 16l2.5-5.5Z"/>',
  search: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4.5 4.5"/>',
  arrow: '<path d="M4 12h15m-5-5 5 5-5 5"/>', chevron: '<path d="m9 5 7 7-7 7"/>',
  close: '<path d="m6 6 12 12M18 6 6 18"/>', menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
  layers: '<path d="m12 3 10 6-10 6L2 9Zm-9 11 9 5 9-5M3 18l9 5 9-5"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l1.5 1.5m11 11L19 19M5 19l1.5-1.5m11-11L19 5"/>',
  moon: '<path d="M20 14a8 8 0 0 1-10-10 8.5 8.5 0 1 0 10 10Z"/>',
  plus: '<path d="M12 5v14M5 12h14"/>', minus: '<path d="M5 12h14"/>',
  home: '<path d="m3 10 9-7 9 7v11h-6v-7H9v7H3Z"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>',
  pause: '<path d="M8 5v14M16 5v14"/>', play: '<path d="m8 4 12 8-12 8Z"/>',
  link: '<path d="m9 15 6-6M8 17l-1 1a4 4 0 0 1-6-6l5-5a4 4 0 0 1 6 0m0 10a4 4 0 0 0 6 0l5-5a4 4 0 0 0-6-6l-1 1"/>',
  bookmark: '<path d="M6 3h12v19l-6-4-6 4Z"/>',
  check: '<path d="m5 12 4 4L20 5"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  external: '<path d="M14 3h7v7m0-7L11 13M10 5H4v15h15v-6"/>',
  route: '<circle cx="5" cy="5" r="2"/><circle cx="19" cy="19" r="2"/><path d="M5 7v8a4 4 0 0 0 8 0V9a4 4 0 0 1 8 0v8"/>',
  flame: '<path d="M12 2s2 5-1 8c-2-2-2-4-2-4s-6 7-5 11c1 6 15 7 16-1 0-4-4-8-4-8s0 4-2 5c1-6-2-11-2-11Z"/>',
  drop: '<path d="M12 2s-7 9-7 13a7 7 0 0 0 14 0c0-4-7-13-7-13Z"/>',
  archive: '<path d="M3 8h18v12H3Zm-1-4h20v4H2Zm7 8h6"/>',
  wind: '<path d="M3 8h12a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M4 17h5a2 2 0 1 1-2 2"/>',
  columns: '<path d="m2 6 10-4 10 4ZM3 21h18M5 9v9m7-9v9m7-9v9"/>',
  hammer: '<path d="m14 4 6 6-3 3-6-6Zm-1 5L3 19l2 2L15 11"/>',
  waves: '<path d="M2 7q3-4 6 0t6 0 6 0M2 12q3-4 6 0t6 0 6 0M2 17q3-4 6 0t6 0 6 0"/>',
  mountain: '<path d="m1 21 8-16 6 10 3-6 5 12ZM6 11l3 2 3-2"/>',
  ship: '<path d="M12 2v14m1-13 8 11h-8ZM3 16h18l-4 5H7Z"/>',
  footprints: '<ellipse cx="8" cy="8" rx="3" ry="5" transform="rotate(-20 8 8)"/><ellipse cx="17" cy="15" rx="3" ry="5" transform="rotate(20 17 15)"/>',
};

export function icon(name, size = 20) {
  return `<svg width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.compass}</svg>`;
}
