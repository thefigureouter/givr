/** @type {import('jest').Config} */
const config = {
  testEnvironment: 'node',
  transform: {
    '^.+\\.tsx?$': ['ts-jest', { tsconfig: { strict: true } }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/$1',
  },
  testMatch: ['**/__tests__/**/*.test.ts', '**/__tests__/**/*.test.tsx'],
  collectCoverageFrom: [
    'lib/streak-engine.ts',
    'lib/badge-engine.ts',
    'lib/mock-db.ts',
    'lib/utils.ts',
  ],
  coverageThreshold: {
    global: { lines: 80, functions: 80, branches: 70 },
  },
};

module.exports = config;
