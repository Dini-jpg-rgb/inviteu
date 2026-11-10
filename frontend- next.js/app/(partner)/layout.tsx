import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PartnerProvider } from "@/context/PartnerContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PartnerProvider>
      <div className="flex h-screen overflow-hidden bg-[#f6efe6] text-zinc-900 selection:bg-[#2d1b11] selection:text-white print:h-auto print:overflow-visible print:bg-white print:block">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden print:h-auto print:overflow-visible print:block print:w-full">
          <main className="flex-1 p-6 md:p-10 overflow-y-auto print:p-0 print:m-0 print:overflow-visible print:h-auto print:w-full">
            {children}
          </main>
        </div>
      </div>
    </PartnerProvider>
  );
}
