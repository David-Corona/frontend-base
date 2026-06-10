/** @type {import('jest').Config} */
module.exports = {
    preset: 'jest-preset-angular',
    setupFilesAfterEnv: ['<rootDir>/setup-jest.ts'],
    testEnvironment: 'jsdom',
    transform: {
        '^.+\\.(ts|js|html)$': [
            'jest-preset-angular',
            {
                tsconfig: '<rootDir>/tsconfig.spec.json',
                stringifyContentPathRegex: '\\.html$',
                useESM: true
            }
        ]
    },
    transformIgnorePatterns: [
        'node_modules/(?!.*\\.mjs$|.*@angular|.*primeng|.*@primeuix|.*rxjs)'
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/src/$1',
        '^@shared/(.*)$': '<rootDir>/src/app/shared/$1',
        '^@features/(.*)$': '<rootDir>/src/app/features/$1',
        '^@demo/(.*)$': '<rootDir>/src/app/demo/$1'
    },
    collectCoverageFrom: [
        'src/app/**/*.ts',
        '!src/app/demo/**/*.ts',
        '!src/app/**/*.spec.ts',
        '!src/app/**/*.d.ts'
    ],
    coverageDirectory: '<rootDir>/coverage',
    coverageReporters: ['html', 'text-summary', 'lcov']
};
