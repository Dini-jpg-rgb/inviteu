"use client";

import React from "react";
import styles from "../../designer-workspace.module.css";

interface DesignerPageHeaderProps {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function DesignerPageHeader({
  title,
  description,
  actions,
}: DesignerPageHeaderProps) {
  return (
    <div className={`${styles.pageHeader} flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 border-b border-[#EAE5DF]/60`}>
      <div>
        <h1 className="font-['Playfair_Display'] text-2xl sm:text-[26px] font-semibold text-[#422B1C] tracking-tight leading-tight mb-1">
          {title}
        </h1>
        {description && (
          <p className="font-sans text-xs sm:text-[13px] text-[#99918A] leading-relaxed mb-0 font-normal">
            {description}
          </p>
        )}
      </div>
      {actions && (
        <div className={`${styles.pageHeaderActions} flex items-center sm:shrink-0 gap-2.5`}>
          {actions}
        </div>
      )}
    </div>
  );
}
