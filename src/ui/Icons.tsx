const P = { width: 24, height: 24, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, 'aria-hidden': true }
export const IHistory = () => <svg {...P}><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5M12 7v5l3 2" /></svg>
export const ISaved = ({ fill }: { fill?: boolean }) => <svg {...P} fill={fill ? 'currentColor' : 'none'}><path d="M6 3h12v18l-6-4-6 4z" /></svg>
export const IScan = () => <svg {...P} width={30} height={30}><path d="M4 8V5a1 1 0 0 1 1-1h3M16 4h3a1 1 0 0 1 1 1v3M20 16v3a1 1 0 0 1-1 1h-3M8 20H5a1 1 0 0 1-1-1v-3M7 9v6M10 9v6M13 9v6M16 9v6" /></svg>
export const ICompare = () => <svg {...P}><path d="M7 4v16M3 8l4-4 4 4M17 20V4M13 16l4 4 4-4" /></svg>
export const IUser = () => <svg {...P}><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></svg>
export const ISearch = () => <svg {...P}><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
export const IBack = () => <svg {...P}><path d="m15 18-6-6 6-6" /></svg>
export const IBox = () => <svg {...P}><path d="M21 8 12 3 3 8v8l9 5 9-5z M3 8l9 5 9-5M12 13v8" /></svg>
export const ICheckCircle = () => <svg {...P}><circle cx="12" cy="12" r="9" /><path d="m8 12.5 3 3 5-6" /></svg>
export const ITriangle = () => <svg {...P}><path d="M12 3 2.5 20h19z" /><path d="M12 10v4M12 17.2v.1" /></svg>
export const IQuestion = () => <svg {...P}><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.1" /></svg>
export const IShield = () => <svg {...P}><path d="M12 3 4.5 6v5.5c0 4.5 3 8 7.5 9.5 4.5-1.500 7.5-5 7.500-9.500V6z" /><path d="M12 8v4.500M12 15.500v.1" /></svg>
export const IInfo = () => <svg {...P} width={18} height={18}><circle cx="12" cy="12" r="9" /><path d="M12 11v5M12 8v.1" /></svg>
export const ISpark = () => <svg {...P} width={22} height={22}><path d="M12 3c.6 4.200 2.800 6.400 7 7-4.200.6-6.400 2.800-7 7-.6-4.200-2.800-6.400-7-7 4.200-.6 6.400-2.800 7-7zM19 16c.2 1.400.9 2.100 2 2.300-1.100.2-1.800.9-2 2.200-.2-1.300-.9-2-2-2.200 1.100-.2 1.800-.9 2-2.300z" /></svg>
export const ITorch = () => <svg {...P}><path d="M8 3h8l-1.500 6h-5zM10 9h4v10a2 2 0 0 1-4 0zM12 12v2" /></svg>
export const ICamera = () => <svg {...P}><path d="M4 8h3l1.500-2h7L17 8h3v11H4z" /><circle cx="12" cy="13" r="3.500" /></svg>
export const IKeyboard = () => <svg {...P}><rect x="3" y="6" width="18" height="12" rx="2" /><path d="M7 10h.1M10 10h.1M13 10h.1M16 10h.1M8 14h8" /></svg>
export const IPlus = () => <svg {...P}><path d="M12 5v14M5 12h14" /></svg>
