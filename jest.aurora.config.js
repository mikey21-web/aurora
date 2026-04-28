/** @type {import('jest').Config} */
module.exports = {
  testEnvironment: 'node',
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      tsconfig: {
        module: 'CommonJS',
        moduleResolution: 'node',
        esModuleInterop: true,
        experimentalDecorators: true,
        emitDecoratorMetadata: true,
        strictNullChecks: false,
        noImplicitAny: false,
        skipLibCheck: true,
        baseUrl: '.',
        paths: {
          '@gitroom/nestjs-libraries/*': ['libraries/nestjs-libraries/src/*'],
          '@gitroom/helpers/*': ['libraries/helpers/src/*'],
          '@gitroom/backend/*': ['apps/backend/src/*'],
        },
      },
      diagnostics: false,
    }],
  },
  resolver: '<rootDir>/tests/ts-resolver.js',
  testMatch: ['**/tests/**/*.test.ts'],
  moduleNameMapper: {
    '^@gitroom/nestjs-libraries/(.*)$': '<rootDir>/libraries/nestjs-libraries/src/$1',
    '^@gitroom/helpers/(.*)$': '<rootDir>/libraries/helpers/src/$1',
    '^@gitroom/backend/(.*)$': '<rootDir>/apps/backend/src/$1',
    '^@langchain/(.*)$': '<rootDir>/tests/__mocks__/langchain.js',
    '^@temporalio/(.*)$': '<rootDir>/tests/__mocks__/temporal.js',
    '^nestjs-temporal-core$': '<rootDir>/tests/__mocks__/temporal.js',
    '^striptags$': '<rootDir>/tests/__mocks__/striptags.js',
    '^rss-parser$': '<rootDir>/tests/__mocks__/rss-parser.js',
    '^jsdom$': '<rootDir>/tests/__mocks__/jsdom.js',
    '^mime$': '<rootDir>/tests/__mocks__/mime.js',
  },
  transformIgnorePatterns: [
    '/node_modules/(?!(tslib|class-validator|class-transformer|reflect-metadata)/)',
  ],
  forceExit: true,
};
