module.exports = {
  root: true,
  env: { browser: true, es2020: true, webextensions: true },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react/jsx-runtime",
    "plugin:react-hooks/recommended",
  ],
  ignorePatterns: ["dist", ".eslintrc.cjs"],
  parserOptions: { ecmaVersion: "latest", sourceType: "module" },
  settings: { react: { version: "18.2" } },
  plugins: ["react-refresh"],
  rules: {
    "react/jsx-no-target-blank": "off",
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
