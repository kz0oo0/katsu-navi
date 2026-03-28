'use server'

import { createAdminClient, createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const PRIMARY_ADMIN_EMAIL = 'kazuhiro.m1224@gmail.com'

export async function approveAdminAction(id: string) {
  const supabase = await createAdminClient()
  const { error } = await supabase
    .from('profiles')
    .update({ is_approved: true })
    .eq('id', id)

  if (error) {
    throw new Error('承認に失敗しました: ' + error.message)
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function deleteAdminAction(id: string) {
  const supabase = await createAdminClient()

  // 1. Fetch user to check email (protection)
  const { data: user } = await supabase.auth.admin.getUserById(id)
  if (user?.user?.email === PRIMARY_ADMIN_EMAIL) {
    throw new Error('システム主管理者を削除することはできません')
  }

  // 2. Delete Auth User (Complete removal)
  const { error: authError } = await supabase.auth.admin.deleteUser(id)
  
  if (authError) {
    // If auth deletion fails, try deleting only the profile as fallback (might be restricted)
    const { error: profileError } = await supabase
      .from('profiles')
      .delete()
      .eq('id', id)
    
    if (profileError) {
      throw new Error('削除に失敗しました: ' + (authError?.message || profileError.message))
    }
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function updateAdminRoleAction(id: string, role: 'admin' | 'super_admin') {
  const supabase = await createAdminClient()

  // Protection: prevent changing primary admin role
  const { data: { user } } = await supabase.auth.admin.getUserById(id)
  if (user?.email === PRIMARY_ADMIN_EMAIL) {
    throw new Error('システム主管理者の権限を変更することはできません')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', id)

  if (error) {
    throw new Error('権限の更新に失敗しました: ' + error.message)
  }

  revalidatePath('/admin/dashboard')
  return { success: true }
}

const ALLOWED_DOMAINS = [
  'gmail.com',
  'yahoo.co.jp',
  'icloud.com',
  'docomo.ne.jp',
  'softbank.ne.jp',
  'i.softbank.jp',
  'ezweb.ne.jp',
  'au.com'
]

export async function getAdminProfilesWithVerificationAction() {
  const supabase = await createAdminClient()
  
  // 1. Fetch all profiles from public.profiles
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })
    
  if (profileError) throw profileError

  // 2. Fetch all auth users to check email_confirmed_at
  const { data: { users }, error: authError } = await supabase.auth.admin.listUsers()
  if (authError) throw authError

  // 3. Merge verification status into profiles
  const augmentedProfiles = profiles.map(p => {
    const authUser = users.find(u => u.id === p.id)
    return {
      ...p,
      email_verified: !!authUser?.email_confirmed_at,
      email: authUser?.email || p.email // Ensure email is present
    }
  })

  return augmentedProfiles
}

export async function registerAdminAction(email: string, password: string, displayName: string) {
  const domain = email.split('@')[1]?.toLowerCase()
  if (!ALLOWED_DOMAINS.includes(domain)) {
    throw new Error('許可されていないメールドメインです。主要なプロバイダ（Gmail/キャリアメール等）をご使用ください。')
  }

  const supabase = await createClient()

  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        display_name: displayName
      },
      emailRedirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/admin/login`
    }
  })

  if (error) {
    if (error.message.includes('already registered')) {
      throw new Error('このメールアドレスは既に登録されています')
    }
    throw new Error('登録に失敗しました: ' + error.message)
  }

  return { success: true, user: data.user }
}
