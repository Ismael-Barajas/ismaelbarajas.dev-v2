import nextCoreWebVitalsConfig from "eslint-config-next/core-web-vitals";

const config = [
  ...nextCoreWebVitalsConfig,
  {
    ignores: ["app/generated/**"],
  },
];

export default config;
