'use server'

import { createClient } from '@/lib/supabase/server'
import { headers } from 'next/headers'

/**
 * 企業ページの閲覧を記録する
 */
export async function trackCompanyView(companyId: string) {
  try {
    const supabase = await createClient()
    const headerList = headers()
    
    // 簡易的なIP取得とUser-Agent取得
    const ip = headerList.get('x-forwarded-for') || 'unknown'
    const ua = headerList.get('user-agent') || 'unknown'
    
    const { error } = await supabase
      .from('company_views')
      .insert({
        company_id: companyId,
        ip_hash: ip,
        user_agent: ua
      })
    
    if (error) {
      // ログレベルとしては静かにエラーを出す（ユーザー体験には影響させない）
      console.warn('Analytics tracking skipped:', error.message)
    }
  } catch (err) {
    console.warn('Analytics tracking failed silently')
  }
}

/**
 * 管理画面用に閲覧統計を取得する
 * ownerIdが指定された場合、そのユーザーが作成した企業の統計のみを返す
 */
export async function getCompanyAnalytics(ownerId?: string) {
  try {
    const supabase = await createClient()
    
    // 直近30日のデータを取得
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    
    let query = supabase
      .from('company_views')
      .select(`
        viewed_at, 
        company_id, 
        companies (name, created_by)
      `)
      .gte('viewed_at', thirtyDaysAgo.toISOString())
      .order('viewed_at', { ascending: false })
    
    if (ownerId) {
      query = query.eq('companies.created_by', ownerId)
    }
    
    const { data: views, error } = await query
    
    if (error) {
      console.error('Error fetching analytics:', error)
      return []
    }
    
    return views || []
  } catch (err) {
    console.error('Unexpected error fetching analytics:', err)
    return []
  }
}
