import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { loadSite, siteUrl } from '@/lib/portfolio';
import { SitePage } from '@/components/site/pages';

export const revalidate = 60;
type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  return { title: { absolute: s ? `Cookie policy | ${s.name}` : 'Cookie policy' }, robots: { index: false }, alternates: { canonical: siteUrl(slug, '/cookie') } };
}

export default async function Page({ params }: Props) {
  const { locale, slug } = await params;
  const s = await loadSite(locale, slug);
  if (!s) notFound();
  return <SitePage ctx={s} page={{ page: 'legal', doc: 'cookie' }} />;
}
