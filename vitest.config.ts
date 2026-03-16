import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      lib: path.resolve(__dirname, "lib"),
      components: path.resolve(__dirname, "components"),
      hooks: path.resolve(__dirname, "hooks"),
    },
  },
  test: {
    environment: "node",
    include: ["__tests__/**/*.test.ts"],
    setupFiles: [],
    fakeTimers: {
      toFake: undefined,
    },
  },
});
