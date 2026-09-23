import type { PortfolioBrand } from '@/lib/portfolio';

export default function PortfolioHeader({ brand, locale }: { brand: PortfolioBrand; locale: string }) {
  const logo = brand.logo_colored_h || brand.logo_black_h;
  const name = brand.company_name || brand.display_name || 'Portfolio immobili';
  return (
    <header className="border-b border-line bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <a href={`/${locale}/a/${brand.portfolio_slug}`} className="flex min-w-0 items-center gap-3">
          {logo ? <img src={logo} alt={name} className="h-9 max-w-[180px] object-contain" /> : <span className="truncate font-display text-xl font-bold">{name}</span>}
        </a>
        {brand.company_email && (
          <a href={`mailto:${brand.company_email}`} className="shrink-0 rounded-lg px-4 py-2 text-sm font-medium text-white" style={{ background: brand.primary_color }}>
            Contattaci
          </a>
        )}
      </div>
    </header>
  );
}
