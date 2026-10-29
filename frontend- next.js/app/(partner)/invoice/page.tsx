"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function PartnerInvoicePage() {
  const router = useRouter();

  useEffect(() => {
    // Menu Invoice telah dipindahkan ke halaman profil partner
    router.replace("/profile#invoice");
  }, [router]);

  return (
    <div className="p-8 text-center text-xs text-zinc-500">
      Mengalihkan ke halaman Profil Partner (Invoice & Riwayat Pembayaran)...
    </div>
  );
}
