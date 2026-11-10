"use client";

import React, { useState } from "react";

interface WidgetItem {
  id: string;
  name: string;
  priority: "Must" | "Should" | "Could";
  basic: boolean;
  pro: boolean;
  premium: boolean;
}

const INITIAL_WIDGETS: WidgetItem[] = [
  { id: "w-01", name: "Cover", priority: "Must", basic: true, pro: true, premium: true },
  { id: "w-02", name: "Event Details", priority: "Must", basic: true, pro: true, premium: true },
  { id: "w-03", name: "Gallery", priority: "Must", basic: true, pro: true, premium: true },
  { id: "w-04", name: "Story", priority: "Should", basic: true, pro: true, premium: true },
  { id: "w-05", name: "Countdown", priority: "Should", basic: true, pro: true, premium: true },
  { id: "w-06", name: "Music", priority: "Should", basic: true, pro: true, premium: true },
  { id: "w-07", name: "RSVP", priority: "Must", basic: true, pro: true, premium: true },
  { id: "w-08", name: "Guestbook", priority: "Should", basic: true, pro: true, premium: true },
  { id: "w-09", name: "Digital Gift", priority: "Should", basic: true, pro: true, premium: true },
  { id: "w-10", name: "Video Greeting", priority: "Could", basic: false, pro: false, premium: true },
  { id: "w-11", name: "Location / Google Maps", priority: "Must", basic: false, pro: true, premium: true },
  { id: "w-12", name: "Bank Account", priority: "Should", basic: false, pro: true, premium: true },
  { id: "w-13", name: "E-wallet", priority: "Should", basic: false, pro: true, premium: true },
  { id: "w-14", name: "Dress Code", priority: "Could", basic: false, pro: true, premium: true },
  { id: "w-15", name: "Live Streaming", priority: "Could", basic: false, pro: false, premium: true },
  { id: "w-16", name: "FAQ", priority: "Could", basic: false, pro: true, premium: true },
  { id: "w-17", name: "Wedding Hashtag", priority: "Could", basic: false, pro: true, premium: true },
];

export default function AdminWidgetsPage() {
  const [widgets, setWidgets] = useState<WidgetItem[]>(INITIAL_WIDGETS);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const toggleWidget = (id: string, tier: "basic" | "pro" | "premium") => {
    setWidgets((prev) =>
      prev.map((w) => {
        if (w.id === id) {
          const updated = { ...w, [tier]: !w[tier] };
          return updated;
        }
        return w;
      })
    );
    const target = widgets.find((w) => w.id === id);
    if (target) {
      const nextVal = !target[tier];
      setToastMessage(
        `Widget "${target.name}" untuk paket ${tier.toUpperCase()} ${
          nextVal ? "diaktifkan" : "dinonaktifkan"
        }`
      );
    }
  };

  const handleReset = () => {
    setWidgets(INITIAL_WIDGETS);
    setToastMessage("Pengaturan ketersediaan widget dikembalikan ke standar awal.");
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 px-4 py-3 rounded-xl flex items-center justify-between text-xs shadow-xs animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="font-semibold">{toastMessage}</span>
          </div>
          <button
            onClick={() => setToastMessage(null)}
            className="text-emerald-700 hover:text-emerald-900 font-bold ml-4 cursor-pointer"
          >
            ✕
          </button>
        </div>
      )}

      {/* Header (Matching Image 5) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 tracking-tight">
            Widget Management
          </h1>
          <p className="text-xs sm:text-sm text-zinc-500 font-medium mt-0.5">
            Widget dan keterkaitannya dengan package
          </p>
        </div>

        <button
          onClick={handleReset}
          className="bg-white hover:bg-zinc-50 border border-[#e5d8c8] text-zinc-700 text-xs font-semibold px-4 py-2 rounded-xl transition shadow-2xs self-start sm:self-auto cursor-pointer"
        >
          Reset ke Standar PRD
        </button>
      </div>

      {/* Widget Table (Matching Image 5) */}
      <div className="bg-white rounded-2xl overflow-hidden border border-[#e5d8c8] shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="border-b border-zinc-200/80 text-zinc-900 font-bold">
              <tr>
                <th className="py-4 px-6 font-bold text-sm">Widget</th>
                <th className="py-4 px-6 font-bold text-sm">Priority</th>
                <th className="py-4 px-6 font-bold text-sm text-center">Basic</th>
                <th className="py-4 px-6 font-bold text-sm text-center">Pro</th>
                <th className="py-4 px-6 font-bold text-sm text-center">Premium</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100">
              {widgets.map((w) => (
                <tr key={w.id} className="hover:bg-amber-50/20 transition-colors">
                  {/* Widget Name */}
                  <td className="py-3.5 px-6 font-semibold text-zinc-900 text-xs sm:text-sm">
                    {w.name}
                  </td>

                  {/* Priority Label */}
                  <td className="py-3.5 px-6 text-zinc-500 font-medium text-xs">
                    {w.priority}
                  </td>

                  {/* Basic Toggle Switch */}
                  <td className="py-3.5 px-6 text-center">
                    <button
                      type="button"
                      onClick={() => toggleWidget(w.id, "basic")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        w.basic ? "bg-[#24140b]" : "bg-zinc-300"
                      }`}
                      role="switch"
                      aria-checked={w.basic}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          w.basic ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>

                  {/* Pro Toggle Switch */}
                  <td className="py-3.5 px-6 text-center">
                    <button
                      type="button"
                      onClick={() => toggleWidget(w.id, "pro")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        w.pro ? "bg-[#24140b]" : "bg-zinc-300"
                      }`}
                      role="switch"
                      aria-checked={w.pro}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          w.pro ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>

                  {/* Premium Toggle Switch */}
                  <td className="py-3.5 px-6 text-center">
                    <button
                      type="button"
                      onClick={() => toggleWidget(w.id, "premium")}
                      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                        w.premium ? "bg-[#24140b]" : "bg-zinc-300"
                      }`}
                      role="switch"
                      aria-checked={w.premium}
                    >
                      <span
                        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                          w.premium ? "translate-x-5" : "translate-x-0"
                        }`}
                      />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
