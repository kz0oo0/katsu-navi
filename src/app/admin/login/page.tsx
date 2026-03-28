'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

export default function AdminLoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    const supabase = createClient()

    const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password })
    if (authError || !data.user) {
      setError('メールアドレスまたはパスワードが間違っています')
      setLoading(false)
      return
    }

    // Check approval
    const { data: profile } = await supabase
      .from('profiles')
      .select('is_approved, role')
      .eq('id', data.user.id)
      .single()

    if (!profile?.is_approved) {
      await supabase.auth.signOut()
      setError('アカウントがまだ承認されていません。上位管理者にお問い合わせください。')
      setLoading(false)
      return
    }

    router.refresh()
    router.push('/admin/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#065F46] to-[#10B981] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
            <span>かつナビ</span>
          </h1>
          <p className="text-emerald-50 mt-2 font-bold">管理者ポータルへようこそ</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-bold text-gray-800 mb-6">管理者ログイン</h2>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} className="flex flex-col gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">メールアドレス</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                required
                placeholder="admin@example.com"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">パスワード</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                placeholder="••••••••"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-[#10B981] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#059669] transition disabled:opacity-60 mt-2"
            >
              {loading ? 'ログイン中...' : 'ログイン'}
            </button>
          </form>

          <p className="text-center text-gray-500 text-sm mt-6">
            アカウントをお持ちでないですか？
            <Link href="/admin/register" className="text-blue-700 font-bold hover:underline ml-1">
              新規登録はこちら
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
