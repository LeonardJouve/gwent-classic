// @ts-check

import globals from "globals";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import {globalIgnores} from "eslint/config";

export default tseslint.config(
    globalIgnores(["node_modules/**", "dist/**"]),
    {
        files: ["**/*.{js,mjs,cjs,ts}"],
        languageOptions: {
            parser: tseslint.parser,
			globals: {
                ...globals.browser,
                ...globals.node
            },
        },
    },
    eslint.configs.recommended,
    tseslint.configs.recommended,
    {
        rules: {
            "@typescript-eslint/no-unused-vars": "off",
            "@typescript-eslint/no-explicit-any": "off",
            "@typescript-eslint/no-unused-expressions": "off",
        }
    },
);
