import type { Category, Transaction } from './types'
import { ConfirmSheet, PageHeader } from './components'
import { formatMoney } from './utils'
import { useState } from 'react'

export function TransactionDetail({ item, categories, onBack, onEdit, onDuplicate, onDelete }: { item:Transaction;categories:Category[];onBack:()=>void;onEdit:()=>void;onDuplicate:()=>void;onDelete:()=>Promise<void> }) {
  const [confirm,setConfirm]=useState(false)
  const category=categories.find((c)=>c.id===item.categoryId)
  const parent=category?.parentId?categories.find((c)=>c.id===category.parentId):undefined
  return <main className="page sub-page detail-page"><PageHeader title="账目详情" back={onBack}/><section className={`detail-hero ${item.type}`}><span>{item.type==='expense'?'支出':'收入'} · {parent?`${parent.name} · `:''}{category?.name??'已删除分类'}</span><strong>{item.type==='expense'?'−':'+'}{formatMoney(item.amountMinor)}</strong><p>{new Date(item.occurredAt).toLocaleString('zh-CN',{year:'numeric',month:'long',day:'numeric',weekday:'short',hour:'2-digit',minute:'2-digit',hour12:false})}</p></section><section className="detail-note"><span>备注</span><p>{item.note||'无备注'}</p></section><div className="detail-actions"><button className="primary-button" onClick={onEdit}>编辑这笔</button><button className="secondary-button" onClick={onDuplicate}>重复一笔</button><button className="text-danger-button" onClick={()=>setConfirm(true)}>删除</button></div>{confirm&&<ConfirmSheet title="删除这笔账目？" message="删除后无法撤销。" confirmLabel="删除" danger onCancel={()=>setConfirm(false)} onConfirm={onDelete}/>}</main>
}
