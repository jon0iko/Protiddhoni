import type { Config } from 'jest';

const config: Config = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    coverageDirectory: 'coverage',
    collectCoverageFrom: [
        'services/**/*.ts',
        'repositories/**/*.ts',
        'middleware/**/*.ts',
        // utils/ was previously omitted here even though tests/utils/ has covered it
        // since early on. Excluding it did not make coverage lower "honestly" — it
        // made the reported number meaningless, because the best-tested directory
        // in the backend was not in the denominator.
        'utils/**/*.ts',
        '!**/*.test.ts',
        '!**/node_modules/**'
    ],
    testMatch: [
        '**/tests/**/*.test.ts'
    ],
    verbose: true,
    testTimeout: 10000,
    // Ratchet, not an aspiration. Each number sits just under what the suite
    // actually achieves, so coverage can only go up. The previous flat 70 had
    // never been evaluated even once, because `pnpm test` omits --coverage.
    // Path-keyed because a single global number hides which layer regressed.
    // A ratchet, not an aspiration: each number sits just below what the suite
    // actually achieves today, so coverage can only go up.
    //
    // The previous flat 70 had never been evaluated even once -- `pnpm test`
    // omits --coverage, and thresholds are only enforced when coverage is
    // collected. `pnpm test:coverage` (and now CI) does collect it.
    //
    // Per-directory floors rather than one global number, so a regression in the
    // data layer cannot be masked by the well-covered utils. NOTE: Jest removes
    // path-matched files from the `global` group, so `global` here covers only
    // files outside the four directories below.
    coverageThreshold: {
        // Jest requires a `global` key, but every directory in
        // collectCoverageFrom has its own floor below, and Jest removes
        // path-matched files from the global group -- so this group is empty and
        // these numbers are inert. The four real gates are the ones underneath.
        // If a new source directory is ever added to collectCoverageFrom, give it
        // its own entry here rather than relying on this.
        global: { statements: 0, branches: 0, functions: 0, lines: 0 },
        './utils/': { statements: 94, branches: 75, functions: 98, lines: 95 },
        './middleware/': { statements: 87, branches: 83, functions: 98, lines: 87 },
        './repositories/': { statements: 59, branches: 59, functions: 59, lines: 63 },
        './services/': { statements: 69, branches: 70, functions: 77, lines: 68 }
    }
};

export default config;
