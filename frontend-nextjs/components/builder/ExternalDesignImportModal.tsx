"use client";

import React, { useState } from "react";
import {
  BranchesOutlined,
  CheckCircleOutlined,
  CodeOutlined,
  FileTextOutlined,
  InfoCircleOutlined,
  UploadOutlined,
  WarningOutlined,
} from "@ant-design/icons";
import {
  Alert,
  App,
  Button,
  Card,
  Col,
  Input,
  Modal,
  Row,
  Space,
  Tag,
  Typography,
  Upload,
} from "antd";
import type { UploadProps } from "antd";
import {
  figmaAdapter,
  elementorAdapter,
  ExternalDesignSource,
  NormalizedMappingResult,
  SAMPLE_FIGMA_PAYLOAD,
  SAMPLE_ELEMENTOR_PAYLOAD,
} from "./adapters/externalDesignAdapter";
import { deserializeFromTemplateJSON } from "@/lib/template-json";
import { BuilderDocument } from "./model";
import { BuilderMetadata } from "./BuilderProperties";

const { Text } = Typography;
const { TextArea } = Input;

export interface ExternalDesignImportModalProps {
  open: boolean;
  onClose: () => void;
  onApplyToCurrentCanvas?: (doc: BuilderDocument, meta: Partial<BuilderMetadata>) => void;
}

export function ExternalDesignImportModal({
  open,
  onClose,
  onApplyToCurrentCanvas,
}: ExternalDesignImportModalProps) {
  const { message, modal } = App.useApp();
  const [selectedSource, setSelectedSource] = useState<ExternalDesignSource>("figma");
  const [jsonText, setJsonText] = useState<string>("");
  const [mappingResult, setMappingResult] = useState<NormalizedMappingResult | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);

  const currentAdapter = selectedSource === "figma" ? figmaAdapter : elementorAdapter;

  const handleSourceChange = (src: ExternalDesignSource) => {
    setSelectedSource(src);
    setJsonText("");
    setMappingResult(null);
    setParseError(null);
  };

  const handleLoadSample = () => {
    const sample = selectedSource === "figma" ? SAMPLE_FIGMA_PAYLOAD : SAMPLE_ELEMENTOR_PAYLOAD;
    const str = JSON.stringify(sample, null, 2);
    setJsonText(str);
    handleConvert(str);
  };

  const handleConvert = (rawStr?: string) => {
    const textToProcess = rawStr ?? jsonText;
    if (!textToProcess.trim()) {
      setParseError("Silakan masukkan atau tempel JSON desain terlebih dahulu.");
      setMappingResult(null);
      return;
    }

    try {
      const parsed = JSON.parse(textToProcess);
      setParseError(null);
      const result = currentAdapter.parse(parsed);
      setMappingResult(result);
      if (result.success) {
        message.success(`Berhasil mengonversi desain ${currentAdapter.name}.`);
      }
    } catch (err) {
      setParseError(err instanceof Error ? `JSON tidak valid: ${err.message}` : "Format JSON tidak valid.");
      setMappingResult(null);
    }
  };

  const handleApply = () => {
    if (!mappingResult?.templateJSON || !onApplyToCurrentCanvas) return;

    modal.confirm({
      title: "Terapkan Desain ke Canvas?",
      content: (
        <div className="space-y-2 text-xs text-[#765D48]">
          <p>
            Seluruh section dan elemen pada canvas akan diperbarui dengan hasil konversi{" "}
            <strong>{currentAdapter.name}</strong>.
          </p>
          <p className="font-semibold text-amber-800">
            Tindakan ini tidak merusak data hingga Anda menyimpannya ke template.
          </p>
        </div>
      ),
      okText: "Ya, Terapkan ke Canvas",
      cancelText: "Batal",
      onOk: () => {
        const deser = deserializeFromTemplateJSON(mappingResult.templateJSON!);
        onApplyToCurrentCanvas(deser.document, deser.metadata);
        message.success("Desain eksternal berhasil diterapkan ke Canvas!");
        onClose();
      },
    });
  };

  const uploadProps: UploadProps = {
    accept: ".json,application/json",
    showUploadList: false,
    beforeUpload: (file) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = String(e.target?.result || "");
        setJsonText(content);
        handleConvert(content);
      };
      reader.readAsText(file);
      return false;
    },
  };

  return (
    <Modal
      open={open}
      onCancel={onClose}
      width={760}
      title={
        <div className="flex items-center gap-2">
          <BranchesOutlined className="text-[#9A5A00]" />
          <span>Import Desain Eksternal (Figma &amp; WordPress / Elementor)</span>
        </div>
      }
      footer={[
        <Button key="close" onClick={onClose}>
          Batal
        </Button>,
        ...(mappingResult && mappingResult.success
          ? [
              <Button
                key="apply"
                type="primary"
                icon={<CheckCircleOutlined />}
                onClick={handleApply}
                className="!bg-[#9A5A00] !border-[#9A5A00]"
              >
                Terapkan ke Canvas
              </Button>,
            ]
          : []),
      ]}
    >
      <div className="space-y-4 py-2">
        {/* Source Selector */}
        <div>
          <Text strong className="text-xs text-[#3A2313] block mb-2">
            Pilih Sumber Desain Eksternal:
          </Text>
          <Row gutter={[12, 12]}>
            <Col xs={24} sm={12}>
              <Card
                hoverable
                onClick={() => handleSourceChange("figma")}
                className={`cursor-pointer transition-all border ${
                  selectedSource === "figma"
                    ? "border-[#FCB040] bg-[#FFF8EE]"
                    : "border-[#EBD9BE] bg-white"
                }`}
                styles={{ body: { padding: 12 } }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-xs block text-[#3A2313]">
                      Figma Design File
                    </span>
                    <span className="text-[11px] text-[#765D48] block mt-0.5">
                      Parsing Frame, Text, Bounding Box, Fills &amp; Flex Auto-Layout.
                    </span>
                  </div>
                  <Tag color={selectedSource === "figma" ? "gold" : "default"} className="!mr-0 !text-[10px]">
                    Figma
                  </Tag>
                </div>
              </Card>
            </Col>

            <Col xs={24} sm={12}>
              <Card
                hoverable
                onClick={() => handleSourceChange("elementor")}
                className={`cursor-pointer transition-all border ${
                  selectedSource === "elementor"
                    ? "border-[#FCB040] bg-[#FFF8EE]"
                    : "border-[#EBD9BE] bg-white"
                }`}
                styles={{ body: { padding: 12 } }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <span className="font-semibold text-xs block text-[#3A2313]">
                      WordPress / Elementor
                    </span>
                    <span className="text-[11px] text-[#765D48] block mt-0.5">
                      Parsing Section, Kolom, Heading, Text, Image, Button, Maps.
                    </span>
                  </div>
                  <Tag color={selectedSource === "elementor" ? "gold" : "default"} className="!mr-0 !text-[10px]">
                    Elementor
                  </Tag>
                </div>
              </Card>
            </Col>
          </Row>
        </div>

        {/* Input area */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-[#3A2313]">
              Payload JSON {selectedSource === "figma" ? "Figma Nodes" : "Elementor Content"}:
            </span>
            <Space size={6}>
              <Upload {...uploadProps}>
                <Button size="small" icon={<UploadOutlined />} className="text-xs">
                  Unggah File JSON
                </Button>
              </Upload>
              <Button
                size="small"
                icon={<CodeOutlined />}
                onClick={handleLoadSample}
                className="text-xs !bg-[#FAF8F5] !border-[#EBD9BE] text-[#9A5A00]"
              >
                Gunakan Contoh JSON {selectedSource === "figma" ? "Figma" : "Elementor"}
              </Button>
            </Space>
          </div>

          <TextArea
            rows={5}
            value={jsonText}
            onChange={(e) => setJsonText(e.target.value)}
            placeholder={`Tempelkan JSON payload ${selectedSource === "figma" ? "Figma (nodes/document)" : "Elementor (content/sections)"} di sini...`}
            className="font-mono text-xs"
          />

          <Button
            type="primary"
            block
            icon={<FileTextOutlined />}
            onClick={() => handleConvert()}
            className="!bg-[#9A5A00] !border-[#9A5A00] !h-8 text-xs font-semibold"
          >
            Konversi &amp; Tinjau Preview Desain
          </Button>
        </div>

        {/* Error message */}
        {parseError && (
          <Alert
            type="error"
            showIcon
            title="Gagal Membaca JSON"
            description={parseError}
            className="text-xs"
          />
        )}

        {/* Mapping Preview & Diagnostics */}
        {mappingResult && mappingResult.templateJSON && (
          <div className="space-y-3 pt-2 border-t border-[#EBD9BE]">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-xs text-[#3A2313] flex items-center gap-1.5">
                <CheckCircleOutlined className="text-emerald-600" />
                Ringkasan Konversi Berhasil
              </span>
              <Tag color="success">Siap Diterapkan</Tag>
            </div>

            {/* Quick Stats Grid */}
            <Row gutter={[8, 8]}>
              <Col span={6}>
                <div className="rounded-lg bg-[#FAF8F5] border border-[#EBD9BE] p-2 text-center">
                  <span className="text-[10px] text-[#765D48] block">Total Section</span>
                  <span className="text-base font-bold text-[#3A2313]">
                    {mappingResult.templateJSON.sections.length}
                  </span>
                </div>
              </Col>
              <Col span={6}>
                <div className="rounded-lg bg-[#FAF8F5] border border-[#EBD9BE] p-2 text-center">
                  <span className="text-[10px] text-[#765D48] block">Total Elemen</span>
                  <span className="text-base font-bold text-[#3A2313]">
                    {Object.keys(mappingResult.templateJSON.elements || {}).length}
                  </span>
                </div>
              </Col>
              <Col span={6}>
                <div className="rounded-lg bg-[#FAF8F5] border border-[#EBD9BE] p-2 text-center">
                  <span className="text-[10px] text-[#765D48] block">Container</span>
                  <span className="text-base font-bold text-[#3A2313]">
                    {Object.keys(mappingResult.templateJSON.containers || {}).length}
                  </span>
                </div>
              </Col>
              <Col span={6}>
                <div className="rounded-lg bg-[#FAF8F5] border border-[#EBD9BE] p-2 text-center">
                  <span className="text-[10px] text-[#765D48] block">Peringatan / Fallback</span>
                  <span className="text-base font-bold text-[#D97706]">
                    {mappingResult.diagnostics.length}
                  </span>
                </div>
              </Col>
            </Row>

            {/* Diagnostics List */}
            {mappingResult.diagnostics.length > 0 && (
              <div className="space-y-1.5">
                <span className="text-xs font-semibold text-[#3A2313] block">
                  Catatan &amp; Penyesuaian Desain:
                </span>
                <div className="max-h-36 overflow-y-auto space-y-1.5 p-2 rounded-lg bg-amber-50/70 border border-amber-200">
                  {mappingResult.diagnostics.map((diag, idx) => (
                    <div key={idx} className="flex items-start gap-1.5 text-[11px] text-amber-900 leading-tight">
                      {diag.severity === "unsupported" ? (
                        <WarningOutlined className="text-amber-700 mt-0.5 shrink-0" />
                      ) : (
                        <InfoCircleOutlined className="text-blue-600 mt-0.5 shrink-0" />
                      )}
                      <div>
                        <span>{diag.message}</span>
                        {diag.fallbackApplied && (
                          <span className="block text-[10px] text-amber-700/80 mt-0.5 font-mono">
                            Fallback: {diag.fallbackApplied}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
