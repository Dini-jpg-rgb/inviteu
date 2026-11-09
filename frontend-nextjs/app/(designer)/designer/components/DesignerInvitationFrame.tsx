"use client";

import React from "react";
import { LockOutlined, MobileOutlined } from "@ant-design/icons";

interface DesignerInvitationFrameProps {
  children: React.ReactNode;
  url: string;
  title: string;
  zoom: number;
}

export function DesignerInvitationFrame({
  children,
  url,
  title,
  zoom,
}: DesignerInvitationFrameProps) {
  return (
    <div
      className="mx-auto w-[375px] max-w-full rounded-[32px] border border-[#34363a] bg-[#202124] p-2 shadow-lg"
      style={{ transform: `scale(${zoom / 100})`, transformOrigin: "top center" }}
      aria-label={`Pratinjau mobile ${title}`}
    >
      <div className="flex w-full flex-col overflow-hidden rounded-[24px] bg-white" style={{ aspectRatio: "375 / 740" }}>
        <div className="flex h-10 shrink-0 items-center justify-between px-6 text-xs text-[#20242c]">
          <span className="font-medium">9:41</span>
          <MobileOutlined aria-hidden="true" />
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </div>
        <div className="shrink-0 border-t border-[#EBD9BE] bg-white px-4 py-3">
          <div className="flex items-center justify-center gap-2 rounded-full bg-[#FDEBD3] px-3 py-2 text-xs text-[#9A5A00]">
            <LockOutlined aria-hidden="true" />
            <span className="truncate">{url}</span>
          </div>
          <div className="mx-auto mt-2 h-1 w-24 rounded-full bg-[#20242c]" />
        </div>
      </div>
    </div>
  );
}
