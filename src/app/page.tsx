import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import CompanyCard from '@/components/CompanyCard'
import { Company } from '@/lib/types'
import HeroSearch from '@/components/HeroSearch'
import { getRegisteredIndustries } from '@/app/actions/companies'

export const revalidate = 60

async function getFeaturedCompanies(): Promise<Company[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('companies')
      .select('*')
      .eq('publish_status', 'published')
      .eq('is_deleted', false)
      .order('created_at', { ascending: false })
      .limit(3)

    if (error) return []
    return data as Company[]
  } catch {
    return []
  }
}

export default async function HomePage() {
  const [companies, registeredIndustries] = await Promise.all([
    getFeaturedCompanies(),
    getRegisteredIndustries()
  ])

  return (
    <div className="overflow-hidden">
      {/* 10-1 & 10-2. ヘッダー & ファーストビュー */}
      <section className="relative bg-white pt-10 pb-20 lg:pt-20 lg:pb-32 overflow-hidden">
        {/* Decorative background */}
        <div className="absolute top-0 right-0 -translate-y-1/2 translate-x-1/2 w-[600px] h-[600px] bg-emerald-50 rounded-full blur-3xl opacity-50 z-0"></div>
        
        <div className="max-w-[1200px] mx-auto px-6 relative z-10">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            {/* Left: Copy & Search */}
            <div className="flex-1 text-center lg:text-left">
              <span className="inline-block py-1.5 px-4 rounded-full bg-emerald-50 text-[#047857] text-xs font-bold tracking-widest uppercase mb-6">
                企業比較サービス
              </span>
              <h1 className="text-4xl lg:text-6xl font-extrabold text-[#0F172A] leading-[1.15] mb-6 tracking-tight">
                合う企業、<br />見つけやすく。
              </h1>
              <p className="text-lg lg:text-xl text-gray-500 font-medium mb-10 leading-relaxed">
                気になる企業を、シンプルに比較。
              </p>
              
              <div className="max-w-xl mx-auto lg:mx-0">
                <HeroSearch />
              </div>
              
            </div>

            {/* Right: UI Mockup */}
            <div className="flex-1 w-full max-w-[500px] lg:max-w-none relative">
              <div className="relative z-10 space-y-4 -rotate-2 scale-105">
                {/* Mock Card 1 */}
                <div className="bg-white p-5 rounded-[24px] shadow-[0_20px_50px_rgba(15,23,42,0.1)] border border-gray-100 w-full animate-float">
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-12 h-12 bg-emerald-50 rounded-xl flex items-center justify-center font-bold text-[#10B981]">K</div>
                    <div>
                      <p className="font-bold text-gray-900">かつナビ株式会社</p>
                      <p className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full inline-block">IT・通信</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-[10px] text-gray-400 font-bold mb-1">平均年収</p>
                      <p className="text-sm font-extrabold text-gray-800">850万円</p>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-xl">
                      <p className="text-[10px] text-gray-400 font-bold mb-1">月残業</p>
                      <p className="text-sm font-extrabold text-gray-800">12h</p>
                    </div>
                  </div>
                </div>
                {/* Mock Card 2 */}
                <div className="bg-white p-5 rounded-[24px] shadow-[0_20px_50px_rgba(15,23,42,0.1)] border border-gray-100 w-4/5 ml-auto -translate-y-4 rotate-3 opacity-90">
                  <div className="flex items-center gap-4 mb-3">
                    <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center font-bold text-blue-500">O</div>
                    <p className="font-bold text-gray-900 text-sm">株式会社おにぎり</p>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full w-full mb-2"></div>
                  <div className="h-2 bg-gray-100 rounded-full w-2/3"></div>
                </div>
              </div>
              {/* Background accent */}
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] border-2 border-dashed border-emerald-100 rounded-full -z-10"></div>
            </div>
          </div>
        </div>
      </section>


      {/* 10-4. 業界で探す */}
      <section className="bg-white py-20 lg:py-32">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] mb-4">業界で探す</h2>
            <div className="w-12 h-1 bg-emerald-500 mx-auto rounded-full"></div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {registeredIndustries.length > 0 ? registeredIndustries.map((ind) => (
              <Link
                key={ind}
                href={`/companies?industry=${encodeURIComponent(ind)}`}
                className="group bg-white border border-gray-100 p-6 rounded-[24px] hover:border-emerald-200 hover:shadow-subtle transition-all duration-300 flex items-center justify-between"
              >
                <div>
                  <span className="text-sm font-bold text-gray-600 group-hover:text-emerald-600 transition-colors uppercase tracking-tight">{ind}</span>
                </div>
                <div className="w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center group-hover:bg-emerald-50 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-gray-300 group-hover:text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </Link>
            )) : (
              <div className="col-span-full py-10 text-center text-gray-400 font-bold italic tracking-widest uppercase text-xs">
                業界データ準備中...
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 10-5. 比較機能紹介 */}
      <section className="bg-[#F8FAFC] py-20 lg:py-32 overflow-hidden relative">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center justify-between mb-20 gap-8">
            <div className="text-center lg:text-left">
              <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] mb-4">企業比較</h2>
              <p className="text-lg text-gray-500 font-medium">気になる企業を並べて見る。</p>
            </div>
            <Link href="/companies/compare" className="btn-secondary !bg-white">
              比較する
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="card-modern p-10 group hover:-translate-y-2">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#10B981] mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-[#0F172A] mb-4">探す</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">条件や業界から<br className="hidden lg:block" />企業を見つける</p>
            </div>
            <div className="card-modern p-10 group hover:-translate-y-2">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#10B981] mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-[#0F172A] mb-4">比べる</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">気になる企業を<br className="hidden lg:block" />並べて比較する</p>
            </div>
            <div className="card-modern p-10 group hover:-translate-y-2">
              <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-[#10B981] mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-all duration-300">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-extrabold text-[#0F172A] mb-4">見つける</h3>
              <p className="text-sm text-gray-500 leading-relaxed font-medium">違いを見ながら<br className="hidden lg:block" />候補を整理する</p>
            </div>
          </div>
        </div>
      </section>

      {/* 10-6. 新着企業 */}
      <section className="bg-white py-20 lg:py-32">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="flex items-center justify-between mb-16">
            <div>
              <h2 className="text-3xl lg:text-4xl font-extrabold text-[#0F172A] mb-3">新着企業</h2>
              <div className="w-12 h-1 bg-emerald-500 rounded-full"></div>
            </div>
            <Link href="/companies" className="text-sm font-bold text-[#10B981] hover:underline">
              すべての企業を見る
            </Link>
          </div>

          {companies.length === 0 ? (
            <div className="text-center py-20 bg-[#F8FAFC] rounded-[32px] border-2 border-dashed border-gray-100 text-gray-400">
              <p className="text-sm font-bold">現在、準備中です。</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {companies.map((company) => (
                <CompanyCard key={company.id} company={company} showCompare={false} />
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 10-7. 企業掲載CTA */}
      <section className="bg-white py-20 lg:py-32">
        <div className="max-w-[1200px] mx-auto px-6">
          <div className="bg-[#0F172A] rounded-[40px] p-10 lg:p-20 relative overflow-hidden flex flex-col lg:flex-row items-center gap-16">
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-[100px]"></div>
            
            <div className="flex-1 relative z-10 text-center lg:text-left">
              <h2 className="text-3xl lg:text-5xl font-extrabold text-white mb-6">
                企業掲載はこちら
              </h2>
              <p className="text-lg lg:text-xl text-gray-400 font-medium mb-10">
                会社の魅力を、シンプルに届ける。
              </p>
              <Link href="/admin/login" className="btn-primary !py-4 !px-12 !bg-emerald-500 hover:!bg-emerald-400 inline-block">
                掲載をはじめる
              </Link>
            </div>

            <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-4 relative z-10">
              {[
                { title: '情報を見やすく掲載', desc: '企業の強みを端的にアピール' },
                { title: '更新しやすい画面', desc: 'いつでも簡単に情報をアップデート' },
                { title: '項目を整理', desc: '比較されやすい構成で魅力を強調' },
                { title: '分析ツール', desc: '閲覧数や反響をグラフでチェック' }
              ].map((m, i) => (
                <div key={i} className="bg-white/5 backdrop-blur-md border border-white/10 p-6 rounded-2xl">
                  <p className="font-bold text-white text-sm mb-1">{m.title}</p>
                  <p className="text-[10px] text-gray-500 font-bold">{m.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
