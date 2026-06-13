import { supabase } from './supabase'

export type ProjectData = {
  id: string
  nome: string
  addr: string
  prezzo: number
  mq: number
  bagni: number
  camere: number
  titolo: string
  cover: string
  icons?: Record<string, string>
  createdAt: string
}

export async function fetchProjects(): Promise<ProjectData[]> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return []
  try {
    const res = await fetch('/api/projects', {
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    })
    if (!res.ok) return []
    const json = await res.json()
    return json.projects ?? []
  } catch (err) {
    console.error('fetchProjects error:', err)
    return []
  }
}

export async function createProject(project: Omit<ProjectData, 'id' | 'createdAt'>): Promise<ProjectData | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  try {
    const res = await fetch('/api/projects', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(project),
    })
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error('API Error:', errJson);
      return null;
    }
    const json = await res.json()
    return json.project ?? null
  } catch (err) {
    console.error('createProject error:', err)
    return null
  }
}

export async function updateProject(id: string, updates: Partial<Omit<ProjectData, 'id' | 'createdAt'>>): Promise<ProjectData | null> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return null
  try {
    const res = await fetch('/api/projects', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id, ...updates }),
    })
    if (!res.ok) {
      const errJson = await res.json().catch(() => ({}));
      console.error('API Error:', errJson);
      return null;
    }
    const json = await res.json()
    return json.project ?? null
  } catch (err) {
    console.error('updateProject error:', err)
    return null
  }
}

export async function deleteProject(id: string): Promise<boolean> {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) return false
  try {
    const res = await fetch(`/api/projects?id=${id}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
      },
    })
    return res.ok
  } catch (err) {
    console.error('deleteProject error:', err)
    return false
  }
}
