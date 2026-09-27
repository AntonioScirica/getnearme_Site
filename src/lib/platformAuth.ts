import { NextRequest } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)
// Utente dal token Supabase (header Authorization: Bearer ...), come nelle altre rotte della piattaforma.
export async function authUser(req: NextRequest): Promise<{ id: string; email: string } | null> {
  const token = req.headers.get('authorization')?.replace('Bearer ', '')
  if (!token) return null
  const { data } = await admin.auth.getUser(token)
  return data.user ? { id: data.user.id, email: data.user.email ?? '' } : null
}
