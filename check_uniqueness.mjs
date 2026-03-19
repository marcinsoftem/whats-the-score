import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkUniqueness() {
  // Test if we can insert two virtual players with same name but different owners
  const testId1 = crypto.randomUUID()
  const testId2 = crypto.randomUUID()
  const name = `Test_${Date.now()}`

  console.log(`Checking uniqueness for name: ${name}`)

  const { error: err1 } = await supabase.from('profiles').insert({
    id: testId1,
    nickname: name,
    type: 'virtual',
    owner_id: '00000000-0000-0000-0000-000000000000' // dummy or null
  })

  if (err1) {
    console.error('Insert 1 failed:', err1.message)
    return
  }

  const { error: err2 } = await supabase.from('profiles').insert({
    id: testId2,
    nickname: name,
    type: 'virtual',
    owner_id: '11111111-1111-1111-1111-111111111111' // different dummy
  })

  if (err2) {
    if (err2.message.includes('unique constraint')) {
      console.log('UNQUE CONSTRAINT DETECTED on nickname')
    } else {
      console.error('Insert 2 failed with different error:', err2.message)
    }
  } else {
    console.log('MULTIPLE VIRTUAL PLAYERS WITH SAME NAME ALLOWED BY DB')
    // Clean up
    await supabase.from('profiles').delete().in('id', [testId1, testId2])
  }
}

checkUniqueness()
