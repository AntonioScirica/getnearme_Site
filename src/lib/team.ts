// Team (agenzia) API layer. Parla con le edge function condivise dell'estensione
// sulla stessa Supabase: `manage-team` (azioni) e `join-team` (accetta inviti).
// Pattern fetch diretto come staging.ts (evita deadlock navigator.locks).

import { getTokenFast, refreshTokenFast } from './staging';

const FN_BASE = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1`;
const ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY as string;

async function invokeFn<T = unknown>(name: string, body: unknown, timeoutMs = 30_000): Promise<{ data: T | null; status: number; error: string | null }> {
  const once = async (token: string) => {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      return await fetch(`${FN_BASE}/${name}`, {
        method: 'POST',
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        signal: ctrl.signal,
      });
    } finally { clearTimeout(timer); }
  };
  try {
    let resp = await once(getTokenFast());
    if (resp.status === 401) {
      const fresh = await refreshTokenFast();
      if (fresh) resp = await once(fresh);
    }
    let json: unknown = null;
    try { json = await resp.json(); } catch { /* no body */ }
    const j = (json ?? {}) as { error?: string };
    return { data: json as T, status: resp.status, error: resp.ok ? null : (j.error || `HTTP ${resp.status}`) };
  } catch (e) {
    const err = e as { name?: string; message?: string };
    return { data: null, status: 0, error: err?.name === 'AbortError' ? '__timeout' : (err?.message || 'network') };
  }
}

export type TeamMember = {
  user_id: string;
  role: 'owner' | 'member';
  joined_at: string;
  email: string;
  avatar_url: string | null;
};

export type TeamInvite = {
  id: string;
  email: string;
  status: string;
  created_at: string;
  expires_at: string;
};

export type TeamStatus = {
  in_team: boolean;
  role: 'owner' | 'member' | null;
  team_id: string | null;
  team_name: string;
  invite_code: string | null;
  max_members: number;
  member_count: number;
  members: TeamMember[];
  pending_invites: TeamInvite[];
  member_left: { email: string; at: string } | null;
};

type Ok = { success?: boolean; error?: string };

const manage = <T = Ok>(action: string, extra: Record<string, unknown> = {}) =>
  invokeFn<T>('manage-team', { action, ...extra });

export async function getTeamStatus(): Promise<TeamStatus | null> {
  const res = await manage<TeamStatus>('get_status');
  return res.error ? null : res.data;
}

export async function createTeam(teamName: string) {
  return manage<{ success: boolean; team_id?: string; invite_code?: string; error?: string }>('create', { team_name: teamName });
}

export async function updateTeamName(teamName: string) {
  return manage('update', { team_name: teamName });
}

export async function regenerateInviteCode() {
  return manage<{ success: boolean; invite_code?: string; error?: string }>('regenerate_code');
}

export async function inviteTeamMember(email: string) {
  return manage<{ success: boolean; invite_id?: string; error?: string }>('invite_email', { email });
}

export async function removeTeamMember(memberUserId: string) {
  return manage('remove_member', { member_user_id: memberUserId });
}

export async function revokeInvite(inviteId: string) {
  return manage('revoke_invite', { invite_id: inviteId });
}

export async function leaveTeam() {
  return manage('leave');
}

export async function dissolveTeam() {
  return manage('dissolve');
}

export async function autoJoinTeam() {
  return manage<{ success: boolean; team_id?: string; team_name?: string }>('auto_join');
}

export async function joinTeam(opts: { code?: string; token?: string }) {
  return invokeFn<{ success: boolean; team_id?: string; team_name?: string; error?: string }>(
    'join-team',
    { invite_code: opts.code, invite_token: opts.token }
  );
}

// Helper UI: iniziali + colore deterministico (porta dall'estensione panel.js).
const AVATAR_COLORS = ['#3B82F6', '#8B5CF6', '#10B981', '#F59E0B', '#EF4444', '#EC4899', '#06B6D4', '#6366F1'];

export function avatarColor(str: string): string {
  let h = 0;
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) | 0;
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length];
}

export function initials(email: string): string {
  const name = (email || '').split('@')[0] || '';
  const parts = name.split(/[._-]+/).filter(Boolean);
  const chars = parts.length >= 2 ? parts[0][0] + parts[1][0] : name.slice(0, 2);
  return chars.toUpperCase();
}
