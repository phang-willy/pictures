import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/../../../application', '<rootDir>/../../../domain'],
  testMatch: [
    '<rootDir>/../../../domain/**/*.spec.ts',
    '<rootDir>/../../../application/**/*.spec.ts',
  ],
  transform: {
    '^.+\\.ts$': ['ts-jest', { tsconfig: '<rootDir>/tsconfig.spec.json' }],
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/../../../$1',
    '^@/domain/(.*)$': '<rootDir>/../../../domain/$1',
    '^@/application/(.*)$': '<rootDir>/../../../application/$1',
    '^@infrastructure/(.*)$': '<rootDir>/../../../infrastructure/$1',
    '^@/shared/(.*)$': '<rootDir>/../../../shared/$1',
  },
  moduleFileExtensions: ['ts', 'js', 'json'],
};

export default config;
