import { useRef, useState } from 'react'
import type { BackupFile, Category, Transaction, TransactionType } from './types'
import { Icon } from './Icons'
import { ConfirmSheet, PageHeader } from './components'
import { csvCell, downloadFile } from './utils'
import { validateBackup } from './db'

export function SettingsPage({ transactions, categories, onPutCategory, onDeleteCategory, onImport, onClear }: {
  transactions: Transaction[]; categories: Category[]
  onPutCategory: (item: Category) => Promise<void>; onDeleteCategory: (id: string) => Promise<void>
  onImport: (backup: BackupFile) => Promise<void>; onClear: () => Promise<void>
}) {
  const [manageType, setManageType] = useState<TransactionType | null>(null)
  const [clearConfirm, setClearConfirm] = useState(false)
  const [importBackup, setImportBackup] = useState<BackupFile | null>(null)
  const [message, setMessage] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)
  const exportJson = () => {
    const backup: BackupFile = { format:'yibi-ledger-backup', version:1, exportedAt:new Date().toISOString(), transactions, categories, settings:{id:'app',currency:'CNY',schemaVersion:1,weekStartsOn:1} }
    downloadFile(`一笔备份-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8')
  }
  const exportCsv = () => {
    const categoryMap = new Map(categories.map((c)=>[c.id,c.name]))
    const rows = [['日期','时间','类型','金额','分类','备注'], ...transactions.map((item)=>[item.localDate,new Date(item.occurredAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}),item.type==='expense'?'支出':'收入',(item.amountMinor/100).toFixed(2),categoryMap.get(item.categoryId)??'已删除分类',item.note])]
    downloadFile(`一笔账单-${new Date().toISOString().slice(0,10)}.csv`, '\ufeff'+rows.map((row)=>row.map(csvCell).join(',')).join('\n'), 'text/csv;charset=utf-8')
  }
  const readImport = async (file?: File) => {
    if (!file) return
    try { const value: unknown = JSON.parse(await file.text()); if (!validateBackup(value)) throw new Error(); setImportBackup(value) }
    catch { setMessage('无法读取这个备份，请确认它是由「一笔」导出的完整 JSON 文件。') }
    if (fileRef.current) fileRef.current.value = ''
  }
  if (manageType) return <CategoryManager type={manageType} categories={categories} transactions={transactions} onBack={()=>setManageType(null)} onPut={onPutCategory} onDelete={onDeleteCategory}/>
  return <main className="page settings-page"><header className="simple-title"><p>本地与私密</p><h1>设置</h1></header>
    <section className="settings-section"><h2>分类</h2><div className="settings-card"><button onClick={()=>setManageType('expense')}><span><i className="setting-icon expense">−</i>支出分类</span><Icon name="chevron" size={18}/></button><button onClick={()=>setManageType('income')}><span><i className="setting-icon income">＋</i>收入分类</span><Icon name="chevron" size={18}/></button></div></section>
    <section className="settings-section"><h2>数据</h2><div className="settings-card"><button onClick={exportJson}><span>导出完整 JSON 备份</span><small>{transactions.length} 笔</small></button><button onClick={()=>fileRef.current?.click()}><span>从 JSON 恢复</span><Icon name="chevron" size={18}/></button><button onClick={exportCsv}><span>导出 CSV</span><Icon name="chevron" size={18}/></button><input ref={fileRef} hidden type="file" accept="application/json,.json" onChange={(e)=>readImport(e.target.files?.[0])}/></div><p className="settings-note">数据只保存在这台设备。建议定期导出 JSON 备份。</p></section>
    <section className="settings-section"><h2>危险操作</h2><div className="settings-card"><button className="danger-text" onClick={()=>setClearConfirm(true)}>清除全部数据</button></div></section>
    <footer className="settings-footer"><strong>一笔</strong><span>简单、私密、自由</span><small>所有数据均保存在本机 · v0.1.0</small></footer>
    {message && <div className="toast" onClick={()=>setMessage('')}>{message}</div>}
    {clearConfirm && <ConfirmSheet title="清除全部数据？" message="所有账目和自定义分类都会从本机永久删除。建议先导出备份。" confirmLabel="永久清除" danger onCancel={()=>setClearConfirm(false)} onConfirm={async()=>{await onClear();setClearConfirm(false)}}/>}
    {importBackup && <ConfirmSheet title="恢复这个备份？" message={`备份包含 ${importBackup.transactions.length} 笔账目和 ${importBackup.categories.length} 个分类，将替换当前所有数据。`} confirmLabel="恢复备份" danger onCancel={()=>setImportBackup(null)} onConfirm={async()=>{await onImport(importBackup);setImportBackup(null);setMessage('备份已恢复')}}/>}
  </main>
}

function CategoryManager({ type, categories, transactions, onBack, onPut, onDelete }: { type: TransactionType; categories: Category[]; transactions: Transaction[]; onBack:()=>void; onPut:(c:Category)=>Promise<void>; onDelete:(id:string)=>Promise<void> }) {
  const list = categories.filter((c)=>c.type===type && !c.archived).sort((a,b)=>a.sortOrder-b.sortOrder)
  const [editing, setEditing] = useState<Category|null>(null)
  const [name, setName] = useState('')
  const [editorOpen, setEditorOpen] = useState(false)
  const [deleting, setDeleting] = useState<Category|null>(null)
  const saveName = async () => {
    const clean=name.trim(); if(!clean) return
    if(editing) await onPut({...editing,name:clean,updatedAt:Date.now()})
    else await onPut({id:crypto.randomUUID(),type,name:clean,icon:'ellipsis',sortOrder:list.length,archived:false,createdAt:Date.now(),updatedAt:Date.now()})
    setEditing(null);setName('');setEditorOpen(false)
  }
  const move = async (index:number, delta:number) => { const other=list[index+delta]; if(!other)return; await Promise.all([onPut({...list[index],sortOrder:other.sortOrder,updatedAt:Date.now()}),onPut({...other,sortOrder:list[index].sortOrder,updatedAt:Date.now()})]) }
  return <main className="page sub-page"><PageHeader title={`${type==='expense'?'支出':'收入'}分类`} back={onBack} action={<button className="text-button" onClick={()=>{setEditing(null);setName('');setEditorOpen(true)}}>新增</button>}/><div className="category-manage-list">{list.map((category,index)=><div key={category.id}><span className={`category-icon ${type}`}><Icon name={category.icon} size={19}/></span><strong>{category.name}</strong><div><button disabled={index===0} onClick={()=>move(index,-1)}>↑</button><button disabled={index===list.length-1} onClick={()=>move(index,1)}>↓</button><button onClick={()=>{setEditing(category);setName(category.name);setEditorOpen(true)}}>编辑</button><button className="danger-text" onClick={()=>setDeleting(category)}>删除</button></div></div>)}</div>
    {editorOpen && <div className="overlay" onMouseDown={(e)=>e.target===e.currentTarget&&(setEditing(null),setEditorOpen(false))}><div className="sheet"><div className="sheet-handle"/><h2>{editing?'修改分类':'新增分类'}</h2><input className="sheet-input" autoFocus maxLength={8} value={name} onChange={(e)=>setName(e.target.value)} placeholder="分类名称" onKeyDown={(e)=>e.key==='Enter'&&saveName()}/><button className="primary-button" disabled={!name.trim()} onClick={saveName}>保存</button><button className="secondary-button" onClick={()=>{setEditing(null);setEditorOpen(false)}}>取消</button></div></div>}
    {deleting && <ConfirmSheet title={`删除“${deleting.name}”？`} message={transactions.some((t)=>t.categoryId===deleting.id)?'这个分类已被历史账目使用。删除后会归档，历史账目不会受影响。':'这个分类尚未使用，将直接删除。'} confirmLabel="删除" danger onCancel={()=>setDeleting(null)} onConfirm={async()=>{if(transactions.some((t)=>t.categoryId===deleting.id))await onPut({...deleting,archived:true,updatedAt:Date.now()});else await onDelete(deleting.id);setDeleting(null)}}/>}
  </main>
}
