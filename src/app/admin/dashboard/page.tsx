'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Company, Profile } from '@/lib/types'
import { approveAdminAction, deleteAdminAction, updateAdminRoleAction, getAdminProfilesWithVerificationAction, ensureCompanyLogosBucketAction } from '@/app/admin/actions'
import { getCompanyAnalytics } from '@/app/actions/analytics'
import { User } from '@supabase/supabase-js'

const PRIMARY_ADMIN_EMAIL = 'kazuhiro.m1224@gmail.com'

export default function AdminDashboard() {
  const router = useRouter()
  const [user, setUser] = useState<User | null>(null)
  const [userProfile, setUserProfile] = useState<Profile | null>(null)
  const [companies, setCompanies] = useState<Company[]>([])
  const [allProfiles, setAllProfiles] = useState<Profile[]>([])
  const [analytics, setAnalytics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'companies' | 'admins' | 'analytics'>('companies')
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')

  const fetchData = useCallback(async (currentUser: User, currentProfile: Profile) => {
    const supabase = createClient()

    const { data: co } = await supabase
      .from('companies').select('*').eq('is_deleted', false).order('created_at', { ascending: false })
    setCompanies((co as Company[]) || [])

    try {
      if (currentProfile.role === 'super_admin') {
        const [profiles, analyticsData] = await Promise.all([
          getAdminProfilesWithVerificationAction(),
          getCompanyAnalytics()
        ])
        setAllProfiles(profiles as Profile[])
        setAnalytics(analyticsData)
      } else {
        const analyticsData = await getCompanyAnalytics(currentUser.id)
        setAnalytics(analyticsData)
      }
    } catch (err) {
      console.error('Analytics fetch error:', err)
    }
    
    setLoading(false)
  }, [])

  useEffect(() => {
    const supabase = createClient()
    
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        router.push('/admin/login')
        return
      }
      setUser(user)

      // Ensure storage bucket is ready
      ensureCompanyLogosBucketAction()

      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()
      
      if (!profile) {
        setLoading(false)
        return
      }
      setUserProfile(profile as Profile)
      fetchData(user, profile as Profile)
    }

    init()
  }, [router, fetchData])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/admin/login')
  }

  const togglePublish = async (company: Company) => {
    const supabase = createClient()
    const newStatus = company.publish_status === 'published' ? 'draft' : 'published'
    await supabase.from('companies').update({ publish_status: newStatus, updated_at: new Date().toISOString() }).eq('id', company.id)
    setCompanies(prev => prev.map(c => c.id === company.id ? { ...c, publish_status: newStatus } : c))
  }

  const handleDelete = async (id: string) => {
    if (!confirm('この企業を削除しますか？')) return
    const supabase = createClient()
    await supabase.from('companies').update({ is_deleted: true, updated_at: new Date().toISOString() }).eq('id', id)
    setCompanies(prev => prev.filter(c => c.id !== id))
  }

  const approveAdmin = async (id: string) => {
    try {
      await approveAdminAction(id)
      setAllProfiles(prev => prev.map(p => p.id === id ? { ...p, is_approved: true } : p))
    } catch (err: any) {
      alert('承認に失敗しました: ' + err.message)
    }
  }
  
  const deleteProfile = async (id: string, displayName: string) => {
    if (id === user?.id) { alert('自分自身を削除することはできません。'); return }
    if (!confirm(`管理者「${displayName}」を完全に削除してもよろしいですか？\n(認証アカウントを含め全て削除されます)`)) return
    
    try {
      await deleteAdminAction(id)
      setAllProfiles(prev => prev.filter(p => p.id !== id))
    } catch (err: any) {
      alert('削除に失敗しました: ' + err.message)
    }
  }
  
  const updateRole = async (id: string, role: 'admin' | 'super_admin') => {
    if (id === user?.id) { alert('自分自身の権限を変更することはできません。'); return }
    try {
      await updateAdminRoleAction(id, role)
      setAllProfiles(prev => prev.map(p => p.id === id ? { ...p, role } : p))
    } catch (err: any) {
      alert('権限変更に失敗しました: ' + err.message)
    }
  }

  if (loading) return <div className="p-8 text-center text-gray-400 font-bold">読み込み中...</div>

  // Access check
  if (!userProfile?.is_approved) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center px-4">
        <div className="max-w-md w-full text-center">
          <div className="text-6xl mb-6">⏳</div>
          <h1 className="text-2xl font-black text-gray-900 mb-4 tracking-tight">承認待ちです</h1>
          <p className="text-gray-500 text-sm mb-8 leading-relaxed font-bold">
            アカウントの登録申請を受け付けました。<br />
            上位管理者による承認が完了するまで、ダッシュボードはご利用いただけません。
          </p>
          <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-100 text-left mb-8">
            <p className="text-[11px] font-black text-emerald-800 uppercase tracking-widest mb-2">現在のステータス</p>
            <p className="text-sm font-bold text-emerald-900 mt-1">
              管理者承認: <span className="text-amber-600 font-black">承認待ち...</span>
            </p>
          </div>
          <button onClick={handleLogout} className="text-gray-400 font-bold hover:text-gray-600 transition underline underline-offset-4 text-sm">
            ログアウトして戻る
          </button>
        </div>
      </div>
    )
  }

  const role = userProfile.role || 'admin'
  const pendingList = allProfiles.filter(p => !p.is_approved)
  const activeList = allProfiles.filter(p => p.is_approved)

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
        <div>
          <h1 className="text-3xl font-black text-gray-900 tracking-tight text-emerald-900">管理者ダッシュボード</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
            <p className="text-sm font-bold text-gray-500">
              {userProfile.email} <span className="mx-2 text-gray-300">|</span> 
              <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-lg uppercase tracking-tight">
                {role === 'super_admin' ? '上位管理者' : '一般管理者'}
              </span>
            </p>
          </div>
        </div>
        <div className="flex gap-4">
          <Link href="/admin/companies/new"
            className="bg-emerald-800 text-white px-6 py-3 rounded-2xl text-sm font-black hover:bg-emerald-700 transition-all shadow-lg shadow-emerald-900/10">
            + 企業を新規登録
          </Link>
          <button onClick={handleLogout}
            className="bg-gray-50 text-gray-400 border border-gray-100 px-6 py-3 rounded-2xl text-sm font-bold hover:bg-red-50 hover:text-red-500 transition-all">
            ログアウト
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">🏢</div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">総企業数</p>
            <p className="text-3xl font-black text-gray-900">{companies.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">✅</div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">公開中</p>
            <p className="text-3xl font-black text-emerald-600">{companies.filter(c => c.publish_status === 'published').length}</p>
          </div>
        </div>
        <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 flex items-center gap-5">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">📝</div>
          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">下書き</p>
            <p className="text-3xl font-black text-amber-600">{companies.filter(c => c.publish_status === 'draft').length}</p>
          </div>
        </div>
        {role === 'super_admin' && (
          <div className="bg-white rounded-[24px] shadow-sm border border-gray-100 p-6 flex items-center gap-5">
            <div className="w-14 h-14 bg-red-50 rounded-2xl flex items-center justify-center text-2xl shadow-inner">👤</div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">承認待ち</p>
              <p className="text-3xl font-black text-red-500">{pendingList.length}</p>
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-4 mb-8 bg-gray-50/50 p-2 rounded-2xl border border-gray-100 w-fit">
        <button onClick={() => setTab('companies')}
          className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${tab === 'companies' ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-900/10' : 'text-gray-400 hover:text-gray-600 hover:bg-white'}`}>
          企業管理
        </button>
        <button onClick={() => setTab('analytics')}
          className={`px-8 py-3 rounded-xl text-sm font-black transition-all ${tab === 'analytics' ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-900/10' : 'text-gray-400 hover:text-gray-600 hover:bg-white'}`}>
          分析ツール
        </button>
        {role === 'super_admin' && (
          <button onClick={() => setTab('admins')}
            className={`px-8 py-3 rounded-xl text-sm font-black transition-all flex items-center gap-2 ${tab === 'admins' ? 'bg-emerald-800 text-white shadow-lg shadow-emerald-900/10' : 'text-gray-400 hover:text-gray-600 hover:bg-white'}`}>
            管理者管理
            {pendingList.length > 0 && <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px] border-2 border-white">{pendingList.length}</span>}
          </button>
        )}
      </div>

      {/* Content Area */}
      <div className="bg-white rounded-[32px] shadow-sm border border-gray-100 overflow-hidden">
        {tab === 'companies' && (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-gray-50/50 border-b border-gray-100">
                  <th className="text-left px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">企業情報</th>
                  <th className="text-left px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest hidden md:table-cell">業界</th>
                  <th className="text-center px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">ステータス</th>
                  <th className="text-right px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">操作</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {companies.map(c => (
                  <tr key={c.id} className="hover:bg-gray-50/30 transition-all group">
                    <td className="px-8 py-6">
                      <div className="font-black text-gray-900 group-hover:text-emerald-700 transition-colors uppercase italic text-sm">{c.name}</div>
                      <div className="text-[10px] text-gray-300 mt-0.5 tracking-wider truncate max-w-xs">{c.location}</div>
                    </td>
                    <td className="px-8 py-6 hidden md:table-cell">
                      <span className="text-xs font-bold text-gray-500 bg-gray-100 px-3 py-1 rounded-lg">{c.industry}</span>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-black px-4 py-1.5 rounded-full uppercase tracking-widest ${
                        c.publish_status === 'published' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                      }`}>
                        <span className={`w-1.5 h-1.5 rounded-full ${c.publish_status === 'published' ? 'bg-emerald-500' : 'bg-amber-500'}`}></span>
                        {c.publish_status === 'published' ? '公開済み' : '下書き'}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={() => togglePublish(c)}
                          className="w-10 h-10 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-700 hover:text-white transition-all flex items-center justify-center font-bold shadow-sm"
                          title={c.publish_status === 'published' ? '非公開にする' : '公開する'}>
                          {c.publish_status === 'published' ? '●' : '○'}
                        </button>
                        <Link href={`/admin/companies/${c.id}/edit`}
                          className="w-10 h-10 bg-gray-50 text-gray-700 rounded-xl hover:bg-gray-900 hover:text-white transition-all flex items-center justify-center font-bold shadow-sm"
                          title="編集する">
                          ✎
                        </Link>
                        <button onClick={() => handleDelete(c.id)}
                          className="w-10 h-10 bg-red-50 text-red-600 rounded-xl hover:bg-red-600 hover:text-white transition-all flex items-center justify-center font-bold shadow-sm"
                          title="削除する">
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {companies.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-20">
                      <div className="text-4xl mb-4">🔍</div>
                      <p className="text-gray-400 font-bold">企業がまだ登録されていません</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'analytics' && (
          <div className="p-8 space-y-12">
            <div>
              <div className="flex items-center gap-3 mb-8 px-2">
                <span className="w-1.5 h-8 bg-emerald-500 rounded-full"></span>
                <div>
                  <h3 className="text-xl font-black text-gray-900 tracking-tight italic">プラットフォーム分析</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">直近7日間の反響推移</p>
                </div>
              </div>
              
              <div className="bg-gray-50/50 rounded-[32px] border border-gray-100 p-8">
                {(() => {
                  const last7Days = [...Array(7)].map((_, i) => {
                    const d = new Date()
                    d.setDate(d.getDate() - (6 - i))
                    return d.toISOString().split('T')[0]
                  })
                  
                  const dailyCounts = last7Days.map(date => ({
                    date: date.split('-').slice(1).join('/'),
                    count: analytics.filter(v => v.viewed_at.startsWith(date)).length
                  }))
                  
                  const maxCount = Math.max(...dailyCounts.map(d => d.count), 1)
                  
                  return (
                    <div className="flex flex-col gap-8">
                      <div className="flex items-end justify-between h-48 gap-2 sm:gap-4 px-4 border-b border-gray-200 pb-2">
                        {dailyCounts.map((d, i) => (
                          <div key={i} className="flex-1 flex flex-col items-center gap-3 group">
                            <div className="relative w-full flex justify-center items-end h-full">
                              <div 
                                className="w-full max-w-[40px] bg-emerald-500 rounded-t-xl transition-all duration-500 hover:bg-emerald-400 shadow-[0_-4px_15px_rgba(16,185,129,0.2)]"
                                style={{ height: `${(d.count / maxCount) * 100}%`, minHeight: d.count > 0 ? '4px' : '0' }}
                              >
                                {d.count > 0 && (
                                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-[10px] font-bold px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20">
                                    {d.count} 閲覧
                                  </div>
                                )}
                              </div>
                            </div>
                            <span className="text-[10px] font-black text-gray-400 group-hover:text-emerald-700 transition-colors">{d.date}</span>
                          </div>
                        ))}
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">総閲覧数 (30日間)</p>
                          <p className="text-2xl font-black text-gray-900">{analytics.length}</p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">最も閲覧された企業</p>
                          <p className="text-sm font-bold text-emerald-700 truncate">
                            {(() => {
                              const counts: any = {}
                              analytics.forEach(v => {
                                const name = v.companies?.name || '不明'
                                counts[name] = (counts[name] || 0) + 1
                              })
                              const top = Object.entries(counts).sort((a: any, b: any) => b[1] - a[1])[0]
                              return top ? `${top[0]} (${top[1]})` : 'データなし'
                            })()}
                          </p>
                        </div>
                        <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">成長率</p>
                          <p className="text-sm font-bold text-gray-500 italic">準備中...</p>
                        </div>
                      </div>

                      {/* 企業別統計 */}
                      <div className="mt-4">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center gap-2">
                            <span className="w-1 h-4 bg-emerald-400 rounded-full"></span>
                            <h4 className="text-xs font-black text-gray-700 uppercase tracking-widest">企業別パフォーマンス</h4>
                          </div>
                          <select 
                            value={selectedCompanyId}
                            onChange={(e) => setSelectedCompanyId(e.target.value)}
                            className="text-[10px] font-black text-gray-500 border border-gray-100 bg-white rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-emerald-500 focus:outline-none shadow-sm"
                          >
                            <option value="">全ての企業</option>
                            {companies.map(c => (
                              <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                          </select>
                        </div>
                        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
                          <table className="w-full text-left">
                            <thead className="bg-gray-50/50 border-b border-gray-100">
                              <tr>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">会社名</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">総閲覧数</th>
                                <th className="px-6 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest text-right">シェア</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                              {(() => {
                                const counts: any = {}
                                analytics.forEach(v => {
                                  const name = v.companies?.name || '不明'
                                  counts[name] = (counts[name] || 0) + 1
                                })
                                const total = analytics.length || 1
                                return Object.entries(counts)
                                  .sort((a: any, b: any) => b[1] - a[1])
                                  .map(([name, count]: any) => (
                                    <tr key={name} className="hover:bg-gray-50/50 transition-colors">
                                      <td className="px-6 py-3 text-sm font-bold text-gray-700">{name}</td>
                                      <td className="px-6 py-3 text-sm font-black text-emerald-700 text-right">{count}</td>
                                      <td className="px-6 py-3 text-[10px] font-bold text-gray-400 text-right">
                                        {Math.round((count / total) * 100)}%
                                      </td>
                                    </tr>
                                  ))
                              })()}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </div>
                  )
                })()}
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6 px-2">
                <span className="w-1 h-6 bg-gray-300 rounded-full"></span>
                <h3 className="text-lg font-black text-gray-900 tracking-tight italic text-gray-500">最近のアクセス履歴</h3>
              </div>
              <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">日付</th>
                      <th className="text-left px-8 py-4 text-[10px] font-black text-gray-400 uppercase tracking-widest">企業名</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {(selectedCompanyId 
                        ? analytics.filter(v => v.company_id === selectedCompanyId)
                        : analytics
                    ).slice(0, 10).map((v, i) => (
                      <tr key={i} className="hover:bg-gray-50/30 transition-all">
                        <td className="px-8 py-4 text-xs font-bold text-gray-400">
                          {new Date(v.viewed_at).toLocaleString('ja-JP', { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="px-8 py-4 text-sm font-bold text-gray-800">{v.companies?.name}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Admins Tab Content */}
        {tab === 'admins' && role === 'super_admin' && (
          <div className="p-8 space-y-12">
            <div>
              <div className="flex items-center gap-3 mb-6 px-2">
                <span className="w-1 h-6 bg-red-500 rounded-full"></span>
                <h3 className="text-lg font-black text-gray-900 tracking-tight italic">承認待ちのユーザー</h3>
              </div>
              <div className="bg-gray-50/50 rounded-[24px] border border-gray-100 overflow-hidden">
                <table className="w-full">
                  <tbody className="divide-y divide-gray-100">
                    {pendingList.map(a => (
                      <tr key={a.id} className="hover:bg-white transition-all">
                        <td className="px-8 py-6 text-sm font-bold text-gray-700">
                          {userProfile.email === PRIMARY_ADMIN_EMAIL ? a.email : '********@****.***'}
                        </td>
                        <td className="px-8 py-6 text-right">
                          <div className="flex gap-3 justify-end">
                            <button onClick={() => approveAdmin(a.id)}
                              className="bg-emerald-700 text-white px-6 py-2 rounded-xl text-xs font-black hover:bg-emerald-600 transition-all shadow-md shadow-emerald-900/10">
                              承認
                            </button>
                            <button onClick={() => deleteProfile(a.id, a.display_name || '')}
                              className="bg-red-50 text-red-600 px-6 py-2 rounded-xl text-xs font-black hover:bg-red-600 hover:text-white transition-all">
                              却下
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {pendingList.length === 0 && (
                      <tr><td colSpan={2} className="text-center py-10 text-gray-400 text-xs font-bold italic tracking-widest uppercase">承認待ちのユーザーはいません</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-6 px-2">
                <span className="w-1 h-6 bg-emerald-500 rounded-full"></span>
                <h3 className="text-lg font-black text-gray-900 tracking-tight italic">有効な管理者</h3>
              </div>
              <div className="bg-white border border-gray-100 rounded-[24px] overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50/50 border-b border-gray-100">
                    <tr>
                      <th className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">ID</th>
                      <th className="text-left px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">メールアドレス</th>
                      <th className="text-center px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">権限</th>
                      <th className="text-right px-8 py-5 text-[10px] font-black text-gray-400 uppercase tracking-widest">操作</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {activeList.map(a => (
                      <tr key={a.id} className="hover:bg-gray-50/30 transition-all group">
                        <td className="px-8 py-6">
                          <div className="font-black text-gray-900 text-sm group-hover:text-emerald-700 transition-colors italic">{a.display_name || '名称未設定'}</div>
                          {a.id === userProfile.id && <span className="mt-2 inline-flex items-center gap-1 text-[8px] bg-emerald-700 text-white px-2 py-0.5 rounded uppercase font-black tracking-widest">あなた</span>}
                        </td>
                        <td className="px-8 py-6">
                          <div className="text-xs font-bold text-gray-500 tracking-wider">
                            {userProfile.email === PRIMARY_ADMIN_EMAIL || a.id === userProfile.id ? a.email : '********@****.***'}
                          </div>
                        </td>
                        <td className="px-8 py-6 text-center">
                          <div className="inline-block relative">
                            <select
                              disabled={a.id === userProfile.id || a.email === PRIMARY_ADMIN_EMAIL}
                              value={a.role}
                              onChange={(e) => updateRole(a.id, e.target.value as 'admin' | 'super_admin')}
                              className="appearance-none bg-gray-100 border-none rounded-xl text-[10px] font-black text-emerald-800 px-6 py-2 focus:ring-2 focus:ring-emerald-500 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed text-center uppercase tracking-widest hover:bg-emerald-50 transition-all">
                              <option value="admin">一般管理者</option>
                              <option value="super_admin">上位管理者</option>
                            </select>
                          </div>
                        </td>
                        <td className="px-8 py-6 text-right">
                          {(a.id !== userProfile.id && a.email !== PRIMARY_ADMIN_EMAIL) && (
                            <button onClick={() => deleteProfile(a.id, a.display_name || '名称未設定')}
                              className="text-red-300 hover:text-red-600 transition-colors uppercase text-[10px] font-black tracking-widest">
                              削除
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
