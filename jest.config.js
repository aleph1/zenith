/** @type {import('ts-jest/dist/types').InitialOptionsTsJest} */
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.ts'],
  //transform: {
  //  "^.+\\.jsx?$": "babel-jest", // Adding this line solved the issue
  //  "^.+\\.tsx?$": "ts-jest"
  //},
};