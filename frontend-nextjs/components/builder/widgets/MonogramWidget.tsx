import React from "react";

export interface MonogramWidgetProps {
  groomInitial?: string;
  brideInitial?: string;
  ampersand?: string;
  familyName?: string;
  note?: string;
}

export function MonogramWidget({
  groomInitial = "M",
  brideInitial = "L",
  ampersand = "&",
  familyName = "Caine",
  note = "We would be delighted to have you with us as we celebrate the beginning of our forever.",
}: MonogramWidgetProps) {
  return (
    <div className="py-6 px-4 text-center bg-stone-50/80 rounded-2xl border border-stone-200">
      <div className="w-16 h-16 mx-auto rounded-full border border-[#6f7f5f]/40 flex items-center justify-center font-serif text-xl font-bold text-[#455633] bg-white shadow-xs">
        <span>{groomInitial}</span>
        <span className="text-[#848858] text-sm mx-0.5">{ampersand}</span>
        <span>{brideInitial}</span>
      </div>
      <p className="mt-3 font-serif font-bold text-sm text-[#24380f]">
        Family of {familyName}
      </p>
      <p className="mt-1 text-[11px] text-stone-500 max-w-xs mx-auto leading-relaxed">
        {note}
      </p>
    </div>
  );
}
