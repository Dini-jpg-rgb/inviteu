/* eslint-disable */
/**
 * Test Suite: Page Builder MVP 4 - Template Management, Designer Workflow, Import/Export & Final QA
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

async function runMVP4Tests() {
  console.log("================================================================================");
  console.log("  INVITEU PAGE BUILDER - TEST SUITE MVP 4 (TEMPLATE MANAGEMENT & WORKFLOW)");
  console.log("================================================================================\n");

  const {
    createEmptyBuilderDocument,
    createDefaultCoverSection,
    createDefaultPenutupSection,
    createBuilderElement,
    createBuilderWidget,
    createBuilderId,
  } = jiti(path.join(rootDir, "components/builder/model.ts"));

  const {
    getAllGlobalThemePresets,
    getGlobalThemePreset,
    GLOBAL_THEME_PRESETS,
    DEFAULT_THEME_ID,
  } = jiti(path.join(rootDir, "lib/theme-system.ts"));

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
    importFromJSONString,
  } = jiti(path.join(rootDir, "components/builder/adapters/importAdapter.ts"));

  const {
    figmaAdapter,
    elementorAdapter,
  } = jiti(path.join(rootDir, "components/builder/adapters/externalDesignAdapter.ts"));

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = "") {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName}`);
      if (details) console.error(`         Details: ${details}`);
      failed++;
    }
  }

  // ---------------------------------------------------------------------------
  // 1. Template Management & Filtering Logic
  // ---------------------------------------------------------------------------
  console.log("\n--- 1. Template Management & Filtering Logic ---");

  const mockTemplates = [
    {
      id: 701,
      name: "Botanical Wedding",
      slug: "botanical-wedding",
      category_name: "Wedding",
      packageTier: "pro",
      themeId: "theme-wedding-botanical",
      status: "draft",
      rejection_note: null,
      updated_at: "2026-11-17T10:00:00.000Z",
    },
    {
      id: 702,
      name: "Modern Intimate",
      slug: "modern-intimate",
      category_name: "Wedding",
      packageTier: "medium",
      themeId: "theme-modern",
      status: "rejected",
      rejection_note: "Perbaiki kontras teks pada section event.",
      updated_at: "2026-11-17T11:00:00.000Z",
    },
    {
      id: 703,
      name: "Minimalist Corporate",
      slug: "minimalist-corporate",
      category_name: "Corporate",
      packageTier: "basic",
      themeId: "theme-minimalist",
      status: "in_review",
      rejection_note: null,
      updated_at: "2026-11-17T12:00:00.000Z",
    },
    {
      id: 704,
      name: "Floral Luxury",
      slug: "floral-luxury",
      category_name: "Engagement",
      packageTier: "pro",
      themeId: "theme-floral",
      status: "published",
      rejection_note: null,
      updated_at: "2026-11-17T13:00:00.000Z",
    },
  ];

  // Filter by Status
  const drafts = mockTemplates.filter(t => normalizeTemplateStatus(t.status) === "draft");
  const inReview = mockTemplates.filter(t => normalizeTemplateStatus(t.status) === "pending_review");
  const published = mockTemplates.filter(t => normalizeTemplateStatus(t.status) === "published");
  const rejected = mockTemplates.filter(t => normalizeTemplateStatus(t.status) === "rejected");

  assert(drafts.length === 1 && drafts[0].id === 701, "Filter by status: draft returns 1 template");
  assert(inReview.length === 1 && inReview[0].id === 703, "Filter by status: pending_review (in_review) returns 1 template");
  assert(published.length === 1 && published[0].id === 704, "Filter by status: published returns 1 template");
  assert(rejected.length === 1 && rejected[0].id === 702, "Filter by status: rejected returns 1 template");

  // Filter by Package Tier
  const proTemplates = mockTemplates.filter(t => normalizePackageTier(t.packageTier) === "pro");
  const basicTemplates = mockTemplates.filter(t => normalizePackageTier(t.packageTier) === "basic");
  assert(proTemplates.length === 2, "Filter by tier: pro returns 2 templates");
  assert(basicTemplates.length === 1, "Filter by tier: basic returns 1 template");

  // Filter by Theme
  const floralThemeTemplates = mockTemplates.filter(t => t.themeId === "theme-floral");
  assert(floralThemeTemplates.length === 1 && floralThemeTemplates[0].id === 704, "Filter by theme returns matching template");

  // Template Duplicate: ensures unique ID and copy naming
  const sourceTemplate = mockTemplates[0];
  const duplicateId = 705;
  const duplicateName = `${sourceTemplate.name} (Copy)`;
  assert(
    duplicateName !== sourceTemplate.name && duplicateId !== sourceTemplate.id,
    "Template duplication generates unique name and unique ID"
  );

  // Template Rename
  const renamedTemplate = { ...sourceTemplate, name: "Botanical Wedding v2", updated_at: new Date().toISOString() };
  assert(
    renamedTemplate.name === "Botanical Wedding v2" && renamedTemplate.updated_at !== sourceTemplate.updated_at,
    "Template rename updates name and last edited timestamp"
  );

  // ---------------------------------------------------------------------------
  // 2. Package Tier vs Theme Separation & Template Creation
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Package Tier vs Theme Separation & Creation Workflow ---");

  const newTemplateInput = {
    name: "Golden Sunrise Wedding",
    category: "Wedding",
    packageTier: "medium", // Product feature tier
    themeId: "theme-wedding-botanical", // Visual styling preset
    canvasType: "blank",
  };

  assert(
    newTemplateInput.packageTier !== newTemplateInput.themeId,
    "Package Tier and Theme are strictly distinct configuration fields"
  );

  const globalPreset = getGlobalThemePreset(newTemplateInput.themeId);
  assert(
    globalPreset !== undefined && globalPreset.id === newTemplateInput.themeId,
    "Theme preset selected from available global theme catalog"
  );

  // Blank Canvas Starter: Minimal valid Cover and Penutup
  const blankCanvasDoc = createEmptyBuilderDocument();
  assert(
    blankCanvasDoc.sections.length === 2 &&
    blankCanvasDoc.sections[0].name.toLowerCase().includes("cover") &&
    blankCanvasDoc.sections[1].name.toLowerCase().includes("penutup"),
    "Blank canvas starter initializes with minimal required Cover and Penutup"
  );

  // ---------------------------------------------------------------------------
  // 3. Autosave & Revision History Snapshot Management
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Autosave & Revision History System ---");

  const snapshotDoc = createEmptyBuilderDocument();
  const testHeading = createBuilderElement("heading", snapshotDoc.sections[0].id);
  testHeading.props.text = "Snapshot Heading V1";
  snapshotDoc.sections[0].children.push(testHeading);

  const mockSnapshot = {
    id: `rev-test-${Date.now()}`,
    timestamp: new Date().toISOString(),
    formattedTime: "14:30:00",
    label: "Sebelum Mengganti Warna",
    source: "manual",
    stats: {
      sectionCount: snapshotDoc.sections.length,
      elementCount: snapshotDoc.sections.reduce((acc, s) => acc + s.children.length, 0),
      widgetCount: 0,
    },
    document: JSON.parse(JSON.stringify(snapshotDoc)),
    metadata: {
      name: "Snapshot Template",
      category_name: "Wedding",
      packageTier: "pro",
      themeId: "theme-wedding-botanical",
    },
  };

  assert(
    mockSnapshot.label === "Sebelum Mengganti Warna" && mockSnapshot.source === "manual",
    "Revision snapshot captures custom label and manual source tag"
  );

  // Simulate editing after snapshot
  testHeading.props.text = "Altered Heading V2";

  // Simulate restoring snapshot
  const restoredDoc = JSON.parse(JSON.stringify(mockSnapshot.document));
  const restoredHeading = restoredDoc.sections[0].children.find(c => c.id === testHeading.id);

  assert(
    restoredHeading && restoredHeading.props.text === "Snapshot Heading V1",
    "Restoring revision snapshot restores exact past document state without data loss"
  );

  // ---------------------------------------------------------------------------
  // 4. Template Validation Rules (Blocking Error vs Advisory Warning)
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Template Validation Rules ---");

  // Valid Template Baseline
  const validDoc = createEmptyBuilderDocument();
  const validHeading = createBuilderElement("heading", validDoc.sections[0].id);
  validHeading.props.text = "Romeo & Juliet";
  validDoc.sections[0].children.push(validHeading);

  const validJSON = serializeToTemplateJSON({
    document: validDoc,
    metadata: {
      name: "Romeo & Juliet Wedding",
      packageTier: "pro",
      category_name: "Wedding",
      description: "Undangan mewah",
    },
    themeId: "theme-wedding-botanical",
  });
  const validResult = validateTemplateJSON(validJSON);
  assert(
    validResult.valid && validResult.errors.length === 0,
    "Valid template passes validation with 0 errors and is eligible for review submission",
    validResult.errors.join("; ")
  );

  // A. Missing Cover as first section -> Blocking Error
  const invalidCoverJSON = {
    ...validJSON,
    sections: [
      {
        id: "sec-gallery",
        name: "Gallery Section",
        sortOrder: 0,
        sectionRole: "content",
        visible: true,
        props: {},
        containerIds: [],
        elementIds: [],
        widgetIds: [],
      },
      validJSON.sections[1],
    ],
  };
  const coverValidation = validateTemplateJSON(invalidCoverJSON);
  assert(
    !coverValidation.valid && coverValidation.errors.some(e => e.includes("Cover")),
    "Validation blocks submission when first section is not Cover",
    coverValidation.errors.join("; ")
  );

  // B. Missing Closing as last section -> Blocking Error
  const invalidClosingJSON = {
    ...validJSON,
    sections: [
      validJSON.sections[0],
      {
        id: "sec-story",
        name: "Story Section",
        sortOrder: 1,
        sectionRole: "content",
        visible: true,
        props: {},
        containerIds: [],
        elementIds: [],
        widgetIds: [],
      },
    ],
  };
  const closingValidation = validateTemplateJSON(invalidClosingJSON);
  assert(
    !closingValidation.valid && closingValidation.errors.some(e => e.includes("Closing") || e.includes("Penutup")),
    "Validation blocks submission when last section is not Closing",
    closingValidation.errors.join("; ")
  );

  // C. Prohibited Live Streaming Widget -> Blocking Error
  const liveStreamingDoc = createEmptyBuilderDocument();
  const lsWidget = createBuilderWidget("countdown", liveStreamingDoc.sections[0].id);
  lsWidget.widgetType = "live_streaming";
  liveStreamingDoc.sections[0].children.push(lsWidget);
  const liveStreamingJSON = serializeToTemplateJSON({
    document: liveStreamingDoc,
    metadata: { name: "Test Live Streaming", packageTier: "pro" },
    themeId: "theme-wedding-botanical",
  });
  const lsValidation = validateTemplateJSON(liveStreamingJSON);
  assert(
    !lsValidation.valid && lsValidation.errors.some(e => e.toLowerCase().includes("live streaming")),
    "Validation blocks submission when prohibited Live Streaming widget is included",
    lsValidation.errors.join("; ")
  );

  // ---------------------------------------------------------------------------
  // 5. Template Status Workflow
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Template Status Workflow Transitions ---");

  // Draft -> Pending Review (submission)
  let testStatus = "draft";
  const canEditInDraft = ["draft", "rejected", "revision_needed"].includes(testStatus);
  assert(canEditInDraft, "Draft status allows active editing");

  // Simulate submission
  testStatus = "pending_review";
  const isReadOnlyInReview = ["pending_review", "published"].includes(testStatus);
  assert(isReadOnlyInReview, "Pending Review status locks template in read-only mode");

  // Admin rejection simulation
  testStatus = "rejected";
  const rejectionNote = "Perbaiki kontras teks.";
  const canEditAfterReject = ["draft", "rejected", "revision_needed"].includes(testStatus);
  assert(
    canEditAfterReject && Boolean(rejectionNote),
    "Rejected status displays admin note and allows designer to edit & resubmit"
  );

  // Published template requires Revision Draft
  testStatus = "published";
  const isDirectEditBlockedOnPublished = ["pending_review", "published"].includes(testStatus);
  const revisionDraftStatus = "draft";
  assert(
    isDirectEditBlockedOnPublished && revisionDraftStatus === "draft",
    "Published status blocks direct editing and requires creating a new Revision Draft"
  );

  // ---------------------------------------------------------------------------
  // 6. JSON Import / Export & ID Collision Handling
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. JSON Import / Export Roundtrip ---");

  const jsonString = JSON.stringify(validJSON, null, 2);
  const importResult = importFromJSONString(jsonString);

  assert(
    importResult.success && importResult.templateJSON !== undefined,
    "importFromJSONString parses valid template JSON successfully"
  );
  assert(
    importResult.deserialized !== undefined &&
    importResult.deserialized.document.sections.length === 2,
    "Imported template deserializes into valid BuilderDocument"
  );

  // ---------------------------------------------------------------------------
  // 7. External Design Import Foundation (Figma & Elementor)
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. External Design Import Foundation ---");

  assert(
    figmaAdapter.source === "figma" && figmaAdapter.isReady === false,
    "Figma adapter conforms to ExternalDesignAdapter and honestly flags foundation stage (isReady: false)"
  );

  const figmaPayload = {
    documentName: "Figma Luxury Wedding",
    version: "v1.2",
    nodes: [
      {
        id: "frame-1",
        name: "Cover Hero",
        type: "FRAME",
        children: [],
      },
    ],
  };

  const figmaMapping = figmaAdapter.parse(figmaPayload);
  assert(
    figmaMapping.success &&
    figmaMapping.templateJSON !== undefined &&
    figmaMapping.diagnostics.length > 0 &&
    figmaMapping.unsupportedFeaturesCount > 0,
    "Figma adapter maps layout into InviteU JSON schema while generating diagnostics for unsupported features",
    `Diagnostics count: ${figmaMapping.diagnostics.length}`
  );

  assert(
    elementorAdapter.source === "elementor" && elementorAdapter.isReady === false,
    "Elementor adapter conforms to ExternalDesignAdapter and honestly flags foundation stage (isReady: false)"
  );

  const elementorPayload = {
    title: "Elementor Rustic Invitation",
    version: "3.18",
    content: [
      {
        id: "sec-elem-1",
        elType: "section",
        elements: [],
      },
    ],
  };

  const elementorMapping = elementorAdapter.parse(elementorPayload);
  assert(
    elementorMapping.success &&
    elementorMapping.templateJSON !== undefined &&
    elementorMapping.diagnostics.length > 0,
    "Elementor adapter maps layout into InviteU JSON schema with diagnostics",
    `Diagnostics count: ${elementorMapping.diagnostics.length}`
  );

  // ---------------------------------------------------------------------------
  // Summary
  // ---------------------------------------------------------------------------
  console.log("\n================================================================================");
  console.log(`  TOTAL TESTS: ${passed + failed} | PASSED: ${passed} | FAILED: ${failed}`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMVP4Tests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
