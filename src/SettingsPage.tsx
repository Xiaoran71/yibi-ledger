import { useRef, useState } from 'react'
import type { BackupFile, Category, Transaction, TransactionType } from './types'
import { categoryIconNames, Icon } from './Icons'
import { expenseColors, incomeColors } from './defaults'
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
    const backup: BackupFile = { format:'yibi-ledger-backup', version:2, exportedAt:new Date().toISOString(), transactions, categories, settings:{id:'app',currency:'CNY',schemaVersion:2,weekStartsOn:1} }
    downloadFile(`一笔备份-${new Date().toISOString().slice(0,10)}.json`, JSON.stringify(backup, null, 2), 'application/json;charset=utf-8')
  }
  const exportCsv = () => {
    const categoryMap = new Map(categories.map((c)=>[c.id,c]))
    const rows = [['日期','时间','类型','金额','一级分类','二级分类','备注'], ...transactions.map((item)=>{const category=categoryMap.get(item.categoryId);const parent=category?.parentId?categoryMap.get(category.parentId):undefined;return [item.localDate,new Date(item.occurredAt).toLocaleTimeString('zh-CN',{hour:'2-digit',minute:'2-digit',hour12:false}),item.type==='expense'?'支出':'收入',(item.amountMinor/100).toFixed(2),parent?.name??category?.name??'已删除分类',parent?category?.name??'':'',item.note]})]
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
    <footer className="settings-footer"><strong>一笔</strong><span>简单、私密、自由</span><small>所有数据均保存在本机 · v0.2.0</small></footer>
    {message && <div className="toast" onClick={()=>setMessage('')}>{message}</div>}
    {clearConfirm && <ConfirmSheet title="清除全部数据？" message="所有账目和自定义分类都会从本机永久删除。建议先导出备份。" confirmLabel="永久清除" danger onCancel={()=>setClearConfirm(false)} onConfirm={async()=>{await onClear();setClearConfirm(false)}}/>}
    {importBackup && <ConfirmSheet title="恢复这个备份？" message={`备份包含 ${importBackup.transactions.length} 笔账目和 ${importBackup.categories.length} 个分类，将替换当前所有数据。`} confirmLabel="恢复备份" danger onCancel={()=>setImportBackup(null)} onConfirm={async()=>{await onImport(importBackup);setImportBackup(null);setMessage('备份已恢复')}}/>}
  </main>
}

function CategoryManager({ type, categories, transactions, onBack, onPut, onDelete }: { type: TransactionType; categories: Category[]; transactions: Transaction[]; onBack:()=>void; onPut:(c:Category)=>Promise<void>; onDelete:(id:string)=>Promise<void> }) {
  const list = categories.filter((c)=>c.type===type && !c.archived && !c.parentId).sort((a,b)=>a.sortOrder-b.sortOrder)
  const [editing, setEditing] = useState<Category|null>(null)
  const [parentId, setParentId] = useState<string|undefined>()
  const [name, setName] = useState('')
  const [icon, setIcon] = useState('ellipsis')
  const [color, setColor] = useState((type==='expense'?expenseColors:incomeColors)[0])
  const [editorOpen, setEditorOpen] = useState(false)
  const [deleting, setDeleting] = useState<Category|null>(null)
  const [reordering, setReordering] = useState<Category|null>(null)
  const openEditor = (category?: Category, parent?: string) => {
    const palette=type==='expense'?expenseColors:incomeColors
    setEditing(category??null);setParentId(category?.parentId??parent);setName(category?.name??'');setIcon(category?.icon??'ellipsis');setColor(category?.color??palette[0]);setEditorOpen(true)
  }
  const saveName = async () => {
    const clean=name.trim(); if(!clean) return
    const peers=categories.filter((c)=>c.type===type&&!c.archived&&(c.parentId??'')===(parentId??''))
    if(editing) await onPut({...editing,name:clean,icon,color,updatedAt:Date.now()})
    else await onPut({id:crypto.randomUUID(),type,name:clean,icon,color,parentId,sortOrder:peers.length,archived:false,createdAt:Date.now(),updatedAt:Date.now()})
    setEditing(null);setName('');setEditorOpen(false);setParentId(undefined)
  }
  const moveTo = async (category:Category, target:number) => {
    const peers=categories.filter((c)=>c.type===type&&!c.archived&&(c.parentId??'')===(category.parentId??'')).sort((a,b)=>a.sortOrder-b.sortOrder)
    const reordered=peers.filter((c)=>c.id!==category.id);reordered.splice(target,0,category)
    await Promise.all(reordered.map((item,index)=>onPut({...item,sortOrder:index,updatedAt:Date.now()})));setReordering(null)
  }
  const childrenOf=(id:string)=>categories.filter((c)=>c.parentId===id&&!c.archived).sort((a,b)=>a.sortOrder-b.sortOrder)
  const renderRow=(category:Category, child=false)=><div className={child?'subcategory-row':''} key={category.id}><span className="category-icon" style={{background:`${category.color}1A`,color:category.color}}><Icon name={category.icon} size={19}/></span><strong>{category.name}</strong><div><button aria-label={`调整${category.name}位置`} onClick={()=>setReordering(category)}>排序</button>{!child&&<button onClick={()=>openEditor(undefined,category.id)}>＋子类</button>}<button onClick={()=>openEditor(category)}>编辑</button><button className="danger-text" onClick={()=>setDeleting(category)}>删除</button></div></div>
  const deleteTree=async()=>{if(!deleting)return;const tree=[deleting,...childrenOf(deleting.id)];const used=tree.some((c)=>transactions.some((t)=>t.categoryId===c.id));if(used)await Promise.all(tree.map((c)=>onPut({...c,archived:true,updatedAt:Date.now()})));else for(const c of tree)await onDelete(c.id);setDeleting(null)}
  const reorderPeers=reordering?categories.filter((c)=>c.type===type&&!c.archived&&(c.parentId??'')===(reordering.parentId??'')).sort((a,b)=>a.sortOrder-b.sortOrder):[]
  return <main className="page sub-page"><PageHeader title={`${type==='expense'?'支出':'收入'}分类`} back={onBack} action={<button className="text-button" onClick={()=>openEditor()}>新增</button>}/><p className="category-manager-note">点击“排序”可直接移动到任意位置；一级分类可添加二级分类。</p><div className="category-manage-list">{list.flatMap((category)=>[renderRow(category),...childrenOf(category.id).map((child)=>renderRow(child,true))])}</div>
    {editorOpen && <div className="overlay" onMouseDown={(e)=>e.target===e.currentTarget&&(setEditing(null),setEditorOpen(false))}><div className="sheet category-editor"><div className="sheet-handle"/><h2>{editing?'修改分类':parentId?'新增二级分类':'新增分类'}</h2><input className="sheet-input" autoFocus maxLength={8} value={name} onChange={(e)=>setName(e.target.value)} placeholder="分类名称" onKeyDown={(e)=>e.key==='Enter'&&saveName()}/><label>图标</label><div className="icon-picker">{categoryIconNames.map((item)=><button className={icon===item?'selected':''} key={item} onClick={()=>setIcon(item)} aria-label={item}><Icon name={item} size={20}/></button>)}</div><label>图表颜色</label><div className="color-picker">{[...expenseColors,...incomeColors].map((item)=><button className={color===item?'selected':''} key={item} style={{background:item}} onClick={()=>setColor(item)} aria-label={`颜色 ${item}`}/>)}</div><button className="primary-button" disabled={!name.trim()} onClick={saveName}>保存</button><button className="secondary-button" onClick={()=>{setEditing(null);setEditorOpen(false);setParentId(undefined)}}>取消</button></div></div>}
    {reordering&&<div className="overlay" onMouseDown={(e)=>e.target===e.currentTarget&&setReordering(null)}><div className="sheet position-sheet"><div className="sheet-handle"/><h2>移动“{reordering.name}”</h2><p>选择新的位置</p><div>{reorderPeers.map((item,index)=><button className={item.id===reordering.id?'current':''} key={item.id} onClick={()=>moveTo(reordering,index)}><span>{index+1}</span>{item.name}{item.id===reordering.id&&<Icon name="check" size={17}/>}</button>)}</div><button className="secondary-button" onClick={()=>setReordering(null)}>取消</button></div></div>}
    {deleting && <ConfirmSheet title={`删除“${deleting.name}”？`} message={(transactions.some((t)=>t.categoryId===deleting.id)||childrenOf(deleting.id).some((c)=>transactions.some((t)=>t.categoryId===c.id)))?'它或它的二级分类已被历史账目使用。删除后会归档，历史账目不会受影响。':childrenOf(deleting.id).length?'它的二级分类也会一并删除。':'这个分类尚未使用，将直接删除。'} confirmLabel="删除" danger onCancel={()=>setDeleting(null)} onConfirm={deleteTree}/>}
  </main>
}
