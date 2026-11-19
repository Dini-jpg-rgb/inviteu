/* eslint-disable */
/**
 * Test Suite: Page Builder MVP 1 - Foundation, Architecture, Theme System & Template Structure
 */

const path = require("path");
const { createJiti } = require("jiti");

const rootDir = path.resolve(__dirname, "..");

const jiti = createJiti(__filename, {
  jsx: true,
  alias: {
    "@": rootDir,
  },
});

async function runMVP1Tests() {
  console.log("================================================================================");
  console.log("  INVITEU PAGE BUILDER - TEST SUITE MVP 1 (FOUNDATION & THEME SYSTEM)");
  console.log("================================================================================\n");

  const {
    serializeToTemplateJSON,
    deserializeFromTemplateJSON,
    validateTemplateJSON,
    normalizePackageTier,
    formatPackageTierLabel,
    normalizeTemplateStatus,
    formatTemplateStatusLabel,
  } = jiti(path.join(rootDir, "lib/template-json.ts"));

  const {
    getAllGlobalThemePresets,
    getGlobalThemePreset,
    GLOBAL_THEME_PRESETS,
    DEFAULT_THEME_ID,
  } = jiti(path.join(rootDir, "lib/theme-system.ts"));

  const {
    resolveTheme,
  } = jiti(path.join(rootDir, "lib/theme-resolver.ts"));

  const {
    createEmptyBuilderDocument,
    createDefaultCoverSection,
    createDefaultPenutupSection,
    ensureCoverAndPenutup,
    createBuilderElement,
    createBuilderWidget,
    createBuilderId,
  } = jiti(path.join(rootDir, "components/builder/model.ts"));

  const {
    exportTemplatePackage,
  } = jiti(path.join(rootDir, "components/builder/adapters/exportHandler.ts"));

  const {
    importFromJSONString,
  } = jiti(path.join(rootDir, "components/builder/adapters/importAdapter.ts"));

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  [PASS] ${message}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${message}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // TEST 1: Package Tier & Template Status Separation
  // ---------------------------------------------------------------------------
  console.log("[1] Package Tier & Template Status Separation:");
  assert(normalizePackageTier("basic") === "basic", "normalizePackageTier('basic') returns 'basic'");
  assert(normalizePackageTier("medium") === "medium", "normalizePackageTier('medium') returns 'medium'");
  assert(normalizePackageTier("pro") === "pro", "normalizePackageTier('pro') returns 'pro'");
  assert(formatPackageTierLabel("basic") === "Basic", "formatPackageTierLabel returns 'Basic'");
  assert(formatPackageTierLabel("medium") === "Medium", "formatPackageTierLabel returns 'Medium'");
  assert(formatPackageTierLabel("pro") === "Pro", "formatPackageTierLabel returns 'Pro'");

  assert(normalizeTemplateStatus("draft") === "draft", "normalizeTemplateStatus('draft') returns 'draft'");
  assert(normalizeTemplateStatus("pending_review") === "pending_review", "normalizeTemplateStatus('pending_review') returns 'pending_review'");
  assert(normalizeTemplateStatus("revision_needed") === "revision_needed", "normalizeTemplateStatus('revision_needed') returns 'revision_needed'");
  assert(normalizeTemplateStatus("rejected") === "rejected", "normalizeTemplateStatus('rejected') returns 'rejected'");
  assert(normalizeTemplateStatus("published") === "published", "normalizeTemplateStatus('published') returns 'published'");

  assert(formatTemplateStatusLabel("draft") === "Draft", "formatTemplateStatusLabel returns 'Draft'");
  assert(formatTemplateStatusLabel("pending_review") === "Pending Review", "formatTemplateStatusLabel returns 'Pending Review'");
  assert(formatTemplateStatusLabel("revision_needed") === "Revision Needed", "formatTemplateStatusLabel returns 'Revision Needed'");
  assert(formatTemplateStatusLabel("rejected") === "Rejected", "formatTemplateStatusLabel returns 'Rejected'");
  assert(formatTemplateStatusLabel("published") === "Published", "formatTemplateStatusLabel returns 'Published'");

  // ---------------------------------------------------------------------------
  // TEST 2: Global Theme Presets
  // ---------------------------------------------------------------------------
  console.log("\n[2] Global Theme Presets:");
  const presets = getAllGlobalThemePresets();
  assert(presets.length >= 6, `Tersedia minimal 6 preset tema global (ditemukan: ${presets.length})`);

  const presetMinimalist = getGlobalThemePreset("theme-minimalist");
  const presetElegant = getGlobalThemePreset("theme-elegant");
  const presetFloral = getGlobalThemePreset("theme-floral");
  const presetModern = getGlobalThemePreset("theme-modern");
  const presetTropicalBali = getGlobalThemePreset("theme-tropical-bali");
  const presetBotanical = getGlobalThemePreset("theme-wedding-botanical");

  assert(Boolean(presetMinimalist && presetMinimalist.name === "Minimalist"), "Preset Minimalist tersedia");
  assert(Boolean(presetElegant && presetElegant.name === "Elegant"), "Preset Elegant tersedia");
  assert(Boolean(presetFloral && presetFloral.name === "Floral"), "Preset Floral tersedia");
  assert(Boolean(presetModern && presetModern.name === "Modern"), "Preset Modern tersedia");
  assert(Boolean(presetTropicalBali && presetTropicalBali.name === "Tropical Bali"), "Preset Tropical Bali tersedia");
  assert(Boolean(presetBotanical && presetBotanical.name === "Botanical Sage"), "Preset Botanical Sage tersedia");

  // Setiap tema memiliki atribut minimal yang diwajibkan
  for (const p of [presetMinimalist, presetElegant, presetFloral, presetModern, presetTropicalBali]) {
    assert(
      Boolean(
        p.id &&
        p.name &&
        p.description &&
        p.thumbnail &&
        p.colorPalette?.primary &&
        p.colorPalette?.secondary &&
        p.colorPalette?.background &&
        p.typography?.fontFamily &&
        p.buttonStyle?.variant &&
        p.backgroundStyle?.type
      ),
      `Preset '${p.name}' memiliki struktur lengkap (ID, nama, deskripsi, thumbnail, palet, tipografi, button, background)`
    );
  }

  // ---------------------------------------------------------------------------
  // TEST 3: Theme Resolver & Fallback Behavior
  // ---------------------------------------------------------------------------
  console.log("\n[3] Theme Resolver & Fallback Behavior:");
  // A. Resolusi normal tema global
  const resolvedMinimal = resolveTheme("theme-minimalist");
  assert(resolvedMinimal.themeId === "theme-minimalist", "Theme resolver mengidentifikasi theme-minimalist");
  assert(resolvedMinimal.isFallback === false, "isFallback false saat tema global tersedia");
  assert(resolvedMinimal.colorPalette.primary === presetMinimalist.colorPalette.primary, "Palet warna sesuai preset");

  // B. Resolusi dengan local overrides desainer
  const customOverrides = {
    colorPalette: { primary: "#FF0055" },
    buttonStyle: { variant: "pill", borderRadius: 99 },
  };
  const resolvedCustom = resolveTheme("theme-minimalist", customOverrides);
  assert(resolvedCustom.colorPalette.primary === "#FF0055", "Local override primary color berhasil diterapkan (#FF0055)");
  assert(resolvedCustom.colorPalette.secondary === presetMinimalist.colorPalette.secondary, "Warna sekunder tetap mewarisi preset asli");
  assert(resolvedCustom.buttonStyle.borderRadius === 99, "Local override button border radius berhasil diterapkan (99px)");
  assert(resolvedCustom.isCustomized === true, "isCustomized bernilai true saat ada override lokal");

  // C. Pastikan preset tema global TIDAK termutasi (Immutable product rule)
  assert(presetMinimalist.colorPalette.primary !== "#FF0055", "Aturan Produk: Preset global tidak terpengaruh oleh override lokal!");

  // D. Fallback saat themeId tidak ada atau dihapus
  const resolvedUnknown = resolveTheme("theme-yang-sudah-dihapus-admin", {
    colorPalette: { primary: "#112233" },
  });
  assert(resolvedUnknown.isFallback === true, "isFallback bernilai true saat themeId tidak ada");
  assert(Boolean(resolvedUnknown.colorPalette.primary === "#112233"), "Fallback tetap mempertahankan konfigurasi override yang ada");
  assert(Boolean(resolvedUnknown.designTokens && resolvedUnknown.cssVariables["--theme-primary"]), "Fallback menghasilkan CSS custom properties");

  // ---------------------------------------------------------------------------
  // TEST 4: Serialisasi & Deserialisasi Template JSON
  // ---------------------------------------------------------------------------
  console.log("\n[4] Serialisasi & Deserialisasi Template JSON:");
  const coverSection = createDefaultCoverSection("Pernikahan Budi & Ani");
  const closingSection = createDefaultPenutupSection();

  // Tambahkan section tengah dengan container dan widgets
  const middleSection = {
    id: "sec-middle-event",
    kind: "section",
    name: "Detail Resepsi",
    visible: true,
    position: { x: 0, y: 0 },
    size: { width: 100, height: 400 },
    responsive: {},
    props: { backgroundColor: "#ffffff" },
    children: [
      {
        id: "cnt-1",
        kind: "element",
        elementType: "container",
        name: "Container Kartu",
        parentSectionId: "sec-middle-event",
        visible: true,
        position: { x: 0, y: 0 },
        size: { width: 340, height: 160 },
        responsive: {},
        props: { display: "flex", flexDirection: "column" },
      },
      {
        id: "el-1",
        kind: "element",
        elementType: "text",
        name: "Waktu Resepsi",
        parentSectionId: "sec-middle-event",
        parentContainerId: "cnt-1",
        visible: true,
        position: { x: 10, y: 10 },
        size: { width: 200, height: 40 },
        responsive: {},
        props: { text: "Pukul 19.00 WIB" },
      },
      {
        id: "wdg-countdown",
        kind: "widget",
        widgetType: "countdown",
        name: "Hitung Mundur",
        parentSectionId: "sec-middle-event",
        visible: true,
        position: { x: 0, y: 0 },
        size: { width: 340, height: 120 },
        responsive: {},
        props: { targetDate: "2026-12-31T19:00:00" },
      },
    ],
  };

  const doc = {
    sections: [coverSection, middleSection, closingSection],
  };

  const metadata = {
    name: "Undangan Elegan Budi & Ani",
    slug: "budi-ani-wedding",
    description: "Template pernikahan modern elegan",
    category_name: "Wedding",
    themeCategory: "Elegant",
    primaryColor: "#1A2A3A",
    secondaryColor: "#C5A059",
    packageTier: "pro",
    status: "draft",
    themeId: "theme-elegant",
    themeConfig: {
      colorPalette: { accent: "#E5C989" },
    },
  };

  // Serialisasi ke Template JSON
  const serialized = serializeToTemplateJSON({
    document: doc,
    metadata,
    packageTier: "pro",
    status: "draft",
    themeId: "theme-elegant",
    themeConfig: { colorPalette: { accent: "#E5C989" } },
  });

  assert(Boolean(serialized.metadata && serialized.metadata.templateId), "Metadata memiliki templateId unik");
  assert(serialized.metadata.packageTier === "pro", "Package Tier tersimpan sebagai 'pro'");
  assert(serialized.metadata.status === "draft", "Status template tersimpan sebagai 'draft'");
  assert(serialized.theme.themeId === "theme-elegant", "Theme ID tersimpan di root JSON: theme.themeId");
  assert(serialized.theme.themeConfig.colorPalette.accent === "#E5C989", "Theme override tersimpan di theme.themeConfig");
  assert(serialized.sections.length === 3, `Sections count matches: ${serialized.sections.length}`);
  assert(serialized.containers["cnt-1"] !== undefined, "Container 'cnt-1' terekam dalam JSON containers map");
  assert(serialized.elements["el-1"] !== undefined, "Element 'el-1' terekam dalam JSON elements map");
  assert(serialized.widgets["wdg-countdown"] !== undefined, "Widget 'wdg-countdown' terekam dalam JSON widgets map");

  // Validasi JSON yang dihasilkan
  const validationResult = validateTemplateJSON(serialized);
  assert(validationResult.valid === true, `Validasi template JSON berhasil (errors: ${validationResult.errors.length})`);

  // Deserialisasi kembali ke BuilderDocument
  const deserialized = deserializeFromTemplateJSON(serialized);
  assert(deserialized.document.sections.length === 3, "Deserialized document memiliki 3 sections");
  assert(deserialized.packageTier === "pro", "Package Tier dipulihkan secara tepat");
  assert(deserialized.status === "draft", "Status template dipulihkan secara tepat");
  assert(deserialized.theme.themeId === "theme-elegant", "Theme ID dipulihkan secara tepat");

  // Periksa widget config tidak hilang
  const restoredMiddle = deserialized.document.sections.find((s) => s.id === "sec-middle-event");
  const restoredWidget = restoredMiddle?.children.find((c) => c.id === "wdg-countdown");
  assert(Boolean(restoredWidget && restoredWidget.props.targetDate === "2026-12-31T19:00:00"), "Konfigurasi widget countdown tidak hilang setelah round-trip");

  // ---------------------------------------------------------------------------
  // TEST 5: Aturan Produk Cover, Closing, dan Live Streaming
  // ---------------------------------------------------------------------------
  console.log("\n[5] Aturan Produk Cover, Closing, dan Live Streaming:");

  // A. Uji Section pertama bukan Cover
  const badFirstDoc = {
    ...serialized,
    sections: [
      { ...middleSection, sortOrder: 0, sectionRole: "content" },
      { ...closingSection, sortOrder: 1, sectionRole: "closing" },
    ],
  };
  const badFirstValidation = validateTemplateJSON(badFirstDoc);
  assert(badFirstValidation.valid === false, "Validasi mendeteksi section pertama bukan Cover");

  // B. Uji Section terakhir bukan Closing
  const badLastDoc = {
    ...serialized,
    sections: [
      { ...coverSection, sortOrder: 0, sectionRole: "cover" },
      { ...middleSection, sortOrder: 1, sectionRole: "content" },
    ],
  };
  const badLastValidation = validateTemplateJSON(badLastDoc);
  assert(badLastValidation.valid === false, "Validasi mendeteksi section terakhir bukan Closing");

  // C. Uji Larangan Live Streaming (Strict Rule)
  const livestreamTemplate = {
    ...serialized,
    widgets: {
      ...serialized.widgets,
      "wdg-stream": {
        id: "wdg-stream",
        widgetType: "live_streaming",
        name: "YouTube Live Stream",
        parentSectionId: "sec-middle-event",
        sortOrder: 5,
        visible: true,
        config: { streamUrl: "https://youtube.com/live" },
      },
    },
  };
  const livestreamValidation = validateTemplateJSON(livestreamTemplate);
  assert(livestreamValidation.valid === false, "Validasi menggagalkan widget Live Streaming (Live Streaming dilarang)");
  assert(
    livestreamValidation.errors.some((e) => e.includes("Live Streaming")),
    "Pesan error spesifik mencantumkan larangan Live Streaming"
  );

  // D. Uji Add-on Video Greeting
  const videoGreetingTemplate = {
    ...serialized,
    widgets: {
      ...serialized.widgets,
      "wdg-video": {
        id: "wdg-video",
        widgetType: "video_greeting",
        name: "Video Ucapan",
        parentSectionId: "sec-middle-event",
        sortOrder: 6,
        visible: true,
        isAddon: true,
        config: { videoUrl: "https://youtube.com/watch?v=sample" },
      },
    },
  };
  const videoValidation = validateTemplateJSON(videoGreetingTemplate);
  assert(videoValidation.valid === true, "Widget Video Greeting valid sebagai add-on (isAddon: true)");

  // ---------------------------------------------------------------------------
  // TEST 6: Export Package & Import Adapter
  // ---------------------------------------------------------------------------
  console.log("\n[6] Export Package & Import Adapter:");
  const exported = exportTemplatePackage({
    document: doc,
    metadata,
    packageTier: "pro",
    status: "draft",
    themeId: "theme-elegant",
  });

  assert(exported.validation.valid === true, "Export package menghasilkan validasi valid: true");
  assert(exported.stats.sectionCount === 3, `Export stats sectionCount: ${exported.stats.sectionCount}`);
  assert(exported.stats.widgetCount >= 1, `Export stats widgetCount: ${exported.stats.widgetCount}`);
  assert(typeof exported.jsonString === "string" && exported.jsonString.length > 50, "Export package menghasilkan string JSON");

  const imported = importFromJSONString(exported.jsonString);
  assert(imported.success === true, "ImportAdapter berhasil mem-parse string JSON hasil export");
  assert(imported.deserialized.document.sections.length === 3, "ImportAdapter berhasil memulihkan seluruh sections");

  // ---------------------------------------------------------------------------
  // TEST SUMMARY
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`  HASIL TEST SUITE MVP 1: ${passed} PASSED, ${failed} FAILED`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMVP1Tests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
