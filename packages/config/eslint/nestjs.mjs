import globals from "globals";
import tseslint from "typescript-eslint";
import base from "./base.mjs";

export default tseslint.config(...base, ...tseslint.configs.recommended, {
  files: ["**/*.ts"],
  languageOptions: {
    globals: globals.node,
  },
  rules: {
    "@typescript-eslint/no-explicit-any": "warn",
  },
});
