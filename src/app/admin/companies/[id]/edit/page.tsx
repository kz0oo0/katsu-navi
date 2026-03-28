import { createClient } from '@/lib/supabase/server'
import CompanyForm from '@/components/CompanyForm'
import { notFound } from 'next/navigation'
import { Company } from '@/lib/types'

export default async function EditCompanyPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('companies')
    .select('*')
    .eq('id', id)
    .eq('is_deleted', false)
    .single()

  if (error || !data) notFound()

  return <CompanyForm mode="edit" initialData={data as Company} />
}
