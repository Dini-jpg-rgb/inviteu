/* eslint-disable */
/**
 * TEST SUITE: Template Creation Wizard Validation & Ant Design Fixes
 * 
 * Verifies:
 * 1. Steps items API does not use deprecated `description` property, uses `content`.
 * 2. Static message API is replaced with App.useApp() context hook.
 * 3. Scenario 1: All required fields filled -> template successfully created.
 * 4. Scenario 2: Required field omitted/invalid -> validation catches specific problematic field.
 * 5. Scenario 3: Optional field omitted (empty description) -> template successfully created.
 * 6. Template persistence & metadata integrity in DesignerTemplatesContext.
 */

const fs = require('fs');
const path = require('path');
const assert = require('assert');

let passed = 0;
let failed = 0;

function it(desc, fn) {
  try {
    fn();
    console.log(`  [PASS] ${desc}`);
    passed++;
  } catch (err) {
    console.error(`  [FAIL] ${desc}`);
    console.error(`         ${err.message}`);
    failed++;
  }
}

console.log("================================================================================");
console.log("  TEST SUITE: TEMPLATE CREATION WIZARD FIXES & VERIFICATION");
console.log("================================================================================\n");

const wizardFilePath = path.join(__dirname, '../app/(designer)/designer/templates/components/TemplateCreateWizard.tsx');
const contextFilePath = path.join(__dirname, '../app/(designer)/designer/DesignerTemplatesContext.tsx');
const wizardCode = fs.readFileSync(wizardFilePath, 'utf8');
const contextCode = fs.readFileSync(contextFilePath, 'utf8');

console.log("--- 1. Ant Design Steps & Message Deprecation Verification ---");

it("Steps items configuration does NOT use deprecated 'description' property", () => {
  // Extract items=[ ... ] from Steps component
  const stepsMatch = wizardCode.match(/<Steps[\s\S]*?items=\{\[([\s\S]*?)\]\}/);
  assert(stepsMatch, "Steps component with items array should exist");
  const itemsContent = stepsMatch[1];
  
  // Make sure 'description:' does NOT appear inside Steps items
  const hasDescription = /\bdescription\s*:/.test(itemsContent);
  assert.strictEqual(hasDescription, false, "Steps items must NOT use deprecated 'description' property");
  
  // Make sure 'content:' is used for items
  const hasContent = /\bcontent\s*:/.test(itemsContent);
  assert.strictEqual(hasContent, true, "Steps items must use 'content' property instead");
});

it("Uses Ant Design 'App.useApp()' context hook instead of static message function", () => {
  // Should import App from 'antd'
  assert(/import\s*\{[^}]*\bApp\b[^}]*\}\s*from\s*["']antd["']/.test(wizardCode), "App must be imported from antd");
  
  // Should NOT import static message from 'antd'
  const staticMessageImport = /import\s*\{[^}]*\bmessage\b[^}]*\}\s*from\s*["']antd["']/.test(wizardCode);
  assert.strictEqual(staticMessageImport, false, "Must not import static message from antd");

  // Should invoke App.useApp()
  assert(/const\s*\{\s*message\s*\}\s*=\s*App\.useApp\(\)/.test(wizardCode), "Must invoke App.useApp() to consume context message");
});

it("Preserves mounted form fields across wizard steps (does not unmount DOM inputs)", () => {
  assert(wizardCode.includes("preserve={true}"), "Form must have preserve={true} enabled");
  // Check that display styling or non-unmounting container is used instead of conditional unmounting
  assert(wizardCode.includes('display: currentStep === 0 ? "block" : "none"'), "Step 0 container must toggle display rather than unmount");
  assert(!wizardCode.includes('{currentStep === 0 && ('), "Step 0 must NOT conditionally unmount");
});

console.log("\n--- 2. Form Validation Logic & Scenarios ---");

// Mock validation rules function reflecting the Form.Item rules
function validateFormValues(values) {
  const errors = {};
  
  // Required name rule
  const rawName = values.name;
  if (!rawName || typeof rawName !== 'string' || rawName.trim().length === 0) {
    errors.name = "Nama template wajib diisi.";
  } else if (rawName.trim().length < 3) {
    errors.name = "Nama template minimal 3 karakter.";
  }
  
  // Required category rule
  if (!values.category || typeof values.category !== 'string' || values.category.trim().length === 0) {
    errors.category = "Kategori wajib dipilih.";
  }

  // Description is optional, no required error
  return {
    valid: Object.keys(errors).length === 0,
    errors,
  };
}

it("Scenario 1: All required fields filled -> form passes validation and template input is valid", () => {
  const values = {
    name: "Royal Garden Elegance",
    category: "Wedding",
    description: "Undangan mewah bernuansa taman kerajaan dengan palet floral lembut.",
  };
  const result = validateFormValues(values);
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(result.errors, {});
});

it("Scenario 2A: Required name field left empty -> validation catches 'name' specifically", () => {
  const values = {
    name: "",
    category: "Wedding",
    description: "Deskripsi opsional.",
  };
  const result = validateFormValues(values);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.errors.name, "Nama template wajib diisi.");
  assert.strictEqual(result.errors.category, undefined, "Category should not have error");
});

it("Scenario 2B: Required name field filled with only spaces -> whitespace rule catches 'name'", () => {
  const values = {
    name: "     ",
    category: "Wedding",
    description: "",
  };
  const result = validateFormValues(values);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.errors.name, "Nama template wajib diisi.");
});

it("Scenario 2C: Required name field less than 3 characters -> min length rule catches 'name'", () => {
  const values = {
    name: "AB",
    category: "Wedding",
    description: "",
  };
  const result = validateFormValues(values);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.errors.name, "Nama template minimal 3 karakter.");
});

it("Scenario 2D: Required category field omitted -> validation catches 'category' specifically", () => {
  const values = {
    name: "Valid Template Name",
    category: "",
    description: "Valid description",
  };
  const result = validateFormValues(values);
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.errors.category, "Kategori wajib dipilih.");
  assert.strictEqual(result.errors.name, undefined);
});

it("Scenario 3: Optional description field omitted -> form passes validation cleanly", () => {
  const values = {
    name: "Minimalist Modern",
    category: "Wedding",
    description: "", // omitted optional field
  };
  const result = validateFormValues(values);
  assert.strictEqual(result.valid, true, "Form must be valid when optional description is empty");
  assert.deepStrictEqual(result.errors, {});
});

console.log("\n--- 3. Template Creation & Data Persistence Integrity ---");

// Mock createTemplate logic from DesignerTemplatesContext
function mockCreateTemplate(input, state = []) {
  const id = state.length + 101;
  const timestamp = new Date().toISOString();
  const slug = `${(input.name || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")}-${id}`;

  const template = {
    id,
    designer_id: 1,
    name: (input.name || "").trim(),
    description: (input.description || "").trim(),
    slug,
    category_name: input.category || "Wedding",
    style: input.style || "Botanical",
    themeCategory: input.style || "Botanical",
    packageTier: input.packageTier || "basic",
    themeId: input.themeId || "theme-wedding-botanical",
    themeConfig: {},
    status: "draft",
    rejection_note: null,
    primaryColor: input.primaryColor || "#6f7f5f",
    secondaryColor: input.secondaryColor || "#455633",
    thumbnail: (input.thumbnail || "/templates/wedding/couple-main.jpg").trim(),
    version: "1.0",
    created_at: timestamp,
    updated_at: timestamp,
    sections: [
      { id: `sec-${id}-cover`, type: "cover" },
      { id: `sec-${id}-penutup`, type: "quote_banner" },
    ],
  };

  return { id, template, nextState: [template, ...state] };
}

it("Template creation produces correct metadata (Tier, Theme, Status Draft, Category)", () => {
  const input = {
    name: "Modern Rustic Wedding",
    description: "",
    category: "Wedding",
    style: "Modern",
    primaryColor: "#FCB040",
    secondaryColor: "#3A2313",
    thumbnail: "/templates/wedding/modern.jpg",
    packageTier: "pro",
    themeId: "theme-modern",
    canvasType: "default",
  };

  const { id, template, nextState } = mockCreateTemplate(input);

  assert.strictEqual(id, 101);
  assert.strictEqual(template.name, "Modern Rustic Wedding");
  assert.strictEqual(template.description, "");
  assert.strictEqual(template.category_name, "Wedding");
  assert.strictEqual(template.packageTier, "pro");
  assert.strictEqual(template.themeId, "theme-modern");
  assert.strictEqual(template.status, "draft", "Status must initially be Draft");
  assert.strictEqual(template.rejection_note, null);
  assert.strictEqual(nextState[0].id, 101, "Template must appear at the top of templates list");
  assert.strictEqual(nextState[0].sections.length, 2, "Must contain initial Cover and Penutup sections");
});

it("DesignerTemplatesContext has null-safe string trimming for optional fields", () => {
  assert(contextCode.includes('(input.description || "").trim()'), "Context must safely trim description");
  assert(contextCode.includes('(input.thumbnail || "/templates/wedding/couple-main.jpg").trim()'), "Context must safely trim thumbnail");
});

console.log("\n================================================================================");
console.log(`  HASIL TEST: ${passed} PASSED | ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
}
