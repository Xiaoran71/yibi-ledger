import { useEffect, useMemo, useRef, useState } from 'react'
import type { Category, EntryDraft, Transaction, TransactionType } from './types'
import { Icon } from './Icons'
import { localDateKey, parseAmount, sanitizeAmountInput, toDateTimeLocal } from './utils'

type Step = 'amount' | 'type' | 'category' | 'note'

export function EntryFlow({ categories, initial, copy = false, onClose, onSave }: {
  categories: Category[]
  initial?: Transaction
  copy?: boolean
  onClose: () => void
  onSave: (item: Transaction) => Promise<void>
}) {
  const now = Date.now()
  const [step, setStep] = useState<Step>('amount')
  const [draft, setDraft] = useState<EntryDraft>(() => initial ? {
    id: copy ? undefined : initial.id,
    amountMinor: initial.amountMinor,
    amountText: (initial.amountMinor / 100).toFixed(2).replace(/\.00$/, ''),
    type: initial.type,
    categoryId: initial.categoryId,
    occurredAt: initial.occurredAt,
    note: initial.note,
  } : { amountMinor: 0, amountText: '', occurredAt: now, note: '' })
  const [dateOpen, setDateOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const amountRef = useRef<HTMLInputElement>(null)
  const noteRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const timer = window.setTimeout(() => step === 'amount' ? amountRef.current?.focus() : step === 'note' ? noteRef.current?.focus() : undefined, 220)
    return () => window.clearTimeout(timer)
  }, [step])

  const visibleCategories = useMemo(() => categories.filter((c) => !c.archived && c.type === draft.type).sort((a, b) => a.sortOrder - b.sortOrder), [categories, draft.type])
  const steps: Step[] = ['amount', 'type', 'category', 'note']
  const back = () => {
    const index = steps.indexOf(step)
    if (index === 0) onClose()
    else setStep(steps[index - 1])
  }
  const chooseType = (type: TransactionType) => {
    setDraft((current) => ({ ...current, type, categoryId: current.type === type ? current.categoryId : undefined }))
    setStep('category')
  }
  const save = async () => {
    if (!draft.amountMinor || !draft.type || !draft.categoryId || saving) return
    setSaving(true)
    const existingCreatedAt = initial && !copy ? initial.createdAt : Date.now()
    await onSave({
      id: draft.id ?? crypto.randomUUID(),
      amountMinor: draft.amountMinor,
      type: draft.type,
      categoryId: draft.categoryId,
      occurredAt: draft.occurredAt,
      localDate: localDateKey(draft.occurredAt),
      timezoneOffset: new Date(draft.occurredAt).getTimezoneOffset(),
      note: draft.note.trim(),
      createdAt: existingCreatedAt,
      updatedAt: Date.now(),
    })
  }
  const isToday = localDateKey(draft.occurredAt) === localDateKey()

  return <div className="entry-flow">
    <header className="entry-header">
      <button className="icon-button" onClick={back} aria-label="返回"><Icon name="back" /></button>
      <div className="step-dots">{steps.map((item) => <span key={item} className={item === step ? 'active' : steps.indexOf(item) < steps.indexOf(step) ? 'done' : ''} />)}</div>
      <button className="icon-button" onClick={onClose} aria-label="关闭"><Icon name="close" /></button>
    </header>

    <main className="entry-content" key={step}>
      {step === 'amount' && <section className="entry-step amount-step">
        <p className="eyebrow">{initial && !copy ? '修改金额' : '记一笔'}</p>
        <div className="amount-input-wrap"><span>¥</span><input ref={amountRef} aria-label="金额" inputMode="decimal" enterKeyHint="next" placeholder="0" value={draft.amountText} onChange={(event) => {
          const amountText = sanitizeAmountInput(event.target.value)
          setDraft((current) => ({ ...current, amountText, amountMinor: parseAmount(amountText) }))
        }} onKeyDown={(event) => event.key === 'Enter' && draft.amountMinor > 0 && setStep('type')} /></div>
        <button className="date-trigger" onClick={() => setDateOpen(true)}>{isToday ? '今天' : new Date(draft.occurredAt).toLocaleString('zh-CN', { month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })} <Icon name="chevron" size={15} /></button>
        <button className="entry-next" disabled={!draft.amountMinor} onClick={() => setStep('type')}>继续</button>
      </section>}

      {step === 'type' && <section className="entry-step"><p className="eyebrow">这是一笔</p><h2>支出还是收入？</h2><div className="type-choices">
        <button className="expense" onClick={() => chooseType('expense')}><span>−</span><strong>支出</strong></button>
        <button className="income" onClick={() => chooseType('income')}><span>＋</span><strong>收入</strong></button>
      </div></section>}

      {step === 'category' && <section className="entry-step category-step"><p className="eyebrow">选择分类</p><h2>{draft.type === 'expense' ? '花在了哪里？' : '收入来自哪里？'}</h2><div className="category-grid">
        {visibleCategories.map((category) => <button key={category.id} onClick={() => { setDraft((current) => ({ ...current, categoryId: category.id })); setStep('note') }}><span className={draft.type}><Icon name={category.icon} /></span><strong>{category.name}</strong></button>)}
      </div></section>}

      {step === 'note' && <section className="entry-step note-step"><p className="eyebrow">最后一步 · 可选</p><h2>写点备注</h2><input ref={noteRef} value={draft.note} onChange={(event) => setDraft((current) => ({ ...current, note: event.target.value.slice(0, 100) }))} placeholder="例如：午饭" enterKeyHint="done" onKeyDown={(event) => event.key === 'Enter' && save()} />
        <div className="entry-summary"><span>{draft.type === 'expense' ? '支出' : '收入'} · {categories.find((c) => c.id === draft.categoryId)?.name}</span><strong>¥{(draft.amountMinor / 100).toFixed(2)}</strong></div>
        <button className="entry-next" disabled={saving} onClick={save}>{saving ? '保存中…' : initial && !copy ? '保存修改' : '保存'}</button>
      </section>}
    </main>

    {dateOpen && <div className="overlay" onMouseDown={(e) => e.target === e.currentTarget && setDateOpen(false)}><div className="sheet date-sheet"><div className="sheet-handle"/><h2>日期和时间</h2><input type="datetime-local" value={toDateTimeLocal(draft.occurredAt)} max="2100-12-31T23:59" onChange={(event) => event.target.value && setDraft((current) => ({ ...current, occurredAt: new Date(event.target.value).getTime() }))}/><button className="primary-button" onClick={() => setDateOpen(false)}>完成</button></div></div>}
  </div>
}
