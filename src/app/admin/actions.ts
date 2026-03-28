'use server'

import { clerkClient, currentUser } from '@clerk/nextjs/server'
import { revalidatePath } from 'next/cache'

const PRIMARY_ADMIN_EMAIL = 'kazuhiro.m1224@gmail.com'

export async function approveAdminAction(userId: string) {
  const user = await currentUser()
  if (!user || user.publicMetadata.role !== 'super_admin') {
    throw new Error('権限がありません')
  }

  await clerkClient.users.updateUserMetadata(userId, {
    unsafeMetadata: {
      is_approved: true
    }
  })

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function deleteAdminAction(userId: string) {
  const user = await currentUser()
  if (!user || user.publicMetadata.role !== 'super_admin') {
    throw new Error('権限がありません')
  }

  const targetUser = await clerkClient.users.getUser(userId)
  const targetEmail = targetUser.emailAddresses[0]?.emailAddress

  if (targetEmail === PRIMARY_ADMIN_EMAIL) {
    throw new Error('システム主管理者を削除することはできません')
  }

  await clerkClient.users.deleteUser(userId)

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function updateAdminRoleAction(userId: string, role: 'admin' | 'super_admin') {
  const user = await currentUser()
  if (!user || user.publicMetadata.role !== 'super_admin') {
    throw new Error('権限がありません')
  }

  const targetUser = await clerkClient.users.getUser(userId)
  const targetEmail = targetUser.emailAddresses[0]?.emailAddress

  if (targetEmail === PRIMARY_ADMIN_EMAIL) {
    throw new Error('システム主管理者の権限を変更することはできません')
  }

  await clerkClient.users.updateUserMetadata(userId, {
    publicMetadata: {
      role
    }
  })

  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function getAdminProfilesWithVerificationAction() {
  const user = await currentUser()
  if (!user || user.publicMetadata.role !== 'super_admin') {
    return []
  }

  const users = await clerkClient.users.getUserList({
    limit: 100,
  })

  return users.data.map(u => ({
    id: u.id,
    display_name: (u.unsafeMetadata.display_name as string) || '名称未設定',
    email: u.emailAddresses[0]?.emailAddress || '',
    role: (u.publicMetadata.role as string) || 'admin',
    is_approved: !!u.unsafeMetadata.is_approved,
    email_verified: u.emailAddresses[0]?.verification?.status === 'verified',
    created_at: new Date(u.createdAt).toISOString()
  }))
}
