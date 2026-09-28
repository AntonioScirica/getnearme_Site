import { createClient } from '@supabase/supabase-js'
import { isPlatformAdmin } from '@/lib/platformAdmins'

// Il sito pubblico e' nei piani Plus e Pro (28/09/2026): Starter ha solo foto e video. Vale anche per chi ha il vecchio
// abbonamento GetNearMe a pagamento e per gli admin. Lo stesso controllo tiene il nome del sito e accende la pagina.
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function sitePlanHolders(ids: string[]): Promise<Set<string>> {
  if (!ids.length) return new Set()
  const now = new Date().toISOString()
  const [{ data: plat }, { data: old }, admins] = await Promise.all([
    admin.from('platform_credits').select('user_id').in('user_id', ids).in('plan', ['plus', 'pro']).gt('subscription_until', now),
    admin.from('user_credits').select('user_id, subscription_type').in('user_id', ids),
    Promise.all(ids.map(id => admin.auth.admin.getUserById(id).then(r => (isPlatformAdmin(r.data.user?.email) ? id : null)).catch(() => null))),
  ])
  return new Set([
    ...(plat ?? []).map(r => r.user_id as string),
    ...(old ?? []).filter(r => r.subscription_type && !['free', 'ambassador'].includes(r.subscription_type)).map(r => r.user_id as string),
    ...admins.filter((x): x is string => !!x),
  ])
}

export const hasSitePlan = async (userId: string) => (await sitePlanHolders([userId])).has(userId)
