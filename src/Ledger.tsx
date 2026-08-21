import { useMemo, useState } from 'react'
import type { Category, Filters, Transaction } from './types'
import { Icon } from './Icons'
import { ConfirmSheet, PageHeader, TransactionList } from './components'

const emptyFilters: Filters = { search: '', type: 'all', categoryId: '', dateFrom: '', dateTo: '' }

export function Ledger({ transactions, categories, onBack, onOpen, onDelete }: {
  transactions: Transaction[]; categories: Category[]; onBack: () => void; onOpen: (item: Transaction) => void; onDelete: (ids: string[]) => Promise<void>
}) {
  const [filters, setFilters] = useState(emptyFilters)
  const [filterOpen, setFilterOpen] = useState(false)
  const [selecting, setSelecting] = useState(false)
  const [selected, setSelected] = useState(new Set<string>())
  const [confirmDelete, setConfirmDelete] = useState(false)
  const filtered = useMemo(() => transactions.filter((item) => {
    const category = categories.find((c) => c.id === item.categoryId)
    return (!filters.search || item.note.toLowerCase().includes(filters.search.toLowerCase()) || category?.name.includes(filters.search))
      && (filters.type === 'all' || item.type === filters.type)
      && (!filters.categoryId || item.categoryId === filters.categoryId)
      && (!filters.dateFrom || item.localDate >= filters.dateFrom)
      && (!filters.dateTo || item.localDate <= filters.dateTo)
  }), [transactions, categories, filters])
  const activeCount = [filters.type !== 'all', !!filters.categoryId, !!filters.dateFrom, !!filters.dateTo].filter(Boolean).length
  const toggle = (id: string) => setSelected((current) => { const next = new Set(current); next.has(id) ? next.delete(id) : next.add(id); return next })

  return <main className="page sub-page">
    <PageHeader title={selecting ? `已选择 ${selected.size} 项` : '全部账单'} back={selecting ? () => { setSelecting(false); setSelected(new Set()) } : onBack} action={<button className="text-button" onClick={() => { setSelecting(!selecting); setSelected(new Set()) }}>{selecting ? '取消' : '选择'}</button>} />
    {!selecting && <><div className="search-box"><Icon name="search" size={19}/><input value={filters.search} onChange={(e) => setFilters({ ...filters, search: e.target.value })} placeholder="搜索备注或分类"/><button className={activeCount ? 'filter-active' : ''} onClick={() => setFilterOpen(true)}>筛选{activeCount ? ` ${activeCount}` : ''}</button></div>
    {activeCount > 0 && <button className="clear-filter" onClick={() => setFilters({ ...emptyFilters, search: filters.search })}>清除筛选</button>}</>}
    <TransactionList items={filtered} categories={categories} onOpen={onOpen} selecting={selecting} selected={selected} onSelect={toggle}/>
    {selecting && <div className="selection-bar"><button disabled={!selected.size} onClick={() => setConfirmDelete(true)}>删除 {selected.size || ''}</button></div>}

    {filterOpen && <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setFilterOpen(false)}><div className="sheet filter-sheet"><div className="sheet-handle"/><h2>筛选账单</h2><label>类型</label><div className="segmented">{(['all','expense','income'] as const).map((type) => <button className={filters.type === type ? 'active' : ''} key={type} onClick={() => setFilters({ ...filters, type, categoryId: '' })}>{type === 'all' ? '全部' : type === 'expense' ? '支出' : '收入'}</button>)}</div>
      <label>分类</label><select value={filters.categoryId} onChange={(e) => setFilters({ ...filters, categoryId: e.target.value })}><option value="">全部分类</option>{categories.filter((c) => !c.archived && (filters.type === 'all' || c.type === filters.type)).map((c) => <option value={c.id} key={c.id}>{c.name}</option>)}</select>
      <label>日期范围</label><div className="date-range"><input type="date" value={filters.dateFrom} onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}/><span>至</span><input type="date" value={filters.dateTo} onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}/></div>
      <button className="primary-button" onClick={() => setFilterOpen(false)}>查看 {filtered.length} 笔账单</button></div></div>}
    {confirmDelete && <ConfirmSheet title="删除所选账目？" message={`将删除 ${selected.size} 笔账目，此操作无法撤销。`} confirmLabel="删除" danger onCancel={() => setConfirmDelete(false)} onConfirm={async () => { await onDelete([...selected]); setConfirmDelete(false); setSelecting(false); setSelected(new Set()) }}/>} 
  </main>
}
