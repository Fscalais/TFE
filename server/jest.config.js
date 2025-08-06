module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/tests/**/*.test.ts'], // Cherche tests dans /server/tests
  rootDir: '.', // /server est la racine pour Jest ici
};
