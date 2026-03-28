'use server'

import { createClient, createAdminClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'

const PRIMARY_ADMIN_EMAIL = 'kazuhiro.m1224@gmail.com'

export async function approveAdminAction(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  // Get current user's profile to check role
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    throw new Error('権限がありません')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ is_approved: true })
    .eq('id', userId)

  if (error) throw error

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function deleteAdminAction(userId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    throw new Error('権限がありません')
  }

  // Get target user's email to protect primary admin
  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (targetProfile?.email === PRIMARY_ADMIN_EMAIL) {
    throw new Error('システム主管理者を削除することはできません')
  }

  // Use Admin Client to delete from Auth as well
  const adminClient = await createAdminClient()
  
  // 1. Delete from Auth
  const { error: authError } = await adminClient.auth.admin.deleteUser(userId)
  if (authError) console.error('Auth deletion error:', authError)

  // 2. Delete from Profiles (Cascades if configured, but explicit is safer)
  const { error: profileError } = await supabase
    .from('profiles')
    .delete()
    .eq('id', userId)

  if (profileError) throw profileError

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function updateAdminRoleAction(userId: string, role: 'admin' | 'super_admin') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    throw new Error('権限がありません')
  }

  const { data: targetProfile } = await supabase
    .from('profiles')
    .select('email')
    .eq('id', userId)
    .single()

  if (targetProfile?.email === PRIMARY_ADMIN_EMAIL) {
    throw new Error('システム主管理者の権限を変更することはできません')
  }

  const { error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', userId)

  if (error) throw error

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function getAdminProfilesWithVerificationAction() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user?.id)
    .single()

  if (!profile || profile.role !== 'super_admin') {
    return []
  }

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error fetching profiles:', error)
    return []
  }

  return profiles.map(p => ({
    ...p,
    email_verified: true // Supabase側でConfirm EmailをOFFにすることを前提
  }))
}

export async function ensureCompanyLogosBucketAction() {
  const adminClient = await createAdminClient()
  
  // 1. Create bucket if not exists
  const { data, error } = await adminClient.storage.getBucket('company-logos')
  
  if (error || !data) {
    console.log('Creating company-logos bucket...')
    const { error: createError } = await adminClient.storage.createBucket('company-logos', {
      public: true,
      allowedMimeTypes: ['image/png', 'image/jpeg', 'image/gif', 'image/webp', 'image/svg+xml'],
      fileSizeLimit: 1024 * 1024 * 2 // 2MB
    })
    if (createError) console.error('Bucket creation error:', createError)
  } else {
    // Ensure it is public even if it exists
    await adminClient.storage.updateBucket('company-logos', { public: true })
  }

  return { success: true }
}
