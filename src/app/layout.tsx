import type { Metadata } from "next";
import { Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ClerkProvider } from "@clerk/nextjs";
import { jaJP } from "@clerk/localizations";

const notoSansJP = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  variable: "--font-noto-sans-jp",
});

export const metadata: Metadata = {
  title: "かつナビ | 企業比較サービス",
  description: "合う企業、見つけやすく。気になる企業を、シンプルに比較。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider localization={{
      ...jaJP,
      signUp: {
        ...jaJP.signUp,
        emailCode: {
          ...jaJP.signUp?.emailCode,
          subtitle: "" // 認証メール送信のメッセージを非表示化
        }
      },
      signIn: {
        ...jaJP.signIn,
        emailCode: {
          ...jaJP.signIn?.emailCode,
          subtitle: "" // 認証メール送信のメッセージを非表示化
        }
      }
    } as any}>
      <html lang="ja">
        <body className={`${notoSansJP.variable} font-sans antialiased bg-[#F8FAFC] text-[#0F172A]`}>
          <Header />
          <main>{children}</main>
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}
