export default {
  displayName: 'contact-functions',
  preset: '../jest.preset.js',
  testEnvironment: 'node',
  coverageDirectory: '../coverage/functions',
  transform: {
    '^.+\\.(ts|js)$': [
      'ts-jest',
      {
        tsconfig: '<rootDir>/tsconfig.spec.json',
      },
    ],
  },
};
