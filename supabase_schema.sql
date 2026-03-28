-- ===========================================
-- かつナビ - Supabase データベーススキーマ
-- ===========================================

-- profiles テーブル（管理者情報）
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid REFERENCES auth.users ON DELETE CASCADE NOT NULL PRIMARY KEY,
  email text,
  display_name text,
  role text DEFAULT 'admin' CHECK (role IN ('admin', 'super_admin')),
  is_approved boolean DEFAULT false,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- companies テーブル（企業情報）
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  industry text NOT NULL,
  location text NOT NULL,
  description text,
  introduction text,
  avg_salary integer,
  avg_overtime integer,
  benefits text,
  strengths text,
  weaknesses text,
  ideal_candidate text,
  logo_url text,
  company_url text,
  recruitment_url text,
  publish_status text DEFAULT 'draft' CHECK (publish_status IN ('draft', 'published')) NOT NULL,
  is_deleted boolean DEFAULT false NOT NULL,
  created_by uuid REFERENCES public.profiles(id),
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- ===========================================
-- Row Level Security (RLS)
-- ===========================================

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;

-- 自己チェック用の関数を作成（無限ループを回避するため）
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin' AND is_approved = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- profiles: 自分自身のプロファイルのみ読み書き可能
CREATE POLICY "profiles_self_read" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_self_insert" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- super_admin は全profileを読める
CREATE POLICY "profiles_superadmin_read" ON public.profiles
  FOR SELECT USING (
    id = auth.uid() OR public.is_super_admin()
  );

-- super_admin は全profileを更新できる（承認操作用）
CREATE POLICY "profiles_superadmin_update" ON public.profiles
  FOR UPDATE USING (
    public.is_super_admin()
  );

CREATE POLICY "profiles_superadmin_delete" ON public.profiles
  FOR DELETE USING (
    public.is_super_admin()
  );

-- companies: 認証なし・公開済みのみ読み込み可能
CREATE POLICY "companies_public_read" ON public.companies
  FOR SELECT USING (publish_status = 'published' AND is_deleted = false);

-- companies: 承認済み管理者は全件読み込み可能
CREATE POLICY "companies_admin_read" ON public.companies
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_approved = true
    )
  );

-- companies: 承認済み管理者のみ作成可能
CREATE POLICY "companies_admin_insert" ON public.companies
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_approved = true
    )
  );

-- companies: 承認済み管理者のみ更新可能
CREATE POLICY "companies_admin_update" ON public.companies
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_approved = true
    )
  );

-- ===========================================
-- Triggers: Auth ユーザー作成時に profile を自動生成
-- ===========================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, display_name, role, is_approved)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'display_name', ''), 
    'admin', 
    false
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ===========================================
-- Storage: company-logos バケット
-- ===========================================
-- Supabase ダッシュボードで以下を設定:
-- 1. Storage > New Bucket > company-logos (public: true)
-- 2. Policy: authenticated users can upload
-- 3. Policy: public can read

-- ===========================================
-- 最初の super_admin 設定（初回のみ）
-- ===========================================
-- Supabase Auth でユーザー登録後、以下を実行:
-- UPDATE public.profiles
-- SET role = 'super_admin', is_approved = true
-- WHERE email = 'your-superadmin@example.com';
