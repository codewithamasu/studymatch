import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: path.join(__dirname, '../.env') })

const supabaseUrl = process.env.VITE_SUPABASE_URL
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function testRealtime() {
  // Find the Alex conversation
  const peerId = '20000000-0000-0000-0000-000000000001'
  
  // Get a conversation matching this peer
  const { data: memberRows, error: memberError } = await supabase
    .from('conversation_members')
    .select('conversation_id')
    .eq('profile_id', peerId)
    .limit(1)

  if (memberError || !memberRows.length) {
    console.error('Could not find a conversation with the peer')
    process.exit(1)
  }

  const conversationId = memberRows[0].conversation_id

  console.log(`Inserting message to conversation: ${conversationId}`)

  const { data, error } = await supabase
    .from('messages')
    .insert({
      conversation_id: conversationId,
      sender_profile_id: peerId,
      body: 'Testing Realtime Sync! ' + new Date().toLocaleTimeString(),
    })
    .select()

  if (error) {
    console.error('Error inserting message:', error)
  } else {
    console.log('Message inserted successfully:', data)
  }
}

testRealtime()
