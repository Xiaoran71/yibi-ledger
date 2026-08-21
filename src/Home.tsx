import type { Category, Transaction } from './types'
import { Icon } from './Icons'
import { TransactionList } from './components'
import { formatMoney, monthKey } from './utils'

export function Home({ transactions, categories, onOpen, onAll, onAdd }: {
  transactions: Transaction[]; categories: Category[]; onOpen: (item: Transaction) => void; onAll: () => void; onAdd: () => void
}) {
  const currentMonth = monthKey()
  const monthly = transactions.filter((item) => item.localDate.startsWith(currentMonth))
  const expense = monthly.filter((item) => item.type === 'expense').reduce((sum, item) => sum + item.amountMinor, 0)
  const income = monthly.filter((item) => item.type === 'income').reduce((sum, item) => sum + item.amountMinor, 0)
  return <main className="page home-page">
    <header className="home-header"><div><p>{new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long' })}</p><h1>本月支出</h1></div><span className="privacy-dot" title="数据仅保存在本机" /></header>
    <section className="month-summary"><div className="hero-amount">{formatMoney(expense)}</div><div className="summary-secondary"><div><span>本月收入</span><strong>{formatMoney(income)}</strong></div><div><span>本月结余</span><strong className={income - expense < 0 ? 'negative' : ''}>{formatMoney(income - expense)}</strong></div></div></section>
    <div className="section-title"><h2>最近账单</h2>{transactions.length > 0 && <button onClick={onAll}>查看全部 <Icon name="chevron" size={14}/></button>}</div>
    <TransactionList items={transactions.slice(0, 8)} categories={categories} onOpen={onOpen} />
    <button className="fab" onClick={onAdd} aria-label="记一笔"><Icon name="plus" size={30}/></button>
  </main>
}
