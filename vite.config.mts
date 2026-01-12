import tsconfigPaths from "vite-tsconfig-paths";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      // Include all files under `src` in the coverage report so we measure
      // coverage for the entire application surface.
      include: ["src/**/*"],
      // Emit common coverage report formats so CI / local tooling can read results.
      reporter: ["text", "json-summary", "lcov"],
      // Directory where coverage reports should be written
      reportsDirectory: "coverage",
      // Count files in `include` even if they are not imported during tests.
      all: true,
      exclude: ["**/node_modules/**", "**/index.ts", "src/db/schema/**"],
    } as any,
    globals: true,
    restoreMocks: true,
  },
  plugins: [tsconfigPaths()],
});
