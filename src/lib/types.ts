export type PublishStatus = 'draft' | 'published'
export type UserRole = 'admin' | 'super_admin'

export interface Profile {
  id: string
  email: string
  display_name?: string
  role: UserRole
  is_approved: boolean
  created_at: string
}

export interface Company {
  id: string
  name: string
  industry: string
  location: string
  description?: string
  introduction?: string
  avg_salary?: number
  avg_overtime?: number
  benefits?: string
  strengths?: string
  weaknesses?: string
  ideal_candidate?: string
  logo_url?: string
  company_url?: string
  recruitment_url?: string
  hiring_flow?: string
  headquarters?: string
  publish_status: PublishStatus
  is_deleted: boolean
  created_by?: string
  created_at: string
  updated_at: string
}

export const INDUSTRIES: string[] = [
  'IT・通信',
  'メーカー',
  '商社',
  '金融',
  'インフラ',
  '小売',
  '広告・出版',
  'コンサル',
  'サービス',
  '不動産',
  '建設',
  '物流',
  '医療・福祉',
  '教育',
  '公務員・団体',
  'その他'
]

export const PREFECTURES: string[] = [
  '北海道', '青森県', '岩手県', '宮城県', '秋田県', '山形県', '福島県',
  '茨城県', '栃木県', '群馬県', '埼玉県', '千葉県', '東京都', '神奈川県',
  '新潟県', '富山県', '石川県', '福井県', '山梨県', '長野県', '岐阜県', 
  '静岡県', '愛知県', '三重県', '滋賀県', '京都府', '大阪府', '兵庫県', 
  '奈良県', '和歌山県', '鳥取県', '島根県', '岡山県', '広島県', '山口県',
  '徳島県', '香川県', '愛媛県', '高知県', '福岡県', '佐賀県', '長崎県', 
  '熊本県', '大分県', '宮崎県', '鹿児島県', '沖縄県'
]

export type Industry = string
