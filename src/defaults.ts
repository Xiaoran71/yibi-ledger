import type { Category, TransactionType } from './types'

const categorySeeds: Array<[TransactionType, string, string]> = [
  ['expense', '餐饮', 'fork'],
  ['expense', '交通', 'bus'],
  ['expense', '购物', 'bag'],
  ['expense', '居住', 'house'],
  ['expense', '娱乐', 'sparkles'],
  ['expense', '医疗', 'cross'],
  ['expense', '学习', 'book'],
  ['expense', '其他', 'ellipsis'],
  ['income', '工资', 'briefcase'],
  ['income', '奖金', 'gift'],
  ['income', '兼职', 'laptop'],
  ['income', '理财', 'chart'],
  ['income', '红包', 'heart'],
  ['income', '其他', 'ellipsis'],
]

export function createDefaultCategories(now = Date.now()): Category[] {
  const counters: Record<TransactionType, number> = { expense: 0, income: 0 }
  return categorySeeds.map(([type, name, icon]) => ({
    id: crypto.randomUUID(),
    type,
    name,
    icon,
    sortOrder: counters[type]++,
    archived: false,
    createdAt: now,
    updatedAt: now,
  }))
}
