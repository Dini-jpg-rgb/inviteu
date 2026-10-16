"use client";

import React, { useState } from "react";

export type NotificationType = "info" | "success" | "warning" | "error";

export interface NotificationProps {
  type?: NotificationType;
  title?: string;
  message: string;
  onClose?: () => void;
  className?: string;
}

export function Notification({
  type = "info",
  title,
  message,
  onClose,
  className = "",
}: NotificationProps) {
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  const typeConfig: Record<
    NotificationType,
    { container: string; text: string; icon: React.ReactNode }
  > = {
    success: {
      container:
        "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/40 dark:border-emerald-800 dark:text-emerald-300",
      text: "text-emerald-700 dark:text-emerald-300",
      icon: (
        <svg
          className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
          />
        </svg>
      ),
    },
    error: {
      container:
        "bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-800 dark:text-rose-300",
      text: "text-rose-700 dark:text-rose-300",
      icon: (
        <svg
          className="w-5 h-5 text-rose-600 dark:text-rose-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    warning: {
      container:
        "bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-800 dark:text-amber-300",
      text: "text-amber-700 dark:text-amber-300",
      icon: (
        <svg
          className="w-5 h-5 text-amber-600 dark:text-amber-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
      ),
    },
    info: {
      container:
        "bg-blue-50 border-blue-200 text-blue-800 dark:bg-blue-950/40 dark:border-blue-800 dark:text-blue-300",
      text: "text-blue-700 dark:text-blue-300",
      icon: (
        <svg
          className="w-5 h-5 text-blue-600 dark:text-blue-400 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  };

  const config = typeConfig[type];

  return (
    <div
      className={`flex items-start gap-3 rounded-xl border p-4 shadow-xs transition-all ${config.container} ${className}`}
      role="alert"
    >
      {config.icon}
      <div className="flex-1">
        {title && <h4 className="font-semibold text-sm mb-0.5">{title}</h4>}
        <p className={`text-sm ${config.text}`}>{message}</p>
      </div>
      <button
        onClick={handleClose}
        className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
        aria-label="Tutup notifikasi"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
