import Link from 'next/link'

export default async function Footer() {
  return (
    <footer className="bg-white border-t border-gray-100 pt-16 pb-12 mt-20">
      <div className="max-w-[1200px] mx-auto px-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-8 pb-12 border-b border-gray-100">
          <div>
            <Link href="/" className="text-2xl font-extrabold tracking-tighter text-[#10B981]">
              かつナビ
            </Link>
            <p className="mt-2 text-sm text-gray-500 font-medium">合う企業、見つけやすく。</p>
          </div>
          
          <nav className="flex flex-wrap gap-x-8 gap-y-4">
            <Link href="/companies" className="text-sm font-bold text-gray-600 hover:text-[#10B981] transition">企業を探す</Link>
            <Link href="/companies/compare" className="text-sm font-bold text-gray-600 hover:text-[#10B981] transition">企業比較</Link>
            <Link href="/admin/login" className="text-sm font-bold text-gray-600 hover:text-[#10B981] transition">管理者ログイン</Link>
          </nav>
        </div>
        
        <div className="pt-10 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex flex-wrap justify-center gap-x-8 gap-y-2 text-xs font-bold text-gray-400">
            {/* リンク削除済み */}
          </div>
          <p className="text-xs font-bold text-gray-400">© 2026 かつナビ. All rights reserved.</p>
        </div>
      </div>
    </footer>
  )
}
