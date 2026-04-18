import type { Config } from "jest";
import nextJest from "next/jest.js";

const createJestConfig = nextJest({
  dir: "./",
});

const config: Config = {
  preset: "ts-jest",
  coverageProvider: "v8",
  testEnvironment: "node",
  testTimeout: 200000,
  testPathIgnorePatterns: [
    "/__tests__/helpers/",
  ],
  setupFiles: ["<rootDir>/utils/test-utils.ts"],
  transform: {
    "^.+\\.tsx?$": "ts-jest",
  },
  transformIgnorePatterns: ["/node_modules/"],
};

export default createJestConfig(config);
