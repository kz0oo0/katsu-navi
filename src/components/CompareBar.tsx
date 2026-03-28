'use client'

import Link from 'next/link'
import { Company } from '@/lib/types'

interface CompareBarProps {
  compareList: string[]
  companies: Company[]
  onRemove: (id: string) => void
}

export default function CompareBar({ compareList, companies, onRemove }: CompareBarProps) {
  if (compareList.length === 0) return null

  const selected = compareList
    .map(id => companies.find(c => c.id === id))
    .filter(Boolean) as Company[]

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-emerald-900 text-white shadow-2xl border-t border-emerald-700 px-4 py-3 z-40">
      <div className="max-w-6xl mx-auto flex items-center gap-4">
        <span className="text-sm font-semibold text-emerald-100 whitespace-nowrap">
          比較中の企業 ({selected.length})
        </span>
        <div className="flex flex-wrap gap-2 overflow-x-auto no-scrollbar py-1">
          {selected.map(c => (
            <span key={c.id} className="flex items-center gap-1 bg-emerald-700 rounded-full px-3 py-1 text-sm">
              {c.name}
              <button onClick={() => onRemove(c.id)} className="ml-1 text-emerald-300 hover:text-white">✕</button>
            </span>
          ))}
        </div>
        <Link
          href="/companies/compare"
          className="ml-auto bg-amber-400 text-emerald-950 font-bold px-5 py-2 rounded-xl text-sm hover:bg-amber-300 transition whitespace-nowrap"
        >
          選んだ企業を比較する
        </Link>
      </div>
    </div>
  )
}
