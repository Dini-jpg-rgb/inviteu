import React from "react";
import { Sidebar } from "@/components/layout/Sidebar";
import { PartnerProvider } from "@/context/PartnerContext";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <PartnerProvider>
      <div className="flex h-screen overflow-hidden bg-[#f6efe6] text-zinc-900 selection:bg-[#2d1b11] selection:text-white">
        <Sidebar />
        <div className="flex-1 flex flex-col min-w-0 h-screen overflow-hidden">
          <main className="flex-1 p-6 md:p-10 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </PartnerProvider>
  );
}
