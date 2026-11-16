import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "react-native": "react-native-web",
    },
  },
  test: {
    environment: "node",
    clearMocks: true,
    restoreMocks: true,
    fsModuleCachePath: "../../node_modules/.vitest-cache/mobile",
    include: ["src/**/*.test.{ts,tsx}"],
  },
});
