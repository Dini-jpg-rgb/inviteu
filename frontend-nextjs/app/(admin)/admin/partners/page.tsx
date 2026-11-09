"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OldAdminPartnersPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/user-management/partner");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
        <span>Mengalihkan ke User Management &gt; Partner Management...</span>
      </div>
    </div>
  );
}
