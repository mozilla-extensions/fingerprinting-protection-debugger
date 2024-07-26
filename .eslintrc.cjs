module.exports = {
  root: true,
  env: { browser: true, es2020: true, webextensions: true },
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  parser: "@typescript-eslint/parser",
  plugins: ["react-refresh"],
  rules: {
    "react-refresh/only-export-components": [
      "warn",
      { allowConstantExport: true },
    ],
    semi: [1, "always"],
    quotes: [1, "double"],
    "comma-dangle": [1, "only-multiline"],
  },
  globals: {
    browser: true,
  },
};
