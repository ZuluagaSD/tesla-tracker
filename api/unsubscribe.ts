import type { VercelRequest, VercelResponse } from '@vercel/node'
import { createClient } from '@supabase/supabase-js'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  const { email } = req.body
  if (!email) return res.status(400).json({ error: 'Missing email' })

  const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_KEY!,
  )

  const { error } = await supabase
    .from('subscribers')
    .update({
      is_active: false,
      access_token: null,
      refresh_token: '',
      updated_at: new Date().toISOString(),
    })
    .eq('email', email)

  if (error) {
    return res.status(500).json({ error: 'Failed to unsubscribe' })
  }

  return res.status(200).json({ success: true, message: 'Unsubscribed successfully' })
}
