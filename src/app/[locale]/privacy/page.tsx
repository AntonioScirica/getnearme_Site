import type { Metadata } from "next";
import Link from "next/link";
import { locales, type Locale } from "@/lib/i18n";
import { translations } from "@/lib/translations";
import Navbar from "@/components/Navbar";

type Props = {
  params: Promise<{ locale: string }>;
};

export async function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;

  return {
    title: "Privacy Policy & Terms of Service — GetNearMe",
    description: "Privacy Policy and Terms of Service for the GetNearMe browser extension.",
    alternates: {
      canonical: `https://getnearme.it/${locale}/privacy`,
    },
  };
}

export default async function PrivacyPolicy({ params }: Props) {
  const { locale } = await params;
  const t = translations[locale as Locale];

  return (
    <div className="min-h-screen bg-white font-sans text-slate-900">
      <Navbar locale={locale as Locale} />

      <main className="pt-32 pb-20 px-4 max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href={`/${locale}`} className="text-blue-500 hover:text-blue-600 text-sm font-medium">
            {t.nav.backToHome}
          </Link>
        </div>

        <article className="prose prose-slate max-w-none">
          {/* ===== PRIVACY POLICY ===== */}
          <h1 className="text-4xl font-serif font-bold text-slate-900">Privacy Policy</h1>
          <p className="text-slate-500 text-sm mb-8">Last Updated: 01 February 2026</p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">1. Introduction and Data Controller</h2>
          <p className="text-slate-600 leading-relaxed">
            This Privacy Policy governs the processing of personal data in connection with the use of the GetNearMe browser extension (the &quot;Service&quot;). This Policy is compliant with Regulation (EU) 2016/679 (GDPR) and is intended to comply with Directive 2002/58/EC (ePrivacy Directive) regarding local storage and access to information on user terminal equipment.
          </p>
          <p className="text-slate-600 leading-relaxed">
            <strong>Data Controller:</strong> Antonio Scirica acting commercially under the trade name &quot;GetNearMe&quot;<br />
            <strong>Email:</strong> as.scirica@gmail.com
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">2. Nature of Data Processing</h2>
          <p className="text-slate-600 leading-relaxed">
            To ensure data minimization and strictly respect third-party intellectual property rights, the Service operates primarily as a local client-side utility.
          </p>
          <ul className="text-slate-600 leading-relaxed">
            <li><strong>Local Processing:</strong> The analysis of real estate properties is performed dynamically within the User&apos;s browser. The Service does not scrape, index, or reproduce third-party databases on its own servers to create a competing search engine.</li>
            <li><strong>No Data Transfer for Aggregation:</strong> Content visible on the User&apos;s screen is processed temporarily in the browser&apos;s volatile memory and is not transmitted to the Controller&apos;s servers for permanent storage or aggregation.</li>
            <li>Property-related data processed locally by the Service relates to real estate objects and locations and does not constitute personal data of identifiable natural persons within the meaning of Article 4 GDPR.</li>
          </ul>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">3. Categories of Data Processed</h2>
          <p className="text-slate-600 leading-relaxed">
            We process only the data strictly necessary to deliver the Service, categorized by storage location:
          </p>

          <h3 className="text-xl font-serif font-bold text-slate-900 mt-6 mb-3">3.1. Server-Side Data (Account &amp; Technical Logs)</h3>
          <p className="text-slate-600 leading-relaxed">
            Our backend infrastructure processes limited metadata required for account management and security:
          </p>
          <ul className="text-slate-600 leading-relaxed">
            <li><strong>Identity Data:</strong> Email address and User ID (authenticated via Supabase) to manage your subscription.</li>
            <li><strong>Transactional Data:</strong> Subscription status, credit balance, and payment identifiers processed securely by Stripe (we do not store full credit card numbers).</li>
            <li><strong>Technical Service Logs:</strong> Technical service validation events confirming that a requested operation was successfully executed (used strictly for credit deduction and debugging), without storing listing content or attributes.</li>
            <li><strong>Security &amp; Retention:</strong> IP addresses and technical logs are retained only for the limited period strictly necessary to fulfill their specific purpose (security monitoring, debugging, and service validation) and are periodically deleted in accordance with internal retention policies to comply with the principle of Storage Limitation (Art. 5(1)(e) GDPR).</li>
          </ul>

          <h3 className="text-xl font-serif font-bold text-slate-900 mt-6 mb-3">3.2. Client-Side Data (Local Device Only)</h3>
          <p className="text-slate-600 leading-relaxed">
            To display comparisons and contextual insights, the Service processes the following data exclusively on your device:
          </p>
          <ul className="text-slate-600 leading-relaxed">
            <li><strong>Temporary Session Data:</strong> The Extension utilizes the browser&apos;s Local Storage API (chrome.storage.local) to temporarily cache limited factual data necessary for analysis visible on the page required for the User&apos;s requested analysis. This data remains sandboxed within your browser and is not accessible to the Controller.</li>
          </ul>

          <h3 className="text-xl font-serif font-bold text-slate-900 mt-6 mb-3">3.3. Voluntary Marketing Data</h3>
          <p className="text-slate-600 leading-relaxed">
            Only if you explicitly consent via a separate checkbox, we process your email address and activity metrics (such as daily usage streaks) to administer the optional Daily Bonus system and send the Newsletter.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">4. Third-Party Processors and Data Recipients</h2>
          <ul className="text-slate-600 leading-relaxed">
            <li><strong>Infrastructure and Payments:</strong> We utilize Supabase (EU) for database hosting and authentication services, and Stripe (Global) for secure PCI-DSS compliant payment processing.</li>
            <li><strong>Communications:</strong> We use Resend (USA) as our email delivery provider for sending transactional codes and, where consented, newsletters.</li>
            <li><strong>Maps and Routing:</strong> To calculate distances and travel times, the Service transmits coordinate pairs to Routing &amp; Mapping Services.</li>
            <li><strong>Market Data &amp; Valuations:</strong> Specific property location data may be cross-referenced with Public Market Data Sources to retrieve estimated market valuations.</li>
            <li><strong>Contextual Events &amp; Activities:</strong> To display nearby activities, the Service queries Contextual Event &amp; Activity Providers. These providers receive general location coordinates and dates to return relevant events; no User identity or personal browsing history is shared with them.</li>
            <li><strong>AI Processing:</strong> If the User voluntarily triggers the &quot;Virtual Staging&quot; feature, image URLs are transmitted transiently to AI Processing Providers solely for the generation of the requested content.</li>
          </ul>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">5. Legal Basis for Processing</h2>
          <p className="text-slate-600 leading-relaxed">
            In compliance with Article 6 of the GDPR, we process data based on the following grounds:
          </p>
          <ul className="text-slate-600 leading-relaxed">
            <li><strong>Performance of a Contract (Art. 6(1)(b)):</strong> For the core delivery of the analysis service, routing calculations, valuation estimates, account management, and processing payments.</li>
            <li><strong>Legitimate Interest (Art. 6(1)(f)):</strong> For ensuring the security of the Extension, preventing fraud (e.g., credit abuse), and maintaining platform integrity.</li>
            <li><strong>Explicit Consent (Art. 6(1)(a)):</strong> For optional features such as marketing communications, the Daily Bonus system, and AI-generated content.</li>
            <li><strong>Legal Obligation (Art. 6(1)(c)):</strong> For tax reporting and accounting compliance.</li>
          </ul>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">6. User Rights</h2>
          <p className="text-slate-600 leading-relaxed">
            Under the GDPR, you have the right to access your data, rectify inaccuracies, erase your account (&quot;right to be forgotten&quot;), and object to processing based on legitimate interest. You also have the right to data portability (Art. 20) and the right to lodge a complaint with a supervisory authority (Art. 77), such as the Garante per la protezione dei dati personali.
          </p>
          <p className="text-slate-600 leading-relaxed">
            To exercise these rights, please contact: <a href="mailto:as.scirica@gmail.com" className="text-blue-500 hover:text-blue-600">as.scirica@gmail.com</a>.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">7. Changes to this Policy</h2>
          <p className="text-slate-600 leading-relaxed">
            We may update this Privacy Policy from time to time. We will notify you of any significant changes via the Extension interface or email.
          </p>

          <hr className="my-16 border-slate-200" />

          {/* ===== TERMS OF SERVICE ===== */}
          <h1 className="text-4xl font-serif font-bold text-slate-900">Terms of Service</h1>
          <p className="text-slate-500 text-sm mb-8">Last Updated: 01 February 2026</p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">1. Acceptance of Terms</h2>
          <p className="text-slate-600 leading-relaxed">
            By installing or using the GetNearMe extension (&quot;Service&quot;), you agree to be bound by these Terms of Service (&quot;Terms&quot;). You affirm that you are at least 18 years of age and are fully able and competent to enter into this agreement. If you do not agree, you must immediately uninstall the Service.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">2. License and Nature of Service</h2>
          <p className="text-slate-600 leading-relaxed">
            <strong>2.1. Client-Side Utility:</strong> You acknowledge that the Service operates as a &quot;User Agent&quot; or browser utility under your direct control. It is designed to augment your local browsing experience by visualizing independent market insights.
          </p>
          <p className="text-slate-600 leading-relaxed">
            <strong>2.2. Limited License:</strong> We grant you a revocable, non-exclusive, non-transferable license to use the Service solely for your personal or internal business analysis of real estate market data.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">3. Restrictions and Intellectual Property</h2>
          <p className="text-slate-600 leading-relaxed">
            <strong>3.1. Independence:</strong> GetNearMe is an independent software tool. We are not affiliated with, endorsed by, sponsored by, or officially connected to any real estate platform (such as Immobiliare.it, Idealista, or others). All third-party trademarks are the property of their respective owners and are used solely for descriptive compatibility purposes (Nominative Fair Use).
          </p>
          <p className="text-slate-600 leading-relaxed">
            <strong>3.2. Prohibited Conduct:</strong> You explicitly agree NOT to use the Service to:
          </p>
          <ul className="text-slate-600 leading-relaxed">
            <li>Perform mass extraction of data for the purpose of creating a competing database, search engine, or commercial service.</li>
            <li>Bypass any security measures, CAPTCHAs, or authentication barriers of third-party platforms.</li>
            <li>Violate the Terms of Service of any third-party real estate portal visited while using the Extension.</li>
          </ul>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">4. Disclaimers and Limitations of Liability</h2>
          <p className="text-slate-600 leading-relaxed">
            <strong>4.1. Estimated Values:</strong> Any &quot;Estimated Total&quot; or financial calculation provided by the Service represents an indicative estimate of costs associated with a property purchase (e.g., agency fees, notary costs, taxes). These estimates are for informational purposes only and do not constitute a binding offer or professional financial quote.
          </p>
          <p className="text-slate-600 leading-relaxed">
            <strong>4.2. Data Reliability:</strong> The information visualized by the Service is derived from publicly available data, information present in the analyzed listings, and automatic processing. We do not verify energy classes via official certificates (APE) nor guarantee the accuracy of data in the source listings. Inaccuracies or omissions in the original third-party listing may be reflected in the Service&apos;s report.
          </p>
          <p className="text-slate-600 leading-relaxed">
            <strong>4.3. No Professional Advice:</strong> The Service does not substitute technical, legal, fiscal, or real estate verification performed by qualified professionals. GetNearMe assumes no responsibility for decisions made based on the information provided.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">5. Liability</h2>
          <p className="text-slate-600 leading-relaxed">
            To the maximum extent permitted by applicable law, GetNearMe shall not be liable for any indirect, incidental, special, or consequential damages, including loss of profits, data, or goodwill, arising out of the use or inability to use the Service.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">6. Termination</h2>
          <p className="text-slate-600 leading-relaxed">
            We reserve the right to suspend or terminate your access to the Service immediately, without prior notice, if you breach these Terms, particularly regarding the unauthorized mass extraction of data or violation of third-party rights.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">7. General Provisions</h2>
          <p className="text-slate-600 leading-relaxed">
            <strong>7.1. Severability:</strong> If any provision of these Terms is found to be unenforceable or invalid, that provision will be limited or eliminated to the minimum extent necessary so that these Terms will otherwise remain in full force and effect.
          </p>
          <p className="text-slate-600 leading-relaxed">
            <strong>7.2. Changes to Terms:</strong> We reserve the right to modify these Terms at any time at our sole discretion. Continued use of the Service following any changes constitutes your acceptance of the new Terms.
          </p>

          <h2 className="text-2xl font-serif font-bold text-slate-900 mt-10 mb-4">8. Governing Law and Jurisdiction</h2>
          <p className="text-slate-600 leading-relaxed">
            These Terms shall be governed by the laws of Italy. Any dispute arising out of or relating to these Terms shall be subject to the exclusive jurisdiction of the competent courts of Rome, Italy. European consumers have the right to use the Online Dispute Resolution platform.
          </p>
        </article>
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-white">
        <div className="max-w-7xl mx-auto px-4 pt-8 pb-8">
          <div className="pt-4 border-t border-slate-800">
            <p className="text-slate-400 text-sm font-light text-center">
              © 2026 GetNearMe. {t.footer.rights}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
