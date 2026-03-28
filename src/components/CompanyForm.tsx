'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useUser } from '@clerk/nextjs'
import { createClient } from '@/lib/supabase/client'
import { INDUSTRIES, PREFECTURES, PublishStatus } from '@/lib/types'
import { Company } from '@/lib/types'

type FormData = {
  name: string
  industry: string
  location: string[]
  description: string
  introduction: string
  avg_salary: string
  avg_overtime: string
  benefits: string
  strengths: string
  weaknesses: string
  ideal_candidate: string
  hiring_flow: string
  headquarters: string
  company_url: string
  recruitment_url: string
  publish_status: PublishStatus
}

interface CompanyFormProps {
  initialData?: Company
  mode: 'new' | 'edit'
}

const defaultForm: FormData = {
  name: '', industry: '', location: [], description: '',
  introduction: '', avg_salary: '', avg_overtime: '', benefits: '',
  strengths: '', weaknesses: '', ideal_candidate: '', hiring_flow: '',
  headquarters: '',
  company_url: '', recruitment_url: '', publish_status: 'draft',
}

export default function CompanyForm({ initialData, mode }: CompanyFormProps) {
  const router = useRouter()
  const { isLoaded, user } = useUser()
  const [form, setForm] = useState<FormData>(
    initialData ? {
      name: initialData.name,
      industry: initialData.industry,
      location: initialData.location ? initialData.location.split(',').map(s => s.trim()) : [],
      description: initialData.description || '',
      introduction: initialData.introduction || '',
      avg_salary: initialData.avg_salary?.toString() || '',
      avg_overtime: initialData.avg_overtime?.toString() || '',
      benefits: initialData.benefits || '',
      strengths: initialData.strengths || '',
      weaknesses: initialData.weaknesses || '',
      ideal_candidate: initialData.ideal_candidate || '',
      hiring_flow: initialData.hiring_flow || '',
      headquarters: initialData.headquarters || '',
      company_url: initialData.company_url || '',
      recruitment_url: initialData.recruitment_url || '',
      publish_status: initialData.publish_status,
    } : defaultForm
  )
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [logoPreview, setLogoPreview] = useState<string | null>(initialData?.logo_url || null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [displayIndustries, setDisplayIndustries] = useState<string[]>(INDUSTRIES)
  const [isNewIndustry, setIsNewIndustry] = useState(false)
  const [newIndustryName, setNewIndustryName] = useState('')

  const set = (key: keyof FormData) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    if (key === 'industry' && e.target.value === '__NEW__') {
      setIsNewIndustry(true)
      setForm(prev => ({ ...prev, [key]: '' }))
    } else {
      setForm(prev => ({ ...prev, [key]: e.target.value }))
    }
  }

  useEffect(() => {
    const fetchIndustries = async () => {
      const { getRegisteredIndustries } = await import('@/app/actions/companies')
      const registered = await getRegisteredIndustries()
      // DBの値のみを使用する（初期値があればそれも追加して重複排除）
      const initialInd = initialData?.industry ? [initialData.industry] : []
      const combined = Array.from(new Set([...initialInd, ...registered])).sort()
      setDisplayIndustries(combined)
    }
    fetchIndustries()
  }, [initialData])

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLogoFile(file)
    setLogoPreview(URL.createObjectURL(file))
  }

  const handleSubmit = async (status: PublishStatus) => {
    if (!form.name || !form.industry) {
      setError('企業名・業界は必須です')
      return
    }
    if (!isLoaded || !user) {
      setError('ログイン情報が確認できません')
      return
    }
    setLoading(true)
    setError('')
    const supabase = createClient()

    let logo_url = initialData?.logo_url || null
    if (logoFile) {
      const ext = logoFile.name.split('.').pop()
      const path = `logos/${user.id}/${Date.now()}.${ext}`
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('company-logos')
        .upload(path, logoFile, { upsert: true })
      if (uploadError) {
        setError('ロゴのアップロードに失敗しました: ' + uploadError.message)
        setLoading(false); return
      }
      const { data: urlData } = supabase.storage.from('company-logos').getPublicUrl(uploadData.path)
      logo_url = urlData.publicUrl
    }

    const payload = {
      name: form.name, industry: form.industry, 
      location: form.location.join(', '),
      description: form.description || null, introduction: form.introduction || null,
      avg_salary: form.avg_salary ? parseInt(form.avg_salary) : null,
      avg_overtime: form.avg_overtime ? parseInt(form.avg_overtime) : null,
      benefits: form.benefits || null, strengths: form.strengths || null,
      weaknesses: form.weaknesses || null, ideal_candidate: form.ideal_candidate || null,
      hiring_flow: form.hiring_flow || null,
      headquarters: form.headquarters || null,
      company_url: form.company_url || null, recruitment_url: form.recruitment_url || null,
      publish_status: status, logo_url, updated_at: new Date().toISOString(),
    }

    let opError = null
    if (mode === 'new') {
      const { error } = await supabase.from('companies').insert({ ...payload, created_by: user.id })
      opError = error
    } else {
      const { error } = await supabase.from('companies').update(payload).eq('id', initialData!.id)
      opError = error
    }

    if (opError) {
      setError('保存に失敗しました: ' + opError.message)
      setLoading(false); return
    }

    router.push('/admin/dashboard')
    router.refresh()
  }

  const InputField = ({ label, name, type = 'text', placeholder, required }: {
    label: string; name: keyof FormData; type?: string; placeholder?: string; required?: boolean
  }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type} value={form[name]} onChange={set(name)} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
      />
    </div>
  )

  const TextAreaField = ({ label, name, rows = 3, placeholder }: {
    label: string; name: keyof FormData; rows?: number; placeholder?: string
  }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">{label}</label>
      <textarea
        value={form[name]} onChange={set(name)} rows={rows} placeholder={placeholder}
        className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] resize-vertical"
      />
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-gray-800 mb-8">
        {mode === 'new' ? '🏢 企業を新規登録' : '✏️ 企業情報を編集'}
      </h1>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm mb-6">{error}</div>
      )}

      <div className="space-y-8">
        <section className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="font-bold text-gray-800 border-b pb-2">📋 基本情報</h2>
          <InputField label="企業名" name="name" required placeholder="例: かつナビ株式会社" />
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">業界 <span className="text-red-500">*</span></label>
              {!isNewIndustry ? (
                <select
                  value={form.industry}
                  onChange={set('industry')}
                  className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] bg-white transition-all"
                >
                  <option value="">業界を選択...</option>
                  {displayIndustries.map(ind => <option key={ind} value={ind}>{ind}</option>)}
                  <option value="__NEW__" className="text-emerald-600 font-bold">+ 新規追加...</option>
                </select>
              ) : (
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={form.industry}
                    onChange={set('industry')}
                    placeholder="新しい業界名を入力"
                    autoFocus
                    className="flex-1 border border-[#10B981] rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981]"
                  />
                  <button 
                    onClick={() => { setIsNewIndustry(false); }}
                    className="px-3 text-xs font-bold text-gray-400 hover:text-gray-600"
                  >
                    キャンセル
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">勤務地（複数選択可）</label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border border-gray-100 p-4 rounded-xl max-h-48 overflow-y-auto bg-gray-50/30">
                {PREFECTURES.map(pref => (
                  <label key={pref} className="flex items-center gap-2 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={form.location.includes(pref)}
                      onChange={(e) => {
                        const next = e.target.checked 
                          ? [...form.location, pref]
                          : form.location.filter(v => v !== pref)
                        setForm(prev => ({ ...prev, location: next }))
                      }}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-gray-300"
                    />
                    <span className="text-xs font-bold text-gray-400 group-hover:text-gray-900 transition-colors">{pref}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1.5">本社所在地</label>
              <select
                value={form.headquarters}
                onChange={set('headquarters')}
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10B981] bg-white transition-all shadow-sm"
              >
                <option value="">都道府県を選択...</option>
                {PREFECTURES.map(pref => <option key={pref} value={pref}>{pref}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-4">
              <InputField label="企業URL" name="company_url" placeholder="https://example.com" />
              <InputField label="採用URL" name="recruitment_url" placeholder="https://example.com/recruit" />
            </div>
          </div>
          <TextAreaField label="採用フロー" name="hiring_flow" rows={3} placeholder="書類選考 → 面接（2回） → 内定" />
        </section>

        {/* Logo */}
        <section className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="font-bold text-gray-800 border-b pb-2">🖼️ ロゴ画像</h2>
          <div className="flex items-center gap-5">
            <div className="w-20 h-20 bg-gray-100 rounded-2xl flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
              {logoPreview ? (
                <img src={logoPreview} alt="preview" className="w-full h-full object-contain" />
              ) : (
                <span className="text-3xl text-gray-300">🏢</span>
              )}
            </div>
            <label className="cursor-pointer bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-emerald-100 transition">
              ロゴ画像をアップロード
              <input
                type="file"
                accept="image/*"
                onChange={handleLogoChange}
                className="hidden"
              />
            </label>
          </div>
        </section>

        {/* Description */}
        <section className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="font-bold text-gray-800 border-b pb-2">💼 企業説明</h2>
          <TextAreaField label="事業内容" name="description" rows={3} placeholder="主な事業内容を入力..." />
          <TextAreaField label="企業紹介文" name="introduction" rows={4} placeholder="企業の魅力や文化について..." />
        </section>

        {/* Stats */}
        <section className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="font-bold text-gray-800 border-b pb-2">📊 勤務データ</h2>
          <div className="grid grid-cols-2 gap-4">
            <InputField label="平均年収（万円）" name="avg_salary" type="number" placeholder="例: 450" />
            <InputField label="平均残業時間（h/月）" name="avg_overtime" type="number" placeholder="例: 20" />
          </div>
          <TextAreaField label="福利厚生" name="benefits" rows={3} placeholder="住宅手当, 健康診断, 育児休暇..." />
        </section>

        {/* Characteristics */}
        <section className="bg-white rounded-2xl shadow p-6 space-y-4">
          <h2 className="font-bold text-gray-800 border-b pb-2">⭐ 企業の特徴</h2>
          <TextAreaField label="強み" name="strengths" placeholder="この企業の強みは..." />
          <TextAreaField label="弱み・課題" name="weaknesses" placeholder="課題として..." />
          <TextAreaField label="こんな人に向いている" name="ideal_candidate" placeholder="向上心があり..." />
        </section>

        {/* Submit */}
        <div className="flex gap-3">
          <button onClick={() => handleSubmit('draft')} disabled={loading}
            className="flex-1 border-2 border-gray-200 text-gray-700 py-3 rounded-xl font-bold text-sm hover:bg-gray-50 transition disabled:opacity-60">
            {loading ? '保存中...' : '下書き保存'}
          </button>
          <button onClick={() => handleSubmit('published')} disabled={loading}
            className="flex-1 bg-emerald-800 text-white py-3 rounded-xl font-bold text-sm hover:bg-emerald-700 transition disabled:opacity-60">
            {loading ? '保存中...' : '公開して保存'}
          </button>
        </div>
      </div>
    </div>
  )
}
