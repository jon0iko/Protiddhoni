import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'services/**/*.ts',
        'repositories/**/*.ts',
        'middleware/**/*.ts',
        '!**/*.test.ts',
        '!**/node_modules/**'
    ],
    testMatch: [
        '**/tests/**/*.test.ts'
    ],
    verbose: true,
    testTimeout: 10000,
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70
        }
    }
};

export default config;
