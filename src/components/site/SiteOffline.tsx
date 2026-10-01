// Sito spento o piano scaduto: pagina gentile con nome e contatto dell'agente, non un 404 nudo
// (anche per i link alle singole case gia' mandati ai clienti)
export default function SiteOffline({ name, email }: { name: string; email: string }) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f5f5f7] p-6 font-sans text-[#1d1d1f]">
      <div className="w-full max-w-md rounded-[32px] bg-white p-8 text-center shadow-sm ring-1 ring-black/5">
        <h1 className="text-2xl font-bold tracking-tight">{name || 'Sito non disponibile'}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-[#6e6e73]">Il sito non è disponibile in questo momento. Torna a trovarci presto.</p>
        {email && <a href={`mailto:${email}`} className="mt-6 inline-flex h-11 items-center rounded-full bg-[#1d1d1f] px-6 text-sm font-semibold text-white">Scrivi a {email}</a>}
      </div>
    </main>
  );
}
