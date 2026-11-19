/* eslint-disable */
/**
 * Test Suite: Page Builder MVP 2 - Visual Editor, Theme Customization & Elementor-Inspired Editing
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

async function runMVP2Tests() {
  console.log("================================================================================");
  console.log("  INVITEU PAGE BUILDER - TEST SUITE MVP 2 (VISUAL EDITOR & THEME CUSTOMIZATION)");
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
    getBuilderObjectStyle,
  } = jiti(path.join(rootDir, "components/builder/styles.ts"));

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
    serializeToTemplateJSON,
    deserializeFromTemplateJSON,
    validateTemplateJSON,
  } = jiti(path.join(rootDir, "lib/template-json.ts"));

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
  // TEST 1: Elements Panel & New Element Types (Heading, Spacer, Icon, Container)
  // ---------------------------------------------------------------------------
  console.log("[1] Elements Creation & Default Configurations:");

  const headingEl = createBuilderElement("heading");
  assert(headingEl.kind === "element", "Heading node kind is 'element'");
  assert(headingEl.elementType === "heading", "Heading elementType is 'heading'");
  assert(headingEl.props.tag === "h2", "Heading default HTML tag is 'h2'");
  assert(headingEl.props.fontSize === 28, "Heading default fontSize is 28");
  assert(headingEl.props.fontFamily === "Georgia, serif", "Heading default fontFamily is Georgia");
  assert(headingEl.props.fontWeight === 700, "Heading default fontWeight is 700");

  const spacerEl = createBuilderElement("spacer");
  assert(spacerEl.kind === "element", "Spacer node kind is 'element'");
  assert(spacerEl.elementType === "spacer", "Spacer elementType is 'spacer'");
  assert(spacerEl.props.height === 32, "Spacer default height is 32px");

  const iconEl = createBuilderElement("icon");
  assert(iconEl.kind === "element", "Icon node kind is 'element'");
  assert(iconEl.elementType === "icon", "Icon elementType is 'icon'");
  assert(iconEl.props.iconName === "heart", "Icon default iconName is 'heart'");
  assert(iconEl.props.iconSize === 32, "Icon default iconSize is 32");
  assert(iconEl.props.color === "#4f46e5", "Icon default color is '#4f46e5'");

  const containerEl = createBuilderElement("container");
  assert(containerEl.kind === "element", "Container node kind is 'element'");
  assert(containerEl.elementType === "container", "Container elementType is 'container'");
  assert(containerEl.props.display === "flex", "Container default display is 'flex'");
  assert(containerEl.props.flexDirection === "column", "Container default flexDirection is 'column'");

  // ---------------------------------------------------------------------------
  // TEST 2: Container Layout Controls (Flexbox & Grid Styles Resolver)
  // ---------------------------------------------------------------------------
  console.log("\n[2] Container Layout Styles (Flexbox & Grid):");

  const flexStyle = getBuilderObjectStyle({
    display: "flex",
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    alignment: "center",
    gap: 16,
  });
  assert(flexStyle.display === "flex", "Flexbox display applied");
  assert(flexStyle.flexDirection === "row", "Flexbox flexDirection applied");
  assert(flexStyle.flexWrap === "wrap", "Flexbox flexWrap applied");
  assert(flexStyle.justifyContent === "space-between", "Flexbox justifyContent applied");
  assert(flexStyle.alignItems === "center", "Flexbox alignItems applied");
  assert(flexStyle.gap === "16px", "Flexbox gap applied");

  const gridStyle = getBuilderObjectStyle({
    display: "grid",
    gridColumns: 3,
    gridRows: 2,
    columnGap: 20,
    rowGap: 12,
  });
  assert(gridStyle.display === "grid", "Grid display applied");
  assert(gridStyle.gridTemplateColumns === "repeat(3, minmax(0, 1fr))", "Grid columns template applied");
  assert(gridStyle.gridTemplateRows === "repeat(2, minmax(0, 1fr))", "Grid rows template applied");
  assert(gridStyle.columnGap === "20px", "Grid columnGap applied");
  assert(gridStyle.rowGap === "12px", "Grid rowGap applied");

  // ---------------------------------------------------------------------------
  // TEST 3: Positioning & Layering (MVP 2 Section 10)
  // ---------------------------------------------------------------------------
  console.log("\n[3] Positioning, Coordinates, Z-Index & Overflow:");

  const absStyle = getBuilderObjectStyle({
    position: "absolute",
    top: 24,
    left: 10,
    zIndex: 15,
    overflow: "hidden",
  });
  assert(absStyle.position === "absolute", "Position absolute applied");
  assert(absStyle.top === "24px", "Top coordinate offset applied");
  assert(absStyle.left === "10px", "Left coordinate offset applied");
  assert(absStyle.zIndex === 15, "Z-index applied");
  assert(absStyle.overflow === "hidden", "Overflow hidden applied");

  // ---------------------------------------------------------------------------
  // TEST 4: Nested Container Structure & Hierarchy
  // ---------------------------------------------------------------------------
  console.log("\n[4] Nested Container Structure & Hierarchy:");

  const doc = createEmptyBuilderDocument();
  const coverSec = createDefaultCoverSection();
  const penutupSec = createDefaultPenutupSection();
  doc.sections = [coverSec, penutupSec];

  // Create section in middle
  const mainSec = {
    id: createBuilderId("section"),
    name: "Acara & Doa",
    kind: "section",
    children: [],
    props: { padding: 40 },
  };
  doc.sections.splice(1, 0, mainSec);

  // Add root container into section
  const rootContainer = createBuilderElement("container");
  rootContainer.name = "Root Container";
  mainSec.children.push(rootContainer);

  // Add nested container inside root container
  const nestedContainer = createBuilderElement("container");
  nestedContainer.name = "Nested Container 1";
  nestedContainer.parentContainerId = rootContainer.id;
  mainSec.children.push(nestedContainer);

  // Add heading & icon inside nested container
  headingEl.parentContainerId = nestedContainer.id;
  iconEl.parentContainerId = nestedContainer.id;
  mainSec.children.push(headingEl);
  mainSec.children.push(iconEl);

  assert(mainSec.children.length === 4, "Main section holds 4 child nodes");
  assert(nestedContainer.parentContainerId === rootContainer.id, "Nested container correctly references rootContainer");
  assert(headingEl.parentContainerId === nestedContainer.id, "Heading element correctly references nestedContainer");
  assert(iconEl.parentContainerId === nestedContainer.id, "Icon element correctly references nestedContainer");

  // ---------------------------------------------------------------------------
  // TEST 5: Theme Selection & Customization (Global Presets & Local Overrides)
  // ---------------------------------------------------------------------------
  console.log("\n[5] Theme Selection, Preset Fallback & Local Overrides:");

  const globalThemes = getAllGlobalThemePresets();
  assert(globalThemes.length >= 5, "At least 5 global theme presets available");

  const elegantPreset = getGlobalThemePreset("elegant");
  assert(Boolean(elegantPreset), "Global preset 'elegant' is available");
  assert(Boolean(elegantPreset.thumbnail), "Global preset has thumbnail");
  assert(Boolean(elegantPreset.colorPalette), "Global preset has colorPalette");
  assert(Boolean(elegantPreset.typography), "Global preset has typography");

  // Verify resolveTheme without override inherits preset exactly
  const resolvedBase = resolveTheme("elegant");
  assert(resolvedBase.themeId === "theme-elegant", "Resolved theme ID is canonical 'theme-elegant'");
  assert(resolvedBase.colorPalette.primary === elegantPreset.colorPalette.primary, "Primary color matches preset");

  // Verify local theme customization override does not mutate global preset
  const originalPrimary = elegantPreset.colorPalette.primary;
  const customOverrides = {
    colorPalette: {
      primary: "#ff0077",
    },
    typography: {
      headingFont: "Cinzel, serif",
    },
  };
  const resolvedCustom = resolveTheme("elegant", customOverrides);

  assert(resolvedCustom.colorPalette.primary === "#ff0077", "Custom override primary color applied");
  assert(resolvedCustom.typography.headingFont === "Cinzel, serif", "Custom override headingFont applied");
  assert(elegantPreset.colorPalette.primary === originalPrimary, "Global preset remains unchanged (immutable)");

  // Reset to Theme Default (clear overrides)
  const resolvedReset = resolveTheme("elegant", undefined);
  assert(resolvedReset.colorPalette.primary === originalPrimary, "Reset returns to default preset primary color");

  // ---------------------------------------------------------------------------
  // TEST 6: Template JSON Schema Integrity (Serialization & Deserialization)
  // ---------------------------------------------------------------------------
  console.log("\n[6] Template JSON Schema Serialization & Persistence:");

  const testMetadata = {
    name: "Undangan Elegan MVP2",
    slug: "undangan-elegan-mvp2",
    description: "Template visual editing test",
    category_name: "Wedding",
    themeCategory: "Elegant",
    primaryColor: "#ff0077",
    secondaryColor: "#C5A059",
    packageTier: "pro",
    status: "draft",
    themeId: "theme-elegant",
    themeConfig: customOverrides,
  };

  const serialized = serializeToTemplateJSON({
    document: doc,
    metadata: testMetadata,
    packageTier: "pro",
    status: "draft",
    themeId: "theme-elegant",
    themeConfig: customOverrides,
  });

  const validation = validateTemplateJSON(serialized);
  assert(validation.valid === true, "Serialized template JSON is valid per schema");

  const deserialized = deserializeFromTemplateJSON(serialized);
  assert(deserialized.document.sections.length === 3, "All 3 sections preserved after deserialization");
  assert(deserialized.metadata.themeId === "theme-elegant", "Theme ID preserved in metadata");
  assert(deserialized.metadata.packageTier === "pro", "Package tier 'pro' preserved in metadata");
  assert(deserialized.metadata.status === "draft", "Status 'draft' preserved in metadata");

  const restoredMainSec = deserialized.document.sections.find((s) => s.id === mainSec.id);
  assert(Boolean(restoredMainSec), "Main section found in deserialized document");
  assert(restoredMainSec.children.length === 4, "All 4 children preserved in main section");

  const restoredNested = restoredMainSec.children.find((c) => c.name === "Nested Container 1");
  assert(Boolean(restoredNested), "Nested container preserved in document");
  assert(restoredNested.parentContainerId === rootContainer.id, "Nested container parent relationship preserved");

  const restoredHeading = restoredMainSec.children.find((c) => c.kind === "element" && c.elementType === "heading");
  assert(Boolean(restoredHeading), "Heading element preserved");
  assert(restoredHeading.props.tag === "h2", "Heading props preserved");
  assert(restoredHeading.props.fontSize === 28, "Heading fontSize preserved");

  // Summary
  console.log("\n================================================================================");
  console.log(`  RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log("================================================================================\n");

  if (failed > 0) {
    process.exit(1);
  }
}

runMVP2Tests().catch((err) => {
  console.error("Test execution failed:", err);
  process.exit(1);
});
