'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const ALLOWED_DOMAINS = [
  'gmail.com',
  'docomo.ne.jp',
  'softbank.ne.jp',
  'i.softbank.jp',
  'ezweb.ne.jp',
  'au.com'
]

export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const validateDomain = (email: string) => {
    const domain = email.split('@')[1]?.toLowerCase()
    return ALLOWED_DOMAINS.includes(domain)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (password !== confirmPassword) {
      setError('パスワードが一致しません。')
      return
    }

    if (!validateDomain(email)) {
      setError('許可されていないメールドメインです。主要なプロバイダ（Gmail/キャリアメール等）をご使用ください。')
      return
    }

    setLoading(true)
    setError('')

    const supabase = createClient()
    
    // 1. Auth SignUp
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          display_name: displayName,
        }
      }
    })

    if (authError) {
      setError(authError.message === 'User already registered' ? '既に登録されているメールアドレスです。' : authError.message)
      setLoading(false)
      return
    }

    if (authData.user) {
      // 2. Insert into profiles (マニュアル同期)
      // Note: 本来はDB Triggerで行うべきですが、動作確実性のためにフロントエンドからも試行
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: authData.user.id,
          email: email,
          display_name: displayName,
          role: 'admin',
          is_approved: false
        })

      if (profileError && profileError.code !== '23505') { // 23505 = unique_violation (すでにTrigger等で作成済み)
        console.error('Profile sync error:', profileError)
      }

      // 3. ログイン画面またはダッシュボード（承認待ち）へ
      router.push('/admin/dashboard')
    } else {
      setError('登録に失敗しました。')
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#065F46] to-[#10B981] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white p-10 rounded-[32px] shadow-2xl border border-gray-100">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold text-[#0F172A] mb-3">かつナビ</h1>
          <p className="text-gray-400 text-sm font-bold">管理者アカウントの登録申請</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">管理者ID</label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="例: かつ丼"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">メールアドレス</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="admin@gmail.com"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">パスワード</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-gray-700 ml-1">パスワード（確認）</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="もう一度入力してください"
              className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              required
            />
          </div>

          {error && <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg leading-relaxed">{error}</p>}

          <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 italic">
            <p className="text-[10px] text-gray-500 font-bold leading-relaxed">
              ⚠️ 登録後、上位管理者による承認が必要です。承認されるまで管理機能は制限されます。
            </p>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#10B981] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#059669] transition shadow-lg disabled:opacity-50"
          >
            {loading ? '登録中...' : '管理者を申請する'}
          </button>
        </form>

        <div className="mt-10 pt-8 border-t border-gray-50 text-center">
          <p className="text-sm text-gray-500 font-bold mb-4">すでにアカウントをお持ちですか？</p>
          <Link href="/admin/login" className="text-[#10B981] font-extrabold hover:underline">
            ログインはこちら
          </Link>
        </div>
      </div>
    </div>
  )
}
