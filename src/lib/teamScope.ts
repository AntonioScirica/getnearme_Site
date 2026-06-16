import type { SupabaseClient } from '@supabase/supabase-js'

// Risolve gli user_id che condividono i dati (immobili, galleria) di un team
// agenzia: tutti i membri + l'owner del team attivo. Fuori da un team -> solo se'.
// Richiede un client service-role (bypass RLS) perche' legge righe di altri utenti.
export async function getTeamUserIds(admin: SupabaseClient, userId: string): Promise<string[]> {
  try {
    // 1. L'utente e' membro di un team?
    const { data: mem } = await admin
      .from('team_members')
      .select('team_id')
      .eq('user_id', userId)
      .maybeSingle()

    let teamId: string | null = mem?.team_id ?? null

    // 2. Altrimenti e' owner di un team attivo?
    if (!teamId) {
      const { data: own } = await admin
        .from('teams')
        .select('id')
        .eq('owner_id', userId)
        .eq('is_active', true)
        .maybeSingle()
      teamId = own?.id ?? null
    }

    if (!teamId) return [userId]

    // 3. Team attivo? prendi owner + tutti i membri.
    const { data: team } = await admin
      .from('teams')
      .select('owner_id, is_active')
      .eq('id', teamId)
      .maybeSingle()

    if (!team || team.is_active === false) return [userId]

    const { data: members } = await admin
      .from('team_members')
      .select('user_id')
      .eq('team_id', teamId)

    const ids = new Set<string>([userId, team.owner_id])
    ;(members ?? []).forEach((m: { user_id: string }) => ids.add(m.user_id))
    return [...ids]
  } catch {
    // In caso di errore non bloccare: ricadi sul solo utente.
    return [userId]
  }
}
