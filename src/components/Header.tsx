'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const pathname = usePathname()
  const router = useRouter()
  const isAuthPage = pathname === '/admin/login' || pathname === '/admin/register'

  useEffect(() => {
    const supabase = createClient()
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
    }
    getUser()

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
    })

    return () => subscription.unsubscribe()
  }, [])

  const handleLogout = async () => {
    const supabase = createClient()
    await supabase.auth.signOut()
    router.push('/')
    setMenuOpen(false)
  }

  return (
    <header className="bg-white text-gray-800 shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group text-2xl font-extrabold tracking-tighter text-[#10B981] hover:opacity-80 transition">
          <span>かつナビ</span>
        </Link>

        {/* Desktop Nav */}
        {!isAuthPage && (
          <nav className="hidden md:flex items-center gap-8 text-[15px] font-bold">
            <Link href="/companies" className="nav-link">企業を探す</Link>
            <Link href="/companies/compare" className="nav-link">企業比較</Link>
            
            {!user ? (
              <Link
                href="/admin/login"
                className="btn-secondary !py-2 !px-5"
              >
                管理者ログイン
              </Link>
            ) : (
              <>
                <Link href="/admin/dashboard" className="nav-link !px-0 text-gray-600 hover:text-[#10B981] transition">管理画面</Link>
                <button 
                  onClick={handleLogout}
                  className="nav-link !px-0 text-gray-400 hover:text-red-500 transition"
                >
                  ログアウト
                </button>
              </>
            )}
          </nav>
        )}

        {/* Mobile Hamburger */}
        {!isAuthPage && (
          <button
            className="md:hidden p-2 rounded-md hover:bg-gray-50 transition"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="メニュー"
          >
            <span className="block w-6 h-0.5 bg-gray-600 mb-1"></span>
            <span className="block w-6 h-0.5 bg-gray-600 mb-1"></span>
            <span className="block w-6 h-0.5 bg-gray-600"></span>
          </button>
        )}
      </div>

      {/* Mobile Menu */}
      {menuOpen && !isAuthPage && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-6 flex flex-col gap-4 text-base font-bold">
          <Link href="/companies" onClick={() => setMenuOpen(false)} className="nav-link !px-0">企業を探す</Link>
          <Link href="/companies/compare" onClick={() => setMenuOpen(false)} className="nav-link !px-0">企業比較</Link>
          
          {!user ? (
            <Link href="/admin/login" onClick={() => setMenuOpen(false)} className="text-[#047857] font-bold">管理者ログイン</Link>
          ) : (
            <>
              <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)} className="nav-link !px-0">管理画面</Link>
              <button 
                onClick={handleLogout}
                className="text-left text-red-500 font-bold"
              >
                ログアウト
              </button>
            </>
          )}
        </div>
      )}
    </header>
  )
}
