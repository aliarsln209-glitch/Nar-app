const P = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
export const IHistory = () => <svg {...P}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>
export const ISaved = ({ fill }: { fill?: boolean }) => <svg {...P} fill={fill ? 'currentColor' : 'none'}><path d="M6 3h12v18l-6-4-6 4z" /></svg>
export const IScan = () => <svg {...P} width={30} height={30}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 9v6M10 9v6M13 9v6M16 9v6" /></svg>
export const ICompare = () => <svg {...P}><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" /></svg>
export const IUser = () => <svg {...P}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
export const ISearch = () => <svg {...P}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
export const IBack = () => <svg {...P}><path d="m15 18-6-6 6-6" /></svg>
export const IBox = () => <svg {...P}><path d="M21 8 12 3 3 8v8l9 5 9-5z M3 8l9 5 9-5M12 13v8" /></svg>
