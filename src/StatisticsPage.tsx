import { useMemo, useState } from 'react'
import type { Category, Transaction, TransactionType } from './types'
import { Icon } from './Icons'
import { formatAmountOnly, formatMoney, monthKey } from './utils'

type ChartItem = { id: string; name: string; value: number; color: string }

function RingChart({ data, onSelect, callouts }: { data: ChartItem[]; onSelect?: (id:string)=>void; callouts: boolean }) {
  const total = data.reduce((sum, item) => sum + item.value, 0)
  const segments = data.map((item) => ({ ...item, size: total ? item.value / total * 100 : 0 })).map((item, index, rows) => ({ ...item, offset: rows.slice(0,index).reduce((sum,row)=>sum+row.size,0) }))
  if (callouts) {
    const positioned = segments.map((item) => { const angle=(item.offset+item.size/2)/100*Math.PI*2-Math.PI/2;return {...item,right:Math.cos(angle)>=0,startX:60+Math.cos(angle)*30,startY:50+Math.sin(angle)*30,rawY:50+Math.sin(angle)*38} })
    for (const right of [false,true]) {
      const side=positioned.filter((item)=>item.right===right).sort((a,b)=>a.rawY-b.rawY)
      const gap=Math.min(11,76/Math.max(side.length-1,1));let previous=12-gap
      side.forEach((item)=>{item.rawY=Math.max(12,Math.min(88,item.rawY),previous+gap);previous=item.rawY})
      const overflow=(side.at(-1)?.rawY??0)-88;if(overflow>0)side.forEach((item)=>item.rawY-=overflow)
    }
    return <div className="ring-wrap callouts"><svg viewBox="0 0 120 100" className="ring-chart callout-chart"><circle cx="60" cy="50" r="25" fill="none" stroke="#ececea" strokeWidth="8"/><g transform="rotate(-90 60 50)">{segments.map((item)=><circle className={onSelect?'selectable':''} role={onSelect?'button':undefined} aria-label={onSelect?`查看${item.name}的二级分类`:undefined} onClick={()=>onSelect?.(item.id)} key={item.id} cx="60" cy="50" r="25" fill="none" stroke={item.color} strokeWidth="8" strokeDasharray={`${item.size} ${100-item.size}`} strokeDashoffset={-item.offset} pathLength="100"/>)}</g>{positioned.map((item)=><g className="chart-callout" key={`${item.id}-label`}><polyline points={`${item.startX},${item.startY} ${item.right?91:29},${item.rawY} ${item.right?94:26},${item.rawY}`} stroke={item.color}/><circle cx={item.startX} cy={item.startY} r="1" fill={item.color}/><text x={item.right?97:23} y={item.rawY+1.8} textAnchor={item.right?'start':'end'}>{item.name}</text></g>)}</svg><div><strong>{data.length}</strong><span>个分类</span></div></div>
  }
  let offset = 0
  return <div className="ring-wrap"><svg viewBox="0 0 42 42" className="ring-chart"><circle cx="21" cy="21" r="15.9" fill="none" stroke="#ececea" strokeWidth="5"/>{data.map((item) => { const size = total ? item.value / total * 100 : 0; const node = <circle className={onSelect?'selectable':''} role={onSelect?'button':undefined} aria-label={onSelect?`查看${item.name}的二级分类`:undefined} onClick={()=>onSelect?.(item.id)} key={item.id} cx="21" cy="21" r="15.9" fill="none" stroke={item.color} strokeWidth="5" strokeDasharray={`${size} ${100-size}`} strokeDashoffset={-offset} pathLength="100"/>; offset += size; return node })}</svg><div><strong>{data.length}</strong><span>个分类</span></div></div>
}

function Composition({ title, type, items, categories }: { title: string; type: TransactionType; items: Transaction[]; categories: Category[] }) {
  const [calloutsOpen,setCalloutsOpen]=useState(false)
  const [selectedParent,setSelectedParent]=useState<string>()
  const categoryMap=new Map(categories.map((c)=>[c.id,c]))
  const fallback=type==='expense'?'#B8685A':'#2F6F57'
  const aggregate=(resolve:(item:Transaction)=>{id:string;name:string;color:string}|null) => {
    const map=new Map<string,ChartItem>()
    items.filter((item)=>item.type===type).forEach((item)=>{const target=resolve(item);if(!target)return;const current=map.get(target.id);map.set(target.id,{...target,value:(current?.value??0)+item.amountMinor})})
    return [...map.values()].sort((a,b)=>b.value-a.value)
  }
  const primary=aggregate((item)=>{const selected=categoryMap.get(item.categoryId);const root=selected?.parentId?categoryMap.get(selected.parentId):selected;return {id:root?.id??item.categoryId,name:root?.name??'已删除分类',color:root?.color??fallback}})
  const secondary=aggregate((item)=>{const selected=categoryMap.get(item.categoryId);if(!selectedParent)return null;const root=selected?.parentId?categoryMap.get(selected.parentId):selected;if(root?.id!==selectedParent)return null;return selected?.parentId?{id:selected.id,name:selected.name,color:selected.color}:{id:`${selectedParent}-direct`,name:'未细分',color:`${selected?.color??fallback}99`}})
  const data=selectedParent?secondary:primary
  const total=data.reduce((sum,item)=>sum+item.value,0)
  const canShowSecondary=categories.some((c)=>c.type===type&&c.parentId)
  const drill=(id:string)=>{if(!selectedParent&&categories.some((c)=>c.parentId===id))setSelectedParent(id)}
  const heading=selectedParent?`${categoryMap.get(selectedParent)?.name??''} · 二级分类`:title
  if (!total) return <section className="stats-card"><div className="stats-card-title"><h3>{heading}</h3></div><p className="muted">这个时期还没有数据</p></section>
  return <section className="stats-card"><div className="stats-card-title"><h3>{heading}</h3><button className={calloutsOpen?'legend-toggle open':'legend-toggle'} onClick={()=>setCalloutsOpen(!calloutsOpen)} aria-label={calloutsOpen?'隐藏饼图分类标注':'显示饼图分类标注'}><Icon name="plus" size={16}/></button></div>{selectedParent&&<div className="chart-view-actions"><button onClick={()=>setSelectedParent(undefined)}>一级分类</button></div>}<div className={calloutsOpen?'composition callouts-open':'composition'}><RingChart data={data} onSelect={!selectedParent?drill:undefined} callouts={calloutsOpen}/><div className="legend">{data.map((item)=>{const canDrill=!selectedParent&&categories.some((c)=>c.parentId===item.id);return <button disabled={!canDrill} onClick={()=>canDrill&&drill(item.id)} key={item.id}><i style={{background:item.color}}/><span>{item.name}</span><strong>{Math.round(item.value/total*100)}%</strong></button>})}</div></div>{!selectedParent&&canShowSecondary&&<p className="chart-hint">点按有二级分类的扇区或名称可查看明细</p>}</section>
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
