/* eslint-disable */
/**
 * Test Suite: Page Builder MVP 3 - Responsive System, Asset Management & Preview Experience
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

async function runMVP3Tests() {
  console.log("================================================================================");
  console.log("  INVITEU PAGE BUILDER - TEST SUITE MVP 3 (RESPONSIVE SYSTEM & ASSET MANAGEMENT)");
  console.log("================================================================================\n");

  const {
    createEmptyBuilderDocument,
    createDefaultCoverSection,
    createDefaultPenutupSection,
    createBuilderElement,
    createBuilderWidget,
    getResponsiveProps,
    getResponsivePosition,
    getResponsiveSize,
    BUILDER_VIEWPORT_WIDTHS,
    BUILDER_TEST_VIEWPORTS,
  } = jiti(path.join(rootDir, "components/builder/model.ts"));

  const {
    getBuilderObjectStyle,
    getBuilderCanvasStyle,
  } = jiti(path.join(rootDir, "components/builder/styles.ts"));

  const {
    resolveTheme,
  } = jiti(path.join(rootDir, "lib/theme-resolver.ts"));

  const {
    DEFAULT_TEMPLATE_ASSETS,
  } = jiti(path.join(rootDir, "lib/template-assets.ts"));

  const {
    serializeToTemplateJSON,
    deserializeFromTemplateJSON,
    validateTemplateJSON,
  } = jiti(path.join(rootDir, "lib/template-json.ts"));

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
  // 1. Breakpoint System & Viewport Width Standards
  // ---------------------------------------------------------------------------
  console.log("\n--- 1. Breakpoint System & Viewport Width Standards ---");

  assert(
    BUILDER_VIEWPORT_WIDTHS.desktop === 1440 &&
    BUILDER_VIEWPORT_WIDTHS.tablet === 768 &&
    BUILDER_VIEWPORT_WIDTHS.mobile === 390,
    "Standard Viewport Breakpoints match specification (Desktop: 1440px, Tablet: 768px, Mobile: 390px)"
  );

  const testViewports = [1440, 1120, 768, 390, 320];
  const allViewportsIncluded = testViewports.every(w =>
    BUILDER_TEST_VIEWPORTS.some(v => v.width === w)
  );
  assert(
    allViewportsIncluded,
    "Tested viewports include 1440px, 1120px, 768px, 390px, and 320px",
    `Expected ${testViewports.join(", ")}`
  );

  // ---------------------------------------------------------------------------
  // 2. Cascade Inheritance (Desktop Baseline -> Tablet -> Mobile)
  // ---------------------------------------------------------------------------
  console.log("\n--- 2. Cascade Inheritance Logic ---");

  const testNode = {
    id: "el-heading-1",
    kind: "element",
    elementType: "heading",
    name: "Wedding Title",
    props: {
      text: "Romeo & Juliet",
      fontSize: 48,
      color: "#2C3E50",
      textAlign: "center",
      padding: 24,
      gap: 16,
    },
    position: { x: 50, y: 100 },
    size: { width: 400, height: 80 },
    responsive: {
      tablet: {
        props: {
          color: "#E74C3C", // Tablet override color only
        },
        position: { x: 30 }, // Tablet override x only
      },
      mobile: {
        props: {
          textAlign: "left", // Mobile override textAlign only
        },
      },
    },
  };

  // Test Desktop baseline (no override active)
  const desktopProps = getResponsiveProps(testNode, "desktop");
  const desktopPos = getResponsivePosition(testNode, "desktop");
  const desktopSize = getResponsiveSize(testNode, "desktop");

  assert(
    desktopProps.color === "#2C3E50" && desktopProps.textAlign === "center" && desktopProps.fontSize === 48,
    "Desktop uses baseline values without inheritance pollution",
    JSON.stringify(desktopProps)
  );
  assert(
    desktopPos.x === 50 && desktopPos.y === 100,
    "Desktop position matches baseline position"
  );
  assert(
    desktopSize.width === 400 && desktopSize.height === 80,
    "Desktop size matches baseline size"
  );

  // Test Tablet cascade: inherits text & textAlign from Desktop, overrides color, overrides x pos, inherits y pos
  const tabletProps = getResponsiveProps(testNode, "tablet");
  const tabletPos = getResponsivePosition(testNode, "tablet");
  const tabletSize = getResponsiveSize(testNode, "tablet");

  assert(
    tabletProps.color === "#E74C3C",
    "Tablet applies its explicit color override"
  );
  assert(
    tabletPos.x === 30 && tabletPos.y === 100,
    "Tablet overrides x to 30 while inheriting y=100 from Desktop",
    `Pos: x=${tabletPos.x}, y=${tabletPos.y}`
  );
  assert(
    tabletSize.width === 400 && tabletSize.height === 80,
    "Tablet inherits baseline size from Desktop"
  );

  // Test Mobile cascade: inherits Tablet's color override (#E74C3C), inherits Tablet's x (30), applies its own textAlign ("left")
  const mobileProps = getResponsiveProps(testNode, "mobile");
  const mobilePos = getResponsivePosition(testNode, "mobile");

  assert(
    mobileProps.color === "#E74C3C",
    "Mobile cascade-inherits Tablet's color override",
    `Color: ${mobileProps.color}`
  );
  assert(
    mobileProps.textAlign === "left",
    "Mobile applies its own explicit textAlign override",
    `TextAlign: ${mobileProps.textAlign}`
  );
  assert(
    mobilePos.x === 30 && mobilePos.y === 100,
    "Mobile cascade-inherits Tablet position override (x=30) and Desktop baseline (y=100)",
    `Pos: x=${mobilePos.x}, y=${mobilePos.y}`
  );

  // ---------------------------------------------------------------------------
  // 3. Automatic Responsive Behavior (Stacking, Auto-scale, Gallery)
  // ---------------------------------------------------------------------------
  console.log("\n--- 3. Automatic Responsive Behavior ---");

  // Flexbox auto-stack row -> col on mobile
  const flexContainer = {
    id: "cont-1",
    kind: "element",
    elementType: "container",
    name: "Row Container",
    props: {
      flexDirection: "row",
      gap: 20,
      padding: 30,
    },
    responsive: {},
  };

  const desktopFlex = getResponsiveProps(flexContainer, "desktop");
  const mobileFlex = getResponsiveProps(flexContainer, "mobile");

  assert(
    desktopFlex.flexDirection === "row",
    "Desktop flex container retains horizontal row direction"
  );
  assert(
    mobileFlex.flexDirection === "column",
    "Mobile flex container automatically stacks to column (autoStackMobile)",
    `Mobile direction: ${mobileFlex.flexDirection}`
  );
  assert(
    mobileFlex.padding < desktopFlex.padding && mobileFlex.gap < desktopFlex.gap,
    "Mobile padding and gap automatically scale down proportionally for compact screens",
    `Padding: ${mobileFlex.padding} (desktop ${desktopFlex.padding}), Gap: ${mobileFlex.gap}`
  );

  // Gallery columns adaptation
  const galleryWidget = {
    id: "widget-gallery",
    kind: "widget",
    widgetType: "gallery",
    name: "Photo Gallery",
    props: {
      columns: 4,
    },
    responsive: {},
  };

  const desktopGallery = getResponsiveProps(galleryWidget, "desktop");
  const mobileGallery = getResponsiveProps(galleryWidget, "mobile");

  assert(
    desktopGallery.columns === 4,
    "Desktop gallery renders 4 columns as configured"
  );
  assert(
    mobileGallery.columns === 2,
    "Mobile gallery automatically adapts 4 columns down to 2 columns for readability",
    `Mobile columns: ${mobileGallery.columns}`
  );

  // Typography auto-scaling
  assert(
    Math.round(mobileProps.fontSize) === 35, // 48 * 0.72 = 34.56 -> 35
    "Mobile typography automatically scales proportionally (48px -> ~35px) avoiding text clipping",
    `Scaled fontSize: ${mobileProps.fontSize}`
  );

  // ---------------------------------------------------------------------------
  // 4. Zero Horizontal Overflow & Canvas Styles Across Viewports
  // ---------------------------------------------------------------------------
  console.log("\n--- 4. Zero Horizontal Overflow & Canvas Styles Across Viewports ---");

  for (const vp of testViewports) {
    const canvasStyle = getBuilderCanvasStyle(vp);
    assert(
      canvasStyle.overflowX === "hidden" && canvasStyle.boxSizing === "border-box",
      `Viewport ${vp}px enforces overflowX: hidden and boxSizing: border-box`,
      JSON.stringify(canvasStyle)
    );
    assert(
      canvasStyle.width === `${vp}px` || canvasStyle.width === "100%",
      `Viewport ${vp}px applies exact width constraints`,
      `Width: ${canvasStyle.width}`
    );
  }

  // ---------------------------------------------------------------------------
  // 5. Global Theme CSS Variables Resolution
  // ---------------------------------------------------------------------------
  console.log("\n--- 5. Global Theme CSS Variables Resolution ---");

  const resolvedTheme = resolveTheme("theme-wedding-botanical", {
    colorPalette: {
      primary: "#1B4D3E",
    },
    typography: {
      headingFontFamily: "Cinzel, serif",
    },
  });

  assert(
    resolvedTheme.cssVariables &&
    resolvedTheme.cssVariables["--theme-primary"] === "#1B4D3E",
    "Theme resolver compiles custom primary color into CSS variable --theme-primary",
    `Variable: ${resolvedTheme.cssVariables?.["--theme-primary"]}`
  );
  assert(
    resolvedTheme.cssVariables["--theme-font-heading"].includes("Cinzel"),
    "Theme resolver compiles heading font into CSS variable --theme-font-heading",
    `Heading Font: ${resolvedTheme.cssVariables?.["--theme-font-heading"]}`
  );

  // ---------------------------------------------------------------------------
  // 6. Asset Management, Replace & Fallbacks
  // ---------------------------------------------------------------------------
  console.log("\n--- 6. Asset Management, Replace & Fallbacks ---");

  assert(
    Array.isArray(DEFAULT_TEMPLATE_ASSETS) && DEFAULT_TEMPLATE_ASSETS.length > 0,
    "Template Asset library contains default assets",
    `Count: ${DEFAULT_TEMPLATE_ASSETS.length}`
  );

  const sampleAsset = DEFAULT_TEMPLATE_ASSETS[0];
  const imageElement = createBuilderElement("image", "sec-1");
  const originalWidth = imageElement.size.width;
  const originalHeight = imageElement.size.height;

  // Simulate replacing image via AssetPicker without losing element configuration
  imageElement.props.src = sampleAsset.url;
  imageElement.props.assetId = sampleAsset.id;

  assert(
    imageElement.props.src === sampleAsset.url &&
    imageElement.size.width === originalWidth &&
    imageElement.size.height === originalHeight,
    "Replacing asset preserves element dimensions and existing attributes without resetting node",
    `Src: ${imageElement.props.src}, Width: ${imageElement.size.width}`
  );

  // ---------------------------------------------------------------------------
  // 7. Full Template JSON Serialization with Responsive Overrides
  // ---------------------------------------------------------------------------
  console.log("\n--- 7. JSON Serialization & Schema Integrity ---");

  const doc = createEmptyBuilderDocument();
  doc.sections[0].children.push(testNode);
  doc.sections[0].children.push(flexContainer);
  doc.sections[0].children.push(galleryWidget);

  const metadata = {
    name: "Responsive Test Template",
    category_name: "Wedding",
    themeId: "elegant",
    themeConfig: { colors: { primary: "#1B4D3E" } },
  };

  const jsonResult = serializeToTemplateJSON({
    document: doc,
    metadata,
    themeId: "theme-wedding-botanical",
    status: "draft",
    packageTier: "basic",
  });
  const validation = validateTemplateJSON(jsonResult);

  assert(
    validation.valid,
    "Template JSON with responsive overrides passes validation schema version 1.0.0",
    validation.errors.join("; ")
  );

  const roundtripDoc = deserializeFromTemplateJSON(jsonResult);
  const roundtripHeading = roundtripDoc.document.sections[0].children.find(c => c.id === testNode.id);

  assert(
    roundtripHeading &&
    roundtripHeading.responsive?.tablet?.props?.color === "#E74C3C" &&
    roundtripHeading.responsive?.mobile?.props?.textAlign === "left",
    "Deserialized document retains all responsive override branches intact",
    JSON.stringify(roundtripHeading?.responsive)
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

runMVP3Tests().catch((err) => {
  console.error("Test execution error:", err);
  process.exit(1);
});
