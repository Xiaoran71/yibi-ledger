import type { ReactNode } from 'react'

const paths: Record<string, ReactNode> = {
  home: <><path d="M3 10.8 12 3l9 7.8"/><path d="M5.5 9.5V21h13V9.5M9 21v-7h6v7"/></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4m8-4v4M3 10h18"/></>,
  chart: <><path d="M4 20V10m6 10V4m6 16v-7m5 7H2"/></>,
  settings: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2.83 2.83-.06-.06A1.7 1.7 0 0 0 15 19.4a1.7 1.7 0 0 0-1 .6 1.7 1.7 0 0 0-.4 1v.1h-4v-.1a1.7 1.7 0 0 0-1.1-1.6 1.7 1.7 0 0 0-1.88.34l-.06.06-2.83-2.83.06-.06A1.7 1.7 0 0 0 4.1 15a1.7 1.7 0 0 0-.6-1 1.7 1.7 0 0 0-1-.4h-.1v-4h.1A1.7 1.7 0 0 0 4.1 8.5a1.7 1.7 0 0 0-.34-1.88l-.06-.06 2.83-2.83.06.06A1.7 1.7 0 0 0 8.5 4.1a1.7 1.7 0 0 0 1-.6 1.7 1.7 0 0 0 .4-1v-.1h4v.1A1.7 1.7 0 0 0 15 4.1a1.7 1.7 0 0 0 1.88-.34l.06-.06 2.83 2.83-.06.06A1.7 1.7 0 0 0 19.4 8.5c.13.38.34.72.6 1 .28.27.63.4 1 .4h.1v4H21a1.7 1.7 0 0 0-1.6 1.1Z"/></>,
  plus: <path d="M12 5v14M5 12h14"/>,
  back: <path d="m15 18-6-6 6-6"/>,
  chevron: <path d="m9 18 6-6-6-6"/>,
  search: <><circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/></>,
  close: <path d="m6 6 12 12M18 6 6 18"/>,
  check: <path d="m5 12 4 4L19 6"/>,
  fork: <><path d="M7 3v8m-3-8v5a3 3 0 0 0 6 0V3M7 11v10M16 3v18m0-18c3 2 4 5 4 8h-4"/></>,
  bus: <><rect x="4" y="3" width="16" height="17" rx="3"/><path d="M4 12h16M8 16h.01M16 16h.01M7 20v2m10-2v2"/></>,
  bag: <><path d="M5 8h14l1 13H4L5 8Z"/><path d="M9 9V6a3 3 0 0 1 6 0v3"/></>,
  house: <><path d="m3 11 9-8 9 8"/><path d="M5 10v11h14V10M9 21v-7h6v7"/></>,
  sparkles: <><path d="m12 3 1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5L12 3Z"/><path d="m19 15 .7 2.3L22 18l-2.3.7L19 21l-.7-2.3L16 18l2.3-.7L19 15ZM5 3l.7 2.3L8 6l-2.3.7L5 9l-.7-2.3L2 6l2.3-.7L5 3Z"/></>,
  cross: <path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6V3Z"/>,
  book: <><path d="M4 4h5a3 3 0 0 1 3 3v14a3 3 0 0 0-3-3H4V4Z"/><path d="M20 4h-5a3 3 0 0 0-3 3v14a3 3 0 0 1 3-3h5V4Z"/></>,
  ellipsis: <><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="12" cy="12" r="1" fill="currentColor"/><circle cx="19" cy="12" r="1" fill="currentColor"/></>,
  briefcase: <><rect x="3" y="7" width="18" height="13" rx="2"/><path d="M8 7V4h8v3m-13 5h18M10 12v2h4v-2"/></>,
  gift: <><rect x="3" y="9" width="18" height="12" rx="1"/><path d="M12 9v12M2 5h20v4H2V5Zm10 0c-1-4-6-4-6-1 0 2 3 1 6 1Zm0 0c1-4 6-4 6-1 0 2-3 1-6 1Z"/></>,
  laptop: <><rect x="4" y="4" width="16" height="12" rx="2"/><path d="M2 20h20M8 20l1-4h6l1 4"/></>,
  heart: <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z"/>,
}

paths.chart = <><path d="M4 20V10m6 10V4m6 16v-7m5 7H2"/></>

export function Icon({ name, size = 24 }: { name: string; size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name] ?? paths.ellipsis}</svg>
}
