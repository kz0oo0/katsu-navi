'use client'

import { useState, useEffect } from 'react'
import { Company } from '@/lib/types'
import { createClient } from '@/lib/supabase/client'
import CompareBar from './CompareBar'

interface CompareActionProps {
  company: Company
}

export default function CompareAction({ company }: CompareActionProps) {
  const [compareList, setCompareList] = useState<string[]>([])
  const [allComparedCompanies, setAllComparedCompanies] = useState<Company[]>([company])

  useEffect(() => {
    const stored = sessionStorage.getItem('compareList')
    if (stored) {
      const ids = JSON.parse(stored) as string[]
      setCompareList(ids)
      fetchMissingCompanies(ids)
    }

    // Listen for storage changes (optional, for cross-tab or complex sync)
    const handleStorage = () => {
      const latest = sessionStorage.getItem('compareList')
      if (latest) {
        const ids = JSON.parse(latest)
        setCompareList(ids)
        fetchMissingCompanies(ids)
      }
    }
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  const fetchMissingCompanies = async (ids: string[]) => {
    const supabase = createClient()
    const { data } = await supabase
      .from('companies')
      .select('*')
      .in('id', ids)
      .eq('is_deleted', false)
    
    if (data) {
      setAllComparedCompanies(data as Company[])
    }
  }

  const toggleCompare = () => {
    const isSelected = compareList.includes(company.id)
    const next = isSelected
      ? compareList.filter(id => id !== company.id)
      : compareList.length < 3 ? [...compareList, company.id] : compareList
    
    sessionStorage.setItem('compareList', JSON.stringify(next))
    setCompareList(next)
    
    // Trigger custom event for other components if needed
    window.dispatchEvent(new Event('storage'))
  }

  const handleRemove = (id: string) => {
    const next = compareList.filter(v => v !== id)
    sessionStorage.setItem('compareList', JSON.stringify(next))
    setCompareList(next)
    window.dispatchEvent(new Event('storage'))
  }

  const isSelected = compareList.includes(company.id)

  return (
    <>
      <button
        onClick={toggleCompare}
        className={`flex items-center gap-2 px-6 py-3 rounded-2xl font-black transition-all border-2 ${
          isSelected
            ? 'bg-emerald-600 text-white border-emerald-600 shadow-lg shadow-emerald-900/10'
            : 'bg-white text-emerald-700 border-emerald-100 hover:border-emerald-200'
        }`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isSelected ? "M5 13l4 4L19 7" : "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"} />
        </svg>
        {isSelected ? '比較中' : '比較に追加'}
      </button>

      <CompareBar 
        compareList={compareList} 
        companies={allComparedCompanies} 
        onRemove={handleRemove} 
      />
    </>
  )
}
