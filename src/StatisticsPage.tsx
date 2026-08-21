import { useMemo, useState } from 'react'
import type { Category, Transaction, TransactionType } from './types'
import { Icon } from './Icons'
import { formatAmountOnly, formatMoney, monthKey } from './utils'

type ChartItem = { id: string; name: string; value: number; color: string }

function RingChart({ data, onSelect }: { data: ChartItem[]; onSelect?: (id:string)=>void }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  let offset = 0
  return <div className="ring-wrap"><svg viewBox="0 0 42 42" className="ring-chart"><circle cx="21" cy="21" r="15.9" fill="none" stroke="#ececea" strokeWidth="5"/>{data.map((item) => { const size = total ? item.value / total * 100 : 0; const node = <circle className={onSelect?'selectable':''} role={onSelect?'button':undefined} aria-label={onSelect?`查看${item.name}的二级分类`:undefined} onClick={()=>onSelect?.(item.id)} key={item.id} cx="21" cy="21" r="15.9" fill="none" stroke={item.color} strokeWidth="5" strokeDasharray={`${size} ${100-size}`} strokeDashoffset={-offset} pathLength="100"/>; offset += size; return node })}</svg><div><strong>{data.length}</strong><span>个分类</span></div></div>
}

function Composition({ title, type, items, categories }: { title: string; type: TransactionType; items: Transaction[]; categories: Category[] }) {
  const [legendOpen,setLegendOpen]=useState(false)
  const [selectedParent,setSelectedParent]=useState<string>()
  const [allSecondary,setAllSecondary]=useState(false)
  const categoryMap=new Map(categories.map((c)=>[c.id,c]))
  const fallback=type==='expense'?'#B8685A':'#2F6F57'
  const aggregate=(resolve:(item:Transaction)=>{id:string;name:string;color:string}|null) => {
    const map=new Map<string,ChartItem>()
    items.filter((item)=>item.type===type).forEach((item)=>{const target=resolve(item);if(!target)return;const current=map.get(target.id);map.set(target.id,{...target,value:(current?.value??0)+item.amountMinor})})
    return [...map.values()].sort((a,b)=>b.value-a.value)
  }
  const primary=aggregate((item)=>{const selected=categoryMap.get(item.categoryId);const root=selected?.parentId?categoryMap.get(selected.parentId):selected;return {id:root?.id??item.categoryId,name:root?.name??'已删除分类',color:root?.color??fallback}})
  const secondary=aggregate((item)=>{const selected=categoryMap.get(item.categoryId);if(selectedParent){const root=selected?.parentId?categoryMap.get(selected.parentId):selected;if(root?.id!==selectedParent)return null;return selected?.parentId?{id:selected.id,name:selected.name,color:selected.color}:{id:`${selectedParent}-direct`,name:'未细分',color:`${selected?.color??fallback}99`}}if(allSecondary)return selected?.parentId?{id:selected.id,name:selected.name,color:selected.color}:{id:`${item.categoryId}-direct`,name:`${selected?.name??'已删除分类'} · 未细分`,color:`${selected?.color??fallback}99`};return null})
  const data=selectedParent||allSecondary?secondary:primary
  const total=data.reduce((sum,item)=>sum+item.value,0)
  const canShowSecondary=categories.some((c)=>c.type===type&&c.parentId)
  const drill=(id:string)=>{if(!selectedParent&&!allSecondary&&categories.some((c)=>c.parentId===id)){setSelectedParent(id);setLegendOpen(true)}}
  const heading=selectedParent?`${categoryMap.get(selectedParent)?.name??''} · 二级分类`:allSecondary?'全部二级分类':title
  if (!total) return <section className="stats-card"><div className="stats-card-title"><h3>{heading}</h3></div><p className="muted">这个时期还没有数据</p></section>
  return <section className="stats-card"><div className="stats-card-title"><h3>{heading}</h3><button className={legendOpen?'legend-toggle open':'legend-toggle'} onClick={()=>setLegendOpen(!legendOpen)} aria-label={legendOpen?'隐藏分类标注':'显示分类标注'}><Icon name="plus" size={16}/></button></div>{canShowSecondary&&<div className="chart-view-actions">{(selectedParent||allSecondary)&&<button onClick={()=>{setSelectedParent(undefined);setAllSecondary(false)}}>一级分类</button>}<button className={allSecondary?'active':''} onClick={()=>{setSelectedParent(undefined);setAllSecondary(!allSecondary);setLegendOpen(true)}}>全部二级</button></div>}<div className={legendOpen?'composition':'composition legend-hidden'}><RingChart data={data} onSelect={!selectedParent&&!allSecondary?drill:undefined}/>{legendOpen&&<div className="legend">{data.map((item)=>{const canDrill=!selectedParent&&!allSecondary&&categories.some((c)=>c.parentId===item.id);return <button disabled={!canDrill} onClick={()=>canDrill&&drill(item.id)} key={item.id}><i style={{background:item.color}}/><span>{item.name}</span><strong>{Math.round(item.value/total*100)}%</strong></button>})}</div>}</div>{!selectedParent&&!allSecondary&&canShowSecondary&&<p className="chart-hint">点按有二级分类的扇区或名称可查看明细</p>}</section>
}

export function StatisticsPage({ transactions, categories }: { transactions: Transaction[]; categories: Category[] }) {
  const now = new Date()
  const [mode, setMode] = useState<'month'|'year'>('month')
  const [month, setMonth] = useState(monthKey())
  const [year, setYear] = useState(now.getFullYear())
  const periodItems = useMemo(() => transactions.filter((item) => mode === 'month' ? item.localDate.startsWith(month) : item.localDate.startsWith(String(year))), [transactions, mode, month, year])
  const totals = (type: TransactionType) => periodItems.filter((i) => i.type === type).reduce((s, i) => s + i.amountMinor, 0)
  const expense = totals('expense'), income = totals('income')
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
    <Composition title="支出分类" type="expense" items={periodItems} categories={categories}/><Composition title="收入分类" type="income" items={periodItems} categories={categories}/>
  </main>
}
