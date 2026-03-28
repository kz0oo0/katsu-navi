'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { registerAdminAction } from '../actions'

export default function AdminRegisterPage() {
  const router = useRouter()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [loading, setLoading] = useState(false)

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) {
      setError('パスワードが一致しません')
      return
    }
    if (password.length < 6) {
      setError('パスワードは6文字以上で入力してください')
      return
    }

    setLoading(true)
    try {
      await registerAdminAction(email, password, displayName)
      setSuccess(true)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#065F46] to-[#10B981] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold text-white flex items-center justify-center gap-2">
            <span>かつナビ</span>
          </h1>
          <p className="text-emerald-50 mt-2 font-bold small">管理者アカウントの申請</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          {success ? (
            <div className="text-center">
              <div className="text-5xl mb-4">📝</div>
              <h2 className="text-xl font-bold text-gray-800 mb-2">管理者登録の申請を完了しました</h2>
              <p className="text-sm text-gray-600 mb-6 leading-relaxed">
                ご登録いただいたメールアドレスに認証メールを送信しました。<br />
                本文内のリンクをクリックして**メール認証を完了**させてください。<br />
                <span className="text-xs text-emerald-600 font-bold block mt-2">
                  ※認証完了後、上位管理者による承認待ちとなります。
                </span>
              </p>
              <Link href="/admin/login" className="block bg-[#10B981] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#059669] transition">
                ログイン画面へ
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-gray-800 mb-6">管理者登録</h2>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-5">
                  {error}
                </div>
              )}

              <form onSubmit={handleRegister} className="flex flex-col gap-4">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">ID</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={e => setDisplayName(e.target.value)}
                    required
                    placeholder="例: かつ丼"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>
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
                    placeholder="6文字以上"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">パスワード（確認）</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    required
                    placeholder="もう一度入力"
                    className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                </div>
                <p className="text-xs text-gray-500 bg-gray-50 p-3 rounded-lg border">
                  ⚠️ 登録後、上位管理者による承認が必要です。承認されるまでログインはできません。
                </p>
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-[#10B981] text-white py-3 rounded-xl font-bold text-sm hover:bg-[#059669] transition disabled:opacity-60 mt-2"
                >
                  {loading ? '登録中...' : '管理者を申請する'}
                </button>
              </form>

              <p className="text-center text-gray-500 text-sm mt-6">
                すでにアカウントをお持ちですか？
                <Link href="/admin/login" className="text-blue-700 font-bold hover:underline ml-1">ログイン</Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
