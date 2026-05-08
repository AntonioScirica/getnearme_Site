import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import HomepageClient from "../HomepageClient";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function PricingExtPage({ params }: Props) {
  const { locale } = await params;
  const t = translations[locale as Locale];
  const l = t.landing;

  return (
    <main style={{ minHeight: "100vh", background: "#eef2ff" }}>
      <HomepageClient
        variant="pricing-section"
        locale={locale}
        pricingData={{
          title1: l.pricing.title1,
          title2: l.pricing.title2,
          titleHighlight: l.pricing.titleHighlight,
          subtitle: l.pricing.subtitle,
          countdownLabel: l.pricing.countdownLabel,
          trustBadges: l.pricing.trustBadges,
          savingsLabel: l.pricing.savingsLabel,
          progressAgencies: l.pricing.progressAgencies,
          progressSpots: l.pricing.progressSpots,
          plans: l.pricing.plans,
        }}
      />
    </main>
  );
}
