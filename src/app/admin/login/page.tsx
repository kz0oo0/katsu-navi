'use client'

import { SignIn } from '@clerk/nextjs'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#065F46] to-[#10B981] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <Link href="/" className="text-3xl font-extrabold text-white hover:opacity-80 transition inline-block mb-3">
            かつナビ
          </Link>
          <p className="text-emerald-50 text-sm font-bold">管理者ポータルにログイン</p>
        </div>

        <div className="bg-white rounded-[32px] shadow-2xl overflow-hidden p-2">
          <SignIn 
            appearance={{
              elements: {
                rootBox: "w-full",
                card: "shadow-none border-none bg-transparent w-full",
                headerTitle: "hidden",
                headerSubtitle: "hidden",
                formButtonPrimary: "bg-[#10B981] hover:bg-[#059669] text-sm font-bold py-3 rounded-xl transition shadow-lg",
                footerActionLink: "text-[#10B981] hover:text-[#059669] font-bold",
                formFieldInput: "rounded-xl border-gray-200 focus:ring-[#10B981] focus:border-[#10B981]",
                dividerLine: "bg-gray-100",
                dividerText: "text-gray-400 text-xs font-bold",
                socialButtonsBlockButton: "rounded-xl border-gray-200 hover:bg-gray-50",
                formLabel: "text-gray-700 font-bold text-xs uppercase tracking-widest"
              }
            }}
            signUpUrl="/admin/register"
            afterSignInUrl="/admin/dashboard"
          />
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
