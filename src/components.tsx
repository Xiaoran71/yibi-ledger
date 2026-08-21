import type { Category, Transaction } from './types'
import { Icon } from './Icons'
import { dateLabel, formatAmountOnly, groupByDate, timeLabel } from './utils'

export function PageHeader({ title, back, action }: { title: string; back?: () => void; action?: React.ReactNode }) {
  return <header className="page-header">
    <div>{back && <button className="icon-button" onClick={back} aria-label="返回"><Icon name="back" /></button>}</div>
    <h1>{title}</h1>
    <div className="header-action">{action}</div>
  </header>
}

export function EmptyState({ text }: { text: string }) {
  return <div className="empty-state"><div className="empty-mark">○</div><p>{text}</p></div>
}

export function TransactionList({ items, categories, onOpen, selecting = false, selected = new Set(), onSelect }: {
  items: Transaction[]
  categories: Category[]
  onOpen: (item: Transaction) => void
  selecting?: boolean
  selected?: Set<string>
  onSelect?: (id: string) => void
}) {
  if (!items.length) return <EmptyState text="还没有账目" />
  const categoryMap = new Map(categories.map((category) => [category.id, category]))
  const groups = groupByDate(items)
  return <div className="transaction-groups">
    {Object.entries(groups).map(([date, transactions]) => {
      const spent = transactions.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amountMinor, 0)
      return <section className="transaction-group" key={date}>
        <div className="group-heading"><strong>{dateLabel(date)}</strong>{spent > 0 && <span>支出 ¥{formatAmountOnly(spent)}</span>}</div>
        <div className="list-card">
          {transactions.map((item) => {
            const category = categoryMap.get(item.categoryId)
            return <button className={`transaction-row ${selecting ? 'is-selecting' : ''}`} key={item.id} onClick={() => selecting ? onSelect?.(item.id) : onOpen(item)}>
              {selecting && <span className={`select-dot ${selected.has(item.id) ? 'selected' : ''}`}>{selected.has(item.id) && <Icon name="check" size={14} />}</span>}
              <span className={`category-icon ${item.type}`}><Icon name={category?.icon ?? 'ellipsis'} size={20} /></span>
              <span className="transaction-main"><strong>{item.note || category?.name || '已删除分类'}</strong><small>{category?.name ?? '已删除分类'} · {timeLabel(item.occurredAt)}</small></span>
              <span className={`transaction-amount ${item.type}`}>{item.type === 'expense' ? '−' : '+'}{formatAmountOnly(item.amountMinor)}</span>
            </button>
          })}
        </div>
      </section>
    })}
  </div>
}

export function BottomNav({ current, onChange }: { current: string; onChange: (page: string) => void }) {
  const items = [['home', '首页'], ['calendar', '日历'], ['chart', '统计'], ['settings', '设置']]
  return <nav className="bottom-nav" aria-label="主导航">
    {items.map(([page, label]) => <button key={page} className={current === page ? 'active' : ''} onClick={() => onChange(page)}><Icon name={page} size={22} /><span>{label}</span></button>)}
  </nav>
}

export function ConfirmSheet({ title, message, confirmLabel = '确认', danger = false, onCancel, onConfirm }: {
  title: string; message: string; confirmLabel?: string; danger?: boolean; onCancel: () => void; onConfirm: () => void
}) {
  return <div className="overlay" role="presentation" onMouseDown={(e) => e.target === e.currentTarget && onCancel()}>
    <div className="sheet confirm-sheet" role="dialog" aria-modal="true">
      <div className="sheet-handle" />
      <h2>{title}</h2><p>{message}</p>
      <button className={`primary-button ${danger ? 'danger' : ''}`} onClick={onConfirm}>{confirmLabel}</button>
      <button className="secondary-button" onClick={onCancel}>取消</button>
    </div>
  </div>
}
