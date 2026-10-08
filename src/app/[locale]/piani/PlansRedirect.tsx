'use client'
import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'

export default function PlansRedirect({ locale }: { locale: 'it' | 'en' }) {
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      window.location.replace(session?.user ? `/${locale}/dashboard#/piano?cambia=1` : `/${locale}#prezzi`)
    }, () => window.location.replace(`/${locale}#prezzi`))
  }, [locale])
  return null
}
