import { useMemo, useState } from 'react'
import type { Category, Transaction, TransactionType } from './types'
import { formatAmountOnly, formatMoney, monthKey } from './utils'

const colors = ['#2f6f57','#6e9e89','#9cb9ab','#d1ddd6','#e8b78b','#cd8b6c','#8b99aa','#bbb3cc']

function RingChart({ data }: { data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let offset = 0
  return <div className="ring-wrap"><svg viewBox="0 0 42 42" className="ring-chart"><circle cx="21" cy="21" r="15.9" fill="none" stroke="#ececea" strokeWidth="5"/>{data.map((item, index) => { const size = total ? item.value / total * 100 : 0; const node = <circle key={item.name} cx="21" cy="21" r="15.9" fill="none" stroke={colors[index % colors.length]} strokeWidth="5" strokeDasharray={`${size} ${100-size}`} strokeDashoffset={-offset} pathLength="100"/>; offset += size; return node })}</svg><div><strong>{data.length}</strong><span>个分类</span></div></div>
}

function Composition({ title, data }: { title: string; data: Array<{ name: string; value: number }> }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  if (!total) return <section className="stats-card"><h3>{title}</h3><p className="muted">这个时期还没有数据</p></section>
  return <section className="stats-card"><h3>{title}</h3><div className="composition"><RingChart data={data}/><div className="legend">{data.slice(0, 5).map((item, i) => <div key={item.name}><i style={{background:colors[i % colors.length]}}/><span>{item.name}</span><strong>{Math.round(item.value/total*100)}%</strong></div>)}</div></div></section>
}

export function StatisticsPage({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  const now = new Date()
  const [mode, setMode] = useState<'month'|'year'>('month')
  const [month, setMonth] = useState(monthKey())
  const [year, setYear] = useState(now.getFullYear())
  const periodItems = useMemo(() => transactions.filter((item) => mode === 'month' ? item.localDate.startsWith(month) : item.localDate.startsWith(String(year))), [transactions, mode, month, year])
  const totals = (type: TransactionType) => periodItems.filter((i) => i.type === type).reduce((s, i) => s + i.amountMinor, 0)
  const expense = totals('expense'), income = totals('income')
  const composition = (type: TransactionType) => {
    const map = new Map<string, number>()
    periodItems.filter((i) => i.type === type).forEach((i) => map.set(i.categoryId, (map.get(i.categoryId) ?? 0) + i.amountMinor))
    return [...map].map(([id, value]) => ({ name: categories.find((c) => c.id === id)?.name ?? '已删除分类', value })).sort((a,b) => b.value-a.value)
  }
  const monthly = Array.from({ length: 12 }, (_, index) => {
    const key = `${year}-${String(index+1).padStart(2,'0')}`
    const rows = transactions.filter((i) => i.localDate.startsWith(key))
    return { month: index+1, expense: rows.filter((i)=>i.type==='expense').reduce((s,i)=>s+i.amountMinor,0), income: rows.filter((i)=>i.type==='income').reduce((s,i)=>s+i.amountMinor,0) }
  })
  const max = Math.max(...monthly.flatMap((item) => [item.expense,item.income]), 1)
  return <main className="page stats-page"><header className="simple-title"><p>回顾</p><h1>统计</h1></header>
    <div className="segmented stats-mode"><button className={mode==='month'?'active':''} onClick={()=>setMode('month')}>月度</button><button className={mode==='year'?'active':''} onClick={()=>setMode('year')}>年度</button></div>
    <div className="period-control">{mode === 'month' ? <input aria-label="选择月份" type="month" value={month} onChange={(e)=>setMonth(e.target.value)}/> : <div><button onClick={()=>setYear(year-1)}>‹</button><strong>{year}年</strong><button onClick={()=>setYear(year+1)}>›</button></div>}</div>
    <section className="stats-hero"><div><span>支出</span><strong>{formatMoney(expense)}</strong></div><div><span>收入</span><strong>{formatMoney(income)}</strong></div><div><span>结余</span><strong>{formatMoney(income-expense)}</strong></div></section>
    {mode === 'year' && <section className="stats-card"><h3>每月收支</h3><div className="bar-legend"><span><i className="expense"/>支出</span><span><i className="income"/>收入</span></div><div className="bars">{monthly.map((item) => <div className="bar-month" key={item.month}><div className="bar-pair"><i className="expense" style={{height:`${Math.max(item.expense/max*100,item.expense?3:0)}%`}} title={`支出 ${formatAmountOnly(item.expense)}`}/><i className="income" style={{height:`${Math.max(item.income/max*100,item.income?3:0)}%`}} title={`收入 ${formatAmountOnly(item.income)}`}/></div><span>{item.month}</span></div>)}</div></section>}
    <Composition title="支出分类" data={composition('expense')}/><Composition title="收入分类" data={composition('income')}/>
  </main>
}
