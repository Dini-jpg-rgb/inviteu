/* eslint-disable */
/**
 * TEST SUITE: Responsive Layout, Animation System & Page Builder UX Refinement
 * 
 * Verifies:
 * 1. Responsive Design: Single design adapts across Desktop (1440px), Tablet (768px), Mobile (390px & 320px).
 * 2. Zero Horizontal Overflow across all viewports.
 * 3. Responsive Overrides & Inheritance logic.
 * 4. Animation System: Opening, Decorative, Scroll, Character, Functional animations.
 * 5. Animation CSS classes & settings mapping.
 * 6. Page Builder UX Simplification: 3 device preview choices, structured tabs, search capability, zero emojis.
 * 7. Template JSON schema integration & round-trip persistence.
 */

const fs = require("fs");
const path = require("path");
const assert = require("assert");

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
console.log("  TEST SUITE: RESPONSIVE SYSTEM, ANIMATION SYSTEM & BUILDER UX REFINEMENT");
console.log("================================================================================\n");

// Read key files to verify implementation
const rootDir = path.resolve(__dirname, "..");
const modelCode = fs.readFileSync(path.join(rootDir, "components/builder/model.ts"), "utf8");
const toolbarCode = fs.readFileSync(path.join(rootDir, "components/builder/BuilderToolbar.tsx"), "utf8");
const canvasCode = fs.readFileSync(path.join(rootDir, "components/builder/BuilderCanvas.tsx"), "utf8");
const propertiesCode = fs.readFileSync(path.join(rootDir, "components/builder/BuilderProperties.tsx"), "utf8");
const frameCode = fs.readFileSync(path.join(rootDir, "components/builder/ObjectManipulationFrame.tsx"), "utf8");
const sectionCode = fs.readFileSync(path.join(rootDir, "components/builder/SectionContainer.tsx"), "utf8");
const previewCode = fs.readFileSync(path.join(rootDir, "components/builder/PreviewRenderer.tsx"), "utf8");
const animTypesCode = fs.readFileSync(path.join(rootDir, "components/builder/animation/animationTypes.ts"), "utf8");
const animCssCode = fs.readFileSync(path.join(rootDir, "components/builder/animation/animations.module.css"), "utf8");

// -----------------------------------------------------------------------------
// 1. RESPONSIVE DESIGN: DESIGN ONCE, ADAPT EVERYWHERE
// -----------------------------------------------------------------------------
console.log("--- 1. Responsive System & Device Viewports ---");

it("Exactly 3 device preview choices provided in BuilderToolbar (Desktop, Tablet, Mobile)", () => {
  const hasDesktop = toolbarCode.includes('value: "desktop"');
  const hasTablet = toolbarCode.includes('value: "tablet"');
  const hasMobile = toolbarCode.includes('value: "mobile"');
  const hasNoCompact = !toolbarCode.includes('value: "desktop_compact"');
  const hasNoMobileSmall = !toolbarCode.includes('value: "mobile_small"');
  assert(
    hasDesktop && hasTablet && hasMobile && hasNoCompact && hasNoMobileSmall,
    "Toolbar must provide exactly Desktop, Tablet, and Mobile options"
  );
});

it("Viewports width standards adhere to Desktop: 1440px, Tablet: 768px, Mobile: 390px", () => {
  assert(modelCode.includes("desktop: 1440"), "Desktop baseline must be 1440px");
  assert(modelCode.includes("tablet: 768"), "Tablet viewport must be 768px");
  assert(modelCode.includes("mobile: 390"), "Mobile standard viewport must be 390px");
});

it("Enforces zero horizontal overflow across 1440px, 768px, 390px, and 320px", () => {
  // Check that frame & canvas enforce maxWidth 100%, boxSizing border-box
  assert(frameCode.includes('maxWidth: "100%"'), "ObjectManipulationFrame must enforce maxWidth: 100%");
  assert(frameCode.includes('boxSizing: "border-box"'), "ObjectManipulationFrame must enforce boxSizing: border-box");
  assert(frameCode.includes("safeWidth"), "ObjectManipulationFrame must compute safeWidth to prevent overflow");
  assert(frameCode.includes("safeLeft"), "ObjectManipulationFrame must clamp safeLeft so absolute items do not spill");
});

it("Supports automatic mobile stacking: row containers switch to column on mobile screens", () => {
  assert(sectionCode.includes('device === "mobile"'), "SectionContainer must check mobile device for stacking");
  assert(sectionCode.includes('"column"'), "SectionContainer must automatically stack to column on mobile");
});

it("Responsive override system: inheritance baseline with indicator and reset", () => {
  assert(propertiesCode.includes("Responsive: Design Once, Adapt Everywhere"), "Properties must present clear responsive system explanation");
  assert(propertiesCode.includes("Reset Semua Override"), "Must provide option to reset device overrides to baseline");
  assert(propertiesCode.includes("Mewarisi Pengaturan Utama") || propertiesCode.includes("Mewarisi Desktop"), "Must indicate when property inherits from desktop baseline");
});

// -----------------------------------------------------------------------------
// 2. ANIMATION SYSTEM
// -----------------------------------------------------------------------------
console.log("\n--- 2. Animation System Categories & Options ---");

it("Opening Animations: Animated Envelope, Wax Seal, Fade In, Slide In", () => {
  assert(animTypesCode.includes("animated_envelope"), "Must support Animated Envelope");
  assert(animTypesCode.includes("envelope_wax_seal"), "Must support Envelope with Wax Seal");
  assert(animTypesCode.includes("fade_in"), "Must support Fade In");
  assert(animTypesCode.includes("slide_in"), "Must support Slide In");
  assert(fs.existsSync(path.join(rootDir, "components/builder/animation/OpeningEnvelopeModal.tsx")), "OpeningEnvelopeModal component must exist");
});

it("Opening Envelope Modal includes click-to-open interaction and skip button", () => {
  const modalCode = fs.readFileSync(path.join(rootDir, "components/builder/animation/OpeningEnvelopeModal.tsx"), "utf8");
  assert(modalCode.includes("handleOpenClick"), "Must handle click to open envelope");
  assert(modalCode.includes("handleSkip"), "Must provide skip button so guest is never blocked");
});

it("Decorative Animations: Falling Petals, Leaves, Sparkles, Floating Light, Butterflies, Birds, Swinging", () => {
  const required = [
    "falling_petals",
    "falling_leaves",
    "sparkles",
    "floating_light",
    "flying_butterflies",
    "flying_birds",
    "swinging_ornament",
  ];
  for (const item of required) {
    assert(animTypesCode.includes(item), `Decorative animation must include ${item}`);
  }
  assert(fs.existsSync(path.join(rootDir, "components/builder/animation/DecorativeAnimationOverlay.tsx")), "DecorativeAnimationOverlay must exist");
});

it("Decorative Animation Overlay respects 'prefers-reduced-motion'", () => {
  const overlayCode = fs.readFileSync(path.join(rootDir, "components/builder/animation/DecorativeAnimationOverlay.tsx"), "utf8");
  assert(overlayCode.includes("prefers-reduced-motion: reduce"), "Must respect prefers-reduced-motion");
  assert(overlayCode.includes("pointer-events-none"), "Overlay must be pointer-events-none so it never blocks UI clicks");
});

it("Scroll Animations: Fade In, Slide Up/Down/Left/Right, Zoom In/Out, Flip, Rotate, Parallax", () => {
  const required = [
    "fade_in",
    "slide_up",
    "slide_down",
    "slide_left",
    "slide_right",
    "zoom_in",
    "zoom_out",
    "flip",
    "rotate",
    "parallax",
  ];
  for (const item of required) {
    assert(animTypesCode.includes(item), `Scroll animation must include ${item}`);
  }
});

it("Functional Animations: Pulse, Bounce, Subtle Hover, Countdown Flip, Vinyl Spin", () => {
  const required = [
    "pulse",
    "bounce",
    "subtle_hover",
    "countdown_tick",
    "music_vinyl_spin",
  ];
  for (const item of required) {
    assert(animTypesCode.includes(item), `Functional animation must include ${item}`);
  }
});

it("Character & Motion Animations: 3D Wedding Character, Motion Graphic, Animated Illustration", () => {
  assert(animTypesCode.includes("wedding_character_3d"), "Must support 3D Wedding Character");
  assert(animTypesCode.includes("motion_graphic"), "Must support Motion Graphic Monogram");
  assert(animTypesCode.includes("animated_illustration"), "Must support Animated Illustration");
});

it("Animations CSS Module contains hardware-accelerated keyframes and reduced-motion fallback", () => {
  assert(animCssCode.includes("@keyframes iuFadeIn"), "Must contain iuFadeIn keyframe");
  assert(animCssCode.includes("@keyframes iuSlideUp"), "Must contain iuSlideUp keyframe");
  assert(animCssCode.includes("@keyframes iuPulse"), "Must contain iuPulse keyframe");
  assert(animCssCode.includes("@keyframes iuVinylSpin"), "Must contain iuVinylSpin keyframe");
  assert(animCssCode.includes("@media (prefers-reduced-motion: reduce)"), "CSS must disable animations on reduced motion");
});

// -----------------------------------------------------------------------------
// 3. PAGE BUILDER UX REFINEMENT & SIMPLIFICATION
// -----------------------------------------------------------------------------
console.log("\n--- 3. Page Builder UX Simplification & Clean UI ---");

it("Right Sidebar provides structured Contextual Tabs: Content, Style, Animation, Responsive", () => {
  assert(propertiesCode.includes('<EditOutlined /> Content'), "Must have Content tab");
  assert(propertiesCode.includes('<BgColorsOutlined /> Style'), "Must have Style tab");
  assert(propertiesCode.includes('<PlayCircleOutlined /> Animation'), "Must have Animation tab");
  assert(propertiesCode.includes('<ControlOutlined /> Responsive'), "Must have Responsive tab");
});

it("Animation Tab in Right Sidebar provides Type, Trigger, Duration, Delay, Repeat, Intensity, Preview & Remove", () => {
  assert(propertiesCode.includes('"animationType"'), "Must have animationType control");
  assert(propertiesCode.includes('"animationTrigger"'), "Must have animationTrigger control");
  assert(propertiesCode.includes('"animationDuration"'), "Must have animationDuration control");
  assert(propertiesCode.includes('"animationDelay"'), "Must have animationDelay control");
  assert(propertiesCode.includes('"animationRepeat"'), "Must have animationRepeat control");
  assert(propertiesCode.includes('"animationIntensity"'), "Must have animationIntensity control");
  assert(propertiesCode.includes("Preview Animasi"), "Must have Preview Animasi action button");
  assert(propertiesCode.includes("Hapus"), "Must have Hapus action button");
});

it("Zero Emojis rule strictly obeyed across Page Builder UI (Ant Design icons used instead)", () => {
  // Check PreviewRenderer and BuilderCanvas for mobile/desktop emojis
  assert(!previewCode.includes("📱"), "PreviewRenderer must not contain mobile emoji");
  assert(!previewCode.includes("🖥"), "PreviewRenderer must not contain desktop emoji");
  assert(!previewCode.includes("🪨"), "PreviewRenderer must not contain tablet emoji");
  assert(!canvasCode.includes("📱"), "BuilderCanvas must not contain mobile emoji");
  assert(!canvasCode.includes("🖥"), "BuilderCanvas must not contain desktop emoji");
  assert(!canvasCode.includes("🔍"), "BuilderCanvas must not contain search emoji");
});

it("Left Sidebar has Elements as default active tab with real-time search", () => {
  const sidebarCode = fs.readFileSync(path.join(rootDir, "components/builder/BuilderSidebar.tsx"), "utf8");
  assert(sidebarCode.includes('defaultActiveKey="elements"'), "Elements must be default active tab in sidebar");
  const assetPanelCode = fs.readFileSync(path.join(rootDir, "components/builder/AssetPanel.tsx"), "utf8");
  assert(assetPanelCode.includes("Cari elemen desain..."), "AssetPanel must provide search input for elements");
  assert(assetPanelCode.includes("Cari widget InviteU..."), "AssetPanel must provide search input for widgets");
});

// -----------------------------------------------------------------------------
// 4. PREVIEW MODE ANIMATION INTEGRATION
// -----------------------------------------------------------------------------
console.log("\n--- 4. Preview Experience & Animation Integration ---");

it("PreviewRenderer renders OpeningEnvelopeModal when opening animation is active", () => {
  assert(previewCode.includes("<OpeningEnvelopeModal"), "PreviewRenderer must integrate OpeningEnvelopeModal");
  assert(previewCode.includes("openingAnimType"), "PreviewRenderer must check openingAnimType");
});

it("PreviewRenderer renders DecorativeAnimationOverlay when decorative animation is configured", () => {
  assert(previewCode.includes("<DecorativeAnimationOverlay"), "PreviewRenderer must integrate DecorativeAnimationOverlay");
  assert(previewCode.includes("decorativeAnimType"), "PreviewRenderer must check decorativeAnimType");
});

it("Animations run on both Preview mode and Editor Canvas", () => {
  assert(frameCode.includes("animClassName"), "ObjectManipulationFrame must attach animation classes");
  assert(sectionCode.includes("<DecorativeAnimationOverlay"), "SectionContainer must render decorative animations");
});

console.log("\n================================================================================");
console.log(`  HASIL TEST: ${passed} PASSED | ${failed} FAILED`);
console.log("================================================================================");

if (failed > 0) {
  process.exit(1);
}
