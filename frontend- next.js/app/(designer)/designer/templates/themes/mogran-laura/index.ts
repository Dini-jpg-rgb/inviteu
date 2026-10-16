import rawJsonData from "../wedding/template.json";
export * from "../wedding";
import { weddingTheme } from "../wedding";

// Compatibility alias for Mogran & Laura theme
export const mogranLauraTheme = weddingTheme;
export default weddingTheme;
export { rawJsonData };
