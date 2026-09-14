"use client";

import { useEffect, Suspense } from "react";
import { usePathname, useSearchParams } from "next/navigation";

function AnalyticsTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const url = `${pathname}${searchParams?.toString() ? `?${searchParams.toString()}` : ""}`;
    console.log(`[Analytics] PageView: ${url}`);
  }, [pathname, searchParams]);

  return null;
}

export default function AnalyticsWrapper({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Suspense fallback={null}>
        <AnalyticsTracker />
      </Suspense>
      {children}
    </>
  );
}
