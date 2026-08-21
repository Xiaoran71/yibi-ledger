import { openDB, type DBSchema } from 'idb'
import { createDefaultCategories, expenseColors, incomeColors } from './defaults'
import type { AppSettings, BackupFile, Category, Transaction, TransactionType } from './types'

interface LedgerDB extends DBSchema {
  transactions: {
    key: string
    value: Transaction
    indexes: { 'by-date': string; 'by-occurred': number; 'by-category': string }
  }
  categories: {
    key: string
    value: Category
    indexes: { 'by-type': string }
  }
  settings: { key: string; value: AppSettings }
}

const dbPromise = openDB<LedgerDB>('yibi-ledger', 2, {
  upgrade(db) {
    if (!db.objectStoreNames.contains('transactions')) {
      const transactions = db.createObjectStore('transactions', { keyPath: 'id' })
      transactions.createIndex('by-date', 'localDate')
      transactions.createIndex('by-occurred', 'occurredAt')
      transactions.createIndex('by-category', 'categoryId')
    }
    if (!db.objectStoreNames.contains('categories')) {
      const categories = db.createObjectStore('categories', { keyPath: 'id' })
      categories.createIndex('by-type', 'type')
    }
    if (!db.objectStoreNames.contains('settings')) db.createObjectStore('settings', { keyPath: 'id' })
  },
})

let initializationPromise: Promise<void> | undefined

async function runInitialization() {
  const db = await dbPromise
  if ((await db.count('categories')) === 0) {
    const tx = db.transaction(['categories', 'settings'], 'readwrite')
    await Promise.all(createDefaultCategories().map((category) => tx.objectStore('categories').put(category)))
    await tx.objectStore('settings').put({ id: 'app', currency: 'CNY', schemaVersion: 2, weekStartsOn: 1 })
    await tx.done
  } else {
    const categories = await db.getAll('categories')
    const tx = db.transaction(['categories', 'settings'], 'readwrite')
    const counters: Record<string, number> = { expense: 0, income: 0 }
    for (const category of categories.sort((a, b) => a.sortOrder - b.sortOrder)) {
      const palette = category.type === 'expense' ? expenseColors : incomeColors
      await tx.objectStore('categories').put({ ...category, color: category.color || palette[counters[category.type]++ % palette.length] })
    }
    await tx.objectStore('settings').put({ id: 'app', currency: 'CNY', schemaVersion: 2, weekStartsOn: 1 })
    await tx.done
  }
}

export function initializeDB() {
  initializationPromise ??= runInitialization()
  return initializationPromise
}

export async function getAllData() {
  const db = await dbPromise
  const [transactions, categories, settings] = await Promise.all([
    db.getAll('transactions'),
    db.getAll('categories'),
    db.get('settings', 'app'),
  ])
  return {
    transactions: transactions.sort((a, b) => b.occurredAt - a.occurredAt),
    categories: categories.sort((a, b) => a.sortOrder - b.sortOrder),
    settings: settings ?? { id: 'app' as const, currency: 'CNY' as const, schemaVersion: 2, weekStartsOn: 1 as const },
  }
}

export async function putTransaction(item: Transaction) {
  return (await dbPromise).put('transactions', item)
}

export async function deleteTransactions(ids: string[]) {
  const tx = (await dbPromise).transaction('transactions', 'readwrite')
  await Promise.all(ids.map((id) => tx.store.delete(id)))
  await tx.done
}

export async function putCategory(item: Category) {
  return (await dbPromise).put('categories', item)
}

export async function deleteCategory(id: string) {
  return (await dbPromise).delete('categories', id)
}

export async function replaceBackup(backup: BackupFile) {
  const db = await dbPromise
  const tx = db.transaction(['transactions', 'categories', 'settings'], 'readwrite')
  await Promise.all([tx.objectStore('transactions').clear(), tx.objectStore('categories').clear(), tx.objectStore('settings').clear()])
  await Promise.all(backup.transactions.map((item) => tx.objectStore('transactions').put(item)))
  const counters: Record<TransactionType, number> = { expense: 0, income: 0 }
  await Promise.all(backup.categories.map((item) => { const palette=item.type==='expense'?expenseColors:incomeColors;return tx.objectStore('categories').put({...item,color:item.color||palette[counters[item.type]++%palette.length]}) }))
  await tx.objectStore('settings').put({ ...backup.settings, schemaVersion: 2 })
  await tx.done
}

export async function clearAndReset() {
  const db = await dbPromise
  const tx = db.transaction(['transactions', 'categories', 'settings'], 'readwrite')
  await Promise.all([tx.objectStore('transactions').clear(), tx.objectStore('categories').clear(), tx.objectStore('settings').clear()])
  await Promise.all(createDefaultCategories().map((item) => tx.objectStore('categories').put(item)))
  await tx.objectStore('settings').put({ id: 'app', currency: 'CNY', schemaVersion: 2, weekStartsOn: 1 })
  await tx.done
}

export function validateBackup(value: unknown): value is BackupFile {
  if (!value || typeof value !== 'object') return false
  const data = value as Partial<BackupFile>
  if (data.format !== 'yibi-ledger-backup' || (data.version !== 1 && data.version !== 2) || !Array.isArray(data.transactions) || !Array.isArray(data.categories)) return false
  const ids = new Set(data.categories.map((c) => c?.id))
  const categoriesValid = data.categories.every((c) => c && typeof c.id === 'string' && (c.type === 'expense' || c.type === 'income') && typeof c.name === 'string' && (!c.parentId || (c.parentId !== c.id && ids.has(c.parentId))))
  const transactionsValid = data.transactions.every((t) => t && typeof t.id === 'string' && Number.isSafeInteger(t.amountMinor) && t.amountMinor > 0 && ids.has(t.categoryId) && typeof t.occurredAt === 'number')
  return categoriesValid && transactionsValid && !!data.settings && data.settings.currency === 'CNY'
}
