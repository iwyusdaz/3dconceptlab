import coreWebVitals from "eslint-config-next/core-web-vitals";
import typescriptConfig from "eslint-config-next/typescript";

const eslintConfig = [
  ...coreWebVitals,
  ...typescriptConfig,
  {
    ignores: [
      ".next/",
      "node_modules/",
      "playwright-report/",
      "test-results/",
      "docs/",
      ".data/",
    ],
  },
];

export default eslintConfig;
