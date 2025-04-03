/** @type {import('ts-jest').JestConfigWithTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'], // Point Jest to the tests directory
  moduleNameMapper: {
    // Handle module aliases if you have them in tsconfig.json
    // Example: '^@/(.*)$': '<rootDir>/src/$1'
  },
  testMatch: [
    '**/tests/**/*.spec.ts', // Look for .spec.ts files within the tests directory
  ],
  // Optional: Setup files to run before each test file (e.g., for global mocks)
  // setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
}; 