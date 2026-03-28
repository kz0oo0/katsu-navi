'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import CompanyCard from '@/components/CompanyCard'
import { Company, INDUSTRIES, PREFECTURES } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import CompareBar from '@/components/CompareBar'

function CompaniesContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [compareList, setCompareList] = useState<string[]>([])
  const [displayIndustries, setDisplayIndustries] = useState<string[]>([])

  const q = searchParams.get('q') || ''
  const industry = searchParams.get('industry') || ''
  const location = searchParams.get('location') || ''

  const [searchInput, setSearchInput] = useState(q)
  const [industryInput, setIndustryInput] = useState(industry)
  const [locationInput, setLocationInput] = useState(location)

  useEffect(() => {
    const stored = sessionStorage.getItem('compareList')
    if (stored) setCompareList(JSON.parse(stored))
    
    // 業界リストを動的に取得
    const fetchIndustriesData = async () => {
      const { getRegisteredIndustries } = await import('@/app/actions/companies')
      const registered = await getRegisteredIndustries()
      setDisplayIndustries(registered)
    }
    fetchIndustriesData()
  }, [])

  useEffect(() => {
    const fetchCompanies = async () => {
      setLoading(true)
      const supabase = createClient()
      let query = supabase
        .from('companies')
        .select('*')
        .eq('publish_status', 'published')
        .eq('is_deleted', false)
        .order('created_at', { ascending: false })

      if (q) query = query.ilike('name', `%${q}%`)
      if (industry) query = query.eq('industry', industry)
      if (location) query = query.eq('location', location)

      const { data } = await query
      setCompanies((data as Company[]) || [])
      setLoading(false)
    }
    fetchCompanies()
  }, [q, industry, location])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    const params = new URLSearchParams()
    if (searchInput) params.set('q', searchInput)
    if (industryInput) params.set('industry', industryInput)
    if (locationInput) params.set('location', locationInput)
    router.push(`/companies?${params.toString()}`)
  }

  const toggleCompare = (id: string) => {
    setCompareList(prev => {
      const next = prev.includes(id)
        ? prev.filter(v => v !== id)
        : prev.length < 3 ? [...prev, id] : prev
      sessionStorage.setItem('compareList', JSON.stringify(next))
      return next
    })
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-6">企業を探す</h1>

      {/* Search & Filter */}
      <form onSubmit={handleSearch} className="bg-white rounded-2xl shadow p-5 mb-8 flex flex-col md:flex-row gap-3">
        <input
          type="text"
          placeholder="企業名を検索..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          className="flex-1 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400"
        />
        <div className="relative flex-1 min-w-[150px]">
          <select
            value={industryInput}
            onChange={e => setIndustryInput(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          >
            <option value="">業界（すべて）</option>
            {displayIndustries.map(ind => (
              <option key={ind} value={ind}>{ind}</option>
            ))}
          </select>
        </div>
        <div className="relative flex-1 min-w-[150px]">
          <select
            value={locationInput}
            onChange={e => setLocationInput(e.target.value)}
            className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400 bg-white"
          >
            <option value="">勤務地（すべて）</option>
            {PREFECTURES.map(pref => (
              <option key={pref} value={pref}>{pref}</option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          className="bg-emerald-800 text-white px-6 py-2.5 rounded-xl text-sm font-semibold hover:bg-emerald-700 transition"
        >
          検索
        </button>
      </form>

      {/* Results count */}
      {!loading && (
        <p className="text-sm text-gray-500 mb-4">
          {companies.length} 件の企業が見つかりました
          {(q || industry || location) && (
            <button
              onClick={() => { setSearchInput(''); setIndustryInput(''); setLocationInput(''); router.push('/companies') }}
              className="ml-3 text-emerald-600 hover:underline"
            >
              絞り込みをリセット
            </button>
          )}
        </p>
      )}

      {/* Company Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl h-72 animate-pulse shadow"></div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="text-center py-20 text-gray-400">
          <p className="text-5xl mb-4">🔍</p>
          <p className="text-lg">企業が見つかりませんでした</p>
          <p className="text-sm mt-2">検索条件を変えてみてください</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {companies.map(company => (
            <CompanyCard
              key={company.id}
              company={company}
              isSelected={compareList.includes(company.id)}
              onCompareToggle={toggleCompare}
              showCompare={true}
            />
          ))}
        </div>
      )}

      <CompareBar compareList={compareList} companies={companies} onRemove={toggleCompare} />
    </div>
  )
}

export default function CompaniesPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-gray-400">読み込み中...</div>}>
      <CompaniesContent />
    </Suspense>
  )
}
