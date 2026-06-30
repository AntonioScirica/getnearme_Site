"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

// A trial/signup CTA that becomes a "Go to dashboard" button when the visitor is
// already logged in (same behaviour as the navbar). Keep its href/children as the
// logged-out version; when logged in it links to /{locale}/dashboard.
export default function AuthCta({
  locale,
  href,
  className,
  style,
  children,
  dashLabel,
}: {
  locale: string;
  href: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
  dashLabel?: string;
}) {
  const [logged, setLogged] = useState(false);
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setLogged(!!session?.user));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setLogged(!!s?.user));
    return () => subscription.unsubscribe();
  }, []);

  if (logged) {
    return (
      <a href={`/${locale}/dashboard`} className={className} style={style}>
        {dashLabel || "Vai alla dashboard"}
      </a>
    );
  }
  return (
    <a href={href} className={className} style={style}>
      {children}
    </a>
  );
}
