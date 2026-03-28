-- 1. profilesテーブルに display_name カラムを追加
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS display_name text;

-- 2. 新規ユーザー作成時のトリガー関数を更新（メタデータから名前を取得するように）
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

-- 3. あなた（kazuhiroさん）の名前を「かず」に設定
UPDATE public.profiles 
SET display_name = 'かず', role = 'super_admin', is_approved = true 
WHERE email = 'kazuhiro.m1224@gmail.com';
