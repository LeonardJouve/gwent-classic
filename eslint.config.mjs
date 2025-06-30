import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";

export default [
    {files: ["**/*.{js,mjs,cjs,ts}"]},
    {languageOptions: {globals: {...globals.browser, ...globals.node}}},
    eslint.configs.recommended,
    tseslint.configs.strict,
    tseslint.configs.stylistic,
];
