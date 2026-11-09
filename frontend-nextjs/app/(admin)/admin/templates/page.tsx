"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { InvitationRenderer } from "@/components/invitations/InvitationRenderer";
import { useAuth } from "@/context/AuthContext";
import {
  approveTemplate,
  archiveTemplate,
  DesignerTemplateData,
  DesignerTemplateSummary,
  getDesignerTemplate,
  getTemplateStatusHistory,
  listDesignerTemplates,
  listTemplateReviewQueue,
  rejectTemplate,
  TemplateReviewQueueItem,
  TemplateStatusHistoryItem,
} from "@/lib/designer-templates";

type AdminTemplate = DesignerTemplateSummary & {
  designer_name?: string;
  submitted_at?: string;
};

function statusLabel(status: string): string {
  switch (status.toLowerCase()) {
    case "in_review":
      return "In Review";
    case "approved":
      return "Approved";
    case "rejected":
      return "Rejected";
    case "archived":
      return "Archived";
    default:
      return "Draft";
  }
}

function statusVariant(
  status: string
): "success" | "warning" | "destructive" | "secondary" {
  switch (status.toLowerCase()) {
    case "approved":
      return "success";
    case "in_review":
      return "warning";
    case "rejected":
      return "destructive";
    default:
      return "secondary";
  }
}

function formatDate(value: string): string {
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
}

export default function AdminTemplateManagementPage() {
  const { token, isLoading: isAuthLoading } = useAuth();
  const [templates, setTemplates] = useState<AdminTemplate[]>([]);
  const [reviewQueue, setReviewQueue] = useState<TemplateReviewQueueItem[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [selectedTemplate, setSelectedTemplate] = useState<DesignerTemplateData | null>(null);
  const [history, setHistory] = useState<TemplateStatusHistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"queue" | "all">("queue");
  const [rejectionNote, setRejectionNote] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingDetail, setIsLoadingDetail] = useState(false);
  const [isActing, setIsActing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const loadTemplates = useCallback(async () => {
    if (!token) {
      setError("Sesi login tidak tersedia. Silakan login kembali.");
      setIsLoading(false);
      return;
    }
    setError(null);
    setIsLoading(true);
    try {
      const [all, queue] = await Promise.all([
        listDesignerTemplates(token),
        listTemplateReviewQueue(token),
      ]);
      const queueByID = new Map(queue.map((item) => [item.id, item]));
      setTemplates(
        all.map((template) => {
          const review = queueByID.get(template.id);
          return {
            ...template,
            designer_name: review?.designer_name,
            submitted_at: review?.submitted_at,
          };
        })
      );
      setReviewQueue(queue);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat template.");
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (isAuthLoading || !token) return;
    void Promise.resolve().then(loadTemplates);
  }, [isAuthLoading, loadTemplates, token]);

  const visibleTemplates = useMemo(
    () =>
      activeTab === "queue"
        ? templates.filter((template) => template.status === "in_review")
        : templates,
    [activeTab, templates]
  );
  const selectedSummary = templates.find((template) => template.id === selectedId);

  const openTemplate = async (template: AdminTemplate) => {
    if (!token) return;
    setSelectedId(template.id);
    setSelectedTemplate(null);
    setHistory([]);
    setError(null);
    setIsLoadingDetail(true);
    try {
      const [detail, statusHistory] = await Promise.all([
        getDesignerTemplate(token, String(template.id), "admin"),
        getTemplateStatusHistory(token, String(template.id), "admin"),
      ]);
      setSelectedTemplate(detail);
      setHistory(statusHistory);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "Gagal memuat detail template.");
    } finally {
      setIsLoadingDetail(false);
    }
  };

  const handleDecision = async (decision: "approve" | "reject") => {
    if (!token || !selectedSummary) return;
    if (decision === "reject" && rejectionNote.trim().length === 0) {
      setError("Catatan penolakan wajib diisi.");
      return;
    }
    setIsActing(true);
    setError(null);
    setMessage(null);
    try {
      if (decision === "approve") {
        await approveTemplate(token, String(selectedSummary.id));
        setMessage("Template berhasil disetujui dan tersedia di katalog Partner.");
      } else {
        await rejectTemplate(token, String(selectedSummary.id), rejectionNote.trim());
        setMessage("Template ditolak. Catatan sudah dapat dilihat Designer.");
      }
      setRejectionNote("");
      await loadTemplates();
      const [detail, statusHistory] = await Promise.all([
        getDesignerTemplate(token, String(selectedSummary.id), "admin"),
        getTemplateStatusHistory(token, String(selectedSummary.id), "admin"),
      ]);
      setSelectedTemplate(detail);
      setHistory(statusHistory);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Tindakan review gagal.");
    } finally {
      setIsActing(false);
    }
  };

  const handleArchive = async () => {
    if (!token || !selectedSummary) return;
    setIsActing(true);
    setError(null);
    try {
      await archiveTemplate(token, String(selectedSummary.id));
      setMessage("Template berhasil diarsipkan dan tidak lagi tersedia di katalog.");
      await loadTemplates();
      const [detail, statusHistory] = await Promise.all([
        getDesignerTemplate(token, String(selectedSummary.id), "admin"),
        getTemplateStatusHistory(token, String(selectedSummary.id), "admin"),
      ]);
      setSelectedTemplate(detail);
      setHistory(statusHistory);
    } catch (actionError) {
      setError(actionError instanceof Error ? actionError.message : "Gagal mengarsipkan template.");
    } finally {
      setIsActing(false);
    }
  };

  const queueById = new Map(reviewQueue.map((item) => [item.id, item]));

  return (
    <div className="space-y-6">
      <header className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Template Review & Approval
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          Review template Designer sebelum tersedia di katalog Partner.
        </p>
      </header>

      {(error || message) && (
        <div
          role={error ? "alert" : "status"}
          className={`rounded-lg border p-3 text-sm ${
            error
              ? "border-rose-200 bg-rose-50 text-rose-800"
              : "border-emerald-200 bg-emerald-50 text-emerald-800"
          }`}
        >
          <div className="flex items-start justify-between gap-3">
            <span>{error || message}</span>
            <button type="button" onClick={() => { setError(null); setMessage(null); }} aria-label="Tutup">
              ×
            </button>
          </div>
        </div>
      )}

      <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.8fr)_minmax(0,1.8fr)]">
        <Card className="overflow-hidden">
          <div className="flex border-b border-zinc-200 p-2 dark:border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab("queue")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                activeTab === "queue" ? "bg-indigo-50 text-indigo-700" : "text-zinc-500"
              }`}
            >
              Antrean ({reviewQueue.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("all")}
              className={`flex-1 rounded-lg px-3 py-2 text-sm font-medium ${
                activeTab === "all" ? "bg-indigo-50 text-indigo-700" : "text-zinc-500"
              }`}
            >
              Semua Template
            </button>
          </div>
          <div className="max-h-[70vh] space-y-2 overflow-y-auto p-3">
            {isAuthLoading || isLoading ? (
              <p className="py-10 text-center text-sm text-zinc-500">Memuat antrean review...</p>
            ) : visibleTemplates.length === 0 ? (
              <p className="py-10 text-center text-sm text-zinc-500">
                {activeTab === "queue" ? "Tidak ada template menunggu review." : "Belum ada template."}
              </p>
            ) : (
              visibleTemplates.map((template) => {
                const review = queueById.get(template.id);
                return (
                  <button
                    type="button"
                    key={template.id}
                    onClick={() => void openTemplate(template)}
                    className={`w-full rounded-xl border p-3 text-left transition-colors ${
                      selectedId === template.id
                        ? "border-indigo-300 bg-indigo-50/70"
                        : "border-zinc-200 hover:bg-zinc-50 dark:border-zinc-800 dark:hover:bg-zinc-900"
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {template.name}
                      </span>
                      <Badge variant={statusVariant(template.status)}>{statusLabel(template.status)}</Badge>
                    </div>
                    <p className="mt-1 text-xs text-zinc-500">
                      {review?.designer_name || `Designer #${template.designer_id}`}
                    </p>
                    <p className="mt-1 text-xs text-zinc-400">
                      {review?.submitted_at
                        ? `Diajukan ${formatDate(review.submitted_at)}`
                        : `Diperbarui ${formatDate(template.updated_at)}`}
                    </p>
                  </button>
                );
              })
            )}
          </div>
        </Card>

        <div className="min-w-0 space-y-6">
          {!selectedId ? (
            <Card className="p-10 text-center text-sm text-zinc-500">
              Pilih template untuk melihat detail, preview, dan riwayat status.
            </Card>
          ) : isLoadingDetail ? (
            <Card className="p-10 text-center text-sm text-zinc-500">Memuat detail template...</Card>
          ) : selectedTemplate && selectedSummary ? (
            <>
              <Card className="space-y-5 p-5">
                <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-start">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
                        {selectedTemplate.name}
                      </h2>
                      <Badge variant={statusVariant(selectedTemplate.status)}>
                        {statusLabel(selectedTemplate.status)}
                      </Badge>
                    </div>
                    <p className="mt-1 text-sm text-zinc-500">
                      {selectedSummary.designer_name || `Designer #${selectedSummary.designer_id}`}
                      {" · "}inviteu.id/templates/{selectedTemplate.slug}
                    </p>
                  </div>
                  <span className="font-mono text-xs text-zinc-400">#{selectedSummary.id}</span>
                </div>

                {selectedTemplate.status === "in_review" && (
                  <div className="flex flex-col gap-3 border-t border-zinc-100 pt-4 sm:flex-row sm:items-end dark:border-zinc-800">
                    <label className="flex-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                      Catatan penolakan (wajib saat reject)
                      <textarea
                        value={rejectionNote}
                        onChange={(event) => setRejectionNote(event.target.value)}
                        maxLength={2000}
                        rows={3}
                        className="mt-1 w-full rounded-lg border border-zinc-300 bg-white p-2 text-sm dark:border-zinc-700 dark:bg-zinc-950"
                        placeholder="Jelaskan revisi yang diperlukan..."
                      />
                    </label>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => void handleDecision("approve")}
                        disabled={isActing}
                        className="bg-emerald-600 text-white hover:bg-emerald-700"
                      >
                        Setujui
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void handleDecision("reject")}
                        disabled={isActing || rejectionNote.trim().length === 0}
                        className="border-rose-200 text-rose-700 hover:bg-rose-50"
                      >
                        Tolak
                      </Button>
                    </div>
                  </div>
                )}
                {selectedTemplate.status === "approved" && (
                  <div className="border-t border-zinc-100 pt-4 dark:border-zinc-800">
                    <Button size="sm" variant="outline" onClick={() => void handleArchive()} disabled={isActing}>
                      Arsipkan Template
                    </Button>
                  </div>
                )}
              </Card>

              <Card className="overflow-hidden">
                <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
                  <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Preview Template</h3>
                </div>
                <div className="mx-auto max-h-[75vh] max-w-[390px] overflow-y-auto bg-[#fcfbfa] p-4">
                  <InvitationRenderer
                    sections={selectedTemplate.sections}
                    className="space-y-4"
                  />
                </div>
              </Card>

              <Card className="p-5">
                <h3 className="font-semibold text-zinc-900 dark:text-zinc-100">Riwayat Status</h3>
                {history.length === 0 ? (
                  <p className="mt-3 text-sm text-zinc-500">Belum ada riwayat status.</p>
                ) : (
                  <ol className="mt-4 space-y-4">
                    {history.map((item) => (
                      <li key={item.id} className="border-l-2 border-indigo-200 pl-4">
                        <div className="flex flex-wrap items-center gap-2">
                          <Badge variant={statusVariant(item.to_status)}>{statusLabel(item.to_status)}</Badge>
                          <span className="text-xs text-zinc-500">{formatDate(item.created_at)}</span>
                          {item.actor_name && (
                            <span className="text-xs text-zinc-400">oleh {item.actor_name}</span>
                          )}
                        </div>
                        {item.note && <p className="mt-1 text-sm text-zinc-600">{item.note}</p>}
                      </li>
                    ))}
                  </ol>
                )}
              </Card>
            </>
          ) : (
            <Card className="p-8 text-sm text-zinc-500">
              Detail template belum tersedia. Muat ulang pilihan template.
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
