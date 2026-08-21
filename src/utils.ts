import type { Transaction } from './types'

export const formatMoney = (minor: number, signed = false) => {
  const value = Math.abs(minor) / 100
  const text = value.toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  const prefix = minor < 0 ? '−' : signed && minor > 0 ? '+' : ''
  return `${prefix}¥${text}`
}

export const formatAmountOnly = (minor: number) =>
  (Math.abs(minor) / 100).toLocaleString('zh-CN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

export function parseAmount(value: string) {
  const normalized = value.replace(',', '.').replace(/[^\d.]/g, '')
  if (!normalized || normalized === '.') return 0
  const [integer = '0', decimal = ''] = normalized.split('.')
  return Number(integer) * 100 + Number((decimal + '00').slice(0, 2))
}

export function sanitizeAmountInput(value: string) {
  let next = value.replace(',', '.').replace(/[^\d.]/g, '')
  const dot = next.indexOf('.')
  if (dot >= 0) next = next.slice(0, dot + 1) + next.slice(dot + 1).replace(/\./g, '').slice(0, 2)
  next = next.replace(/^0+(?=\d)/, '')
  return next.slice(0, 12)
}

export function localDateKey(timestamp = Date.now()) {
  const date = new Date(timestamp)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export function toDateTimeLocal(timestamp: number) {
  const date = new Date(timestamp)
  const p = (n: number) => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${p(date.getMonth() + 1)}-${p(date.getDate())}T${p(date.getHours())}:${p(date.getMinutes())}`
}

export const monthKey = (date = new Date()) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

export function dateLabel(key: string) {
  const today = localDateKey()
  const yesterday = localDateKey(Date.now() - 86400000)
  if (key === today) return '今天'
  if (key === yesterday) return '昨天'
  const [, month, day] = key.split('-')
  return `${Number(month)}月${Number(day)}日`
}

export const timeLabel = (timestamp: number) => new Date(timestamp).toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit', hour12: false })

export function groupByDate(items: Transaction[]) {
  return items.reduce<Record<string, Transaction[]>>((groups, item) => {
    ;(groups[item.localDate] ??= []).push(item)
    return groups
  }, {})
}

export function downloadFile(name: string, content: BlobPart, type: string) {
  const url = URL.createObjectURL(new Blob([content], { type }))
  const link = document.createElement('a')
  link.href = url
  link.download = name
  document.body.appendChild(link)
  link.click()
  link.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}

export function csvCell(value: string | number) {
  const text = String(value)
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
}
