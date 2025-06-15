module.exports = {
  testEnvironment: 'jsdom',
  testPathIgnorePatterns: ['/node_modules/', 'e2e\\.spec\\.js$', 'login\\.test\\.js$', 'index\\.test\\.js$', 'track\\.test\\.js$'],
  setupFilesAfterEnv: ['./jest.setup.js']
};
