const path = require("path");
const { createJiti } = require("jiti");

const rootDir = path.resolve(__dirname, "..");

const jiti = createJiti(__filename, {
  jsx: true,
  alias: {
    "@": rootDir,
  },
});

async function runMVP5Tests() {
  console.log("=== MEMULAI TEST SUITE: INVITEU ASSET MANAGEMENT & STYLING (MVP 5) ===");

  const {
    DEFAULT_TEMPLATE_ASSETS,
    uploadTemplateAsset,
  } = jiti(path.join(rootDir, "lib/template-assets.ts"));

  const {
    serializeBuilderToSchema,
    deserializeSchemaToBuilder,
    validateTemplateSchema,
  } = jiti(path.join(rootDir, "lib/template-schema.ts"));

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

  // -------------------------------------------------------------------------
  // TEST 1: Default Template Assets Registry & Storage Relations
  // -------------------------------------------------------------------------
  console.log("\n[1] Pustaka Aset Bawaan (DEFAULT_TEMPLATE_ASSETS):");
  assert(DEFAULT_TEMPLATE_ASSETS.length >= 6, `Memiliki ${DEFAULT_TEMPLATE_ASSETS.length} aset terdaftar`);
  assert(DEFAULT_TEMPLATE_ASSETS.some(a => a.category === "couples"), "Memiliki aset kategori 'couples'");
  assert(DEFAULT_TEMPLATE_ASSETS.some(a => a.category === "venues"), "Memiliki aset kategori 'venues'");
  assert(DEFAULT_TEMPLATE_ASSETS.some(a => a.category === "backgrounds"), "Memiliki aset kategori 'backgrounds'");
  assert(DEFAULT_TEMPLATE_ASSETS.every(a => a.storage_file_id === undefined), "Aset bawaan tidak mengklaim storage_file_id palsu");
  assert(DEFAULT_TEMPLATE_ASSETS.every(a => !a.url.startsWith("data:")), "Aset bawaan tidak menggunakan Data URL sementara");

  const uploadResult = await uploadTemplateAsset({
    name: "couple.png",
    type: "image/png",
    size: 1024,
  });
  assert(
    uploadResult.success === false && uploadResult.error.includes("backend"),
    "Upload dinonaktifkan secara eksplisit saat endpoint backend belum tersedia"
  );

  // -------------------------------------------------------------------------
  // TEST 2: Schema Serialization with MVP 5 Enhanced Settings
  // -------------------------------------------------------------------------
  console.log("\n[2] Serialisasi Skema dengan Pengaturan Styling Baru:");
  const testSection = {
    id: "sec-cover-test",
    type: "cover",
    name: "Cover & Hero",
    sortOrder: 0,
    visible: true,
    settings: {
      alignment: "center",
      fontFamily: "script",
      fontSize: "lg",
      fontWeight: "bold",
      textColor: "#24380f",
      accentColor: "#6f7f5f",
      backgroundColor: "#faf8f5",
      paddingY: "lg",
      borderRadius: "xl",
      borderWidth: "medium",
      borderColor: "#d6d3d1",
      bgImage: "/templates/wedding/venue.jpg",
      bgImageOpacity: 50,
      bgImagePosition: "right",
      bgImageSize: "100% 100%",
      layoutVariant: "card",
      shadow: "md",
      cropFit: "cover",
      objectPosition: "top",
      imageHeight: 220,
      imageBorderRadius: "lg",
    },
    content: {
      coupleTitle: "MOGRAN & LAURA",
      imageUrl: "/templates/wedding/couple-main.jpg",
    },
  };

  const schemaPackage = serializeBuilderToSchema(
    { name: "Wedding Luxury Theme", slug: "wedding-luxury", version: "1.0" },
    [testSection]
  );

  assert(schemaPackage.sections.length === 1, "Section berhasil diserialisasi");
  const serializedSettings = schemaPackage.sections[0].settings;
  assert(serializedSettings.fontFamily === "script", `fontFamily tersimpan: ${serializedSettings.fontFamily}`);
  assert(serializedSettings.fontSize === "lg", `fontSize tersimpan: ${serializedSettings.fontSize}`);
  assert(serializedSettings.fontWeight === "bold", `fontWeight tersimpan: ${serializedSettings.fontWeight}`);
  assert(serializedSettings.borderRadius === "xl", `borderRadius tersimpan: ${serializedSettings.borderRadius}`);
  assert(serializedSettings.borderWidth === "medium", `borderWidth tersimpan: ${serializedSettings.borderWidth}`);
  assert(serializedSettings.bgImage === "/templates/wedding/venue.jpg", `bgImage tersimpan: ${serializedSettings.bgImage}`);
  assert(serializedSettings.bgImagePosition === "right", `bgImagePosition tersimpan: ${serializedSettings.bgImagePosition}`);
  assert(serializedSettings.bgImageSize === "100% 100%", `bgImageSize tersimpan: ${serializedSettings.bgImageSize}`);
  assert(serializedSettings.imageHeight === 220, `imageHeight tersimpan: ${serializedSettings.imageHeight}`);
  assert(serializedSettings.layoutVariant === "card", `layoutVariant tersimpan: ${serializedSettings.layoutVariant}`);

  // -------------------------------------------------------------------------
  // TEST 3: Deserialization Roundtrip (Styling Preservation)
  // -------------------------------------------------------------------------
  console.log("\n[3] Deserialisasi Roundtrip Menjaga 100% Styling:");
  const deserialized = deserializeSchemaToBuilder(schemaPackage);
  const reconstructedSection = deserialized.sections[0];
  assert(reconstructedSection.settings.fontFamily === "script", "fontFamily berhasil direkonstruksi");
  assert(reconstructedSection.settings.borderRadius === "xl", "borderRadius berhasil direkonstruksi");
  assert(reconstructedSection.settings.bgImage === "/templates/wedding/venue.jpg", "bgImage berhasil direkonstruksi");
  assert(reconstructedSection.settings.bgImagePosition === "right", "bgImagePosition berhasil direkonstruksi");
  assert(reconstructedSection.settings.bgImageSize === "100% 100%", "bgImageSize berhasil direkonstruksi");
  assert(reconstructedSection.settings.cropFit === "cover", "cropFit berhasil direkonstruksi");

  // -------------------------------------------------------------------------
  // TEST 4: Validation of New Styling Schema
  // -------------------------------------------------------------------------
  console.log("\n[4] Validasi Skema Baru:");
  const valResult = validateTemplateSchema(schemaPackage);
  assert(valResult.valid === true, "Skema dengan styling baru lulus validasi tanpa error");
  assert(valResult.errors.length === 0, `Jumlah error: ${valResult.errors.length}`);

  console.log(`\n======================================================`);
  console.log(`HASIL TEST MVP 5: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) process.exit(1);
}

runMVP5Tests().catch((err) => {
  console.error("Test MVP 5 gagal:", err);
  process.exit(1);
});
