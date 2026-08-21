import { useMemo, useState } from 'react'
import type { Category, Transaction } from './types'
import { Icon } from './Icons'
import { TransactionList } from './components'
import { formatAmountOnly, localDateKey, monthKey } from './utils'

export function CalendarPage({ transactions, categories, onOpen }: { transactions: Transaction[]; categories: Category[]; onOpen: (item: Transaction) => void }) {
  const today = new Date()
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1))
  const [selected, setSelected] = useState(localDateKey())
  const year = cursor.getFullYear(), month = cursor.getMonth()
  const monthPrefix = monthKey(cursor)
  const firstDay = new Date(year, month, 1).getDay()
  const offset = firstDay === 0 ? 6 : firstDay - 1
  const days = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: Math.ceil((offset + days) / 7) * 7 }, (_, index) => index - offset + 1)
  const dailyTotals = useMemo(() => transactions.reduce<Record<string, number>>((map, item) => { if (item.type === 'expense') map[item.localDate] = (map[item.localDate] ?? 0) + item.amountMinor; return map }, {}), [transactions])
  const selectedItems = transactions.filter((item) => item.localDate === selected)
  const move = (delta: number) => { const next = new Date(year, month + delta, 1); setCursor(next); setSelected(monthKey(next) + '-01') }
  return <main className="page calendar-page">
    <header className="calendar-title"><div><p>日历</p><h1>{year}年{month + 1}月</h1></div><div><button className="icon-button" onClick={() => move(-1)}><Icon name="back"/></button><button className="icon-button" onClick={() => move(1)}><Icon name="chevron"/></button></div></header>
    <section className="calendar-card"><div className="weekdays">{['一','二','三','四','五','六','日'].map((d) => <span key={d}>{d}</span>)}</div><div className="calendar-grid">
      {cells.map((day, index) => {
        const valid = day > 0 && day <= days
        const key = valid ? `${monthPrefix}-${String(day).padStart(2, '0')}` : ''
        return <button key={index} disabled={!valid} className={`${key === selected ? 'selected' : ''} ${key === localDateKey() ? 'today' : ''}`} onClick={() => setSelected(key)}>{valid && <><span>{day}</span>{dailyTotals[key] > 0 && <small>{dailyTotals[key] >= 100000 ? `${Math.round(dailyTotals[key]/100000)}k` : formatAmountOnly(dailyTotals[key]).replace('.00','')}</small>}</>}</button>
      })}
    </div></section>
    <div className="section-title"><h2>{selected === localDateKey() ? '今天' : new Date(`${selected}T12:00`).toLocaleDateString('zh-CN', { month: 'long', day: 'numeric' })}</h2><span>{selectedItems.length} 笔</span></div>
    <TransactionList items={selectedItems} categories={categories} onOpen={onOpen}/>
  </main>
}
