// eslint.config.js
import js from "@eslint/js";
import pluginImport from "eslint-plugin-import";
import pluginN from "eslint-plugin-n";
import pluginPrettier from "eslint-plugin-prettier";
import ts from "typescript-eslint";

export default [
  // 無視パターン
  { ignores: ["dist/**", "node_modules/**", "**/*.test.ts", "vitest.config.ts"] },

  // JS推奨
  js.configs.recommended,

  // TypeScript 推奨（型なし）をまず全体に
  ...ts.configs.recommended,

  // TypeScript 型付きLintはTSファイルだけに限定
  {
    files: ["**/*.ts", "**/*.tsx"],
    ...ts.configs.recommendedTypeChecked[ts.configs.recommendedTypeChecked.length - 1], // 後段設定のマージ回避策
    languageOptions: {
      parserOptions: {
        project: ["./tsconfig.json"],
        tsconfigRootDir: import.meta.dirname,
        ecmaVersion: "latest",
        sourceType: "module",
      },
    },
    rules: {
      // ここにTSの追加ルール
      "@typescript-eslint/no-unsafe-member-access": "warn",
      "@typescript-eslint/no-floating-promises": "error",
    },
  },

  // import / prettier / node
  {
    plugins: { import: pluginImport, prettier: pluginPrettier, n: pluginN },
    settings: {
      "import/resolver": {
        typescript: { project: "tsconfig.json" },
        node: { extensions: [".js", ".mjs", ".ts", ".d.ts"] },
      },
    },
    rules: {
      "prettier/prettier": "warn",
      "n/no-unsupported-features/es-syntax": "off",
      "n/no-missing-import": "off",
      "import/extensions": [
        "error",
        "ignorePackages",
        { ts: "never", tsx: "never", js: "always", mjs: "always" },
      ],
      "import/order": [
        "warn",
        {
          groups: [["builtin", "external"], ["internal"], ["parent", "sibling", "index"]],
          "newlines-between": "always",
          alphabetize: { order: "asc", caseInsensitive: true },
        },
      ],
    },
  },
];
