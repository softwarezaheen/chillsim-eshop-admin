import js from "@eslint/js";
import globals from "globals";
import react from "eslint-plugin-react";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default [
  { ignores: ["dist"] },
  {
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        __APP_VERSION__: "readonly", // Define __APP_VERSION__ as a readonly global
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
    settings: { react: { version: "18.3" } },
    plugins: {
      react,
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...js.configs.recommended.rules,
      ...react.configs.recommended.rules,
      ...react.configs["jsx-runtime"].rules,
      ...reactHooks.configs.recommended.rules,

      // Custom Rules
      "react/jsx-no-target-blank": "off",
      "react-refresh/only-export-components": [
        "warn",
        { allowConstantExport: true },
      ],

      // Ignore `no-unused-vars`
      "no-unused-vars": "off", // Disable this rule

      // Disable unnecessary try/catch checks
      "no-useless-catch": "off", // Disable the rule

      // Disable empty object pattern checking
      "no-empty-pattern": "off", // Disable this rule

      // Disable unsafe chaining checking
      "no-unsafe-optional-chaining": "off", // Disable this rule

      // Prop types checking
      "react/prop-types": "off",

      // Useless escape checking
      "no-useless-escape": "off",

      // No debugger checking
      "no-debugger": "off",

      // Duplicate keys checking
      "no-dupe-keys": "off",
    },
  },
  {
    files: ["**/*.test.{js,ts,jsx,tsx}", "**/*.spec.{js,ts,jsx,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.vitest,
      },
      parserOptions: {
        ecmaVersion: "latest",
        ecmaFeatures: { jsx: true },
        sourceType: "module",
      },
    },
  }
];
