'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { getRegisteredIndustries } from '@/app/actions/companies'

export default function HeroSearch() {
  const router = useRouter()
  const [industries, setIndustries] = useState<string[]>([])
  const [selectedIndustry, setSelectedIndustry] = useState('')
  const [keyword, setKeyword] = useState('')

  useEffect(() => {
    const fetchIndustries = async () => {
      const data = await getRegisteredIndustries()
      setIndustries(data)
    }
    fetchIndustries()
  }, [])

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault()
    const params = new URLSearchParams()
    if (keyword) params.set('q', keyword)
    if (selectedIndustry) params.set('industry', selectedIndustry)
    router.push(`/companies?${params.toString()}`)
  }

  return (
    <div className="bg-white p-2 rounded-[24px] shadow-[0_10px_40px_rgba(15,23,42,0.08)] flex flex-col sm:flex-row gap-2 border border-gray-100">
      <div className="flex-1 flex items-center px-4 border-b sm:border-b-0 sm:border-r border-gray-100">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input 
          type="text" 
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="企業名で検索" 
          className="w-full py-3 text-sm focus:outline-none font-medium placeholder:text-gray-300"
          onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
        />
      </div>
      
      <div className="flex-1 flex items-center px-4">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-400 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
        </svg>
        <select
          value={selectedIndustry}
          onChange={(e) => setSelectedIndustry(e.target.value)}
          className="w-full py-3 text-sm focus:outline-none font-medium text-gray-700 bg-transparent appearance-none cursor-pointer"
        >
          <option value="">すべての業界</option>
          {industries.map(ind => (
            <option key={ind} value={ind}>{ind}</option>
          ))}
        </select>
      </div>

      <button 
        onClick={() => handleSearch()}
        className="btn-primary sm:w-32 flex items-center justify-center py-3 sm:py-0"
      >
        探す
      </button>
    </div>
  )
}
