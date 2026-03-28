'use client'

import { useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('ログインに失敗しました。メールアドレスまたはパスワードが正しくありません。')
      setLoading(false)
    } else {
      router.push('/admin/dashboard')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#065F46] to-[#10B981] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-extrabold text-white hover:opacity-80 transition inline-block mb-3">
            かつナビ
          </Link>
          <p className="text-emerald-50 text-sm font-bold">管理者ポータルにログイン</p>
        </div>

        <div className="bg-white rounded-[32px] shadow-2xl p-10 border border-gray-100">
          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-widest ml-1">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                required
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-gray-700 uppercase tracking-widest ml-1">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                required
              />
            </div>

            {error && (
              <p className="text-red-500 text-xs font-bold bg-red-50 p-3 rounded-lg leading-relaxed">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#10B981] text-white py-4 rounded-xl font-bold text-sm hover:bg-[#059669] transition shadow-lg disabled:opacity-50"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <div className="mt-10 pt-8 border-t border-gray-50 text-center">
            <p className="text-xs text-gray-500 font-bold mb-4">アカウントをお持ちでないですか？</p>
            <Link href="/admin/register" className="text-[#10B981] font-extrabold hover:underline">
              新規登録（承認申請）はこちら
            </Link>
          </div>
        </div>
        
        <div className="text-center mt-8">
          <p className="text-emerald-50 text-xs font-bold opacity-80">
            &copy; {new Date().getFullYear()} Katsu-Navi Analytics. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  )
}
