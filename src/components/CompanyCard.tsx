import Link from 'next/link'
import Image from 'next/image'
import { Company } from '@/lib/types'

interface CompanyCardProps {
  company: Company
  isSelected?: boolean
  onCompareToggle?: (id: string) => void
  showCompare?: boolean
}

export default function CompanyCard({
  company,
  isSelected = false,
  onCompareToggle,
  showCompare = true,
}: CompanyCardProps) {
  return (
    <div className="card-modern overflow-hidden flex flex-col h-full bg-white group">
      {/* Logo area */}
      <div className="h-44 bg-gray-50 flex items-center justify-center px-8 border-b border-gray-100 transition-colors group-hover:bg-white">
        {company.logo_url ? (
          <div className="relative w-full h-full">
            <Image
              src={company.logo_url}
              alt={`${company.name}のロゴ`}
              fill
              className="object-contain p-6"
            />
          </div>
        ) : (
          <span className="text-6xl text-gray-200 font-bold select-none group-hover:text-emerald-100 transition-colors">
            {company.name.charAt(0)}
          </span>
        )}
      </div>

      <div className="p-7 flex flex-col flex-1 gap-4 text-left">
        {/* Industry tag */}
        <span className="inline-block text-[10px] font-bold text-[#047857] bg-emerald-50 rounded-full px-3 py-1 w-fit uppercase tracking-widest mb-1">
          {company.industry}
        </span>

        <h2 className="text-xl font-bold text-gray-900 leading-snug line-clamp-1">
          {company.name}
        </h2>

        {company.introduction && (
          <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed h-11">
            {company.introduction}
          </p>
        )}

        <div className="flex flex-col gap-2.5 mt-2 bg-[#F8FAFC] p-5 rounded-2xl border border-gray-100">
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-400">平均年収</span>
            <span className="font-bold text-[#0F172A]">{company.avg_salary ? `${company.avg_salary.toLocaleString()}万円` : '---'}</span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="font-semibold text-gray-400">月平均残業</span>
            <span className="font-bold text-[#0F172A]">{company.avg_overtime != null ? `${company.avg_overtime}h` : '---'}</span>
          </div>
        </div>

        <div className="flex gap-3 mt-auto pt-5">
          <Link
            href={`/companies/${company.id}`}
            className="flex-1 text-center btn-primary !py-3.5"
          >
            詳細を見る
          </Link>
          {showCompare && onCompareToggle && (
            <button
              onClick={() => onCompareToggle(company.id)}
              title="比較リストに追加"
              className={`p-3.5 rounded-[16px] transition-all border-2 flex items-center justify-center ${
                isSelected
                  ? 'bg-[#10B981] text-white border-[#10B981] shadow-lg shadow-emerald-100'
                  : 'bg-white text-gray-300 border-gray-100 hover:border-emerald-200 hover:text-emerald-500'
              }`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isSelected ? "M5 13l4 4L19 7" : "M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"} />
              </svg>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
