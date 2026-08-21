export type TransactionType = 'expense' | 'income'

export interface Transaction {
  id: string
  amountMinor: number
  type: TransactionType
  categoryId: string
  occurredAt: number
  localDate: string
  timezoneOffset: number
  note: string
  createdAt: number
  updatedAt: number
}

export interface Category {
  id: string
  type: TransactionType
  name: string
  icon: string
  color: string
  parentId?: string
  sortOrder: number
  archived: boolean
  createdAt: number
  updatedAt: number
}

export interface AppSettings {
  id: 'app'
  currency: 'CNY'
  schemaVersion: number
  weekStartsOn: 1
}

export interface BackupFile {
  format: 'yibi-ledger-backup'
  version: 1 | 2
  exportedAt: string
  transactions: Transaction[]
  categories: Category[]
  settings: AppSettings
}

export interface EntryDraft {
  id?: string
  amountMinor: number
  amountText: string
  type?: TransactionType
  categoryId?: string
  occurredAt: number
  note: string
}

export interface Filters {
  search: string
  type: 'all' | TransactionType
  categoryId: string
  dateFrom: string
  dateTo: string
}
