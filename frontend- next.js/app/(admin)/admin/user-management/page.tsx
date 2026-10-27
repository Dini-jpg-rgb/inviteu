"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function UserManagementIndexPage() {
  const router = useRouter();

  useEffect(() => {
    router.replace("/admin/user-management/admin");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-[300px]">
      <div className="flex items-center gap-2 text-zinc-500 text-sm">
        <span className="w-2 h-2 rounded-full bg-rose-600 animate-ping" />
        <span>Memuat User Management...</span>
      </div>
    </div>
  );
}
