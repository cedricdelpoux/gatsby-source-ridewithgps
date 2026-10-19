const js = require("@eslint/js")
const prettierConfig = require("eslint-config-prettier")
const globals = require("globals")

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: "commonjs",
      globals: {
        ...globals.node,
      },
    },
  },
  prettierConfig,
]
