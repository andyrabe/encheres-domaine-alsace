// Icônes au trait, dessinées pour l'appli.
const base = { fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, viewBox: '0 0 24 24', 'aria-hidden': true };

export const IcAccueil = () => (<svg {...base}><path d="M4 11 12 4l8 7v9h-5v-6H9v6H4z" /></svg>);
export const IcLots = () => (<svg {...base}><path d="M3 12 12 3h8v8l-9 9z" /><circle cx="16" cy="8" r="1.6" /></svg>);
export const IcDomaine = () => (<svg {...base}><path d="m14 4 6 6M11 7l6 6M4 20l7-7M9.5 5.5l9 9-2.5 2.5-9-9z" /><path d="M3 21h8" /></svg>);
export const IcComptes = () => (<svg {...base}><path d="M5 3h11l3 3v15H5z" /><path d="M9 8h6M9 12h6M9 16h4" /></svg>);
export const IcReglages = () => (<svg {...base}><circle cx="12" cy="12" r="3" /><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1" /></svg>);
export const IcPlus = () => (<svg {...base}><path d="M12 5v14M5 12h14" /></svg>);
export const IcRetour = () => (<svg {...base}><path d="M15 18 9 12l6-6" /></svg>);
export const IcExport = () => (<svg {...base}><path d="M12 3v12M7 10l5 5 5-5M5 21h14" /></svg>);
export const IcImprimer = () => (<svg {...base}><path d="M7 9V3h10v6M7 17H5a2 2 0 0 1-2-2v-4a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v4a2 2 0 0 1-2 2h-2" /><rect x="7" y="14" width="10" height="7" /></svg>);
export const IcBoite = () => (<svg {...base}><path d="M3 8 12 3l9 5v8l-9 5-9-5z" /><path d="m3 8 9 5 9-5M12 13v8" /></svg>);
