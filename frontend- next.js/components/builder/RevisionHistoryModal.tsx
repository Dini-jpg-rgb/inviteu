"use client";

import React, { useEffect, useState } from "react";
import {
  ClockCircleOutlined,
  DeleteOutlined,
  HistoryOutlined,
  PlusOutlined,
  RollbackOutlined,
  EyeOutlined,
} from "@ant-design/icons";
import {
  Alert,
  Button,
  Empty,
  Input,
  List,
  Modal,
  Space,
  Tag,
  Typography,
  message,
} from "antd";
import { BuilderDocument } from "./model";
import { BuilderMetadata } from "./BuilderProperties";

const { Text } = Typography;

export interface RevisionSnapshot {
  id: string;
  timestamp: string; // ISO string
  formattedTime: string;
  label: string;
  source: "autosave" | "manual" | "system";
  stats: {
    sectionCount: number;
    elementCount: number;
    widgetCount: number;
  };
  document: BuilderDocument;
  metadata: BuilderMetadata;
}

export interface RevisionHistoryModalProps {
  open: boolean;
  onClose: () => void;
  templateId?: number | null;
  currentDocument: BuilderDocument;
  currentMetadata: BuilderMetadata;
  onRestore: (doc: BuilderDocument, meta: BuilderMetadata) => void;
}

export function RevisionHistoryModal({
  open,
  onClose,
  templateId,
  currentDocument,
  currentMetadata,
  onRestore,
}: RevisionHistoryModalProps) {
  const storageKey = `inviteu_builder_revisions_${templateId ?? "current_session"}`;

  const [snapshots, setSnapshots] = useState<RevisionSnapshot[]>(() => {
    if (typeof window === "undefined") return [];
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored) return JSON.parse(stored);
    } catch {}
    return [];
  });
  const [newSnapshotNote, setNewSnapshotNote] = useState("");
  const [isCreatingSnapshot, setIsCreatingSnapshot] = useState(false);
  const [previewSnapshot, setPreviewSnapshot] = useState<RevisionSnapshot | null>(null);

  // Load snapshots asynchronously on open to prevent synchronous cascading renders
  useEffect(() => {
    if (!open) return;
    const timer = setTimeout(() => {
      try {
        const stored = localStorage.getItem(storageKey);
        if (stored) {
          const parsed: RevisionSnapshot[] = JSON.parse(stored);
          setSnapshots(parsed);
        } else {
          // Initial snapshot if none exists
          const initialSnapshot: RevisionSnapshot = {
            id: `rev-init-${Date.now()}`,
            timestamp: new Date().toISOString(),
            formattedTime: new Date().toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            }),
            label: "Snapshot Awal Sesi",
            source: "system",
            stats: {
              sectionCount: currentDocument.sections.length,
              elementCount: currentDocument.sections.reduce(
                (acc, s) => acc + s.children.filter((c) => c.kind === "element").length,
                0
              ),
              widgetCount: currentDocument.sections.reduce(
                (acc, s) => acc + s.children.filter((c) => c.kind === "widget").length,
                0
              ),
            },
            document: currentDocument,
            metadata: currentMetadata,
          };
          setSnapshots([initialSnapshot]);
          localStorage.setItem(storageKey, JSON.stringify([initialSnapshot]));
        }
      } catch {
        // Fallback
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [open, storageKey, currentDocument, currentMetadata]);

  // Save manual snapshot
  const handleCreateSnapshot = () => {
    const label = newSnapshotNote.trim() || `Snapshot Manual #${snapshots.length + 1}`;
    const newSnapshot: RevisionSnapshot = {
      id: `rev-manual-${Date.now()}`,
      timestamp: new Date().toISOString(),
      formattedTime: new Date().toLocaleTimeString("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
      }),
      label,
      source: "manual",
      stats: {
        sectionCount: currentDocument.sections.length,
        elementCount: currentDocument.sections.reduce(
          (acc, s) => acc + s.children.filter((c) => c.kind === "element").length,
          0
        ),
        widgetCount: currentDocument.sections.reduce(
          (acc, s) => acc + s.children.filter((c) => c.kind === "widget").length,
          0
        ),
      },
      document: JSON.parse(JSON.stringify(currentDocument)),
      metadata: JSON.parse(JSON.stringify(currentMetadata)),
    };

    const updated = [newSnapshot, ...snapshots].slice(0, 20); // Limit to last 20 revisions
    setSnapshots(updated);
    try {
      localStorage.setItem(storageKey, JSON.stringify(updated));
    } catch {
      // Storage quota safety
    }
    setNewSnapshotNote("");
    setIsCreatingSnapshot(false);
    message.success(`Snapshot "${label}" berhasil disimpan.`);
  };

  // Restore snapshot with confirmation
  const handleRestore = (snapshot: RevisionSnapshot) => {
    Modal.confirm({
      title: "Pulihkan Snapshot Desain Ini?",
      content: (
        <div className="text-xs space-y-1.5 py-1 text-[#765D48]">
          <p>
            Anda akan memulihkan desain ke versi: <strong>{snapshot.label}</strong> ({snapshot.formattedTime}).
          </p>
          <p className="text-amber-700">
            Perubahan yang belum tersimpan pada kanvas saat ini akan digantikan oleh snapshot ini.
          </p>
        </div>
      ),
      okText: "Ya, Pulihkan Versi Ini",
      cancelText: "Batal",
      onOk: () => {
        onRestore(snapshot.document, snapshot.metadata);
        message.success(`Desain berhasil dipulihkan ke versi "${snapshot.label}".`);
        onClose();
      },
    });
  };

  // Clear snapshots
  const handleClearHistory = () => {
    Modal.confirm({
      title: "Hapus Riwayat Revisi?",
      content: "Seluruh catatan snapshot pada browser ini akan dibersihkan.",
      okText: "Hapus",
      cancelText: "Batal",
      okButtonProps: { danger: true },
      onOk: () => {
        setSnapshots([]);
        localStorage.removeItem(storageKey);
        message.success("Riwayat revisi lokal berhasil dibersihkan.");
      },
    });
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={700}
      title={
        <div className="flex items-center gap-2">
          <HistoryOutlined className="text-[#FFAD38]" />
          <span className="text-[#422B1C] font-semibold">Revision History & Desain Snapshot</span>
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Tutup
        </Button>,
        snapshots.length > 0 && (
          <Button
            key="clear"
            danger
            icon={<DeleteOutlined />}
            onClick={handleClearHistory}
          >
            Bersihkan Riwayat
          </Button>
        ),
      ]}
    >
      <div className="space-y-4 py-2">
        {/* Scope disclaimer alert */}
        <Alert
          type="info"
          showIcon
          title="Penyimpanan Snapshot Lokal Sesi Browser"
          description={
            <span className="text-xs">
              Revision History menyimpan snapshot desain penting secara berkala ke local storage browser Anda. Berbeda dengan Undo/Redo yang bersifat per-aksi, Revision History memungkinkan Anda kembali ke titik desain yang lebih besar.
            </span>
          }
        />

        {/* Create Manual Snapshot Form */}
        <div className="flex items-center justify-between gap-2 p-3 rounded-lg bg-[#FFF8EE] border border-[#EAE5DF]">
          {isCreatingSnapshot ? (
            <div className="flex items-center gap-2 w-full">
              <Input
                size="small"
                placeholder="Catatan perubahan (contoh: Sebelum ganti palet warna)..."
                value={newSnapshotNote}
                onChange={(e) => setNewSnapshotNote(e.target.value)}
                onPressEnter={handleCreateSnapshot}
                className="text-xs flex-1"
                autoFocus
              />
              <Button
                size="small"
                type="primary"
                onClick={handleCreateSnapshot}
                className="!bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] !font-semibold text-xs shadow-xs"
              >
                Simpan
              </Button>
              <Button size="small" onClick={() => setIsCreatingSnapshot(false)} className="text-xs">
                Batal
              </Button>
            </div>
          ) : (
            <>
              <div>
                <p className="text-xs font-semibold text-[#422B1C] mb-0.5">
                  Simpan Titik Perubahan Saat Ini
                </p>
                <p className="text-[11px] text-[#99918A] mb-0">
                  Buat checkpoint manual sebelum melakukan eksperimen layout atau styling besar.
                </p>
              </div>
              <Button
                size="small"
                icon={<PlusOutlined />}
                onClick={() => setIsCreatingSnapshot(true)}
                className="!border-[#FFAD38] !text-[#FFAD38] hover:!border-[#F5A623] hover:!text-[#F5A623] text-xs font-semibold"
              >
                Snapshot Baru
              </Button>
            </>
          )}
        </div>

        {/* Snapshots List */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <Text strong className="text-xs text-[#422B1C]">
              Daftar Snapshot Tersimpan ({snapshots.length})
            </Text>
            <Text type="secondary" className="text-[11px] text-[#99918A]">
              Maksimal 20 snapshot terakhir
            </Text>
          </div>

          {snapshots.length === 0 ? (
            <Empty description="Belum ada riwayat revisi yang tersimpan." />
          ) : (
            <List
              size="small"
              className="max-h-72 overflow-y-auto space-y-2"
              dataSource={snapshots}
              renderItem={(item) => (
                <List.Item
                  key={item.id}
                  className="!block !p-0 !border-0"
                >
                  <div className="rounded-lg border border-[#EAE5DF] bg-white p-3 hover:border-[#FFAD38] shadow-xs transition-all w-full">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-xs text-[#422B1C] truncate">
                          {item.label}
                        </span>
                        <Tag
                          color={item.source === "manual" ? "gold" : item.source === "autosave" ? "blue" : "default"}
                          className="!mr-0 !text-[10px]"
                        >
                          {item.source === "manual" ? "Manual" : item.source === "autosave" ? "Autosave" : "System"}
                        </Tag>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#99918A]">
                        <span className="flex items-center gap-1">
                          <ClockCircleOutlined className="text-[10px]" />
                          {item.formattedTime}
                        </span>
                        <span>·</span>
                        <span>{item.stats.sectionCount} section</span>
                        <span>·</span>
                        <span>{item.stats.elementCount} elemen</span>
                        {item.stats.widgetCount > 0 && (
                          <>
                            <span>·</span>
                            <span>{item.stats.widgetCount} widget</span>
                          </>
                        )}
                      </div>
                    </div>

                    <Space size={6}>
                      <Button
                        size="small"
                        icon={<EyeOutlined />}
                        onClick={() => setPreviewSnapshot(item)}
                        className="text-xs"
                      >
                        Detail
                      </Button>
                      <Button
                        size="small"
                        type="primary"
                        icon={<RollbackOutlined />}
                        onClick={() => handleRestore(item)}
                        className="!bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] !font-semibold text-xs shadow-xs"
                      >
                        Pulihkan
                      </Button>
                    </Space>
                  </div>
                  </div>
                </List.Item>
              )}
            />
          )}
        </div>
      </div>

      {/* Detail Preview Modal */}
      {previewSnapshot && (
        <Modal
          open={Boolean(previewSnapshot)}
          onCancel={() => setPreviewSnapshot(null)}
          title={`Detail Snapshot: ${previewSnapshot.label}`}
          footer={[
            <Button key="close" onClick={() => setPreviewSnapshot(null)}>
              Tutup
            </Button>,
            <Button
              key="restore"
              type="primary"
              className="!bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] !font-semibold shadow-xs"
              onClick={() => {
                const target = previewSnapshot;
                setPreviewSnapshot(null);
                handleRestore(target);
              }}
            >
              Pulihkan Snapshot Ini
            </Button>,
          ]}
        >
          <div className="space-y-3 py-2 text-xs">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 bg-[#F7F6F4] rounded border border-[#EAE5DF]">
                <span className="block text-[10px] text-[#99918A]">Sections</span>
                <span className="font-bold text-sm text-[#422B1C]">{previewSnapshot.stats.sectionCount}</span>
              </div>
              <div className="p-2 bg-[#F7F6F4] rounded border border-[#EAE5DF]">
                <span className="block text-[10px] text-[#99918A]">Elements</span>
                <span className="font-bold text-sm text-[#422B1C]">{previewSnapshot.stats.elementCount}</span>
              </div>
              <div className="p-2 bg-[#F7F6F4] rounded border border-[#EAE5DF]">
                <span className="block text-[10px] text-[#99918A]">Widgets</span>
                <span className="font-bold text-sm text-[#422B1C]">{previewSnapshot.stats.widgetCount}</span>
              </div>
            </div>

            <div>
              <p className="font-semibold text-[#422B1C] mb-1">Daftar Section pada Snapshot Ini:</p>
              <ul className="list-disc pl-4 space-y-1 text-stone-700">
                {previewSnapshot.document.sections.map((sec) => (
                  <li key={sec.id}>
                    <strong>{sec.name}</strong> ({sec.children.length} elemen/widget)
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Modal>
      )}
    </Modal>
  );
}
