// Flat config for ESLint 9; same scope (.ts files) and rules as the former .eslintrc.json.
import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import globals from "globals";

const TS_FILES = ["**/*.ts"];

export default [
  {
    ignores: [
      "node_modules/",
      "dist/",
      "build/",
      "coverage/",
      "src/payload-types.ts",
    ],
  },
  { ...js.configs.recommended, files: TS_FILES },
  ...tsPlugin.configs["flat/recommended"].map((config) => ({
    ...config,
    files: TS_FILES,
  })),
  {
    files: TS_FILES,
    languageOptions: {
      ecmaVersion: 2020,
      sourceType: "module",
      globals: {
        ...globals.node,
        ...globals.es2020,
      },
    },
    rules: {
      "no-console": "error",
      // Warning, as in the typescript-eslint 5 preset the former config was written for.
      "@typescript-eslint/no-explicit-any": "warn",
      "@typescript-eslint/no-empty-function": "warn",
      // Replacements for ban-types, removed in typescript-eslint 8.
      "@typescript-eslint/no-unsafe-function-type": "warn",
      "@typescript-eslint/no-wrapper-object-types": "warn",
      "@typescript-eslint/no-empty-object-type": "warn",
    },
  },
  {
    // Tests log progress on purpose.
    files: ["__tests__/**/*.ts"],
    rules: {
      "no-console": "off",
    },
  },
];
