import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(s => s.trim()))
)

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY)

async function run() {
  const email = 'kazuhiro.m1224@gmail.com'
  console.log(`🔍 Checking status for: ${email}...`)
  
  // 1. Get Auth User
  const { data: { users } } = await supabase.auth.admin.listUsers()
  const user = users.find(u => u.email === email)
  
  if (!user) {
    console.log('❌ User not found in Auth.')
    return
  }
  console.log(`Auth ID: ${user.id}`)

  // 2. Get Profile
  const { data: profile, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error) {
    console.log('❌ Profile Error:', error.message)
    const { data: all } = await supabase.from('profiles').select('*')
    console.log('Current Profiles:', all)
  } else {
    console.log('✅ Profile Found:', profile)
  }
}

run().catch(console.error)
