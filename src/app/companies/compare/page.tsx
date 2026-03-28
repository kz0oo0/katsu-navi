'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Company } from '@/lib/types'
import Link from 'next/link'
import Image from 'next/image'

function CompareCell({ value, label }: { value?: string | number | null; label?: string }) {
  if (value == null || value === '') return <td className="px-6 py-6 text-center text-gray-300 text-xs italic">データなし</td>
  return (
    <td className="px-6 py-6 text-center text-sm text-gray-700 leading-relaxed font-medium">
      {label ? (
        <div className="flex flex-col items-center">
          <span className="text-xl font-black text-gray-900">{value}</span>
          <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{label}</span>
        </div>
      ) : value}
    </td>
  )
}

export default function ComparePage() {
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = sessionStorage.getItem('compareList')
    const ids = stored ? JSON.parse(stored) : []
    setCompareIds(ids)

    if (ids.length === 0) { setLoading(false); return }

    const fetchCompanies = async () => {
      const supabase = createClient()
      const { data } = await supabase
        .from('companies')
        .select('*')
        .in('id', ids)
        .eq('publish_status', 'published')
        .eq('is_deleted', false)
      setCompanies((data as Company[]) || [])
      setLoading(false)
    }
    fetchCompanies()
  }, [])

  const removeFromCompare = (id: string) => {
    const next = compareIds.filter(v => v !== id)
    setCompareIds(next)
    setCompanies(prev => prev.filter(c => c.id !== id))
    sessionStorage.setItem('compareList', JSON.stringify(next))
  }

  if (loading) return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="w-12 h-12 border-4 border-emerald-100 border-t-emerald-600 rounded-full animate-spin mb-4"></div>
      <p className="text-gray-400 font-medium">比較データを読み込み中...</p>
    </div>
  )

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
        <div>
          <h1 className="text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-2 italic">企業比較</h1>
          <p className="text-gray-500 font-medium">気になる企業を項目別に徹底比較。</p>
        </div>
        <Link href="/companies" className="inline-flex items-center text-sm font-bold text-emerald-700 hover:text-emerald-800 transition-colors bg-emerald-50 px-5 py-2.5 rounded-xl border border-emerald-100">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7 7-7" />
          </svg>
          検索に戻る
        </Link>
      </div>

      {companies.length === 0 ? (
        <div className="bg-white rounded-[32px] border border-gray-100 shadow-sm p-12 md:p-20 text-center">
          <div className="w-24 h-24 bg-gray-50 rounded-[28px] flex items-center justify-center text-5xl mx-auto mb-8">⚖️</div>
          <h2 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">比較する企業がありません</h2>
          <p className="text-gray-500 font-medium mb-10 max-w-md mx-auto">
            企業一覧から気になる企業を最大3社まで選んで比較することができます。
          </p>
          <Link href="/companies" className="inline-block bg-emerald-800 text-white px-10 py-4 rounded-2xl font-black hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-900/10">
            企業を探しに行く
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden relative">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="px-8 py-10 text-left bg-gray-50/50 border-b border-gray-100 w-48 shrink-0">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em]">比較項目</span>
                  </th>
                  {companies.map(c => (
                    <th key={c.id} className="px-6 py-10 text-center bg-gray-50/50 border-b border-gray-100 min-w-[240px]">
                      <div className="flex flex-col items-center">
                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center overflow-hidden shadow-sm mb-4 border border-gray-100 relative group">
                          {c.logo_url ? (
                            <Image src={c.logo_url} alt={c.name} width={64} height={64} className="object-contain p-2" />
                          ) : (
                            <span className="text-2xl font-black text-emerald-800">{c.name.charAt(0)}</span>
                          )}
                          <button
                            onClick={() => removeFromCompare(c.id)}
                            className="absolute inset-0 bg-red-500/90 text-white opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-xs font-black"
                          >
                            削除
                          </button>
                        </div>
                        <h3 className="text-base font-black text-gray-900 mb-1 line-clamp-1">{c.name}</h3>
                        <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">{c.industry}</span>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {[
                  { label: '業界', key: 'industry' },
                  { label: '本社', key: 'headquarters' },
                  { label: '拠点', key: 'location' },
                  { label: '平均年収', key: 'avg_salary', suffix: '万円' },
                  { label: '平均残業時間', key: 'avg_overtime', suffix: 'h/月' },
                  { label: '採用フロー', key: 'hiring_flow' },
                  { label: '事業内容', key: 'description' },
                  { label: '強み・メリット', key: 'strengths' },
                  { label: '課題・弱み', key: 'weaknesses' },
                  { label: '福利厚生', key: 'benefits' },
                ].map((row) => (
                  <tr key={row.key} className="hover:bg-gray-50/30 transition-colors">
                    <td className="px-8 py-8 text-[11px] font-black text-gray-400 uppercase tracking-widest bg-gray-50/20 border-r border-gray-50">
                      {row.label}
                    </td>
                    {companies.map(c => (
                      <CompareCell
                        key={c.id}
                        value={(c as Company & Record<string, unknown>)[row.key] as string | number | null | undefined}
                        label={row.suffix}
                      />
                    ))}
                  </tr>
                ))}
                <tr>
                  <td className="px-8 py-10 bg-gray-50/20 border-r border-gray-50"></td>
                  {companies.map(c => (
                    <td key={c.id} className="px-6 py-10 text-center">
                      <Link href={`/companies/${c.id}`}
                        className="inline-block w-full bg-emerald-800 text-white py-3 rounded-xl text-sm font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10">
                        詳細を見る
                      </Link>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}
