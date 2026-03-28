'use client'

import { useEffect } from 'react'
import { trackCompanyView } from '@/app/actions/analytics'

interface TrackViewProps {
  companyId: string
}

/**
 * 企業詳細ページの閲覧を非同期で記録するためのクライアントコンポーネント
 */
export default function TrackView({ companyId }: { companyId: string }) {
  useEffect(() => {
    // ページマウント時に一度だけ実行
    const timer = setTimeout(() => {
      trackCompanyView(companyId)
    }, 1000) // 1秒滞在でカウント（簡易的なボット除外）

    return () => clearTimeout(timer)
  }, [companyId])

  return null
}
