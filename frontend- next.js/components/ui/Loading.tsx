import React from "react";

export interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  label?: string;
}

export function LoadingSpinner({
  size = "md",
  className = "",
  label,
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-8 w-8 border-3",
    xl: "h-12 w-12 border-4",
  };

  return (
    <div className={`inline-flex items-center gap-2 ${className}`}>
      <div
        className={`${sizeClasses[size]} animate-spin rounded-full border-zinc-300 border-t-zinc-900 dark:border-zinc-700 dark:border-t-zinc-100`}
        role="status"
        aria-label={label || "Loading"}
      />
      {label && (
        <span className="text-sm font-medium text-zinc-600 dark:text-zinc-400">
          {label}
        </span>
      )}
    </div>
  );
}

export interface SkeletonProps extends React.HTMLAttributes<HTMLDivElement> {
  className?: string;
}

export function Skeleton({ className = "", ...props }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse rounded-md bg-zinc-200/80 dark:bg-zinc-800 ${className}`}
      {...props}
    />
  );
}

export interface LoadingOverlayProps {
  isLoading: boolean;
  message?: string;
  children: React.ReactNode;
}

export function LoadingOverlay({
  isLoading,
  message = "Memuat data...",
  children,
}: LoadingOverlayProps) {
  return (
    <div className="relative">
      {children}
      {isLoading && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-xl bg-white/70 backdrop-blur-xs dark:bg-zinc-900/70">
          <LoadingSpinner size="lg" />
          {message && (
            <p className="mt-2 text-sm font-medium text-zinc-600 dark:text-zinc-300">
              {message}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
