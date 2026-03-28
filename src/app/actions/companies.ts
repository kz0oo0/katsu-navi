'use server'

import { createClient } from '@/lib/supabase/server'

/**
 * データベースに登録されているユニークな業界名のリストを取得する
 */
export async function getRegisteredIndustries(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('companies')
      .select('industry')
      .eq('is_deleted', false)

    if (error) {
      console.error('Error fetching industries:', error)
      return []
    }

    if (!data) return []

    // 重複を排除し、空文字を除外してソート
    const uniqueIndustries = Array.from(
      new Set(data.map(item => item.industry).filter(Boolean))
    ).sort()

    return uniqueIndustries
  } catch (err) {
    console.error('Unexpected error fetching industries:', err)
    return []
  }
}
