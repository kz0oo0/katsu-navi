import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'

// Manually parse .env.local since we might not have dotenv globally
const envFile = fs.readFileSync(path.join(process.cwd(), '.env.local'), 'utf8')
const env = Object.fromEntries(
  envFile.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(s => s.trim()))
)

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing env vars in .env.local')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const email = 'kazuhiro.m1224@gmail.com'
const password = 'Mkazuhiro1224'

async function run() {
  console.log(`🚀 Creating/Activating user: ${email}...`)
  
  // 1. Check if user exists
  const { data: { users }, error: listError } = await supabase.auth.admin.listUsers()
  if (listError) throw listError

  let user = users.find(u => u.email === email)

  if (!user) {
    console.log('Registering new user...')
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true
    })
    if (createError) throw createError
    user = newUser.user
    console.log('User registered.')
  } else {
    console.log('User already exists in Auth.')
  }

  // 2. Activate in profiles table
  console.log('Activating profile as super_admin...')
  const { error: profError } = await supabase
    .from('profiles')
    .upsert({ 
      id: user.id, 
      email: email,
      display_name: 'かず',
      role: 'super_admin', 
      is_approved: true
    })

  if (profError) throw profError
  
  console.log('✅ Success! User is now a super_admin and approved.')
}

run().catch(err => {
  console.error('❌ Error:', err)
  process.exit(1)
})
