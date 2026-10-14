import eslint from "@eslint/js";

export default [
  {
    ignores: [
      "**/node_modules/**",
      "**/.next/**",
      "**/dist/**",
      "**/coverage/**",
      "**/*.generated.*",
    ],
  },
  eslint.configs.recommended,
];
