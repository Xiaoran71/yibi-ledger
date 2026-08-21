import type { Category, TransactionType } from './types'

export const expenseColors = ['#B8685A','#CE8272','#D99B76','#C99465','#A9786D','#B38691','#8C8496','#A6A09A']
export const incomeColors = ['#2F6F57','#4F8770','#6E9E89','#88AC99','#5D8D91','#7697A3','#829986','#A1AEA5']

const categorySeeds: Array<[TransactionType, string, string, string]> = [
  ['expense', '餐饮', 'fork', expenseColors[0]],
  ['expense', '交通', 'bus', expenseColors[1]],
  ['expense', '购物', 'bag', expenseColors[2]],
  ['expense', '居住', 'house', expenseColors[3]],
  ['expense', '娱乐', 'sparkles', expenseColors[4]],
  ['expense', '医疗', 'cross', expenseColors[5]],
  ['expense', '学习', 'book', expenseColors[6]],
  ['expense', '其他', 'ellipsis', expenseColors[7]],
  ['income', '工资', 'briefcase', incomeColors[0]],
  ['income', '奖金', 'gift', incomeColors[1]],
  ['income', '兼职', 'laptop', incomeColors[2]],
  ['income', '理财', 'chart', incomeColors[3]],
  ['income', '红包', 'heart', incomeColors[4]],
  ['income', '其他', 'ellipsis', incomeColors[5]],
]

export function createDefaultCategories(now = Date.now()): Category[] {
  const counters: Record<TransactionType, number> = { expense: 0, income: 0 }
  return categorySeeds.map(([type, name, icon, color]) => ({
    id: crypto.randomUUID(),
    type,
    name,
    icon,
    color,
    sortOrder: counters[type]++,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }))
}
