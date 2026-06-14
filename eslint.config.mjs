import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    // Generated / vendored, not ours to lint:
    "drizzle/**",
  ]),
  // Project rules. Type-aware (projectService) so promise correctness is
  // checked, which matters for Server Actions and async Supabase calls.
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      parserOptions: { projectService: true },
    },
    rules: {
      // Unused code is a smell. `_`-prefixed args/vars/catches are opt-out
      // (e.g. the `_prev` first arg of a useActionState Server Action).
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      // `any` defeats strict mode. Warn, not error: AGENTS.md allows it with a
      // comment, so the warning is the reminder to justify it.
      "@typescript-eslint/no-explicit-any": "warn",
      // `import type { X }` keeps type-only imports out of the JS output.
      "@typescript-eslint/consistent-type-imports": "error",
      // A forgotten `await` on a Server Action or DB write is a real bug.
      "@typescript-eslint/no-floating-promises": "error",
      "@typescript-eslint/no-misused-promises": "error",
      // Leave server logs intentional; ban stray `console.log`.
      "no-console": ["warn", { allow: ["warn", "error"] }],
      eqeqeq: ["error", "smart"],
      "no-var": "error",
      "object-shorthand": "error",
    },
  },
]);

export default eslintConfig;
