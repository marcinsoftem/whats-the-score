import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env.local') })

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkSchema() {
  const { data, error } = await supabase
    .from('matches')
    .select('*')
    .limit(1)

  if (error) {
    console.error('Error fetching match:', error)
    return
  }

  if (data && data.length > 0) {
    console.log('Columns in matches table:', Object.keys(data[0]))
  } else {
    console.log('No matches found to check columns.')
  }
}

checkSchema()
