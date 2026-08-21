import { useEffect, useState } from 'react'
import type { BackupFile, Category, Transaction } from './types'
import { BottomNav } from './components'
import { Home } from './Home'
import { Ledger } from './Ledger'
import { CalendarPage } from './CalendarPage'
import { StatisticsPage } from './StatisticsPage'
import { SettingsPage } from './SettingsPage'
import { EntryFlow } from './EntryFlow'
import { TransactionDetail } from './TransactionDetail'
import { clearAndReset, deleteCategory, deleteTransactions, getAllData, initializeDB, putCategory, putTransaction, replaceBackup } from './db'
import { localDateKey } from './utils'

type Page = 'home'|'calendar'|'chart'|'settings'|'ledger'

export default function App() {
  const [page,setPage]=useState<Page>('home')
  const [transactions,setTransactions]=useState<Transaction[]>([])
  const [categories,setCategories]=useState<Category[]>([])
  const [loading,setLoading]=useState(true)
  const [entry,setEntry]=useState<Transaction|null|undefined>(undefined)
  const [entryCopy,setEntryCopy]=useState(false)
  const [detail,setDetail]=useState<Transaction|null>(null)
  const [toast,setToast]=useState('')
  const refresh=async()=>{const data=await getAllData();setTransactions(data.transactions);setCategories(data.categories)}
  useEffect(()=>{initializeDB().then(refresh).finally(()=>setLoading(false))},[])
  useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(''),2400);return()=>clearTimeout(timer)},[toast])
  const save=async(item:Transaction)=>{await putTransaction(item);await refresh();setEntry(undefined);setEntryCopy(false);setDetail(null);setToast('已保存')}
  const remove=async(ids:string[])=>{await deleteTransactions(ids);await refresh();setDetail(null);setToast(ids.length>1?`已删除 ${ids.length} 笔账目`:'已删除')}
  const duplicate=(item:Transaction)=>{setEntryCopy(true);setEntry({...item,occurredAt:Date.now(),localDate:localDateKey(),createdAt:Date.now(),updatedAt:Date.now()})}
  const changePage=(next:string)=>{setPage(next as Page);setDetail(null);window.scrollTo({top:0,behavior:'instant'})}
  if(loading)return <div className="launch-screen"><span>一笔</span></div>
  if(entry!==undefined)return <EntryFlow categories={categories} initial={entry??undefined} copy={entryCopy} onClose={()=>{setEntry(undefined);setEntryCopy(false)}} onSave={save}/>
  if(detail)return <TransactionDetail item={detail} categories={categories} onBack={()=>setDetail(null)} onEdit={()=>{setEntryCopy(false);setEntry(detail)}} onDuplicate={()=>duplicate(detail)} onDelete={()=>remove([detail.id])}/>
  return <div className="app-shell">
    {page==='home'&&<Home transactions={transactions} categories={categories} onOpen={setDetail} onAll={()=>setPage('ledger')} onAdd={()=>{setEntryCopy(false);setEntry(null)}}/>} 
    {page==='ledger'&&<Ledger transactions={transactions} categories={categories} onBack={()=>setPage('home')} onOpen={setDetail} onDelete={remove}/>} 
    {page==='calendar'&&<CalendarPage transactions={transactions} categories={categories} onOpen={setDetail}/>} 
    {page==='chart'&&<StatisticsPage transactions={transactions} categories={categories}/>} 
    {page==='settings'&&<SettingsPage transactions={transactions} categories={categories} onPutCategory={async(c)=>{await putCategory(c);await refresh()}} onDeleteCategory={async(id)=>{await deleteCategory(id);await refresh()}} onImport={async(b:BackupFile)=>{await replaceBackup(b);await refresh()}} onClear={async()=>{await clearAndReset();await refresh();setToast('全部数据已清除')}}/>}
    {page!=='ledger'&&<BottomNav current={page} onChange={changePage}/>} 
    {toast&&<div className="toast">{toast}</div>}
  </div>
}
