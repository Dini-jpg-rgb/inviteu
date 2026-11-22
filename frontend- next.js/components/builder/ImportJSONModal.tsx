"use client";

import React, { useState } from "react";
import {
  InboxOutlined,
  UploadOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Input,
  Modal,
  Radio,
  Upload,
} from "antd";
import type { UploadProps } from "antd";
import {
  InviteUTemplateJSON,
  validateTemplateJSON,
  deserializeFromTemplateJSON,
  ValidationResult,
  DeserializationResult,
} from "@/lib/template-json";
import { BuilderDocument } from "./model";
import { BuilderMetadata } from "./BuilderProperties";

const { TextArea } = Input;
const { Dragger } = Upload;

export interface ImportJSONModalProps {
  open: boolean;
  onClose: () => void;
  onApplyToCurrentCanvas?: (doc: BuilderDocument, meta: Partial<BuilderMetadata>) => void;
  onImportAsNewTemplate?: (templateJSON: InviteUTemplateJSON) => void;
}

export function ImportJSONModal({
  open,
  onClose,
  onApplyToCurrentCanvas,
  onImportAsNewTemplate,
}: ImportJSONModalProps) {
  const { message, modal } = App.useApp();
  const [jsonText, setJsonText] = useState("");
  const [validation, setValidation] = useState<ValidationResult | null>(null);
  const [parsedData, setParsedData] = useState<InviteUTemplateJSON | null>(null);
  const [deserialized, setDeserialized] = useState<DeserializationResult | null>(null);
  const [importMode, setImportMode] = useState<"file" | "paste">("file");

  const resetState = () => {
    setJsonText("");
    setValidation(null);
    setParsedData(null);
    setDeserialized(null);
  };

  const processJSONString = (rawString: string) => {
    try {
      const parsed = JSON.parse(rawString);
      const valResult = validateTemplateJSON(parsed);
      setValidation(valResult);

      if (valResult.valid) {
        const templateJSON = parsed as InviteUTemplateJSON;
        setParsedData(templateJSON);
        const deser = deserializeFromTemplateJSON(templateJSON);
        setDeserialized(deser);
      } else {
        setParsedData(null);
        setDeserialized(null);
      }
    } catch (err) {
      setValidation({
        valid: false,
        errors: [err instanceof Error ? err.message : "String JSON tidak valid."],
        warnings: [],
      });
      setParsedData(null);
      setDeserialized(null);
    }
  };

  const uploadProps: UploadProps = {
    name: "templateFile",
    accept: ".json,application/json",
    multiple: false,
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = String(e.target?.result || "");
        setJsonText(content);
        processJSONString(content);
      };
      reader.readAsText(file);
      return false; // Prevent automatic HTTP upload
    },
  };

  const handleApplyToCanvas = () => {
    if (!deserialized || !onApplyToCurrentCanvas) return;
    modal.confirm({
      title: "Ganti Konten Canvas Saat Ini?",
      content: (
        <p className="text-xs text-[#765D48]">
          Seluruh elemen dan section pada canvas aktif akan digantikan oleh template JSON ini. Tindakan ini tidak dapat dibatalkan jika belum disimpan ke snapshot.
        </p>
      ),
      okText: "Ya, Terapkan ke Canvas",
      cancelText: "Batal",
      onOk: () => {
        onApplyToCurrentCanvas(deserialized.document, deserialized.metadata);
        message.success("Template berhasil diterapkan ke canvas aktif.");
        resetState();
        onClose();
      },
    });
  };

  const handleImportAsNew = () => {
    if (!parsedData || !onImportAsNewTemplate) return;
    onImportAsNewTemplate(parsedData);
    message.success("Template berhasil diimpor sebagai template baru.");
    resetState();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={() => {
        resetState();
        onClose();
      }}
      width={680}
      title={
        <div className="flex items-center gap-2">
          <UploadOutlined className="text-[#FFAD38]" />
          <span className="text-[#422B1C] font-semibold">Impor Internal Template JSON</span>
        </div>
      }
      footer={[
        <Button
          key="cancel"
          onClick={() => {
            resetState();
            onClose();
          }}
        >
          Batal
        </Button>,
        onApplyToCurrentCanvas && (
          <Button
            key="apply"
            disabled={!validation?.valid || !deserialized}
            onClick={handleApplyToCanvas}
          >
            Terapkan ke Canvas Aktif
          </Button>
        ),
        onImportAsNewTemplate && (
          <Button
            key="save-new"
            type="primary"
            className="!bg-[#FFAD38] !text-[#3D2516] !border-[#FFAD38] !font-semibold shadow-xs"
            disabled={!validation?.valid || !parsedData}
            onClick={handleImportAsNew}
          >
            Simpan sebagai Template Baru
          </Button>
        ),
      ]}
    >
      <div className="space-y-4 py-2">
        <Radio.Group
          value={importMode}
          onChange={(e) => setImportMode(e.target.value)}
          size="small"
          buttonStyle="solid"
        >
          <Radio.Button value="file">Unggah File (.json)</Radio.Button>
          <Radio.Button value="paste">Tempel Teks JSON</Radio.Button>
        </Radio.Group>

        {importMode === "file" ? (
          <Dragger {...uploadProps} className="p-4 bg-[#FFF8EE] border-[#EAE5DF] rounded-lg">
            <p className="ant-upload-drag-icon">
              <InboxOutlined className="!text-[#FFAD38] text-3xl" />
            </p>
            <p className="ant-upload-text text-xs font-semibold text-[#422B1C]">
              Klik atau seret file template JSON InviteU ke area ini
            </p>
            <p className="ant-upload-hint text-[11px] text-[#99918A]">
              Mendukung format file schema InviteUTemplateJSON (versi 1.0.0).
            </p>
          </Dragger>
        ) : (
          <div className="space-y-2">
            <TextArea
              rows={8}
              value={jsonText}
              onChange={(e) => {
                setJsonText(e.target.value);
                processJSONString(e.target.value);
              }}
              placeholder="Tempel string JSON template InviteU di sini..."
              className="font-mono text-xs"
            />
          </div>
        )}

        {/* Validation Result Box */}
        {validation && (
          <div className="space-y-2">
            {validation.valid && parsedData ? (
              <Alert
                type="success"
                showIcon
                title="Validasi Skema Lolos"
                description={
                  <div className="text-xs space-y-1.5 mt-1">
                    <p className="mb-0">
                      Format JSON valid dan kompatibel dengan Page Builder InviteU (Schema v{parsedData.metadata.schemaVersion}).
                    </p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-center text-xs pt-1">
                      <div className="p-1.5 bg-white rounded border border-green-200">
                        <span className="block text-[10px] text-stone-500">Nama</span>
                        <span className="font-bold truncate block">{parsedData.metadata.name}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-green-200">
                        <span className="block text-[10px] text-stone-500">Sections</span>
                        <span className="font-bold">{parsedData.sections.length}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-green-200">
                        <span className="block text-[10px] text-stone-500">Tier</span>
                        <span className="font-bold uppercase">{parsedData.metadata.packageTier}</span>
                      </div>
                      <div className="p-1.5 bg-white rounded border border-green-200">
                        <span className="block text-[10px] text-stone-500">Theme</span>
                        <span className="font-bold truncate block">{parsedData.theme?.themeId || "Default"}</span>
                      </div>
                    </div>
                  </div>
                }
              />
            ) : (
              <Alert
                type="error"
                showIcon
                title="Validasi Format JSON Gagal"
                description={
                  <ul className="list-disc pl-4 text-xs space-y-0.5 mt-1">
                    {validation.errors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                }
              />
            )}

            {validation.warnings.length > 0 && (
              <Alert
                type="warning"
                showIcon
                title="Catatan Peringatan Import:"
                description={
                  <ul className="list-disc pl-4 text-xs space-y-0.5 mt-1">
                    {validation.warnings.map((w, idx) => (
                      <li key={idx}>{w}</li>
                    ))}
                  </ul>
                }
              />
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
