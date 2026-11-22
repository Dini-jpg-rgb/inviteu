"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Check,
  FilePlus,
  Paintbrush,
} from "lucide-react";
import {
  App,
  Button,
  Card,
  Col,
  Form,
  Input,
  Row,
  Select,
  Steps,
  Tag,
  Typography,
  message as staticMessage,
} from "antd";
import {
  getAllGlobalThemePresets,
} from "@/lib/theme-system";
import {
  useDesignerTemplates,
  NewLocalTemplateInput,
} from "../../DesignerTemplatesContext";

const { Text, Title } = Typography;

export function TemplateCreateWizard() {
  const router = useRouter();
  const { createTemplate } = useDesignerTemplates();
  const antdApp = App.useApp();
  const message = antdApp?.message || staticMessage;
  const [form] = Form.useForm();

  const [currentStep, setCurrentStep] = useState(0);
  const [selectedTier, setSelectedTier] = useState<"basic" | "medium" | "pro">("pro");
  const [selectedThemeId, setSelectedThemeId] = useState<string>("theme-wedding-botanical");
  const [canvasChoice, setCanvasChoice] = useState<"default" | "blank">("default");

  const themes = getAllGlobalThemePresets();
  const currentTheme = themes.find((t) => t.id === selectedThemeId) || themes[0];

  const handleNext = async () => {
    try {
      if (currentStep === 0) {
        // Validasi field wajib pada Step 0: nama dan kategori
        await form.validateFields(["name", "category"]);
      }
      setCurrentStep((prev) => prev + 1);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) {
        const errorInfo = err as {
          errorFields: Array<{ name: (string | number)[]; errors: string[] }>;
        };
        if (errorInfo.errorFields?.length > 0) {
          const firstErrorMsg = errorInfo.errorFields[0].errors[0];
          message.error(firstErrorMsg || "Mohon lengkapi field wajib pada Metadata Template.");
        }
      }
    }
  };

  const handlePrev = () => {
    setCurrentStep((prev) => prev - 1);
  };

  const handleCreate = async () => {
    try {
      // Validasi semua field yang terdaftar dalam form
      const values = await form.validateFields();
      const trimmedName = (values.name || "").trim();

      if (!trimmedName || trimmedName.length < 3) {
        setCurrentStep(0);
        form.setFields([
          {
            name: "name",
            errors: [trimmedName ? "Nama template minimal 3 karakter." : "Nama template wajib diisi."],
          },
        ]);
        message.error("Nama template wajib diisi minimal 3 karakter.");
        return;
      }

      if (!values.category) {
        setCurrentStep(0);
        form.setFields([
          {
            name: "category",
            errors: ["Kategori wajib dipilih."],
          },
        ]);
        message.error("Kategori wajib dipilih.");
        return;
      }

      const input: NewLocalTemplateInput = {
        name: trimmedName,
        description: values.description ? values.description.trim() : "",
        category: values.category || "Wedding",
        style: currentTheme?.name || "Botanical",
        primaryColor: currentTheme?.colorPalette.primary || "#6f7f5f",
        secondaryColor: currentTheme?.colorPalette.secondary || "#455633",
        thumbnail: currentTheme?.thumbnail || "/templates/wedding/couple-main.jpg",
        packageTier: selectedTier,
        themeId: selectedThemeId,
        canvasType: canvasChoice,
      };

      const newId = createTemplate(input);
      message.success(`Template "${input.name}" berhasil dibuat dengan status Draft.`);
      router.push(`/designer/templates/${newId}/edit`);
    } catch (err: unknown) {
      if (err && typeof err === "object" && "errorFields" in err) {
        const errorInfo = err as {
          errorFields: Array<{ name: (string | number)[]; errors: string[] }>;
        };
        if (errorInfo.errorFields?.length > 0) {
          // Arahkan kembali ke Step 0 agar user melihat field yang bermasalah secara visual
          const hasStep0Error = errorInfo.errorFields.some((f) =>
            ["name", "category"].includes(String(f.name[0]))
          );
          if (hasStep0Error) {
            setCurrentStep(0);
          }
          const firstErrorMsg = errorInfo.errorFields[0].errors[0];
          message.error(firstErrorMsg || "Mohon lengkapi field wajib sebelum membuat template.");
          return;
        }
      }
      console.error("Error creating template:", err);
      message.error(err instanceof Error ? err.message : "Terjadi kesalahan saat membuat template.");
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-6 px-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#EAE5DF]/70 pb-4">
        <div>
          <Title level={4} className="!mb-0 !font-['Playfair_Display'] !text-[22px] !text-[#422B1C]">
            Buat Template Undangan Baru
          </Title>
          <Text className="text-xs text-[#99918A]">
            Ikuti wizard terpandu untuk mengonfigurasi metadata, tier, tema global, dan kanvas awal.
          </Text>
        </div>
        <Button
          icon={<ArrowLeft size={16} strokeWidth={1.8} />}
          onClick={() => router.push("/designer/templates")}
          className="!rounded-lg"
        >
          Kembali ke Daftar
        </Button>
      </div>

      {/* Steps Indicator - menggunakan `content` menggantikan `description` untuk Ant Design compatibility */}
      <Steps
        current={currentStep}
        size="small"
        items={[
          { title: "Metadata Template", content: "Nama & Kategori" },
          { title: "Package Tier", content: "Tingkat Produk" },
          { title: "Tema Global", content: "Pilihan Desain" },
          { title: "Starter Canvas", content: "Desain Awal" },
        ]}
      />

      <Form
        form={form}
        layout="vertical"
        preserve={true}
        initialValues={{
          name: "",
          category: "Wedding",
          description: "",
        }}
      >
        {/* STEP 0: Metadata */}
        <div style={{ display: currentStep === 0 ? "block" : "none" }}>
          <Card className="rounded-[10px] border-[#EAE5DF] bg-white shadow-xs" styles={{ body: { padding: 24 } }}>
            <Title level={5} className="!mb-4 !font-['Playfair_Display'] !text-[#422B1C]">
              Langkah 1: Identitas & Kategori Template
            </Title>
            <Row gutter={16}>
              <Col xs={24} sm={16}>
                <Form.Item
                  label="Nama Template"
                  name="name"
                  rules={[
                    { required: true, message: "Nama template wajib diisi." },
                    { whitespace: true, message: "Nama template tidak boleh hanya spasi." },
                    { min: 3, message: "Nama template minimal 3 karakter." },
                  ]}
                >
                  <Input placeholder="Contoh: Royal Garden Wedding, Minimalist Modern..." />
                </Form.Item>
              </Col>
              <Col xs={24} sm={8}>
                <Form.Item
                  label="Kategori Acara"
                  name="category"
                  rules={[{ required: true, message: "Kategori wajib dipilih." }]}
                >
                  <Select
                    options={[
                      { value: "Wedding", label: "Pernikahan (Wedding)" },
                      { value: "Engagement", label: "Lamaran (Engagement)" },
                      { value: "Birthday", label: "Ulang Tahun (Birthday)" },
                      { value: "Corporate", label: "Acara Perusahaan (Corporate)" },
                      { value: "Custom", label: "Kustom / Lainnya" },
                    ]}
                  />
                </Form.Item>
              </Col>
              <Col xs={24}>
                <Form.Item label="Deskripsi Template (Opsional)" name="description">
                  <Input.TextArea
                    rows={3}
                    placeholder="Jelaskan nuansa, konsep desain, atau karakteristik unik template ini..."
                  />
                </Form.Item>
              </Col>
            </Row>
          </Card>
        </div>

        {/* STEP 1: Package Tier */}
        <div style={{ display: currentStep === 1 ? "block" : "none" }}>
          <Card className="rounded-[10px] border-[#EAE5DF] bg-white shadow-xs" styles={{ body: { padding: 24 } }}>
            <div className="mb-4">
              <Title level={5} className="!mb-1 !font-['Playfair_Display'] !text-[#422B1C]">
                Langkah 2: Pilih Package Tier
              </Title>
              <Text className="text-xs text-[#99918A]">
                Package Tier menentukan tingkat fitur undangan InviteU dan terpisah dari pilihan tema visual.
              </Text>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card
                  hoverable
                  onClick={() => setSelectedTier("basic")}
                  className={`h-full cursor-pointer transition-all rounded-[10px] border ${
                    selectedTier === "basic"
                      ? "border-[#FFAD38] bg-[#FFF8EE] ring-2 ring-[#FFAD38]/30 shadow-xs"
                      : "border-[#EAE5DF] bg-white hover:border-[#FFAD38]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Tag color="default" className="!font-bold !rounded-[4px]">
                      BASIC TIER
                    </Tag>
                    {selectedTier === "basic" && (
                      <CheckCircle2 size={18} strokeWidth={1.8} className="text-[#FFAD38]" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-[#422B1C] mb-1">
                    Fitur Esensial
                  </h4>
                  <p className="text-xs text-[#99918A] mb-3 leading-relaxed">
                    Cocok untuk undangan sederhana: Cover hero, detail acara waktu/lokasi, peta Google Maps, dan salam penutup.
                  </p>
                  <ul className="text-[11px] text-[#99918A] space-y-1 list-disc pl-4">
                    <li>Section Cover & Penutup</li>
                    <li>Detail Acara & Rundown</li>
                    <li>Responsive Desktop & Mobile</li>
                  </ul>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card
                  hoverable
                  onClick={() => setSelectedTier("medium")}
                  className={`h-full cursor-pointer transition-all rounded-[10px] border ${
                    selectedTier === "medium"
                      ? "border-[#FFAD38] bg-[#FFF8EE] ring-2 ring-[#FFAD38]/30 shadow-xs"
                      : "border-[#EAE5DF] bg-white hover:border-[#FFAD38]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Tag color="cyan" className="!font-bold !rounded-[4px]">
                      MEDIUM TIER
                    </Tag>
                    {selectedTier === "medium" && (
                      <CheckCircle2 size={18} strokeWidth={1.8} className="text-[#FFAD38]" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-[#422B1C] mb-1">
                    Interaktif & Galeri
                  </h4>
                  <p className="text-xs text-[#99918A] mb-3 leading-relaxed">
                    Menambahkan fitur interaktivitas: Galeri foto memanjang, hitung mundur (countdown), dan RSVP standar.
                  </p>
                  <ul className="text-[11px] text-[#99918A] space-y-1 list-disc pl-4">
                    <li>Semua fitur Basic</li>
                    <li>Widget Countdown timer</li>
                    <li>Galeri foto grid adaptif</li>
                    <li>Form RSVP standar</li>
                  </ul>
                </Card>
              </Col>

              <Col xs={24} md={8}>
                <Card
                  hoverable
                  onClick={() => setSelectedTier("pro")}
                  className={`h-full cursor-pointer transition-all rounded-[10px] border ${
                    selectedTier === "pro"
                      ? "border-[#FFAD38] bg-[#FFF8EE] ring-2 ring-[#FFAD38]/30 shadow-xs"
                      : "border-[#EAE5DF] bg-white hover:border-[#FFAD38]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Tag color="gold" className="!font-bold !rounded-[4px]">
                      PRO TIER (PREMIUM)
                    </Tag>
                    {selectedTier === "pro" && (
                      <CheckCircle2 size={18} strokeWidth={1.8} className="text-[#FFAD38]" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-[#422B1C] mb-1">
                    Fitur Penuh & Multimedia
                  </h4>
                  <p className="text-xs text-[#99918A] mb-3 leading-relaxed">
                    Pengalaman undangan terlengkap: Musik latar (autoplay), cerita cinta (love story), amplop digital, dan ucapan video.
                  </p>
                  <ul className="text-[11px] text-[#99918A] space-y-1 list-disc pl-4">
                    <li>Semua fitur Medium</li>
                    <li>Widget Background Musik</li>
                    <li>Buku Tamu & Ucapan Digital</li>
                    <li>Amplop Digital & Kado</li>
                  </ul>
                </Card>
              </Col>
            </Row>
          </Card>
        </div>

        {/* STEP 2: Theme Selection */}
        <div style={{ display: currentStep === 2 ? "block" : "none" }}>
          <Card className="rounded-[10px] border-[#EAE5DF] bg-white shadow-xs" styles={{ body: { padding: 24 } }}>
            <div className="mb-4">
              <Title level={5} className="!mb-1 !font-['Playfair_Display'] !text-[#422B1C]">
                Langkah 3: Pilih Tema Desain Global
              </Title>
              <Text className="text-xs text-[#99918A]">
                Pilih basis preset tema visual. Perubahan palet atau tipografi pada template ini tidak akan mengubah tema global.
              </Text>
            </div>

            <Row gutter={[16, 16]}>
              {themes.map((theme) => {
                const isSelected = theme.id === selectedThemeId;
                return (
                  <Col xs={24} sm={12} md={8} key={theme.id}>
                    <Card
                      hoverable
                      onClick={() => setSelectedThemeId(theme.id)}
                      className={`h-full cursor-pointer transition-all rounded-[10px] border overflow-hidden ${
                        isSelected
                          ? "border-[#FFAD38] ring-2 ring-[#FFAD38]/40 shadow-xs"
                          : "border-[#EAE5DF] hover:border-[#FFAD38]"
                      }`}
                      styles={{ body: { padding: 12 } }}
                    >
                      <div className="relative h-28 w-full rounded-md overflow-hidden mb-2 bg-[#F7F6F4]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={theme.thumbnail || "/templates/wedding/couple-main.jpg"}
                          alt={theme.name}
                          className="w-full h-full object-cover"
                        />
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 bg-[#FFAD38] text-[#3D2516] rounded-full w-5 h-5 flex items-center justify-center text-xs shadow-xs">
                            <Check size={12} strokeWidth={2.5} />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between mb-1">
                        <span className="font-bold text-xs text-[#422B1C] truncate">
                          {theme.name}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#99918A] line-clamp-2 mb-2">
                        {theme.description}
                      </p>

                      {/* Color Palette Swatches */}
                      <div className="flex items-center gap-1.5 pt-1 border-t border-[#EAE5DF]">
                        <div
                          className="w-4 h-4 rounded-full border border-black/10"
                          style={{ backgroundColor: theme.colorPalette.primary }}
                          title={`Primary: ${theme.colorPalette.primary}`}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-black/10"
                          style={{ backgroundColor: theme.colorPalette.secondary }}
                          title={`Secondary: ${theme.colorPalette.secondary}`}
                        />
                        <div
                          className="w-4 h-4 rounded-full border border-black/10"
                          style={{ backgroundColor: theme.colorPalette.accent }}
                          title={`Accent: ${theme.colorPalette.accent}`}
                        />
                        <span className="text-[10px] text-stone-400 font-mono ml-auto">
                          {theme.typography.fontFamily.split(",")[0]}
                        </span>
                      </div>
                    </Card>
                  </Col>
                );
              })}
            </Row>
          </Card>
        </div>

        {/* STEP 3: Starter Canvas */}
        <div style={{ display: currentStep === 3 ? "block" : "none" }}>
          <Card className="rounded-[10px] border-[#EAE5DF] bg-white shadow-xs" styles={{ body: { padding: 24 } }}>
            <div className="mb-4">
              <Title level={5} className="!mb-1 !font-['Playfair_Display'] !text-[#422B1C]">
                Langkah 4: Desain Awal (Starter Canvas)
              </Title>
              <Text className="text-xs text-[#99918A]">
                Anda dapat memulai dari template dengan section siap pakai atau mulai dari kanvas kosong bersih.
              </Text>
            </div>

            <Row gutter={[16, 16]}>
              <Col xs={24} sm={12}>
                <Card
                  hoverable
                  onClick={() => setCanvasChoice("default")}
                  className={`cursor-pointer transition-all rounded-[10px] border ${
                    canvasChoice === "default"
                      ? "border-[#FFAD38] bg-[#FFF8EE] ring-2 ring-[#FFAD38]/30 shadow-xs"
                      : "border-[#EAE5DF] bg-white hover:border-[#FFAD38]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <Paintbrush size={20} strokeWidth={1.8} className="text-[#FFAD38]" />
                    {canvasChoice === "default" && (
                      <CheckCircle2 size={18} strokeWidth={1.8} className="text-[#FFAD38]" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-[#422B1C] mb-1">
                    Template Bawaan Tema (Direkomendasikan)
                  </h4>
                  <p className="text-xs text-[#99918A] mb-0 leading-relaxed">
                    Kanvas otomatis diisi dengan struktur section Cover, Event Details, dan Penutup dengan warna dan tipografi tema terpilih.
                  </p>
                </Card>
              </Col>

              <Col xs={24} sm={12}>
                <Card
                  hoverable
                  onClick={() => setCanvasChoice("blank")}
                  className={`cursor-pointer transition-all rounded-[10px] border ${
                    canvasChoice === "blank"
                      ? "border-[#FFAD38] bg-[#FFF8EE] ring-2 ring-[#FFAD38]/30 shadow-xs"
                      : "border-[#EAE5DF] bg-white hover:border-[#FFAD38]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <FilePlus size={20} strokeWidth={1.8} className="text-[#FFAD38]" />
                    {canvasChoice === "blank" && (
                      <CheckCircle2 size={18} strokeWidth={1.8} className="text-[#FFAD38]" />
                    )}
                  </div>
                  <h4 className="font-bold text-sm text-[#422B1C] mb-1">
                    Kanvas Kosong (Blank Canvas)
                  </h4>
                  <p className="text-xs text-[#99918A] mb-0 leading-relaxed">
                    Mulai dari kanvas bersih dengan section minimal Cover dan Penutup (sesuai aturan validasi InviteU), siap Anda tata dari nol.
                  </p>
                </Card>
              </Col>
            </Row>

            <div className="mt-4 p-3 rounded-[8px] bg-[#FFF8EE] border border-[#EAE5DF] text-xs space-y-1">
              <span className="font-semibold text-[#422B1C] block">Ringkasan Konfigurasi:</span>
              <p className="mb-0 text-[#422B1C]">
                Tier: <strong className="uppercase">{selectedTier}</strong> · Tema: <strong>{currentTheme?.name}</strong> · Status Awal: <strong>Draft</strong>
              </p>
            </div>
          </Card>
        </div>
      </Form>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between pt-2">
        <Button
          onClick={handlePrev}
          disabled={currentStep === 0}
          className="!rounded-lg"
        >
          Sebelumnya
        </Button>

        {currentStep < 3 ? (
          <Button
            type="primary"
            onClick={handleNext}
            className="!bg-[#FFAD38] !text-[#3D2516] !font-semibold hover:!bg-[#F5A623] !border-[#FFAD38] shadow-xs !rounded-lg"
          >
            Lanjutkan
          </Button>
        ) : (
          <Button
            type="primary"
            onClick={handleCreate}
            className="!bg-[#FFAD38] !text-[#3D2516] !font-bold hover:!bg-[#F5A623] !border-[#FFAD38] shadow-xs !rounded-lg"
          >
            Buat Template & Buka Builder
          </Button>
        )}
      </div>
    </div>
  );
}
