const { defineConfig } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests/e2e',
  use: { headless: true },
  webServer: {
    command: 'npx http-server . -p 4173 -c-1',
    url: 'http://127.0.0.1:4173',
    reuseExistingServer: true,
  },
});
