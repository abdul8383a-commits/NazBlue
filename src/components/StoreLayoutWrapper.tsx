"use client";

import { usePathname } from "next/navigation";
import BottomNavigation from "./BottomNavigation";

export default function StoreLayoutWrapper({ 
  children, 
  navbar, 
  footer 
}: { 
  children: React.ReactNode;
  navbar: React.ReactNode;
  footer: React.ReactNode;
}) {
  const pathname = usePathname();
  const isAdmin = pathname?.startsWith("/admin");

  if (isAdmin) {
    return <>{children}</>;
  }

  return (
    <div className="min-h-screen flex flex-col relative pb-16 md:pb-0">
      {navbar}
      <main className="flex-1 w-full overflow-x-hidden">
        {children}
      </main>
      {footer}
      <BottomNavigation />
    </div>
  );
}
