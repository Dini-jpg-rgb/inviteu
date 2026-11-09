const path = require("path");
const { createJiti } = require("jiti");

const rootDir = path.resolve(__dirname, "..");

const jiti = createJiti(__filename, {
  jsx: true,
  alias: {
    "@": rootDir,
  },
});

async function runTests() {
  console.log("=== MEMULAI TEST SUITE: INVITEU TEMPLATE SCHEMA & DATA BINDING (MVP 4) ===");

  const {
    weddingTheme,
  } = jiti(path.join(rootDir, "app/(designer)/designer/templates/themes/wedding/index.ts"));

  const {
    convertThemeToSections,
    createSectionInstance,
  } = jiti(path.join(rootDir, "components/builder/registry/index.tsx"));

  const {
    serializeBuilderToSchema,
    deserializeSchemaToBuilder,
    validateTemplateSchema,
    getDummyInvitationContent,
    bindInvitationContentToSections,
    schemaPackageToDatabaseRecords,
    databaseRecordsToSchemaPackage,
    valuesToInvitationContents,
    invitationContentsToValues,
    convertThemeToSchemaPackage,
    determineBindingType,
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
  // TEST 1: Konversi Tema Bawaan ke Sections
  // -------------------------------------------------------------------------
  console.log("\n[1] Mengonversi Tema Wedding ke Section Builder:");
  const initialSections = convertThemeToSections(weddingTheme);
  assert(initialSections.length >= 7, `Memiliki ${initialSections.length} sections dari tema wedding`);
  assert(initialSections.some(s => s.type === "cover"), "Memiliki section 'cover'");
  assert(initialSections.some(s => s.type === "event_details"), "Memiliki section 'event_details'");
  assert(initialSections.some(s => s.type === "gallery"), "Memiliki section 'gallery'");

  // -------------------------------------------------------------------------
  // TEST 2: Serialisasi Builder -> JSON Schema Package
  // -------------------------------------------------------------------------
  console.log("\n[2] Serialisasi State Builder ke Format Skema JSON:");
  const templateMeta = {
    id: weddingTheme.id,
    name: weddingTheme.name,
    slug: weddingTheme.slug,
    version: weddingTheme.version,
    themeCategory: weddingTheme.themeCategory,
    primaryColor: weddingTheme.colorPalette.primary,
    secondaryColor: weddingTheme.colorPalette.secondary,
  };

  const schemaPackage = serializeBuilderToSchema(templateMeta, initialSections);
  assert(schemaPackage.name === weddingTheme.name, `Schema package name: ${schemaPackage.name}`);
  assert(schemaPackage.slug === "wedding", `Schema package slug: ${schemaPackage.slug}`);
  assert(schemaPackage.sections.length === initialSections.length, `Sections count matches: ${schemaPackage.sections.length}`);

  const totalFields = schemaPackage.sections.reduce((acc, s) => acc + s.fields.length, 0);
  assert(totalFields > 15, `Berhasil mengekstrak ${totalFields} fields`);

  // -------------------------------------------------------------------------
  // TEST 3: Validasi Integritas Skema
  // -------------------------------------------------------------------------
  console.log("\n[3] Validasi Integritas Skema Template & Fields:");
  const validation = validateTemplateSchema(schemaPackage);
  assert(validation.valid === true, "Validasi skema berhasil (valid === true)");
  assert(validation.errors.length === 0, `Tidak ada error (errors: ${validation.errors.length})`);

  // Uji validasi kegagalan
  const invalidSchema = { ...schemaPackage, name: "", sections: "bukan-array" };
  const invalidValidation = validateTemplateSchema(invalidSchema);
  assert(invalidValidation.valid === false, "Validasi mendeteksi skema tidak valid");
  assert(invalidValidation.errors.length >= 2, `Mendeteksi ${invalidValidation.errors.length} error`);

  // -------------------------------------------------------------------------
  // TEST 4: Deserialisasi Skema JSON Kembali ke State Builder
  // -------------------------------------------------------------------------
  console.log("\n[4] Deserialisasi Skema JSON Kembali ke State Builder:");
  const deserialized = deserializeSchemaToBuilder(schemaPackage);
  assert(deserialized.templateMeta.name === templateMeta.name, "Template meta name konsisten");
  assert(deserialized.sections.length === initialSections.length, `Jumlah section konsisten (${deserialized.sections.length})`);

  const coverBefore = initialSections.find(s => s.type === "cover");
  const coverAfter = deserialized.sections.find(s => s.type === "cover");
  assert(coverAfter !== undefined, "Section cover berhasil direkonstruksi");
  assert(coverAfter.content.coupleTitle === coverBefore.content.coupleTitle, `coupleTitle cocok: ${coverAfter.content.coupleTitle}`);
  assert(coverAfter.settings.alignment === coverBefore.settings.alignment, "settings.alignment konsisten");

  // -------------------------------------------------------------------------
  // TEST 5: Konversi Skema ke Format Database (template_sections & template_fields)
  // -------------------------------------------------------------------------
  console.log("\n[5] Konversi Skema ke Relasi Tabel Database:");
  const dbRecords = schemaPackageToDatabaseRecords(schemaPackage, 101);
  assert(dbRecords.sections.length === schemaPackage.sections.length, `Baris template_sections: ${dbRecords.sections.length}`);
  assert(dbRecords.fields.length === totalFields, `Baris template_fields: ${dbRecords.fields.length}`);

  const secSample = dbRecords.sections[0];
  assert(secSample.template_id === 101, `Foreign key template_id benar: ${secSample.template_id}`);
  assert(typeof secSample.settings === "object", "Column settings tersimpan sebagai JSONB object");

  // Konversi balik DB -> Schema Package
  const reconstructedPkg = databaseRecordsToSchemaPackage(
    { id: 101, name: schemaPackage.name, slug: schemaPackage.slug, version: schemaPackage.version },
    dbRecords.sections,
    dbRecords.fields
  );
  assert(reconstructedPkg.sections.length === schemaPackage.sections.length, "DB -> Schema package sections count cocok");

  // -------------------------------------------------------------------------
  // TEST 6: Data Binding dengan Nilai Partner (Dummy Data)
  // -------------------------------------------------------------------------
  console.log("\n[6] Uji Data Binding Dinamis (Partner) vs Statis (Designer):");
  const dummyContent = getDummyInvitationContent();
  assert(dummyContent.coupleTitle === "ARYA & CITRA", `Dummy coupleTitle: ${dummyContent.coupleTitle}`);
  assert(dummyContent.placeName !== undefined, "Dummy placeName tersedia");
  assert(Array.isArray(dummyContent.gallery_images), "Dummy gallery images tersedia");

  // Tandai salah satu field desainer sebagai STATIS
  const modifiedSections = initialSections.map(s => {
    if (s.type === "cover") {
      return {
        ...s,
        content: {
          ...s.content,
          _is_static_coupleTitle: true, // Designer mengunci judul cover statis
        }
      };
    }
    return s;
  });

  const boundSections = bindInvitationContentToSections(modifiedSections, dummyContent);
  const boundCover = boundSections.find(s => s.type === "cover");
  const boundEvent = boundSections.find(s => s.type === "event_details");

  // coupleTitle yang dikunci statis TIDAK boleh berubah
  assert(
    boundCover.content.coupleTitle === coverBefore.content.coupleTitle,
    `Field statis terjaga (tetap '${coverBefore.content.coupleTitle}', tidak tertimpa partner)`
  );

  // Field dinamis (placeName & address) HARUS ter-override nilai Partner
  assert(
    boundEvent.content.placeName === dummyContent.placeName,
    `Field dinamis placeName ter-binding dengan benar: ${boundEvent.content.placeName}`
  );
  assert(
    boundEvent.content.address === dummyContent.address,
    `Field dinamis address ter-binding dengan benar: ${boundEvent.content.address}`
  );

  // -------------------------------------------------------------------------
  // TEST 7: invitation_contents DB Mapping
  // -------------------------------------------------------------------------
  console.log("\n[7] Uji Simpan & Baca Tabel invitation_contents:");
  const versionId = 99;
  const contentRows = valuesToInvitationContents(dummyContent, dbRecords.fields, versionId);
  assert(contentRows.length > 0, `Berhasil membuat ${contentRows.length} baris invitation_contents`);
  assert(contentRows.every(r => r.invitation_version_id === versionId), "Foreign key invitation_version_id konsisten");

  const restoredPartnerValues = invitationContentsToValues(contentRows, dbRecords.fields);
  assert(restoredPartnerValues.placeName === dummyContent.placeName, "Nilai placeName terbaca kembali dari invitation_contents");
  assert(restoredPartnerValues.dateText === dummyContent.dateText, "Nilai dateText terbaca kembali dari invitation_contents");

  // -------------------------------------------------------------------------
  // RINGKASAN
  // -------------------------------------------------------------------------
  console.log(`\n======================================================`);
  console.log(`HASIL TEST: ${passed} PASSED, ${failed} FAILED`);
  console.log(`======================================================\n`);

  if (failed > 0) {
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
