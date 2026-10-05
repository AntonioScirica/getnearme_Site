"use client";

import BusinessPlanView from "@/components/platform/BusinessPlanView";

// Business plan dinamico con i dati reali (bp-actuals accetta la chiave del dashboard).
// BusinessPlanView usa il tema chiaro della piattaforma: contenitore chiaro dentro il dashboard scuro.
export default function BusinessPlanPage({ authKey }: { authKey: string }) {
  return (
    <div className="-m-4 md:-m-6 min-h-screen bg-canvas px-4 py-6 font-sans text-ink sm:px-8">
      <div className="mx-auto max-w-[1280px]">
        <BusinessPlanView userKey="metrics-dashboard" actualsHeaders={{ "x-metrics-key": authKey }} />
      </div>
    </div>
  );
}
