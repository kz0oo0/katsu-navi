'use client'

import Link from 'next/link'
import { useState } from 'react'
import { usePathname } from 'next/navigation'
import { SignedIn, SignedOut, UserButton } from '@clerk/nextjs'

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const pathname = usePathname()
  const isAdminPage = pathname.startsWith('/admin')

  return (
    <header className="bg-white text-gray-800 shadow-sm border-b border-gray-100 sticky top-0 z-50">
      <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 group text-2xl font-extrabold tracking-tighter text-[#10B981] hover:opacity-80 transition">
          <span>かつナビ</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-8 text-[15px] font-bold">
          <Link href="/companies" className="nav-link">企業を探す</Link>
          <Link href="/companies/compare" className="nav-link">企業比較</Link>
          
          <SignedOut>
            <Link
              href="/admin/login"
              className="btn-secondary !py-2 !px-5"
            >
              管理者ログイン
            </Link>
          </SignedOut>
          
          <SignedIn>
            <div className="flex items-center gap-4">
              <Link href="/admin/dashboard" className="text-sm font-bold text-gray-600 hover:text-[#10B981]">管理画面</Link>
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </nav>

        {/* Mobile Hamburger */}
        <button
          className="md:hidden p-2 rounded-md hover:bg-gray-50 transition"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="メニュー"
        >
          <span className="block w-6 h-0.5 bg-gray-600 mb-1"></span>
          <span className="block w-6 h-0.5 bg-gray-600 mb-1"></span>
          <span className="block w-6 h-0.5 bg-gray-600"></span>
        </button>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-6 flex flex-col gap-4 text-base font-bold">
          <Link href="/companies" onClick={() => setMenuOpen(false)} className="nav-link !px-0">企業を探す</Link>
          <Link href="/companies/compare" onClick={() => setMenuOpen(false)} className="nav-link !px-0">企業比較</Link>
          
          <SignedOut>
            <Link href="/admin/login" onClick={() => setMenuOpen(false)} className="text-[#047857] font-bold">管理者ログイン</Link>
          </SignedOut>
          
          <SignedIn>
            <Link href="/admin/dashboard" onClick={() => setMenuOpen(false)} className="nav-link !px-0">管理画面</Link>
            <div className="pt-2">
              <UserButton afterSignOutUrl="/" />
            </div>
          </SignedIn>
        </div>
      )}
    </header>
  )
}
