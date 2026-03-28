-- company_views テーブル（閲覧ログ）の作成
CREATE TABLE IF NOT EXISTS public.company_views (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  company_id uuid REFERENCES public.companies(id) ON DELETE CASCADE,
  viewed_at timestamptz DEFAULT now() NOT NULL,
  ip_hash text,
  user_agent text
);

-- RLSの設定
ALTER TABLE public.company_views ENABLE ROW LEVEL SECURITY;

-- 読み取り: 承認済み管理者のみ可能
CREATE POLICY "company_views_admin_read" ON public.company_views
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = auth.uid() AND p.is_approved = true
    )
  );

-- 書き込み: 誰でも可能（トラッキング用）
-- セキュリティ上は制限すべきだが、パブリックアクセスのトラッキングのため許可
CREATE POLICY "company_views_public_insert" ON public.company_views
  FOR INSERT WITH CHECK (true);

-- インデックス作成（集計速度向上のため）
CREATE INDEX IF NOT EXISTS idx_company_views_company_id ON public.company_views(company_id);
CREATE INDEX IF NOT EXISTS idx_company_views_viewed_at ON public.company_views(viewed_at);
