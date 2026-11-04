"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { apiPublicRequest } from "@/lib/api-client";
import { usePartner } from "@/context/PartnerContext";

interface PackageWidget {
  widget_key: string;
  is_enabled: boolean;
}

interface PackageLimit {
  resource_key: string;
  limit_value: number;
}

interface ApiPackage {
  id: number;
  name: string;
  description: string | null;
  price: string;
  invitation_quota: number;
  duration_months: number | null;
  widgets: PackageWidget[];
  limits: PackageLimit[];
}

interface PackagesResponse {
  success: boolean;
  message?: string;
  data?: {
    packages?: ApiPackage[];
  };
}

interface PackageDetailResponse {
  success: boolean;
  message?: string;
  data?: {
    package?: ApiPackage;
  };
}

function formatPrice(price: string) {
  const amount = Number(price);
  if (!Number.isFinite(amount)) return `Rp ${price}`;

  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDuration(months: number | null) {
  if (months === null) return null;
  return `${months} bulan`;
}

function PackageSummary({ pkg }: { pkg: ApiPackage }) {
  const enabledWidgets = pkg.widgets.filter((widget) => widget.is_enabled);

  return (
    <ul className="mt-4 space-y-2 text-xs font-medium text-zinc-800">
      <li className="flex items-start gap-2">
        <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />
        <span>Invitation: {pkg.invitation_quota}</span>
      </li>
      {pkg.duration_months !== null && (
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />
          <span>Masa aktif: {formatDuration(pkg.duration_months)}</span>
        </li>
      )}
      {enabledWidgets.map((widget) => (
        <li key={widget.widget_key} className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />
          <span>Widget: {widget.widget_key}</span>
        </li>
      ))}
      {pkg.limits.map((limit) => (
        <li key={limit.resource_key} className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-700" />
          <span>
            {limit.resource_key.replace(/[_-]+/g, " ")}: {limit.limit_value}
          </span>
        </li>
      ))}
    </ul>
  );
}

function PackageDetails({
  pkg,
}: {
  pkg: ApiPackage;
}) {
  const enabledWidgets = pkg.widgets.filter((widget) => widget.is_enabled);

  return (
    <section
      className="scroll-mt-6 rounded-2xl border border-[#e5d8c8] bg-white p-5 shadow-xs sm:p-7"
      aria-labelledby="package-detail-title"
    >
      <div className="flex flex-col gap-3 border-b border-[#eee4d7] pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">
            Detail paket
          </p>
          <h2 id="package-detail-title" className="mt-1 text-xl font-bold text-[#331c11]">
            {pkg.name}
          </h2>
          {pkg.description && (
            <p className="mt-2 max-w-3xl text-sm leading-relaxed text-zinc-600">
              {pkg.description}
            </p>
          )}
        </div>
        <p className="shrink-0 text-lg font-extrabold text-[#331c11]">
          {formatPrice(pkg.price)}
        </p>
      </div>

      <div className="mt-5 grid gap-5 md:grid-cols-2">
        <div>
          <h3 className="text-sm font-bold text-zinc-900">Ringkasan paket</h3>
          <dl className="mt-3 space-y-2 text-xs">
            <div className="flex justify-between gap-4 rounded-lg bg-[#fcfaf7] px-3 py-2">
              <dt className="text-zinc-600">Kuota undangan</dt>
              <dd className="font-semibold text-zinc-900">{pkg.invitation_quota}</dd>
            </div>
            {pkg.duration_months !== null && (
              <div className="flex justify-between gap-4 rounded-lg bg-[#fcfaf7] px-3 py-2">
                <dt className="text-zinc-600">Masa aktif</dt>
                <dd className="font-semibold text-zinc-900">
                  {formatDuration(pkg.duration_months)}
                </dd>
              </div>
            )}
          </dl>

          <h3 className="mt-5 text-sm font-bold text-zinc-900">Widget</h3>
          {pkg.widgets.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">Belum ada data widget untuk paket ini.</p>
          ) : (
            <ul className="mt-2 space-y-2 text-xs">
              {pkg.widgets.map((widget) => (
                <li
                  key={widget.widget_key}
                  className="flex items-center justify-between gap-3 rounded-lg border border-zinc-100 px-3 py-2"
                >
                  <span className="break-all font-medium text-zinc-800">{widget.widget_key}</span>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      widget.is_enabled
                        ? "bg-emerald-50 text-emerald-700"
                        : "bg-zinc-100 text-zinc-500"
                    }`}
                  >
                    {widget.is_enabled ? "Aktif" : "Tidak aktif"}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div>
          <h3 className="text-sm font-bold text-zinc-900">Batasan penggunaan</h3>
          {pkg.limits.length === 0 ? (
            <p className="mt-2 text-xs text-zinc-500">Belum ada data batasan untuk paket ini.</p>
          ) : (
            <ul className="mt-3 space-y-2 text-xs">
              {pkg.limits.map((limit) => (
                <li
                  key={limit.resource_key}
                  className="flex justify-between gap-4 rounded-lg bg-[#fcfaf7] px-3 py-2"
                >
                  <span className="break-all text-zinc-600">{limit.resource_key}</span>
                  <span className="shrink-0 font-semibold text-zinc-900">{limit.limit_value}</span>
                </li>
              ))}
            </ul>
          )}

          <h3 className="mt-5 text-sm font-bold text-zinc-900">Akses kategori template</h3>
          <p className="mt-2 text-xs leading-relaxed text-zinc-500">
            Informasi akses kategori template belum tersedia dari API paket.
          </p>
          {enabledWidgets.length > 0 && (
            <p className="mt-4 text-[11px] text-zinc-500">
              {enabledWidgets.length} widget tersedia pada paket ini.
            </p>
          )}
        </div>
      </div>

      <div className="mt-6 border-t border-[#eee4d7] pt-4">
        <Link
          href={`/packages/checkout?packageId=${pkg.id}`}
          className="inline-flex w-full items-center justify-center rounded-lg bg-[#331c11] px-4 py-2.5 text-xs font-semibold text-white transition-colors hover:bg-[#4a2918] sm:w-auto"
        >
          Pilih Paket
        </Link>
      </div>
    </section>
  );
}

function ServiceTermsAccordion({ terms }: { terms: string[] }) {
  return (
    <section className="rounded-2xl border border-[#e5d8c8] bg-white p-5 shadow-xs sm:p-7">
      <h2 className="text-base font-bold text-[#331c11]">Ketentuan Layanan</h2>
      <p className="mt-1 text-xs text-zinc-500">
        Ketentuan akan ditampilkan di sini setelah tersedia dari API.
      </p>

      {terms.length === 0 ? (
        <p className="mt-4 rounded-lg bg-[#fcfaf7] px-3 py-3 text-xs text-zinc-500">
          Belum ada data ketentuan layanan dari API.
        </p>
      ) : (
        <div className="mt-4 space-y-2">
          {terms.map((term, index) => (
            <details key={`${index}-${term}`} className="group rounded-lg border border-[#eee4d7]">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-3 text-xs font-semibold text-zinc-800">
                <span>Ketentuan {index + 1}</span>
                <span className="text-amber-700 transition-transform group-open:rotate-180" aria-hidden="true">
                 ⌄
                </span>
              </summary>
              <p className="border-t border-[#eee4d7] px-4 py-3 text-xs leading-relaxed text-zinc-600">
                {term}
              </p>
            </details>
          ))}
        </div>
      )}
    </section>
  );
}

export default function PartnerPackagesPage() {
  const { activePackage, activePackageDetails, transactions } = usePartner();
  const [packages, setPackages] = useState<ApiPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [selectedPackageId, setSelectedPackageId] = useState<number | null>(null);
  const [selectedPackage, setSelectedPackage] = useState<ApiPackage | null>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(false);
  const [detailError, setDetailError] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();

    async function loadPackages() {
      setIsLoading(true);
      setLoadError(null);
      try {
        const response = await apiPublicRequest("/packages", { signal: controller.signal });
        const result = (await response.json()) as PackagesResponse;
        if (!response.ok || !result.success || !Array.isArray(result.data?.packages)) {
          throw new Error(result.message || "Respons daftar paket dari server tidak valid.");
        }
        setPackages(result.data.packages);
      } catch (error) {
        if (controller.signal.aborted) return;
        setLoadError(
          error instanceof Error ? error.message : "Tidak dapat memuat daftar paket.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoading(false);
      }
    }

    void loadPackages();
    return () => controller.abort();
  }, []);

  useEffect(() => {
    if (selectedPackageId === null) return;

    const controller = new AbortController();

    async function loadPackageDetails() {
      setIsLoadingDetails(true);
      setDetailError(null);
      setSelectedPackage(null);
      try {
        const response = await apiPublicRequest(`/packages/${selectedPackageId}`, {
          signal: controller.signal,
        });
        const result = (await response.json()) as PackageDetailResponse;
        if (!response.ok || !result.success || !result.data?.package) {
          throw new Error(result.message || "Respons detail paket dari server tidak valid.");
        }
        setSelectedPackage(result.data.package);
      } catch (error) {
        if (controller.signal.aborted) return;
        setDetailError(
          error instanceof Error ? error.message : "Tidak dapat memuat detail paket.",
        );
      } finally {
        if (!controller.signal.aborted) setIsLoadingDetails(false);
      }
    }

    void loadPackageDetails();
    return () => controller.abort();
  }, [selectedPackageId]);

  const packageTerms: string[] = [];

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <header>
        <p className="text-xs font-semibold uppercase tracking-wide text-[#6e4d2a]">
        </p>
        <h1 className="mt-1 text-base font-extrabold tracking-tight text-[#331c11] sm:text-lg">
          Package
        </h1>
        <p className="mt-2 max-w-2xl text-xs leading-relaxed text-[#6e4d2a] sm:text-sm">
          Pilih package untuk membuka quota dan widget.
        </p>
      </header>

      <section aria-labelledby="package-list-title">
        <div className="mb-3 flex items-end justify-between gap-3">
          <div>
            <h2 id="package-list-title" className="text-base font-bold text-[#331c11]">
              Daftar Paket
            </h2>
            <p className="mt-0.5 text-xs text-zinc-500">
              {packages.length} paket tersedia
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className="rounded-2xl border border-[#e5d8c8] bg-white p-8 text-center text-sm text-zinc-500">
            Memuat daftar paket...
          </div>
        ) : loadError ? (
          <div
            role="alert"
            className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-800"
          >
            <p>{loadError}</p>
            <button
              type="button"
              onClick={() => window.location.reload()}
              className="mt-3 rounded-lg border border-rose-300 bg-white px-3 py-2 text-xs font-semibold"
            >
              Coba lagi
            </button>
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-2xl border border-[#e5d8c8] bg-white p-8 text-center text-sm text-zinc-500">
            Belum ada paket aktif yang tersedia.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {packages.map((pkg) => {
              const isCurrentActive =
                activePackageDetails?.id === pkg.id ||
                activePackage === String(pkg.id) ||
                activePackage === pkg.name.trim().toLowerCase().replace(/\s+/g, "-");

              return (
                <article
                  key={pkg.id}
                  className="relative flex flex-col justify-between rounded-2xl border border-[#df9226] bg-[#f5a638] p-5 text-[#2d1b11] shadow-xs sm:p-6"
                >
                  {isCurrentActive && (
                    <span className="absolute right-4 top-4 rounded-full bg-[#d2f3e8] px-3 py-1 text-[10px] font-bold text-emerald-800">
                      Aktif
                    </span>
                  )}
                  <div>
                    <h3 className="pr-14 text-base font-bold text-zinc-900">{pkg.name}</h3>
                    <p className="mt-2 text-2xl font-black tracking-tight text-zinc-900 sm:text-3xl">
                      {formatPrice(pkg.price)}
                    </p>
                    {pkg.description && (
                      <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-zinc-700">
                        {pkg.description}
                      </p>
                    )}
                    <div className="my-4 border-t border-[#df9226]" />
                    <PackageSummary pkg={pkg} />
                  </div>

                  <div className="mt-6 space-y-2">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedPackage(null);
                        setDetailError(null);
                        setSelectedPackageId(pkg.id);
                      }}
                      className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-900 transition-colors hover:bg-zinc-50"
                    >
                      Lihat Detail
                    </button>
                    {isCurrentActive ? (
                      <button
                        type="button"
                        disabled
                        className="w-full cursor-default rounded-lg border border-zinc-200 bg-white px-3 py-2.5 text-xs font-semibold text-zinc-500"
                      >
                        Package aktif
                      </button>
                    ) : (
                      <Link
                        href={`/packages/checkout?packageId=${pkg.id}`}
                        className="block w-full rounded-lg bg-[#1c1c1c] px-3 py-2.5 text-center text-xs font-semibold text-white transition-colors hover:bg-black"
                      >
                        Pilih package
                      </Link>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="package-detail-section-title" className="space-y-3">
        <h2 id="package-detail-section-title" className="text-base font-bold text-[#331c11]">
          Detail Paket
        </h2>
        {isLoadingDetails && (
          <div className="rounded-2xl border border-[#e5d8c8] bg-white p-5 text-xs text-zinc-500">
            Memuat detail paket...
          </div>
        )}
        {detailError && (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-800">
            {detailError}
          </div>
        )}
        {!selectedPackageId && !isLoadingDetails && (
          <div className="rounded-2xl border border-dashed border-[#d8c3ad] bg-white/70 p-5 text-xs text-zinc-500">
            Pilih “Lihat Detail” pada kartu paket untuk melihat widget dan batasan penggunaannya.
          </div>
        )}
        {selectedPackage && (
          <PackageDetails pkg={selectedPackage} />
        )}
      </section>

      <ServiceTermsAccordion terms={packageTerms} />

      <section aria-labelledby="transaction-title" className="pt-1">
        <h2 id="transaction-title" className="mb-3 text-sm font-bold text-zinc-900">
          Status transaksi
        </h2>
        <div className="overflow-hidden rounded-2xl border border-[#e5d8c8] bg-white shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#331c11] text-white">
                <tr>
                  <th className="px-4 py-3 font-semibold">Order</th>
                  <th className="px-4 py-3 font-semibold">Package</th>
                  <th className="px-4 py-3 font-semibold">Total</th>
                  <th className="px-4 py-3 font-semibold">Status</th>
                  <th className="px-4 py-3 font-semibold">Tanggal</th>
                  <th className="px-4 py-3 text-center font-semibold">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100">
                {transactions.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-zinc-400">
                      Belum ada riwayat transaksi package.
                    </td>
                  </tr>
                ) : (
                  transactions.map((tx) => (
                    <tr key={tx.id} className="transition-colors hover:bg-zinc-50/80">
                      <td className="px-4 py-3.5 font-medium text-zinc-900">{tx.orderNumber}</td>
                      <td className="px-4 py-3.5 font-medium text-zinc-700">{tx.packageName}</td>
                      <td className="px-4 py-3.5 font-semibold text-zinc-900">{tx.amount}</td>
                      <td className="px-4 py-3.5">
                        <span
                          className={`inline-block rounded-full border px-3 py-1 text-[11px] font-semibold ${
                            tx.status === "Paid"
                              ? "border-emerald-200 bg-[#eaf7f0] text-emerald-700"
                              : tx.status === "Pending"
                                ? "border-amber-200 bg-[#fef5e7] text-amber-700"
                                : tx.status === "Simulated"
                                  ? "border-sky-200 bg-sky-50 text-sky-700"
                                  : "border-rose-200 bg-rose-50 text-rose-700"
                          }`}
                        >
                          {tx.status === "Simulated" ? "Simulasi" : tx.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-zinc-600">{tx.date}</td>
                      <td className="px-4 py-3.5 text-center">
                        <button
                          type="button"
                          onClick={() =>
                            window.alert(
                              `Rincian Transaksi: ${tx.orderNumber}\nPaket: ${tx.packageName}\nTotal: ${tx.amount}\nStatus: ${tx.status}`,
                            )
                          }
                          className="rounded-md border border-zinc-200 bg-white px-3.5 py-1.5 text-[11px] font-semibold text-zinc-800 transition-colors hover:bg-zinc-50"
                        >
                          Detail
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
