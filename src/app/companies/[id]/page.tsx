import { createClient } from '@/lib/supabase/server'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { Company } from '@/lib/types'
import TrackView from '@/components/TrackView'
import CompareAction from '@/components/CompareAction'

export const revalidate = 60

async function getCompany(id: string): Promise<Company | null> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .eq('publish_status', 'published')
    .eq('is_deleted', false)
    .single()
  if (error || !data) return null
  return data as Company
}

function Section({ title, icon, children }: { title: string; icon: string; children: React.ReactNode }) {
  return (
    <section className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-8">
      <h2 className="text-xl font-bold text-gray-900 mb-6 flex items-center gap-3">
        <span className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center text-xl">{icon}</span> {title}
      </h2>
      <div className="text-gray-700 leading-relaxed">
        {children}
      </div>
    </section>
  )
}

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (value == null || value === '') return null
  return (
    <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 py-4 border-b border-gray-50 last:border-0">
      <span className="w-32 shrink-0 text-sm font-semibold text-gray-400 capitalize">{label}</span>
      <span className="text-sm font-medium text-gray-800">{value}</span>
    </div>
  )
}

export default async function CompanyDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const company = await getCompany(id)
  if (!company) notFound()

  return (
    <div className="max-w-5xl mx-auto px-4 py-12">
      <TrackView companyId={company.id} />
      
      {/* Breadcrumb / Back */}
      <div className="mb-8">
        <Link href="/companies" className="inline-flex items-center text-sm font-medium text-gray-500 hover:text-emerald-600 transition-colors">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          企業一覧に戻る
        </Link>
      </div>

      {/* Header card */}
      <div className="bg-gradient-to-br from-emerald-900 via-emerald-800 to-teal-900 rounded-[32px] text-white p-8 md:p-12 mb-10 flex flex-col md:flex-row gap-8 items-center shadow-2xl relative overflow-hidden">
        {/* Background blobs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl"></div>

        <div className="w-32 h-32 bg-white rounded-[24px] flex items-center justify-center shrink-0 shadow-xl overflow-hidden relative z-10 border-4 border-white/10">
          {company.logo_url ? (
            <Image src={company.logo_url} alt={company.name} width={128} height={128} className="object-contain p-4" />
          ) : (
            <span className="text-5xl font-bold text-emerald-800">{company.name.charAt(0)}</span>
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left relative z-10">
          <div className="inline-block px-3 py-1 bg-white/10 backdrop-blur-md rounded-full text-xs font-bold tracking-wider uppercase mb-3">
            {company.industry}
          </div>
          <h1 className="text-3xl md:text-4xl font-black mb-3 tracking-tight">{company.name}</h1>
          <p className="text-emerald-100/80 flex items-center gap-2 justify-center md:justify-start font-medium">
            <span className="text-emerald-400">📍</span> {company.location}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 relative z-10 w-full md:w-auto">
          <CompareAction company={company} />
          {company.company_url && (
            <a href={company.company_url} target="_blank" rel="noopener noreferrer"
              className="bg-white/10 backdrop-blur-md hover:bg-white/20 text-white px-6 py-3 rounded-2xl text-sm font-bold transition-all border border-white/20 text-center">
              公式サイト
            </a>
          )}
          {company.recruitment_url && (
            <a href={company.recruitment_url} target="_blank" rel="noopener noreferrer"
              className="bg-amber-400 hover:bg-amber-300 text-emerald-950 px-6 py-3 rounded-2xl text-sm font-black transition-all shadow-lg shadow-amber-900/20 text-center">
              採用情報を見る
            </a>
          )}
        </div>
      </div>

      <div className="grid gap-10">
        {/* Key Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {company.avg_salary != null && (
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 flex items-center gap-5">
              <div className="w-12 h-12 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl">💰</div>
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">平均年収</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-black text-gray-900">{company.avg_salary.toLocaleString()}</p>
                  <p className="text-xs font-bold text-gray-500">万円</p>
                </div>
              </div>
            </div>
          )}
          {company.avg_overtime != null && (
            <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 flex items-center gap-5">
              <div className="w-12 h-12 bg-indigo-50 rounded-2xl flex items-center justify-center text-2xl">⏰</div>
              <div>
                <p className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">平均残業</p>
                <div className="flex items-baseline gap-1">
                  <p className="text-2xl font-black text-gray-900">{company.avg_overtime}</p>
                  <p className="text-xs font-bold text-gray-500">時間/月</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Content sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2 space-y-8">
            {company.introduction && (
              <Section title="企業紹介" icon="🏢">
                <p className="text-base text-gray-600 leading-loose whitespace-pre-wrap">{company.introduction}</p>
              </Section>
            )}

            {company.description && (
              <Section title="事業内容" icon="💼">
                <p className="text-base text-gray-600 leading-loose whitespace-pre-wrap">{company.description}</p>
              </Section>
            )}

            {(company.strengths || company.weaknesses || company.ideal_candidate) && (
              <Section title="企業の特徴" icon="⭐">
                <div className="space-y-8">
                  {company.strengths && (
                    <div>
                      <h3 className="text-sm font-bold text-emerald-600 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs">✓</span>
                        強み・メリット
                      </h3>
                      <p className="text-base text-gray-600 leading-loose whitespace-pre-wrap pl-8">{company.strengths}</p>
                    </div>
                  )}
                  {company.weaknesses && (
                    <div>
                      <h3 className="text-sm font-bold text-amber-600 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-amber-100 rounded-full flex items-center justify-center text-xs">!</span>
                        課題・弱み
                      </h3>
                      <p className="text-base text-gray-600 leading-loose whitespace-pre-wrap pl-8">{company.weaknesses}</p>
                    </div>
                  )}
                  {company.ideal_candidate && (
                    <div className="bg-emerald-50/50 p-6 rounded-2xl border border-emerald-100">
                      <h3 className="text-sm font-bold text-emerald-800 mb-3 flex items-center gap-2">
                        <span className="w-6 h-6 bg-emerald-200 rounded-full flex items-center justify-center text-xs text-emerald-800">👤</span>
                        こんな人に向いている
                      </h3>
                      <p className="text-base text-gray-700 leading-loose whitespace-pre-wrap">{company.ideal_candidate}</p>
                    </div>
                  )}
                </div>
              </Section>
            )}
          </div>

          <div className="space-y-8">
            {company.benefits && (
              <Section title="福利厚生" icon="🎁">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{company.benefits}</p>
              </Section>
            )}

            <Section title="基本情報" icon="📋">
              <div className="space-y-1">
                <InfoRow label="業界" value={company.industry} />
                <div className="flex flex-col gap-1 py-4 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-semibold text-gray-400 capitalize uppercase tracking-widest text-[10px]">本社所在地</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    <span className="text-[10px] font-bold bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-lg border border-emerald-100">
                      {company.headquarters || '未設定'}
                    </span>
                  </div>
                </div>
                <div className="flex flex-col gap-1 py-4 border-b border-gray-50 last:border-0">
                  <span className="text-sm font-semibold text-gray-400 capitalize uppercase tracking-widest text-[10px]">勤務地（拠点）</span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {company.location?.split(',').map(loc => (
                      <span key={loc.trim()} className="text-[10px] font-bold bg-gray-100 text-gray-600 px-2 py-0.5 rounded-lg">
                        {loc.trim()}
                      </span>
                    ))}
                  </div>
                </div>
                {company.hiring_flow && (
                  <div className="py-6">
                    <h3 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <span className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center text-xs">🚀</span>
                      採用フロー
                    </h3>
                    <div className="space-y-4 relative pl-4 border-l-2 border-emerald-100 ml-2">
                      {company.hiring_flow.split('→').map((step, i) => (
                        <div key={i} className="relative">
                          <span className="absolute -left-[21px] top-1.5 w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]"></span>
                          <p className="text-sm font-bold text-gray-700">{step.trim()}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <Link 
                  href="/companies"
                  className="mt-6 block w-full bg-gray-50 hover:bg-gray-100 text-gray-600 py-3 rounded-xl text-xs font-bold text-center transition-colors"
                >
                  同じ業界の企業を探す
                </Link>
              </div>
            </Section>
          </div>
        </div>
      </div>
    </div>
  )
}
