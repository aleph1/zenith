/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  testEnvironment: 'jsdom',
  //transform: {
  //  "^.+\\.jsx?$": "babel-jest", // Adding this line solved the issue
  //  "^.+\\.tsx?$": "ts-jest"
  //},
  verbose: true,
  // This will show the full error details
  errorOnDeprecated: true,
};