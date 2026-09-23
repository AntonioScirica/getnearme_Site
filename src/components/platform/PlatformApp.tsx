'use client';

import type { UserData } from '@/app/[locale]/dashboard/page';

export default function PlatformApp({ userData }: { userData: UserData }) {
  return (
    <div className="flex h-full items-center justify-center text-neutral-500">
      Nuova piattaforma, {userData.email}
    </div>
  );
}
